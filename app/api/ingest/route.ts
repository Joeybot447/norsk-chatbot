/**
 * Ingest API Route (Placeholder — Phase 4 will add actual processing)
 * POST /api/ingest — Accept file/content upload, store metadata in knowledge_sources
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '../../../lib/supabase/client';

async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const supabase = createServiceClient();
  const { data, error } = await supabase.auth.getUser(authHeader.slice(7));
  if (error || !data.user) return null;
  return data.user;
}

/**
 * POST /api/ingest
 * Accepts multipart/form-data (file) or JSON ({ siteId, title, content, type })
 * Creates a knowledge_sources row with status='pending'
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Ikke autentisert' }, { status: 401 });
    }

    const supabase = createServiceClient();
    const contentType = request.headers.get('content-type') || '';

    let siteId: string;
    let title: string;
    let type: string = 'document';
    let content: string | null = null;
    let fileUrl: string | null = null;
    let fileSize: number | null = null;

    if (contentType.includes('multipart/form-data')) {
      // File upload
      const formData = await request.formData();
      siteId = formData.get('siteId') as string;
      title = (formData.get('title') as string) || 'Opplastet fil';
      type = (formData.get('type') as string) || 'document';

      const file = formData.get('file') as File | null;
      if (file) {
        title = title || file.name;
        fileSize = file.size;
        // In Phase 4, we'd upload to storage and process the file
        // For now, just record metadata
        fileUrl = `pending://${file.name}`;
      }
    } else {
      // JSON body
      let body: any;
      try {
        body = await request.json();
      } catch {
        return NextResponse.json({ error: 'Ugyldig JSON' }, { status: 400 });
      }

      siteId = body.siteId;
      title = body.title || 'Innhold uten tittel';
      type = body.type || 'text';
      content = body.content || null;
    }

    if (!siteId) {
      return NextResponse.json({ error: 'siteId er påkrevd' }, { status: 400 });
    }

    // Verify user owns this site
    const { data: site } = await supabase
      .from('sites')
      .select('id')
      .eq('id', siteId)
      .eq('user_id', user.id)
      .single();

    if (!site) {
      return NextResponse.json({ error: 'Nettsted ikke funnet eller ingen tilgang' }, { status: 404 });
    }

    // Create knowledge_sources row
    const { data: source, error: insertError } = await supabase
      .from('knowledge_sources')
      .insert({
        site_id: siteId,
        type,
        title,
        content,
        file_url: fileUrl,
        file_size: fileSize,
        chunk_count: 0,
        status: 'pending',
      })
      .select('id, type, title, status, created_at')
      .single();

    if (insertError || !source) {
      console.error('Ingest insert error:', insertError);
      return NextResponse.json({ error: 'Kunne ikke lagre kilde' }, { status: 500 });
    }

    return NextResponse.json(
      {
        sourceId: source.id,
        type: source.type,
        title: source.title,
        status: source.status,
        message: 'Kilde mottatt. Behandling vil skje i en fremtidig fase.',
      },
      { status: 201 }
    );
  } catch (err) {
    const error = err as Error;
    console.error(`Ingest POST error: ${error.message}`);
    return NextResponse.json({ error: 'Noe gikk galt under innlasting' }, { status: 500 });
  }
}
