/**
 * API Key Middleware
 * Handles API key generation, hashing, validation, and extraction.
 */

import { NextRequest } from 'next/server';
import { createServiceClient } from '../supabase/client';
import crypto from 'crypto';

/**
 * SHA-256 hash of an API key
 */
export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Generate a new API key with 'nb_' prefix
 * Returns the raw key (shown once), its hash (stored), and prefix (for display)
 */
export function generateApiKey(): { key: string; hash: string; prefix: string } {
  const random = crypto.randomBytes(32).toString('hex');
  const key = `nb_${random}`;
  const hash = hashApiKey(key);
  const prefix = key.slice(0, 10); // "nb_" + first 7 chars of random
  return { key, hash, prefix };
}

/**
 * Validate an API key against the database.
 * Returns site info if valid, null if not.
 * Updates last_used_at on successful validation.
 */
export async function validateApiKey(
  apiKey: string
): Promise<{ siteId: string; siteName: string } | null> {
  const hash = hashApiKey(apiKey);
  const supabase = createServiceClient();

  const { data: keyRow, error } = await supabase
    .from('api_keys')
    .select('id, site_id, is_active')
    .eq('key_hash', hash)
    .eq('is_active', true)
    .single();

  if (error || !keyRow) return null;

  // Get site name
  const { data: site } = await supabase
    .from('sites')
    .select('name, is_active')
    .eq('id', keyRow.site_id)
    .single();

  if (!site || !site.is_active) return null;

  // Update last_used_at (fire-and-forget)
  supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', keyRow.id)
    .then(() => {});

  return { siteId: keyRow.site_id, siteName: site.name };
}

/**
 * Extract API key from request.
 * Checks (in order): Authorization Bearer header, X-API-Key header, query param.
 */
export function extractApiKey(request: NextRequest): string | null {
  // 1. Authorization: Bearer nb_xxx
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer nb_')) {
    return authHeader.slice(7);
  }

  // 2. X-API-Key header
  const xApiKey = request.headers.get('x-api-key');
  if (xApiKey) return xApiKey;

  // 3. Query parameter
  const queryKey = request.nextUrl.searchParams.get('apiKey');
  if (queryKey) return queryKey;

  return null;
}
