import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser-side client (anon key, respects RLS, persists auth session)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side client (service role key, bypasses RLS) — for API routes
export function createServiceClient(): SupabaseClient {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Server client with user's session token (for SSR with RLS)
export function createServerClient(accessToken?: string): SupabaseClient {
  if (!accessToken) return supabase;
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
