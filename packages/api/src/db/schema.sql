-- ===== ENABLE EXTENSIONS =====
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ===== CUSTOMERS TABLE =====
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  stripe_customer_id VARCHAR(255),
  plan VARCHAR(50) DEFAULT 'starter', -- starter, pro, enterprise
  status VARCHAR(50) DEFAULT 'active', -- active, paused, cancelled
  billing_email VARCHAR(255),
  payment_method_id VARCHAR(255), -- Stripe payment method ID
  next_billing_date TIMESTAMP,
  data_residency VARCHAR(20) DEFAULT 'eu', -- eu, us, etc
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(stripe_customer_id)
);

-- ===== SITES TABLE (Chatbots) =====
CREATE TABLE IF NOT EXISTS sites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  domain VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  api_key VARCHAR(255) UNIQUE NOT NULL,
  widget_config JSONB DEFAULT '{
    "theme": "light",
    "primary_color": "#007bff",
    "secondary_color": "#6c757d",
    "position": "bottom-right",
    "welcome_message": "Hej! Hvordan kan jeg hjelpe deg?",
    "tone": "professional",
    "language": "norwegian"
  }',
  status VARCHAR(50) DEFAULT 'active', -- active, paused, deleted
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(api_key)
);

CREATE INDEX idx_sites_customer_id ON sites(customer_id);
CREATE INDEX idx_sites_api_key ON sites(api_key);

-- ===== DOCUMENTS TABLE =====
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'webpage', 'pdf', 'docx', 'faq', 'txt'
  source_url VARCHAR(500),
  title VARCHAR(255),
  content TEXT,
  metadata JSONB,
  chunks_count INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active', -- active, stale, deleted
  last_crawled TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_documents_site_id ON documents(site_id);
CREATE INDEX idx_documents_created_at ON documents(created_at);

-- ===== CHUNKS TABLE (for vector storage) =====
CREATE TABLE IF NOT EXISTS chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  chunk_index INT NOT NULL,
  content TEXT NOT NULL,
  tokens INT,
  embedding VECTOR(1536),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(document_id, chunk_index)
);

CREATE INDEX idx_chunks_site_id ON chunks(site_id);
CREATE INDEX idx_chunks_document_id ON chunks(document_id);
CREATE INDEX idx_chunks_embedding ON chunks USING ivfflat (embedding vector_cosine_ops);

-- ===== CONVERSATIONS TABLE =====
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  session_id VARCHAR(255) NOT NULL,
  visitor_email VARCHAR(255),
  visitor_name VARCHAR(255),
  visitor_company VARCHAR(255),
  ip_address VARCHAR(50),
  user_agent TEXT,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP,
  message_count INT DEFAULT 0,
  handoff_requested BOOLEAN DEFAULT FALSE,
  satisfaction_rating INT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_conversations_site_id ON conversations(site_id);
CREATE INDEX idx_conversations_session_id ON conversations(session_id);
CREATE INDEX idx_conversations_created_at ON conversations(site_id, created_at DESC);

-- ===== MESSAGES TABLE =====
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  tokens_used INT,
  confidence_score FLOAT,
  sources JSONB, -- [{title, url, chunk_id}]
  feedback INT, -- 1 (up), -1 (down), null (none)
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_site_id ON messages(site_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- ===== GUARDRAIL RULES TABLE =====
CREATE TABLE IF NOT EXISTS guardrail_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'topic', 'sentiment', 'pii', 'off_topic', 'keyword'
  pattern VARCHAR(500),
  action VARCHAR(50) NOT NULL, -- 'block', 'redirect', 'warn'
  response_text TEXT,
  priority INT DEFAULT 0,
  enabled BOOLEAN DEFAULT TRUE,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_guardrail_rules_site_id ON guardrail_rules(site_id);

-- ===== ANALYTICS EVENTS TABLE =====
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- 'message_sent', 'handoff', 'feedback', 'widget_load'
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analytics_events_site_id ON analytics_events(site_id);
CREATE INDEX idx_analytics_events_customer_id ON analytics_events(customer_id);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(site_id, created_at DESC);

-- ===== AUDIT LOG TABLE (GDPR compliance) =====
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  target_id UUID,
  target_type VARCHAR(100),
  old_value JSONB,
  new_value JSONB,
  actor_type VARCHAR(50), -- 'customer', 'admin', 'system'
  actor_id VARCHAR(255),
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_customer_id ON audit_logs(customer_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ===== JOBS TABLE (for Bull queue persistence) =====
CREATE TABLE IF NOT EXISTS jobs (
  id SERIAL PRIMARY KEY,
  queue_name VARCHAR(255) NOT NULL,
  job_id VARCHAR(255) NOT NULL,
  data JSONB,
  state VARCHAR(50), -- 'pending', 'active', 'completed', 'failed'
  progress INT DEFAULT 0,
  error_message TEXT,
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 3,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(queue_name, job_id)
);

CREATE INDEX idx_jobs_queue_state ON jobs(queue_name, state);

-- ===== FUNCTIONS & TRIGGERS =====

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON sites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guardrail_rules_updated_at BEFORE UPDATE ON guardrail_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
