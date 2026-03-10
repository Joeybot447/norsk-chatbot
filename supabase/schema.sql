-- =============================================================================
-- NorskBot AI — Complete Supabase Database Schema
-- Norwegian B2B AI Chatbot SaaS Platform
-- =============================================================================
-- Designed: 2026-03-10
-- Database: Supabase (PostgreSQL 15+)
-- Auth: Supabase Auth (auth.users managed by Supabase)
-- Vector: pgvector for RAG embeddings
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ---------------------------------------------------------------------------

-- Vector similarity search for RAG knowledge chunks
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Cryptographic functions (gen_random_uuid already available in PG 13+)
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Full-text search utilities (built-in but explicit)
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;


-- ---------------------------------------------------------------------------
-- 2. CUSTOM TYPES
-- ---------------------------------------------------------------------------

-- User roles within the platform
CREATE TYPE public.user_role AS ENUM ('owner', 'admin', 'member');

-- Subscription plan tiers
CREATE TYPE public.plan_tier AS ENUM ('free', 'starter', 'professional', 'enterprise');

-- Subscription status
CREATE TYPE public.subscription_status AS ENUM ('active', 'past_due', 'canceled', 'trialing', 'paused');

-- Conversation status
CREATE TYPE public.conversation_status AS ENUM ('active', 'closed', 'archived');

-- Message sender role
CREATE TYPE public.message_role AS ENUM ('user', 'assistant', 'system');

-- Knowledge source type
CREATE TYPE public.knowledge_source_type AS ENUM ('document', 'webpage', 'text', 'faq', 'csv');

-- Usage action types for billing
CREATE TYPE public.usage_action AS ENUM ('chat_message', 'embedding', 'document_ingest', 'api_call');


-- ---------------------------------------------------------------------------
-- 3. TABLES
-- ---------------------------------------------------------------------------

-- ===== profiles =====
-- Extends Supabase auth.users with app-specific data.
-- Auto-created via trigger on auth.users INSERT.
-- Columns: 7
CREATE TABLE public.profiles (
    id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name text,
    company_name text,
    avatar_url  text,
    role        public.user_role NOT NULL DEFAULT 'owner',
    plan        public.plan_tier NOT NULL DEFAULT 'free',
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'User profiles extending Supabase auth.users. One row per authenticated user.';


-- ===== sites =====
-- Customer chatbot sites. Each user can create multiple sites.
-- Columns: 10
CREATE TABLE public.sites (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name            text NOT NULL,
    domain          text,
    welcome_message text DEFAULT 'Hei! Hvordan kan jeg hjelpe deg?',
    bot_name        text DEFAULT 'NorskBot',
    theme_config    jsonb DEFAULT '{"primaryColor": "#2563eb", "position": "bottom-right"}'::jsonb,
    is_active       boolean NOT NULL DEFAULT true,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.sites IS 'Customer chatbot sites. Each site gets its own widget, knowledge base, and conversation history.';


-- ===== conversations =====
-- Chat sessions between site visitors and the AI bot.
-- Columns: 7
CREATE TABLE public.conversations (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id     uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    visitor_id  text NOT NULL,
    status      public.conversation_status NOT NULL DEFAULT 'active',
    metadata    jsonb DEFAULT '{}'::jsonb,
    started_at  timestamptz NOT NULL DEFAULT now(),
    ended_at    timestamptz
);

COMMENT ON TABLE public.conversations IS 'Chat sessions. visitor_id is a client-generated fingerprint or session token.';


-- ===== messages =====
-- Individual messages within a conversation.
-- Columns: 6
CREATE TABLE public.messages (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    role            public.message_role NOT NULL,
    content         text NOT NULL,
    tokens_used     integer DEFAULT 0,
    created_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.messages IS 'Individual chat messages. Role is user (visitor), assistant (AI), or system.';


-- ===== knowledge_sources =====
-- Uploaded documents / knowledge items per site.
-- Columns: 9
CREATE TABLE public.knowledge_sources (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id     uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    type        public.knowledge_source_type NOT NULL DEFAULT 'document',
    title       text NOT NULL,
    content     text,
    file_url    text,
    file_size   integer,
    chunk_count integer DEFAULT 0,
    status      text NOT NULL DEFAULT 'pending',
    created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.knowledge_sources IS 'Knowledge base sources (documents, web pages, text). Each source is chunked for RAG.';


-- ===== knowledge_chunks =====
-- RAG chunks with vector embeddings for similarity search.
-- Columns: 7
CREATE TABLE public.knowledge_chunks (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id   uuid NOT NULL REFERENCES public.knowledge_sources(id) ON DELETE CASCADE,
    site_id     uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    content     text NOT NULL,
    embedding   vector(1536),
    metadata    jsonb DEFAULT '{}'::jsonb,
    created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.knowledge_chunks IS 'RAG chunks with 1536-dim embeddings (OpenAI text-embedding-3-small). site_id denormalized for faster RLS + queries.';


-- ===== api_keys =====
-- Per-site API keys for widget authentication.
-- Columns: 8
CREATE TABLE public.api_keys (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id     uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    key_hash    text NOT NULL,
    key_prefix  text NOT NULL,
    name        text NOT NULL DEFAULT 'Default',
    is_active   boolean NOT NULL DEFAULT true,
    created_at  timestamptz NOT NULL DEFAULT now(),
    last_used_at timestamptz
);

COMMENT ON TABLE public.api_keys IS 'Hashed API keys per site. key_prefix stores first 8 chars for identification. Full key shown only once at creation.';


-- ===== usage_logs =====
-- Tracks API usage for metering and billing.
-- Columns: 7
CREATE TABLE public.usage_logs (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id     uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action_type public.usage_action NOT NULL,
    tokens_used integer DEFAULT 0,
    metadata    jsonb DEFAULT '{}'::jsonb,
    created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.usage_logs IS 'Usage metering for billing. Tracks tokens, API calls, and document ingestions per site.';


-- ===== subscriptions =====
-- Billing/subscription records per user.
-- Columns: 9
CREATE TABLE public.subscriptions (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_name               public.plan_tier NOT NULL DEFAULT 'free',
    status                  public.subscription_status NOT NULL DEFAULT 'active',
    stripe_customer_id      text,
    stripe_subscription_id  text,
    current_period_start    timestamptz NOT NULL DEFAULT now(),
    current_period_end      timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
    created_at              timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.subscriptions IS 'User subscriptions with Stripe integration fields. One active subscription per user.';


-- ---------------------------------------------------------------------------
-- 4. INDEXES
-- ---------------------------------------------------------------------------

-- profiles
CREATE INDEX idx_profiles_plan ON public.profiles(plan);

-- sites
CREATE INDEX idx_sites_user_id ON public.sites(user_id);
CREATE INDEX idx_sites_domain ON public.sites(domain);
CREATE INDEX idx_sites_is_active ON public.sites(is_active) WHERE is_active = true;

-- conversations
CREATE INDEX idx_conversations_site_id ON public.conversations(site_id);
CREATE INDEX idx_conversations_visitor_id ON public.conversations(visitor_id);
CREATE INDEX idx_conversations_status ON public.conversations(status);
CREATE INDEX idx_conversations_started_at ON public.conversations(started_at DESC);

-- messages
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);

-- knowledge_sources
CREATE INDEX idx_knowledge_sources_site_id ON public.knowledge_sources(site_id);
CREATE INDEX idx_knowledge_sources_type ON public.knowledge_sources(type);

-- knowledge_chunks
CREATE INDEX idx_knowledge_chunks_source_id ON public.knowledge_chunks(source_id);
CREATE INDEX idx_knowledge_chunks_site_id ON public.knowledge_chunks(site_id);

-- HNSW index for fast vector similarity search (cosine distance)
CREATE INDEX idx_knowledge_chunks_embedding ON public.knowledge_chunks
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- api_keys
CREATE INDEX idx_api_keys_site_id ON public.api_keys(site_id);
CREATE INDEX idx_api_keys_key_hash ON public.api_keys(key_hash);
CREATE UNIQUE INDEX idx_api_keys_key_hash_unique ON public.api_keys(key_hash);

-- usage_logs
CREATE INDEX idx_usage_logs_site_id ON public.usage_logs(site_id);
CREATE INDEX idx_usage_logs_user_id ON public.usage_logs(user_id);
CREATE INDEX idx_usage_logs_created_at ON public.usage_logs(created_at DESC);
CREATE INDEX idx_usage_logs_action_type ON public.usage_logs(action_type);

-- subscriptions
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_customer ON public.subscriptions(stripe_customer_id);


-- ---------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS)
-- ---------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- ----- profiles -----
-- Users can read and update their own profile
CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Insert handled by trigger (service role), but allow user insert as fallback
CREATE POLICY "profiles_insert_own" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- ----- sites -----
-- Users can CRUD their own sites
CREATE POLICY "sites_select_own" ON public.sites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "sites_insert_own" ON public.sites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sites_update_own" ON public.sites
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sites_delete_own" ON public.sites
    FOR DELETE USING (auth.uid() = user_id);

-- ----- conversations -----
-- Users can read conversations for their sites
CREATE POLICY "conversations_select_own" ON public.conversations
    FOR SELECT USING (
        site_id IN (SELECT id FROM public.sites WHERE user_id = auth.uid())
    );

-- Allow anonymous inserts from the chat widget (via service role or anon key with API key validation)
-- The actual auth for widget visitors is done via api_keys at the application layer
CREATE POLICY "conversations_insert_via_site" ON public.conversations
    FOR INSERT WITH CHECK (
        site_id IN (SELECT id FROM public.sites WHERE is_active = true)
    );

CREATE POLICY "conversations_update_own" ON public.conversations
    FOR UPDATE USING (
        site_id IN (SELECT id FROM public.sites WHERE user_id = auth.uid())
    );

-- ----- messages -----
-- Users can read messages for their sites' conversations
CREATE POLICY "messages_select_own" ON public.messages
    FOR SELECT USING (
        conversation_id IN (
            SELECT c.id FROM public.conversations c
            JOIN public.sites s ON s.id = c.site_id
            WHERE s.user_id = auth.uid()
        )
    );

-- Allow inserts for active conversations (widget visitors + AI responses)
CREATE POLICY "messages_insert_active" ON public.messages
    FOR INSERT WITH CHECK (
        conversation_id IN (
            SELECT id FROM public.conversations WHERE status = 'active'
        )
    );

-- ----- knowledge_sources -----
-- Users can CRUD knowledge sources for their sites
CREATE POLICY "knowledge_sources_select_own" ON public.knowledge_sources
    FOR SELECT USING (
        site_id IN (SELECT id FROM public.sites WHERE user_id = auth.uid())
    );

CREATE POLICY "knowledge_sources_insert_own" ON public.knowledge_sources
    FOR INSERT WITH CHECK (
        site_id IN (SELECT id FROM public.sites WHERE user_id = auth.uid())
    );

CREATE POLICY "knowledge_sources_update_own" ON public.knowledge_sources
    FOR UPDATE USING (
        site_id IN (SELECT id FROM public.sites WHERE user_id = auth.uid())
    );

CREATE POLICY "knowledge_sources_delete_own" ON public.knowledge_sources
    FOR DELETE USING (
        site_id IN (SELECT id FROM public.sites WHERE user_id = auth.uid())
    );

-- ----- knowledge_chunks -----
-- Users can read chunks for their sites
CREATE POLICY "knowledge_chunks_select_own" ON public.knowledge_chunks
    FOR SELECT USING (
        site_id IN (SELECT id FROM public.sites WHERE user_id = auth.uid())
    );

-- Insert/delete managed by service role during ingestion, but allow owner access
CREATE POLICY "knowledge_chunks_insert_own" ON public.knowledge_chunks
    FOR INSERT WITH CHECK (
        site_id IN (SELECT id FROM public.sites WHERE user_id = auth.uid())
    );

CREATE POLICY "knowledge_chunks_delete_own" ON public.knowledge_chunks
    FOR DELETE USING (
        site_id IN (SELECT id FROM public.sites WHERE user_id = auth.uid())
    );

-- ----- api_keys -----
-- Users can CRUD API keys for their sites
CREATE POLICY "api_keys_select_own" ON public.api_keys
    FOR SELECT USING (
        site_id IN (SELECT id FROM public.sites WHERE user_id = auth.uid())
    );

CREATE POLICY "api_keys_insert_own" ON public.api_keys
    FOR INSERT WITH CHECK (
        site_id IN (SELECT id FROM public.sites WHERE user_id = auth.uid())
    );

CREATE POLICY "api_keys_update_own" ON public.api_keys
    FOR UPDATE USING (
        site_id IN (SELECT id FROM public.sites WHERE user_id = auth.uid())
    );

CREATE POLICY "api_keys_delete_own" ON public.api_keys
    FOR DELETE USING (
        site_id IN (SELECT id FROM public.sites WHERE user_id = auth.uid())
    );

-- ----- usage_logs -----
-- Users can read their own usage logs (no insert/update/delete — service role only)
CREATE POLICY "usage_logs_select_own" ON public.usage_logs
    FOR SELECT USING (auth.uid() = user_id);

-- ----- subscriptions -----
-- Users can read their own subscriptions
CREATE POLICY "subscriptions_select_own" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Insert/update managed by webhooks (service role), but allow user read
CREATE POLICY "subscriptions_insert_own" ON public.subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ---------------------------------------------------------------------------
-- 6. FUNCTIONS
-- ---------------------------------------------------------------------------

-- Function: Auto-create profile when a new user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, avatar_url, created_at, updated_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data ->> 'avatar_url',
        now(),
        now()
    );
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS 'Creates a profile row when a new user signs up. Extracts name from metadata or email.';


-- Function: Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_updated_at() IS 'Auto-updates the updated_at column on row modification.';


-- Function: Match knowledge chunks by vector similarity (for RAG queries)
CREATE OR REPLACE FUNCTION public.match_knowledge_chunks(
    query_embedding vector(1536),
    match_site_id uuid,
    match_threshold float DEFAULT 0.78,
    match_count int DEFAULT 5
)
RETURNS TABLE (
    id uuid,
    content text,
    metadata jsonb,
    similarity float
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT
        kc.id,
        kc.content,
        kc.metadata,
        1 - (kc.embedding <=> query_embedding) AS similarity
    FROM public.knowledge_chunks kc
    WHERE kc.site_id = match_site_id
      AND 1 - (kc.embedding <=> query_embedding) > match_threshold
    ORDER BY kc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION public.match_knowledge_chunks IS 'Vector similarity search for RAG. Returns top N chunks above threshold for a given site.';


-- Function: Get usage summary for a site in a date range
CREATE OR REPLACE FUNCTION public.get_usage_summary(
    p_site_id uuid,
    p_start_date timestamptz DEFAULT (now() - interval '30 days'),
    p_end_date timestamptz DEFAULT now()
)
RETURNS TABLE (
    action_type public.usage_action,
    total_count bigint,
    total_tokens bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
    -- Verify the caller owns this site
    IF NOT EXISTS (
        SELECT 1 FROM public.sites
        WHERE id = p_site_id AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    RETURN QUERY
    SELECT
        ul.action_type,
        count(*)::bigint AS total_count,
        COALESCE(sum(ul.tokens_used), 0)::bigint AS total_tokens
    FROM public.usage_logs ul
    WHERE ul.site_id = p_site_id
      AND ul.created_at BETWEEN p_start_date AND p_end_date
    GROUP BY ul.action_type;
END;
$$;

COMMENT ON FUNCTION public.get_usage_summary IS 'Returns aggregated usage stats for a site within a date range. Checks ownership.';


-- ---------------------------------------------------------------------------
-- 7. TRIGGERS
-- ---------------------------------------------------------------------------

-- Auto-create profile on new auth.users signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at on profiles
CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- Auto-update updated_at on sites
CREATE TRIGGER sites_updated_at
    BEFORE UPDATE ON public.sites
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();


-- ---------------------------------------------------------------------------
-- 8. STORAGE BUCKETS (reference — apply via Supabase dashboard or CLI)
-- ---------------------------------------------------------------------------
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('knowledge-files', 'knowledge-files', false);
--
-- CREATE POLICY "knowledge_files_select" ON storage.objects
--     FOR SELECT USING (
--         bucket_id = 'knowledge-files'
--         AND auth.uid()::text = (storage.foldername(name))[1]
--     );
--
-- CREATE POLICY "knowledge_files_insert" ON storage.objects
--     FOR INSERT WITH CHECK (
--         bucket_id = 'knowledge-files'
--         AND auth.uid()::text = (storage.foldername(name))[1]
--     );


-- ---------------------------------------------------------------------------
-- SCHEMA SUMMARY
-- ---------------------------------------------------------------------------
-- Tables: 9
--   profiles          (8 columns)  — User profiles
--   sites             (10 columns) — Chatbot sites
--   conversations     (7 columns)  — Chat sessions
--   messages          (6 columns)  — Chat messages
--   knowledge_sources (10 columns) — Knowledge documents
--   knowledge_chunks  (7 columns)  — RAG chunks + embeddings
--   api_keys          (8 columns)  — Site API keys
--   usage_logs        (7 columns)  — Usage metering
--   subscriptions     (9 columns)  — Billing subscriptions
--
-- Total columns: 72
-- RLS policies: 24
-- Indexes: 22 (including 1 HNSW vector index)
-- Functions: 4
-- Triggers: 3
-- Custom types: 7
-- =============================================================================
