# NorskBot AI — Production Implementation Plan

**Author:** CTO (Claude Opus 4.6)  
**Date:** 2026-03-10  
**Status:** Ready for execution  
**Previous audit:** CTO-AUDIT.md (UI/design issues — separate workstream)

---

## Executive Summary

NorskBot AI has a polished Next.js frontend with 10+ dashboard pages, auth screens, and a landing page — but **zero working backend**. Every API route imports from `lib/db/client.ts` (Vercel Postgres via `@vercel/postgres`), which is the wrong database. The real database is Supabase (PostgreSQL + pgvector), already deployed with 9 tables, 24 RLS policies, and vector search functions. The auth system uses custom JWT + bcrypt against a non-existent `users` table instead of Supabase Auth. The chat widget — the core product — doesn't exist. All dashboard data is hardcoded mock arrays.

This plan connects the UI to a working backend in 5 phases.

---

## Schema Reference (Supabase — already deployed)

For quick reference by all phases. Column names from `supabase/schema.sql`:

| Table | Key Columns | Notes |
|-------|------------|-------|
| `profiles` | id (FK→auth.users), display_name, company_name, avatar_url, role, plan | Auto-created by trigger on auth signup |
| `sites` | id, user_id (FK→profiles), name, domain, welcome_message, bot_name, theme_config (jsonb), is_active | |
| `conversations` | id, site_id, visitor_id (text), status (enum), metadata (jsonb), started_at, ended_at | |
| `messages` | id, conversation_id, role (enum: user/assistant/system), content, tokens_used | |
| `knowledge_sources` | id, site_id, type (enum), title, content, file_url, file_size, chunk_count, status | Note: column is `title` not `name` |
| `knowledge_chunks` | id, source_id, site_id, content, embedding (vector 1536), metadata (jsonb) | |
| `api_keys` | id, site_id, key_hash, key_prefix, name, is_active, last_used_at | |
| `usage_logs` | id, site_id, user_id, action_type (enum), tokens_used, metadata | |
| `subscriptions` | id, user_id, plan_name (enum), status (enum), stripe_customer_id, stripe_subscription_id, current_period_start, current_period_end | |

**Critical mismatches in current code vs schema:**
- Code uses `session_id` → schema has `visitor_id`
- Code uses `knowledge_sources.name` → schema has `title`
- Code uses `knowledge_sources.type = 'file'/'url'/'text'` → schema enum is `'document'/'webpage'/'text'/'faq'/'csv'`
- Code uses `knowledge_chunks.chunk_index`, `token_count` → schema has no such columns
- Code uses `conversations.message_count`, `session_id`, `visitor_name`, `visitor_email`, `visitor_company`, `ip_address`, `user_agent` → schema has none of these
- Code uses `messages.site_id`, `confidence_score`, `sources`, `feedback` → schema has none of these
- Code uses `customers` table → doesn't exist (it's `profiles`)
- Auth code uses `users` table → doesn't exist (Supabase Auth manages `auth.users`, profile data in `profiles`)

---

## Phase 1: Database Client & Auth Foundation

### Goal
Replace the broken Vercel Postgres + custom JWT auth with Supabase as the single database client and Supabase Auth as the authentication layer.

### Dependencies
None — this is the foundation everything else builds on.

### Files to Create/Modify

#### 1.1 DELETE: `lib/db/client.ts`
Remove entirely. This Vercel Postgres client is unused and creates confusion.

#### 1.2 DELETE: `lib/db/init.ts`
Remove entirely. No initialization needed — Supabase handles connections.

#### 1.3 MODIFY: `lib/supabase/client.ts`
The existing file is close but needs a proper server-side client for SSR/API routes and a browser client that handles auth sessions.

```typescript
// lib/supabase/client.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser-side client (uses anon key, respects RLS, persists auth session)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side client (uses service role key, bypasses RLS)
// Use in API routes, server actions, and server components
export function createServiceClient(): SupabaseClient {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }
  return createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Server-side client that inherits the user's session (for SSR pages)
// Pass the auth token from the request to maintain RLS context
export function createServerClient(accessToken?: string): SupabaseClient {
  if (!accessToken) return supabase;
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
```

#### 1.4 CREATE: `lib/supabase/auth.ts`
Auth helper functions used by dashboard pages and API routes.

```typescript
// lib/supabase/auth.ts
import { supabase } from './client';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  companyName?: string;
  avatarUrl?: string;
  plan: string;
}

// Sign up with email/password
export async function signUp(email: string, password: string, metadata: { displayName: string; companyName?: string }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: metadata.displayName,
        company_name: metadata.companyName,
      },
    },
  });
  if (error) throw error;
  return data;
}

// Sign in with email/password
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

// Sign out
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Get current user with profile data
export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, company_name, avatar_url, plan')
    .eq('id', user.id)
    .single();

  return {
    id: user.id,
    email: user.email!,
    displayName: profile?.display_name || user.email!.split('@')[0],
    companyName: profile?.company_name,
    avatarUrl: profile?.avatar_url,
    plan: profile?.plan || 'free',
  };
}

// Send password reset email
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });
  if (error) throw error;
}

// Listen for auth state changes
export function onAuthStateChange(callback: (user: AuthUser | null) => void) {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const user = await getCurrentUser();
      callback(user);
    } else {
      callback(null);
    }
  });
}
```

#### 1.5 CREATE: `lib/supabase/hooks.ts`
React hooks for auth state in client components.

```typescript
// lib/supabase/hooks.ts
'use client';

import { useState, useEffect } from 'react';
import { supabase } from './client';
import { getCurrentUser, type AuthUser } from './auth';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current session
    getCurrentUser().then((u) => {
      setUser(u);
      setLoading(false);
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const u = await getCurrentUser();
        setUser(u);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}
```

#### 1.6 MODIFY: `app/auth/page.tsx`
Replace the fake API calls with real Supabase Auth:

**Login handler** — replace the `fetch('/api/auth/login', ...)` block with:
```typescript
import { signIn } from '@/lib/supabase/auth';

// In handleLogin:
try {
  setLoading(true);
  setError('');
  await signIn(loginEmail, loginPass);
  router.push('/dashboard');
} catch (err: any) {
  setError(err.message || 'Innlogging feilet');
} finally {
  setLoading(false);
}
```

**Register handler** — replace the `fetch('/api/auth/register', ...)` block with:
```typescript
import { signUp } from '@/lib/supabase/auth';

// In handleRegister:
try {
  setLoading(true);
  setError('');
  await signUp(regEmail, regPass, {
    displayName: regName,
    companyName: regCompany,
  });
  setSuccess('Konto opprettet! Sjekk e-posten din for bekreftelse.');
} catch (err: any) {
  setError(err.message || 'Registrering feilet');
} finally {
  setLoading(false);
}
```

#### 1.7 MODIFY: `app/auth/forgot-password/page.tsx`
Replace the `setTimeout` fake call with:
```typescript
import { resetPassword } from '@/lib/supabase/auth';

// In handleSubmit:
try {
  setLoading(true);
  await resetPassword(email);
  setSubmitted(true);
} catch (err: any) {
  setError(err.message || 'Kunne ikke sende tilbakestillings-e-post');
} finally {
  setLoading(false);
}
```

#### 1.8 MODIFY: `app/dashboard/layout.tsx`
Wire real auth state into the sidebar:

```typescript
// Add at top:
import { useAuth } from '@/lib/supabase/hooks';
import { signOut } from '@/lib/supabase/auth';

// Replace const userName = 'Ola Nordmann':
const { user, loading } = useAuth();
const router = useRouter();

// Redirect if not logged in:
useEffect(() => {
  if (!loading && !user) {
    router.push('/auth');
  }
}, [loading, user, router]);

if (loading || !user) {
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>Laster...</div>;
}

const userName = user.displayName;
const userInitials = userName.split(' ').map((n) => n[0]).join('').toUpperCase();
const userPlan = user.plan === 'free' ? 'Gratis plan' : user.plan === 'starter' ? 'Starter' : user.plan === 'professional' ? 'Profesjonell' : 'Enterprise';

// Replace handleLogout:
const handleLogout = async () => {
  await signOut();
  router.push('/auth');
};
```

#### 1.9 DELETE: `app/api/auth/login/route.ts`
#### 1.10 DELETE: `app/api/auth/register/route.ts`  
#### 1.11 DELETE: `app/api/auth/verify/route.ts`
All three are custom JWT auth against non-existent tables. Supabase Auth replaces them entirely. The only auth API route we keep is for OAuth callbacks (if needed later).

#### 1.12 DELETE: `lib/config.js`
This config references SQLite paths, JWT secrets, and Express-era settings. Replace with simple env checks where needed.

### Acceptance Criteria
1. `lib/db/client.ts` no longer exists
2. `supabase.auth.signUp()` creates a user in Supabase Auth AND auto-creates a `profiles` row (via existing trigger)
3. `supabase.auth.signInWithPassword()` returns a valid session
4. Dashboard layout shows the real user's `display_name` from `profiles`
5. Navigating to `/dashboard/*` while logged out redirects to `/auth`
6. Logout clears the session and redirects to `/auth`
7. No imports of `lib/db/client` remain anywhere in the codebase
8. No imports of `bcryptjs`, `jsonwebtoken`, or `@vercel/postgres` remain

### Estimated Complexity
**Medium-High** — touches auth flow which is security-critical, but Supabase Auth does the heavy lifting. ~6 hours.

---

## Phase 2: Core API Routes (Chat + Widget + Sites + API Keys)

### Goal
Build working API routes that use the Supabase service client, match the actual schema column names, and implement API key authentication for the widget.

### Dependencies
**Phase 1 must be complete** — needs `createServiceClient()` and `supabase` from `lib/supabase/client.ts`.

### Files to Create/Modify

#### 2.1 CREATE: `lib/api/middleware.ts`
API key validation middleware for widget-facing routes.

```typescript
// lib/api/middleware.ts
import { createServiceClient } from '@/lib/supabase/client';
import crypto from 'crypto';

// Hash an API key the same way we store it
export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

// Generate a new API key (returns both raw key and hash)
export function generateApiKey(): { key: string; hash: string; prefix: string } {
  const raw = 'nb_' + crypto.randomBytes(24).toString('hex');
  const hash = hashApiKey(raw);
  const prefix = raw.substring(0, 11); // "nb_" + first 8 hex chars
  return { key: raw, hash, prefix };
}

// Validate API key from request header, return site_id or null
export async function validateApiKey(apiKey: string): Promise<{ siteId: string; siteName: string } | null> {
  const supabase = createServiceClient();
  const hash = hashApiKey(apiKey);

  const { data, error } = await supabase
    .from('api_keys')
    .select('site_id, is_active, sites!inner(id, name, is_active)')
    .eq('key_hash', hash)
    .eq('is_active', true)
    .single();

  if (error || !data) return null;

  // Type assertion for the joined query
  const site = (data as any).sites;
  if (!site?.is_active) return null;

  // Update last_used_at
  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('key_hash', hash);

  return { siteId: data.site_id, siteName: site.name };
}

// Extract API key from request (header or query param)
export function extractApiKey(request: Request): string | null {
  // Check Authorization header: "Bearer nb_xxx"
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  // Check X-API-Key header
  const apiKeyHeader = request.headers.get('x-api-key');
  if (apiKeyHeader) return apiKeyHeader;
  // Check query param
  const url = new URL(request.url);
  return url.searchParams.get('api_key');
}
```

#### 2.2 REWRITE: `app/api/chat/route.ts`
Complete rewrite using Supabase, correct schema columns, and real AI integration.

```typescript
// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/client';
import { validateApiKey, extractApiKey } from '@/lib/api/middleware';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate via API key
    const apiKey = extractApiKey(request);
    if (!apiKey) {
      return NextResponse.json({ error: 'API-nokkel mangler' }, { status: 401 });
    }
    const auth = await validateApiKey(apiKey);
    if (!auth) {
      return NextResponse.json({ error: 'Ugyldig API-nokkel' }, { status: 401 });
    }

    const body = await request.json();
    const { message, visitorId, conversationId } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Melding kan ikke vaere tom' }, { status: 400 });
    }
    if (message.length > 2000) {
      return NextResponse.json({ error: 'Melding for lang (maks 2000 tegn)' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const siteId = auth.siteId;

    // 2. Get or create conversation
    let convId = conversationId;
    if (!convId) {
      const vid = visitorId || crypto.randomUUID();
      const { data: conv, error: convErr } = await supabase
        .from('conversations')
        .insert({ site_id: siteId, visitor_id: vid, status: 'active' })
        .select('id')
        .single();
      if (convErr) throw convErr;
      convId = conv.id;
    }

    // 3. Store user message
    const userTokens = Math.ceil(message.length / 4);
    await supabase.from('messages').insert({
      conversation_id: convId,
      role: 'user',
      content: message.trim(),
      tokens_used: userTokens,
    });

    // 4. Get conversation history (last 20 messages for context)
    const { data: history } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
      .limit(20);

    // 5. RAG: Find relevant knowledge chunks
    // First, generate embedding for the query using OpenAI (if available)
    // For now, use text-based search as fallback
    let contextChunks: string[] = [];
    const { data: chunks } = await supabase
      .from('knowledge_chunks')
      .select('content')
      .eq('site_id', siteId)
      .limit(5);
    if (chunks) {
      contextChunks = chunks.map(c => c.content);
    }

    // 6. Get site config for system prompt
    const { data: site } = await supabase
      .from('sites')
      .select('name, welcome_message, bot_name')
      .eq('id', siteId)
      .single();

    const systemPrompt = `Du er ${site?.bot_name || 'NorskBot'}, en hjelpsom AI-assistent for ${site?.name || 'denne bedriften'}. Svar alltid pa norsk. Vaer profesjonell, vennlig og konsis.

${contextChunks.length > 0 ? `Bruk folgende kunnskapsbase for a svare:\n\n${contextChunks.join('\n\n---\n\n')}` : 'Du har ingen spesifikk kunnskapsbase tilgjengelig enna. Svar basert pa generell kunnskap og oppfordre brukeren til a kontakte bedriften direkte for spesifikke sporsmaal.'}

Hvis du ikke vet svaret, si det aerlig og foreslaa at brukeren kontakter bedriften direkte.`;

    // 7. Call Claude API
    const messages = (history || []).map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })).filter(m => m.role === 'user' || m.role === 'assistant');

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.length > 0 ? messages : [{ role: 'user', content: message }],
    });

    const assistantContent = response.content[0].type === 'text'
      ? response.content[0].text
      : 'Beklager, jeg kunne ikke generere et svar.';
    const assistantTokens = response.usage.output_tokens;

    // 8. Store assistant message
    await supabase.from('messages').insert({
      conversation_id: convId,
      role: 'assistant',
      content: assistantContent,
      tokens_used: assistantTokens,
    });

    // 9. Log usage
    const { data: siteData } = await supabase
      .from('sites')
      .select('user_id')
      .eq('id', siteId)
      .single();

    if (siteData) {
      await supabase.from('usage_logs').insert({
        site_id: siteId,
        user_id: siteData.user_id,
        action_type: 'chat_message',
        tokens_used: userTokens + assistantTokens,
        metadata: { model: 'claude-sonnet-4-20250514' },
      });
    }

    return NextResponse.json({
      message: assistantContent,
      conversationId: convId,
      tokensUsed: assistantTokens,
    });
  } catch (err) {
    console.error('Chat error:', err);
    return NextResponse.json(
      { error: 'Beklager, noe gikk galt. Vennligst prov igjen.' },
      { status: 500 }
    );
  }
}

// GET /api/chat?conversationId=xxx — Get conversation history
export async function GET(request: NextRequest) {
  try {
    const apiKey = extractApiKey(request);
    if (!apiKey) {
      return NextResponse.json({ error: 'API-nokkel mangler' }, { status: 401 });
    }
    const auth = await validateApiKey(apiKey);
    if (!auth) {
      return NextResponse.json({ error: 'Ugyldig API-nokkel' }, { status: 401 });
    }

    const conversationId = request.nextUrl.searchParams.get('conversationId');
    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId er pakrevd' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Verify conversation belongs to the authenticated site
    const { data: conv } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('site_id', auth.siteId)
      .single();

    if (!conv) {
      return NextResponse.json({ error: 'Samtale ikke funnet' }, { status: 404 });
    }

    const { data: messages } = await supabase
      .from('messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    return NextResponse.json({
      conversationId,
      messages: messages || [],
    });
  } catch (err) {
    console.error('Chat history error:', err);
    return NextResponse.json({ error: 'Kunne ikke laste samtalehistorikk' }, { status: 500 });
  }
}
```

#### 2.3 REWRITE: `app/api/widget/route.ts`
Widget configuration endpoint — public, identified by site ID.

```typescript
// app/api/widget/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/client';

// GET /api/widget?siteId=xxx — Get widget config (public, CORS enabled)
export async function GET(request: NextRequest) {
  const siteId = request.nextUrl.searchParams.get('siteId');
  if (!siteId) {
    return NextResponse.json({ error: 'siteId is required' }, { status: 400 });
  }

  try {
    const supabase = createServiceClient();
    const { data: site, error } = await supabase
      .from('sites')
      .select('id, name, welcome_message, bot_name, theme_config, is_active')
      .eq('id', siteId)
      .eq('is_active', true)
      .single();

    if (error || !site) {
      return NextResponse.json({ error: 'Nettsted ikke funnet' }, { status: 404 });
    }

    const response = NextResponse.json({
      id: site.id,
      name: site.name,
      welcomeMessage: site.welcome_message,
      botName: site.bot_name,
      theme: site.theme_config,
    });

    // CORS headers for widget embedding
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET');
    response.headers.set('Cache-Control', 'public, max-age=300'); // 5 min cache
    return response;
  } catch (err) {
    console.error('Widget config error:', err);
    return NextResponse.json({ error: 'Kunne ikke laste widget-konfigurasjon' }, { status: 500 });
  }
}
```

#### 2.4 CREATE: `app/api/sites/route.ts`
Site CRUD for dashboard (authenticated via Supabase session).

```typescript
// app/api/sites/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/client';
import { generateApiKey } from '@/lib/api/middleware';

// Helper: get user ID from Supabase session
async function getUserId(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const supabase = createServiceClient();
  // Decode the JWT to get the user (service client can verify)
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user.id;
}

// GET /api/sites — List user's sites
export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Ikke autorisert' }, { status: 401 });

  const supabase = createServiceClient();
  const { data: sites, error } = await supabase
    .from('sites')
    .select(`
      id, name, domain, welcome_message, bot_name, theme_config, is_active, created_at, updated_at,
      conversations(count),
      api_keys(id, key_prefix, name, is_active, created_at, last_used_at)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return NextResponse.json(sites || []);
}

// POST /api/sites — Create a new site + generate default API key
export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Ikke autorisert' }, { status: 401 });

  const body = await request.json();
  const { name, domain, welcomeMessage, botName } = body;

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'Nettstedsnavn er pakrevd' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Create site
  const { data: site, error: siteErr } = await supabase
    .from('sites')
    .insert({
      user_id: userId,
      name: name.trim(),
      domain: domain?.trim() || null,
      welcome_message: welcomeMessage || 'Hei! Hvordan kan jeg hjelpe deg?',
      bot_name: botName || 'NorskBot',
    })
    .select()
    .single();

  if (siteErr) throw siteErr;

  // Generate default API key
  const { key, hash, prefix } = generateApiKey();
  await supabase.from('api_keys').insert({
    site_id: site.id,
    key_hash: hash,
    key_prefix: prefix,
    name: 'Standard',
  });

  return NextResponse.json({
    ...site,
    apiKey: key, // Show the raw key only once at creation
  }, { status: 201 });
}
```

#### 2.5 CREATE: `app/api/sites/[id]/route.ts`
Single site operations (update, delete).

```typescript
// app/api/sites/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/client';

async function getUserId(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const supabase = createServiceClient();
  const { data: { user } } = await supabase.auth.getUser(authHeader.slice(7));
  return user?.id || null;
}

// GET /api/sites/[id] — Get single site with stats
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Ikke autorisert' }, { status: 401 });

  const supabase = createServiceClient();
  const { data: site, error } = await supabase
    .from('sites')
    .select('*, conversations(count), knowledge_sources(count), api_keys(id, key_prefix, name, is_active, last_used_at)')
    .eq('id', params.id)
    .eq('user_id', userId)
    .single();

  if (error || !site) return NextResponse.json({ error: 'Nettsted ikke funnet' }, { status: 404 });
  return NextResponse.json(site);
}

// PATCH /api/sites/[id] — Update site
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Ikke autorisert' }, { status: 401 });

  const body = await request.json();
  const allowed = ['name', 'domain', 'welcome_message', 'bot_name', 'theme_config', 'is_active'];
  const updates: Record<string, any> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('sites')
    .update(updates)
    .eq('id', params.id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error || !data) return NextResponse.json({ error: 'Oppdatering feilet' }, { status: 400 });
  return NextResponse.json(data);
}

// DELETE /api/sites/[id] — Delete site (cascades to conversations, messages, knowledge, api_keys)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Ikke autorisert' }, { status: 401 });

  const supabase = createServiceClient();
  const { error } = await supabase
    .from('sites')
    .delete()
    .eq('id', params.id)
    .eq('user_id', userId);

  if (error) return NextResponse.json({ error: 'Sletting feilet' }, { status: 400 });
  return NextResponse.json({ deleted: true });
}
```

#### 2.6 CREATE: `app/api/sites/[id]/api-keys/route.ts`
Manage API keys for a site.

```typescript
// app/api/sites/[id]/api-keys/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/client';
import { generateApiKey } from '@/lib/api/middleware';

// POST — Generate new API key for site
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  // Auth check (same pattern as sites route)
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Ikke autorisert' }, { status: 401 });

  const supabase = createServiceClient();
  const { data: { user } } = await supabase.auth.getUser(authHeader.slice(7));
  if (!user) return NextResponse.json({ error: 'Ikke autorisert' }, { status: 401 });

  // Verify site ownership
  const { data: site } = await supabase
    .from('sites')
    .select('id')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();
  if (!site) return NextResponse.json({ error: 'Nettsted ikke funnet' }, { status: 404 });

  const body = await request.json();
  const { key, hash, prefix } = generateApiKey();

  await supabase.from('api_keys').insert({
    site_id: params.id,
    key_hash: hash,
    key_prefix: prefix,
    name: body.name || 'Ny nokkel',
  });

  return NextResponse.json({
    key, // Raw key shown only once
    prefix,
    name: body.name || 'Ny nokkel',
  }, { status: 201 });
}

// DELETE — Revoke an API key
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Ikke autorisert' }, { status: 401 });

  const supabase = createServiceClient();
  const { data: { user } } = await supabase.auth.getUser(authHeader.slice(7));
  if (!user) return NextResponse.json({ error: 'Ikke autorisert' }, { status: 401 });

  const keyId = request.nextUrl.searchParams.get('keyId');
  if (!keyId) return NextResponse.json({ error: 'keyId er pakrevd' }, { status: 400 });

  // Deactivate instead of delete (for audit trail)
  await supabase
    .from('api_keys')
    .update({ is_active: false })
    .eq('id', keyId)
    .eq('site_id', params.id);

  return NextResponse.json({ revoked: true });
}
```

#### 2.7 REWRITE: `app/api/health/route.ts`
Simple health check using Supabase.

```typescript
// app/api/health/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const { count, error } = await supabase.from('sites').select('*', { count: 'exact', head: true });

    return NextResponse.json({
      status: error ? 'degraded' : 'ok',
      timestamp: new Date().toISOString(),
      database: error ? 'error' : 'connected',
    }, { status: error ? 503 : 200 });
  } catch (err) {
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
```

#### 2.8 ADD CORS: `app/api/chat/route.ts` (OPTIONS handler)
Required for widget cross-origin requests.

```typescript
// Add to chat route:
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    },
  });
}
```

Also add CORS headers to the POST and GET responses in the chat route.

### Acceptance Criteria
1. `POST /api/chat` with a valid API key creates a conversation, stores messages, calls Claude, returns AI response
2. `GET /api/chat?conversationId=xxx` returns message history
3. `GET /api/widget?siteId=xxx` returns site config with CORS headers
4. `GET /api/sites` (authenticated) returns the user's sites with conversation counts
5. `POST /api/sites` creates a site and auto-generates an API key
6. `PATCH /api/sites/[id]` updates site settings
7. `DELETE /api/sites/[id]` removes a site (cascade)
8. `POST /api/sites/[id]/api-keys` generates a new key, returns the raw key once
9. All routes use `createServiceClient()` — no imports from `lib/db/client`
10. No `?` parameter placeholders in SQL (Supabase client uses `.eq()` method chaining)

### Estimated Complexity
**High** — core business logic, security-critical API key validation, AI integration. ~10 hours.

---

## Phase 3: Widget.js (The Core Product)

### Goal
Build a lightweight, embeddable JavaScript chat widget that customers place on their websites via a `<script>` tag.

### Dependencies
**Phase 2 must be complete** — widget calls `/api/chat` (POST) and `/api/widget` (GET).

### Files to Create

#### 3.1 CREATE: `public/widget.js`
Self-contained, zero-dependency chat widget. Must be < 50KB minified.

**Embed code format:**
```html
<script src="https://norskbot.no/widget.js" data-site-id="SITE_UUID" data-api-key="nb_xxx"></script>
```

**Full specification:**

```javascript
// public/widget.js
// NorskBot AI Chat Widget — Embeddable, zero dependencies, <50KB
(function() {
  'use strict';

  // Read config from script tag attributes
  var script = document.currentScript;
  if (!script) return;

  var siteId = script.getAttribute('data-site-id');
  var apiKey = script.getAttribute('data-api-key');
  var apiUrl = script.getAttribute('data-api-url') || script.src.replace('/widget.js', '');

  if (!siteId || !apiKey) {
    console.error('NorskBot: data-site-id og data-api-key attributter er pakrevd');
    return;
  }

  // State
  var conversationId = localStorage.getItem('norskbot_conv_' + siteId) || null;
  var visitorId = localStorage.getItem('norskbot_visitor_' + siteId) || generateId();
  localStorage.setItem('norskbot_visitor_' + siteId, visitorId);

  var isOpen = false;
  var isLoading = false;
  var messages = [];
  var config = null; // loaded from /api/widget

  // Utility
  function generateId() {
    return 'v_' + Math.random().toString(36).substr(2, 16);
  }

  // Styles (inline, all contained)
  var STYLES = {
    // ... (complete CSS-in-JS for bubble, chat window, messages, input)
    // Professional, matches NorskBot brand colors
    // Position: bottom-right by default, configurable via theme_config
  };

  // DOM structure:
  // 1. Chat bubble (FAB) — fixed bottom-right, 60x60, primary color circle with chat icon
  // 2. Chat window — 400x600 max, slides up from bubble position
  //    - Header: bot name, close button
  //    - Messages area: scrollable, auto-scroll on new message
  //    - Input area: text input + send button

  // Core functions:
  // loadConfig() — GET /api/widget?siteId=xxx → sets config, theme colors, welcome message
  // toggleChat() — show/hide chat window
  // sendMessage(text) — POST /api/chat with API key header
  // appendMessage(role, content) — adds to DOM and messages array
  // renderMessages() — clears and re-renders all messages

  // Lifecycle:
  // 1. Script loads → create bubble button
  // 2. User clicks bubble → loadConfig() if not loaded, show window, show welcome message
  // 3. User types message → sendMessage() → show loading indicator → show AI response
  // 4. conversationId stored in localStorage for continuity across page loads
  // 5. On new conversation, first response stores conversationId from API

  // API calls:
  // fetch(apiUrl + '/api/widget?siteId=' + siteId) → GET, no auth needed
  // fetch(apiUrl + '/api/chat', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
  //   body: JSON.stringify({ message, visitorId, conversationId })
  // })

  // The full implementation should be ~300-400 lines of vanilla JS
  // including all DOM creation, event handling, and styling
})();
```

**Key design requirements:**
- All styles injected via JS (no external CSS)
- Creates a shadow DOM root to prevent style leakage in/out
- Chat bubble: 60px circle, positioned bottom-right (configurable)
- Chat window: 380px wide, 520px tall, rounded corners, shadow
- Header bar: primary color background, bot name, close X button
- Message bubbles: user messages right-aligned (primary color), bot messages left-aligned (gray)
- Typing indicator: animated dots while waiting for AI response
- Input: text field + send button at bottom
- Mobile responsive: full-width on screens < 480px
- Smooth open/close animation (transform + opacity)
- Accessible: proper ARIA labels, keyboard navigation, focus management

#### 3.2 CREATE: `app/api/widget/script/route.ts`
Returns the embed code snippet for a given site.

```typescript
// app/api/widget/script/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const siteId = request.nextUrl.searchParams.get('siteId');
  const apiKey = request.nextUrl.searchParams.get('apiKey');
  const host = request.headers.get('host');
  const protocol = request.nextUrl.protocol;
  const baseUrl = `${protocol}//${host}`;

  const snippet = `<script src="${baseUrl}/widget.js" data-site-id="${siteId || 'DITT_NETTSTED_ID'}" data-api-key="${apiKey || 'DIN_API_NOKKEL'}"></script>`;

  return NextResponse.json({ snippet, baseUrl });
}
```

### Acceptance Criteria
1. Adding `<script src="https://norskbot.no/widget.js" data-site-id="xxx" data-api-key="nb_xxx">` to any HTML page shows a chat bubble
2. Clicking the bubble opens a chat window with the site's welcome message
3. Typing a message and pressing Enter/Send sends it to `/api/chat` and displays the AI response
4. Conversation persists across page reloads (localStorage conversationId)
5. Widget works on HTTP and HTTPS pages (CORS properly configured)
6. Widget is < 50KB (ideally < 30KB)
7. Widget uses Shadow DOM to prevent CSS conflicts
8. Mobile-friendly (full-width on small screens)
9. No external dependencies (no React, no frameworks)

### Estimated Complexity
**High** — this is the core product, must be bulletproof and performant. ~12 hours.

---

## Phase 4: Knowledge Ingestion Pipeline

### Goal
Build a working file upload and processing pipeline that extracts text, chunks it, generates embeddings, and stores vectors for RAG retrieval.

### Dependencies
**Phase 1 must be complete** (Supabase client). Phase 2 is helpful but not strictly required.

### Files to Create/Modify

#### 4.1 REWRITE: `app/api/ingest/route.ts`
Complete rewrite using Supabase and real embedding generation.

```typescript
// app/api/ingest/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/client';

// Helper: chunk text into ~500 token (~2000 char) segments with overlap
function chunkText(text: string, maxChars: number = 2000, overlap: number = 200): string[] {
  const chunks: string[] = [];
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);

  let current = '';
  for (const para of paragraphs) {
    if ((current + '\n\n' + para).length > maxChars && current.length > 0) {
      chunks.push(current.trim());
      // Keep overlap from end of current chunk
      const words = current.split(/\s+/);
      const overlapWords = words.slice(-Math.ceil(overlap / 5));
      current = overlapWords.join(' ') + '\n\n' + para;
    } else {
      current = current ? current + '\n\n' + para : para;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  // Force-split oversized chunks
  const result: string[] = [];
  for (const chunk of chunks) {
    if (chunk.length <= maxChars) {
      result.push(chunk);
    } else {
      for (let i = 0; i < chunk.length; i += maxChars - overlap) {
        result.push(chunk.slice(i, i + maxChars).trim());
      }
    }
  }
  return result.filter(c => c.length > 0);
}

// Generate embeddings using OpenAI API
// Uses text-embedding-3-small (1536 dimensions, matches schema)
async function generateEmbedding(text: string): Promise<number[]> {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    throw new Error('OPENAI_API_KEY not set — embeddings require OpenAI');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI embedding error: ${response.status}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

// POST /api/ingest — Upload and process file or text
export async function POST(request: NextRequest) {
  try {
    // Auth: require user session (dashboard upload)
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Ikke autorisert' }, { status: 401 });
    }

    const supabase = createServiceClient();
    const { data: { user } } = await supabase.auth.getUser(authHeader.slice(7));
    if (!user) return NextResponse.json({ error: 'Ikke autorisert' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const textContent = formData.get('text') as string | null;
    const siteId = formData.get('siteId') as string;
    const title = formData.get('title') as string | null;

    if (!siteId) {
      return NextResponse.json({ error: 'siteId er pakrevd' }, { status: 400 });
    }

    // Verify site ownership
    const { data: site } = await supabase
      .from('sites')
      .select('id')
      .eq('id', siteId)
      .eq('user_id', user.id)
      .single();
    if (!site) return NextResponse.json({ error: 'Nettsted ikke funnet' }, { status: 404 });

    let extractedText = '';
    let sourceType: 'document' | 'text' = 'document';
    let sourceTitle = title || 'Ukjent';
    let fileSize: number | null = null;

    if (file) {
      // File upload
      const ext = file.name.split('.').pop()?.toLowerCase();
      const buffer = Buffer.from(await file.arrayBuffer());
      fileSize = file.size;
      sourceTitle = title || file.name;

      if (ext === 'txt') {
        extractedText = new TextDecoder().decode(buffer);
      } else if (ext === 'pdf') {
        const pdfParse = (await import('pdf-parse')).default;
        const pdfData = await pdfParse(buffer);
        extractedText = pdfData.text || '';
      } else if (ext === 'docx') {
        // Basic DOCX extraction via XML parsing
        const JSZip = (await import('jszip')).default;
        const zip = await JSZip.loadAsync(buffer);
        const docXml = await zip.file('word/document.xml')?.async('string');
        if (docXml) {
          extractedText = docXml
            .replace(/<w:p[^>]*>/gi, '\n')
            .replace(/<[^>]+>/g, '')
            .replace(/\s+/g, ' ')
            .replace(/\n\s+/g, '\n')
            .trim();
        }
      } else {
        return NextResponse.json(
          { error: `Filtype .${ext} er ikke stottet. Akseptert: PDF, TXT, DOCX` },
          { status: 400 }
        );
      }
    } else if (textContent) {
      // Raw text input
      extractedText = textContent;
      sourceType = 'text';
      sourceTitle = title || 'Tekst-snippet';
    } else {
      return NextResponse.json({ error: 'Ingen fil eller tekst mottatt' }, { status: 400 });
    }

    if (extractedText.trim().length < 10) {
      return NextResponse.json({ error: 'Kunne ikke trekke ut nok tekst fra filen' }, { status: 400 });
    }

    // 1. Create knowledge source record
    const { data: source, error: srcErr } = await supabase
      .from('knowledge_sources')
      .insert({
        site_id: siteId,
        type: sourceType,
        title: sourceTitle,
        content: extractedText.substring(0, 10000), // Store first 10K chars as preview
        file_size: fileSize,
        status: 'processing',
      })
      .select('id')
      .single();

    if (srcErr) throw srcErr;

    // 2. Chunk the text
    const chunks = chunkText(extractedText);

    // 3. Generate embeddings and store chunks
    let successCount = 0;
    for (const chunk of chunks) {
      try {
        const embedding = await generateEmbedding(chunk);
        await supabase.from('knowledge_chunks').insert({
          source_id: source.id,
          site_id: siteId,
          content: chunk,
          embedding: embedding,
          metadata: { charCount: chunk.length, tokenEstimate: Math.ceil(chunk.length / 4) },
        });
        successCount++;
      } catch (embErr) {
        console.error('Embedding error for chunk:', embErr);
        // Continue with remaining chunks
      }
    }

    // 4. Update source status and chunk count
    await supabase
      .from('knowledge_sources')
      .update({
        status: successCount > 0 ? 'ready' : 'error',
        chunk_count: successCount,
      })
      .eq('id', source.id);

    // 5. Log usage
    await supabase.from('usage_logs').insert({
      site_id: siteId,
      user_id: user.id,
      action_type: 'document_ingest',
      tokens_used: Math.ceil(extractedText.length / 4),
      metadata: { sourceId: source.id, chunks: successCount, fileName: sourceTitle },
    });

    return NextResponse.json({
      sourceId: source.id,
      title: sourceTitle,
      chunks: successCount,
      totalChunks: chunks.length,
      status: successCount > 0 ? 'ready' : 'error',
    }, { status: 201 });
  } catch (err) {
    console.error('Ingest error:', err);
    return NextResponse.json({ error: 'Feil under prosessering av innhold' }, { status: 500 });
  }
}

// GET /api/ingest?siteId=xxx — List knowledge sources for a site
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Ikke autorisert' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data: { user } } = await supabase.auth.getUser(authHeader.slice(7));
  if (!user) return NextResponse.json({ error: 'Ikke autorisert' }, { status: 401 });

  const siteId = request.nextUrl.searchParams.get('siteId');
  if (!siteId) return NextResponse.json({ error: 'siteId er pakrevd' }, { status: 400 });

  // Verify ownership
  const { data: site } = await supabase
    .from('sites')
    .select('id')
    .eq('id', siteId)
    .eq('user_id', user.id)
    .single();
  if (!site) return NextResponse.json({ error: 'Nettsted ikke funnet' }, { status: 404 });

  const { data: sources } = await supabase
    .from('knowledge_sources')
    .select('id, type, title, file_size, chunk_count, status, created_at')
    .eq('site_id', siteId)
    .order('created_at', { ascending: false });

  return NextResponse.json(sources || []);
}

// DELETE /api/ingest?sourceId=xxx — Delete a knowledge source and its chunks
export async function DELETE(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Ikke autorisert' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data: { user } } = await supabase.auth.getUser(authHeader.slice(7));
  if (!user) return NextResponse.json({ error: 'Ikke autorisert' }, { status: 401 });

  const sourceId = request.nextUrl.searchParams.get('sourceId');
  if (!sourceId) return NextResponse.json({ error: 'sourceId er pakrevd' }, { status: 400 });

  // Verify ownership through site
  const { data: source } = await supabase
    .from('knowledge_sources')
    .select('id, site_id, sites!inner(user_id)')
    .eq('id', sourceId)
    .single();

  if (!source || (source as any).sites?.user_id !== user.id) {
    return NextResponse.json({ error: 'Kilde ikke funnet' }, { status: 404 });
  }

  // Chunks cascade-delete via FK, but be explicit
  await supabase.from('knowledge_chunks').delete().eq('source_id', sourceId);
  await supabase.from('knowledge_sources').delete().eq('id', sourceId);

  return NextResponse.json({ deleted: true });
}
```

#### 4.2 UPDATE: Chat route RAG integration
In `app/api/chat/route.ts` (Phase 2), replace the basic chunk retrieval with vector search:

```typescript
// Replace the simple text-based chunk retrieval with:
let contextChunks: string[] = [];

// Check if we have an OpenAI key for embeddings
if (process.env.OPENAI_API_KEY) {
  try {
    // Generate query embedding
    const embResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: message,
      }),
    });
    const embData = await embResponse.json();
    const queryEmbedding = embData.data[0].embedding;

    // Call the match_knowledge_chunks Supabase function
    const { data: matches } = await supabase.rpc('match_knowledge_chunks', {
      query_embedding: queryEmbedding,
      match_site_id: siteId,
      match_threshold: 0.75,
      match_count: 5,
    });

    if (matches && matches.length > 0) {
      contextChunks = matches.map((m: any) => m.content);
    }
  } catch (embErr) {
    console.error('RAG embedding error:', embErr);
    // Fall back to no context
  }
} else {
  // Fallback: simple text retrieval (no vector search)
  const { data: chunks } = await supabase
    .from('knowledge_chunks')
    .select('content')
    .eq('site_id', siteId)
    .limit(3);
  if (chunks) contextChunks = chunks.map(c => c.content);
}
```

#### 4.3 ADD dependency: `jszip`
For DOCX parsing (lighter than `child_process` + `unzip`):
```bash
npm install jszip
```

#### 4.4 ADD environment variable: `OPENAI_API_KEY`
Required for embedding generation. Add to `.env.local`:
```
OPENAI_API_KEY=sk-...
```

### Acceptance Criteria
1. Uploading a PDF via `POST /api/ingest` (FormData with `file` + `siteId`) extracts text, chunks it, generates embeddings, stores in `knowledge_chunks`
2. Uploading a TXT file works the same way
3. Uploading a DOCX file works the same way
4. `GET /api/ingest?siteId=xxx` returns the list of knowledge sources with chunk counts
5. `DELETE /api/ingest?sourceId=xxx` removes the source and all its chunks
6. Chat route uses `match_knowledge_chunks` RPC for vector similarity search when OpenAI key is available
7. `knowledge_chunks.embedding` column is populated with 1536-dimension vectors
8. Status transitions: pending → processing → ready/error

### Estimated Complexity
**High** — embedding pipeline, PDF parsing, vector search integration. ~10 hours.

---

## Phase 5: Dashboard Data Wiring

### Goal
Replace all hardcoded mock data in dashboard pages with real Supabase queries, making every page functional.

### Dependencies
**Phase 1 must be complete** (auth + Supabase client). Phases 2-4 should ideally be done for full functionality, but this phase can start in parallel for UI wiring.

### Files to Modify

#### 5.1 MODIFY: `app/dashboard/page.tsx`
Replace the hardcoded conversations array with real data.

**Remove:** The entire mock `conversations` array, mock `chatMessages` array, and hardcoded contact details.

**Add data fetching:**
```typescript
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/hooks';

// In component:
const { user } = useAuth();
const [conversations, setConversations] = useState<any[]>([]);
const [selectedConv, setSelectedConv] = useState<any>(null);
const [messages, setMessages] = useState<any[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  if (!user) return;
  loadConversations();
}, [user]);

async function loadConversations() {
  // Get user's sites first
  const { data: sites } = await supabase
    .from('sites')
    .select('id')
    .eq('user_id', user.id);

  if (!sites || sites.length === 0) {
    setLoading(false);
    return;
  }

  const siteIds = sites.map(s => s.id);

  // Get recent conversations across all sites
  const { data: convs } = await supabase
    .from('conversations')
    .select(`
      id, visitor_id, status, started_at, metadata,
      sites(name),
      messages(content, role, created_at)
    `)
    .in('site_id', siteIds)
    .order('started_at', { ascending: false })
    .limit(50);

  setConversations(convs || []);
  setLoading(false);
}

async function loadMessages(conversationId: string) {
  const { data } = await supabase
    .from('messages')
    .select('id, role, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  setMessages(data || []);
}
```

**Display:** Show real visitor IDs (truncated), real timestamps, real message previews, real status badges. If no conversations exist, show an empty state: "Ingen samtaler enna. Installer widget-koden pa nettstedet ditt for a begynne."

#### 5.2 MODIFY: `app/dashboard/analytics/page.tsx`
Replace mock metrics with real aggregated data.

```typescript
// Fetch real stats:
const { user } = useAuth();

useEffect(() => {
  if (!user) return;
  loadAnalytics();
}, [user]);

async function loadAnalytics() {
  const { data: sites } = await supabase
    .from('sites')
    .select('id, name')
    .eq('user_id', user.id);

  if (!sites) return;
  const siteIds = sites.map(s => s.id);

  // Total conversations
  const { count: totalConvs } = await supabase
    .from('conversations')
    .select('*', { count: 'exact', head: true })
    .in('site_id', siteIds);

  // Total messages
  const { count: totalMsgs } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .in('conversation_id',
      (await supabase.from('conversations').select('id').in('site_id', siteIds)).data?.map(c => c.id) || []
    );

  // Conversations per site (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  // ... aggregate per site

  setStats({ totalConvs, totalMsgs, ... });
}
```

**Replace all hardcoded metric values** with state variables. Show "0" for empty stats, not mock numbers.

#### 5.3 MODIFY: `app/dashboard/sites/page.tsx`
Replace mock sites array with real data.

```typescript
const { user } = useAuth();
const [sites, setSites] = useState<any[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  if (!user) return;
  loadSites();
}, [user]);

async function loadSites() {
  const { data } = await supabase
    .from('sites')
    .select('id, name, domain, is_active, created_at, conversations(count)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  setSites(data || []);
  setLoading(false);
}
```

**Wire the "Slett" button** to actually call `DELETE /api/sites/[id]` and refresh the list.
**Wire the "Rediger" button** to navigate to an edit page or open a modal.

#### 5.4 MODIFY: `app/dashboard/sites/new/page.tsx`
Wire form submission to `POST /api/sites`.

```typescript
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setLoading(true);

  const { data: session } = await supabase.auth.getSession();
  const token = session?.session?.access_token;

  const response = await fetch('/api/sites', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ name, domain, welcomeMessage, botName }),
  });

  const result = await response.json();
  if (response.ok) {
    // Show the API key to the user (only time it's visible)
    setCreatedApiKey(result.apiKey);
    // Then redirect to sites list
  } else {
    setError(result.error);
  }
  setLoading(false);
}
```

#### 5.5 MODIFY: `app/dashboard/knowledge/page.tsx`
Replace mock knowledge sources with real data.

```typescript
const { user } = useAuth();
const [sources, setSources] = useState<any[]>([]);
const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
const [sites, setSites] = useState<any[]>([]);

useEffect(() => {
  if (!user) return;
  loadSites();
}, [user]);

async function loadSites() {
  const { data } = await supabase
    .from('sites')
    .select('id, name')
    .eq('user_id', user.id);
  setSites(data || []);
  if (data && data.length > 0) {
    setSelectedSiteId(data[0].id);
    loadSources(data[0].id);
  }
}

async function loadSources(siteId: string) {
  const { data: session } = await supabase.auth.getSession();
  const response = await fetch(`/api/ingest?siteId=${siteId}`, {
    headers: { 'Authorization': `Bearer ${session?.session?.access_token}` },
  });
  const data = await response.json();
  setSources(data);
}
```

#### 5.6 MODIFY: `app/dashboard/knowledge/upload/page.tsx`
Wire the drag-and-drop upload zone to the real ingest API.

```typescript
async function handleUpload(file: File) {
  setUploadProgress(0);
  const { data: session } = await supabase.auth.getSession();

  const formData = new FormData();
  formData.append('file', file);
  formData.append('siteId', selectedSiteId);

  const response = await fetch('/api/ingest', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${session?.session?.access_token}` },
    body: formData,
  });

  setUploadProgress(100);
  const result = await response.json();

  if (response.ok) {
    // Add to documents list
    setDocuments(prev => [{
      id: result.sourceId,
      name: file.name,
      size: formatFileSize(file.size),
      type: file.name.split('.').pop()?.toUpperCase() || 'UKJENT',
      status: result.status === 'ready' ? 'Klar' : 'Feil',
      chunks: result.chunks,
    }, ...prev]);
  } else {
    setError(result.error);
  }
}
```

#### 5.7 MODIFY: `app/dashboard/widget/page.tsx`
Show real embed code based on user's selected site and API key.

```typescript
const { user } = useAuth();
const [sites, setSites] = useState<any[]>([]);
const [selectedSite, setSelectedSite] = useState<any>(null);

useEffect(() => {
  if (!user) return;
  loadSites();
}, [user]);

async function loadSites() {
  const { data } = await supabase
    .from('sites')
    .select('id, name, domain, api_keys(key_prefix, is_active)')
    .eq('user_id', user.id);
  setSites(data || []);
  if (data && data.length > 0) setSelectedSite(data[0]);
}

// Generate embed code:
const embedCode = selectedSite
  ? `<script src="${window.location.origin}/widget.js" data-site-id="${selectedSite.id}" data-api-key="DIN_API_NOKKEL"></script>`
  : '';
// Note: Show key_prefix + "..." since we don't store raw keys. User must use the key from when they created the site.
```

#### 5.8 MODIFY: `app/dashboard/settings/page.tsx`
Load and save real user settings.

```typescript
const { user } = useAuth();

// Load profile data:
useEffect(() => {
  if (!user) return;
  setEmail(user.email);
  setFullName(user.displayName);
  setCompany(user.companyName || '');
}, [user]);

// Save settings:
async function handleSave() {
  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: fullName,
      company_name: company,
    })
    .eq('id', user.id);

  if (!error) {
    setSuccess('Innstillinger lagret!');
  }
}
```

#### 5.9 MODIFY: `app/dashboard/billing/page.tsx`
Load real subscription and usage data.

```typescript
const { user } = useAuth();
const [subscription, setSubscription] = useState<any>(null);
const [usage, setUsage] = useState<any>(null);

useEffect(() => {
  if (!user) return;
  loadBilling();
}, [user]);

async function loadBilling() {
  // Get subscription
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();
  setSubscription(sub);

  // Get usage for current period
  const { data: logs } = await supabase
    .from('usage_logs')
    .select('action_type, tokens_used')
    .eq('user_id', user.id)
    .gte('created_at', sub?.current_period_start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
  // Aggregate...
  setUsage(aggregated);
}
```

#### 5.10 MODIFY: `app/dashboard/profile/page.tsx`
Load and save real profile data (this page is already well-built, just needs data wiring).

```typescript
const { user } = useAuth();

useEffect(() => {
  if (!user) return;
  setDisplayName(user.displayName);
  setAvatarUrl(user.avatarUrl || '');
}, [user]);

async function handleSave() {
  const { error } = await supabase
    .from('profiles')
    .update({ display_name: displayName, avatar_url: avatarUrl })
    .eq('id', user.id);
  // Show success/error
}
```

### Acceptance Criteria
1. Dashboard main page shows real conversations from Supabase (or empty state)
2. Clicking a conversation loads real messages
3. Sites page shows the user's actual sites from DB
4. Creating a new site works and shows the API key
5. Deleting a site works with confirmation
6. Knowledge page shows real knowledge sources per site
7. Upload page actually uploads files and creates knowledge sources
8. Widget page shows real embed code with the user's site ID
9. Settings page loads and saves real profile data
10. Analytics page shows real counts (conversations, messages, etc.)
11. Billing page shows real subscription status (or "Gratis plan" default)
12. No mock/hardcoded arrays remain in any dashboard page

### Estimated Complexity
**Medium** — mostly CRUD wiring, but touches every dashboard page. ~8 hours.

---

## Execution Order & Parallelization

```
Phase 1 (Foundation) ─── MUST BE FIRST
    │
    ├── Phase 2 (API Routes) ─── depends on Phase 1
    │       │
    │       └── Phase 3 (Widget.js) ─── depends on Phase 2
    │
    ├── Phase 4 (Knowledge Pipeline) ─── depends on Phase 1 only
    │
    └── Phase 5 (Dashboard Wiring) ─── depends on Phase 1, benefits from 2-4
```

**Recommended execution:**
1. **Phase 1** first (blocking everything)
2. **Phase 2 + Phase 4** in parallel (both depend only on Phase 1)
3. **Phase 3 + Phase 5** in parallel (Phase 3 needs Phase 2; Phase 5 needs Phase 1, improves with 2+4)

**Minimum viable demo path:** Phase 1 → Phase 2 → Phase 3 = working chat widget on any website.

---

## Complexity Summary

| Phase | Description | Estimated Hours | Difficulty |
|-------|-------------|----------------|------------|
| 1 | Database Client & Auth | 6h | Medium-High |
| 2 | Core API Routes | 10h | High |
| 3 | Widget.js | 12h | High |
| 4 | Knowledge Pipeline | 10h | High |
| 5 | Dashboard Wiring | 8h | Medium |
| **Total** | | **46h** | |

**With parallelization (2 agents):** ~28h wall-clock time.  
**With full parallelization (3 agents after Phase 1):** ~18h wall-clock time.

---

## Dependencies & Environment

**Required environment variables** (`.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=https://qknnodnreplieqljwlix.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
ANTHROPIC_API_KEY=<claude api key>
OPENAI_API_KEY=<openai key for embeddings>
```

**NPM packages to add:**
```bash
npm install jszip
```

**NPM packages to remove (after Phase 1):**
```bash
npm uninstall @vercel/postgres bcryptjs jsonwebtoken multer pg
```

**Files to delete:**
- `lib/db/client.ts`
- `lib/db/init.ts`
- `lib/config.js`
- `app/api/auth/login/route.ts`
- `app/api/auth/register/route.ts`
- `app/api/auth/verify/route.ts`
- `lib/utils/logger.js` (replace with `console.log` or create simple wrapper)
- `lib/utils/redis.js` (not used — Supabase handles caching)
- `packages/` directory (legacy monorepo — not used by Next.js app)
- `api.js` (legacy Express entry point)

---

## Post-Implementation (Not in scope, but noted)

- **Stripe integration** — wire subscriptions to real payment processing
- **Email verification** — Supabase Auth supports it but needs SMTP config
- **Rate limiting** — per API key, per IP
- **Analytics deep-dive** — charts, date range filters, export
- **Widget theming** — expose more customization options
- **Multi-language support** — widget responds in visitor's language
- **File storage** — use Supabase Storage instead of local uploads
- **Real-time** — Supabase Realtime for live conversation updates in dashboard
