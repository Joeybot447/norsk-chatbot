/**
 * Sites API Route
 * GET  /api/sites — List user's sites (Bearer token auth)
 * POST /api/sites — Create site + auto-generate API key
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '../../../lib/supabase/client';
import { generateApiKey } from '../../../lib/api/middleware';

async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  const supabase = createServiceClient();

  // Use the token to get the user via Supabase Auth admin
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;

  return data.user;
}

/**
 * GET /api/sites
 * List all sites for the authenticated user, with conversation counts and API keys
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Ikke autentisert' }, { status: 401 });
    }

    const supabase = createServiceClient();

    // Get user's sites
    const { data: sites, error } = await supabase
      .from('sites')
      .select('id, name, domain, welcome_message, bot_name, theme_config, is_active, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Sites list error:', error);
      return NextResponse.json({ error: 'Kunne ikke hente nettsteder' }, { status: 500 });
    }

    // Enrich with conversation counts and API keys
    const enriched = await Promise.all(
      (sites || []).map(async (site) => {
        const { count: conversationCount } = await supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .eq('site_id', site.id);

        const { data: apiKeys } = await supabase
          .from('api_keys')
          .select('id, key_prefix, name, is_active, last_used_at, created_at')
          .eq('site_id', site.id)
          .order('created_at', { ascending: false });

        return {
          ...site,
          conversationCount: conversationCount || 0,
          apiKeys: apiKeys || [],
        };
      })
    );

    return NextResponse.json({ sites: enriched });
  } catch (err) {
    const error = err as Error;
    console.error(`Sites GET error: ${error.message}`);
    return NextResponse.json({ error: 'Noe gikk galt' }, { status: 500 });
  }
}

/**
 * POST /api/sites
 * Body: { name, domain?, welcomeMessage?, botName? }
 * Creates a site and auto-generates an API key (shown once in response)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Ikke autentisert' }, { status: 401 });
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Ugyldig JSON' }, { status: 400 });
    }

    const { name, domain, welcomeMessage, botName } = body;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Navn er påkrevd' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Create site
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .insert({
        user_id: user.id,
        name: name.trim(),
        domain: domain || null,
        welcome_message: welcomeMessage || 'Hei! Hvordan kan jeg hjelpe deg?',
        bot_name: botName || 'NorskBot',
        theme_config: {},
        is_active: true,
      })
      .select('id, name, domain, welcome_message, bot_name, is_active, created_at')
      .single();

    if (siteError || !site) {
      console.error('Site create error:', siteError);
      return NextResponse.json({ error: 'Kunne ikke opprette nettsted' }, { status: 500 });
    }

    // Auto-generate API key
    const { key, hash, prefix } = generateApiKey();

    const { error: keyError } = await supabase
      .from('api_keys')
      .insert({
        site_id: site.id,
        key_hash: hash,
        key_prefix: prefix,
        name: 'Standard API-nøkkel',
        is_active: true,
      });

    if (keyError) {
      console.error('API key create error:', keyError);
    }

    return NextResponse.json(
      {
        site,
        apiKey: key, // Raw key — shown ONCE
        apiKeyPrefix: prefix,
        message: 'Nettsted opprettet. Lagre API-nøkkelen — den vises kun én gang.',
      },
      { status: 201 }
    );
  } catch (err) {
    const error = err as Error;
    console.error(`Sites POST error: ${error.message}`);
    return NextResponse.json({ error: 'Noe gikk galt' }, { status: 500 });
  }
}
