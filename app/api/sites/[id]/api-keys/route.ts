/**
 * API Keys Route
 * POST   /api/sites/[id]/api-keys — Generate new API key
 * DELETE /api/sites/[id]/api-keys — Revoke (deactivate) a key
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '../../../../../lib/supabase/client';
import { generateApiKey } from '../../../../../lib/api/middleware';

async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const supabase = createServiceClient();
  const { data, error } = await supabase.auth.getUser(authHeader.slice(7));
  if (error || !data.user) return null;
  return data.user;
}

/**
 * POST /api/sites/[id]/api-keys
 * Body: { name? }
 * Generates a new API key for the site
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: siteId } = await params;
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Ikke autentisert' }, { status: 401 });
    }

    const supabase = createServiceClient();

    // Verify site ownership
    const { data: site } = await supabase
      .from('sites')
      .select('id')
      .eq('id', siteId)
      .eq('user_id', user.id)
      .single();

    if (!site) {
      return NextResponse.json({ error: 'Nettsted ikke funnet' }, { status: 404 });
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // No body is fine — name is optional
    }

    const { key, hash, prefix } = generateApiKey();

    const { data: keyRow, error: keyError } = await supabase
      .from('api_keys')
      .insert({
        site_id: siteId,
        key_hash: hash,
        key_prefix: prefix,
        name: body.name || 'API-nøkkel',
        is_active: true,
      })
      .select('id, key_prefix, name, is_active, created_at')
      .single();

    if (keyError) {
      console.error('API key create error:', keyError);
      return NextResponse.json({ error: 'Kunne ikke opprette API-nøkkel' }, { status: 500 });
    }

    return NextResponse.json(
      {
        ...keyRow,
        key, // Raw key — shown ONCE
        message: 'API-nøkkel opprettet. Lagre den — den vises kun én gang.',
      },
      { status: 201 }
    );
  } catch (err) {
    const error = err as Error;
    console.error(`API key POST error: ${error.message}`);
    return NextResponse.json({ error: 'Noe gikk galt' }, { status: 500 });
  }
}

/**
 * DELETE /api/sites/[id]/api-keys
 * Body: { keyId }
 * Deactivates (revokes) the key — does NOT delete it
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: siteId } = await params;
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Ikke autentisert' }, { status: 401 });
    }

    const supabase = createServiceClient();

    // Verify site ownership
    const { data: site } = await supabase
      .from('sites')
      .select('id')
      .eq('id', siteId)
      .eq('user_id', user.id)
      .single();

    if (!site) {
      return NextResponse.json({ error: 'Nettsted ikke funnet' }, { status: 404 });
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Ugyldig JSON' }, { status: 400 });
    }

    const { keyId } = body;
    if (!keyId) {
      return NextResponse.json({ error: 'keyId er påkrevd' }, { status: 400 });
    }

    // Deactivate the key (don't delete)
    const { data: updated, error: updateError } = await supabase
      .from('api_keys')
      .update({ is_active: false })
      .eq('id', keyId)
      .eq('site_id', siteId)
      .select('id, key_prefix, is_active')
      .single();

    if (updateError || !updated) {
      return NextResponse.json({ error: 'API-nøkkel ikke funnet' }, { status: 404 });
    }

    return NextResponse.json({ revoked: true, keyId: updated.id, prefix: updated.key_prefix });
  } catch (err) {
    const error = err as Error;
    console.error(`API key DELETE error: ${error.message}`);
    return NextResponse.json({ error: 'Noe gikk galt' }, { status: 500 });
  }
}
