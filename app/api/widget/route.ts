/**
 * Widget Config API Route
 * GET /api/widget?siteId=xxx — Public endpoint, returns site config for widget embedding
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '../../../lib/supabase/client';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function corsJson(data: any, init?: ResponseInit) {
  const res = NextResponse.json(data, init);
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v));
  res.headers.set('Cache-Control', 'public, max-age=300'); // 5-min cache
  return res;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * GET /api/widget?siteId=xxx
 * Public — returns site config for widget rendering
 */
export async function GET(request: NextRequest) {
  try {
    const siteId = request.nextUrl.searchParams.get('siteId');
    if (!siteId) {
      return corsJson({ error: 'siteId parameter er påkrevd' }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data: site, error } = await supabase
      .from('sites')
      .select('id, name, welcome_message, bot_name, theme_config')
      .eq('id', siteId)
      .eq('is_active', true)
      .single();

    if (error || !site) {
      return corsJson({ error: 'Nettsted ikke funnet' }, { status: 404 });
    }

    return corsJson({
      id: site.id,
      name: site.name,
      welcomeMessage: site.welcome_message,
      botName: site.bot_name,
      theme: site.theme_config,
    });
  } catch (err) {
    const error = err as Error;
    console.error(`Widget route error: ${error.message}`);
    return corsJson(
      { error: 'Kunne ikke laste widgetkonfigurasjon' },
      { status: 500 }
    );
  }
}
