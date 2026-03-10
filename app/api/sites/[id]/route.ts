/**
 * Single Site API Route
 * GET    /api/sites/[id] — Get site with stats
 * PATCH  /api/sites/[id] — Update site
 * DELETE /api/sites/[id] — Delete site (cascades)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '../../../../lib/supabase/client';

async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const supabase = createServiceClient();
  const { data, error } = await supabase.auth.getUser(authHeader.slice(7));
  if (error || !data.user) return null;
  return data.user;
}

async function verifySiteOwnership(supabase: any, siteId: string, userId: string) {
  const { data: site, error } = await supabase
    .from('sites')
    .select('*')
    .eq('id', siteId)
    .eq('user_id', userId)
    .single();

  return error ? null : site;
}

/**
 * GET /api/sites/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Ikke autentisert' }, { status: 401 });
    }

    const supabase = createServiceClient();
    const site = await verifySiteOwnership(supabase, id, user.id);
    if (!site) {
      return NextResponse.json({ error: 'Nettsted ikke funnet' }, { status: 404 });
    }

    // Get stats
    const { count: conversationCount } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('site_id', id);

    const { count: messageCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .in('conversation_id',
        (await supabase.from('conversations').select('id').eq('site_id', id)).data?.map((c: any) => c.id) || []
      );

    const { count: sourceCount } = await supabase
      .from('knowledge_sources')
      .select('*', { count: 'exact', head: true })
      .eq('site_id', id);

    const { data: apiKeys } = await supabase
      .from('api_keys')
      .select('id, key_prefix, name, is_active, last_used_at, created_at')
      .eq('site_id', id)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      ...site,
      stats: {
        conversations: conversationCount || 0,
        messages: messageCount || 0,
        knowledgeSources: sourceCount || 0,
      },
      apiKeys: apiKeys || [],
    });
  } catch (err) {
    const error = err as Error;
    console.error(`Site GET error: ${error.message}`);
    return NextResponse.json({ error: 'Noe gikk galt' }, { status: 500 });
  }
}

/**
 * PATCH /api/sites/[id]
 * Body: { name?, domain?, welcome_message?, bot_name?, theme_config?, is_active? }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Ikke autentisert' }, { status: 401 });
    }

    const supabase = createServiceClient();
    const site = await verifySiteOwnership(supabase, id, user.id);
    if (!site) {
      return NextResponse.json({ error: 'Nettsted ikke funnet' }, { status: 404 });
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Ugyldig JSON' }, { status: 400 });
    }

    // Only allow specific fields
    const allowedFields = ['name', 'domain', 'welcome_message', 'bot_name', 'theme_config', 'is_active'];
    const updates: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Ingen felt å oppdatere' }, { status: 400 });
    }

    const { data: updated, error: updateError } = await supabase
      .from('sites')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) {
      console.error('Site update error:', updateError);
      return NextResponse.json({ error: 'Kunne ikke oppdatere nettsted' }, { status: 500 });
    }

    return NextResponse.json(updated);
  } catch (err) {
    const error = err as Error;
    console.error(`Site PATCH error: ${error.message}`);
    return NextResponse.json({ error: 'Noe gikk galt' }, { status: 500 });
  }
}

/**
 * DELETE /api/sites/[id]
 * Deletes site and all related data (cascading)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Ikke autentisert' }, { status: 401 });
    }

    const supabase = createServiceClient();
    const site = await verifySiteOwnership(supabase, id, user.id);
    if (!site) {
      return NextResponse.json({ error: 'Nettsted ikke funnet' }, { status: 404 });
    }

    // Delete in order: messages → conversations → chunks → sources → api_keys → usage_logs → site
    // Get conversation IDs first
    const { data: convs } = await supabase
      .from('conversations')
      .select('id')
      .eq('site_id', id);

    if (convs && convs.length > 0) {
      const convIds = convs.map((c: any) => c.id);
      await supabase.from('messages').delete().in('conversation_id', convIds);
    }

    await supabase.from('conversations').delete().eq('site_id', id);

    // Get source IDs
    const { data: sources } = await supabase
      .from('knowledge_sources')
      .select('id')
      .eq('site_id', id);

    if (sources && sources.length > 0) {
      const sourceIds = sources.map((s: any) => s.id);
      await supabase.from('knowledge_chunks').delete().in('source_id', sourceIds);
    }

    await supabase.from('knowledge_sources').delete().eq('site_id', id);
    await supabase.from('api_keys').delete().eq('site_id', id);
    await supabase.from('usage_logs').delete().eq('site_id', id);
    await supabase.from('sites').delete().eq('id', id);

    return NextResponse.json({ deleted: true, siteId: id });
  } catch (err) {
    const error = err as Error;
    console.error(`Site DELETE error: ${error.message}`);
    return NextResponse.json({ error: 'Kunne ikke slette nettsted' }, { status: 500 });
  }
}
