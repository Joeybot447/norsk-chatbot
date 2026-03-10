/**
 * Authentication Middleware
 * Supabase Auth verification and user context
 */

import { NextRequest } from 'next/server';
import { createServerClient } from '../supabase/client';

export interface AuthContext {
  userId: string;
  email: string;
  role: string;
}

export async function requireAuth(request: NextRequest): Promise<AuthContext | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7);
  const supabase = createServerClient(token);

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  return {
    userId: user.id,
    email: user.email || '',
    role: user.user_metadata?.role || 'user',
  };
}

export async function requireSiteAuth(request: NextRequest, siteId: string): Promise<AuthContext | null> {
  const auth = await requireAuth(request);
  if (!auth) return null;

  const token = request.headers.get('authorization')?.slice(7);
  const supabase = createServerClient(token);

  const { data: site } = await supabase
    .from('sites')
    .select('id')
    .eq('id', siteId)
    .eq('user_id', auth.userId)
    .single();

  return site ? auth : null;
}
