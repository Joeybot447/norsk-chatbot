/**
 * Knowledge Ingestion API Route — Phase 4
 * POST   /api/ingest — Upload file or text, extract → chunk → embed → store
 * GET    /api/ingest?siteId=xxx — List knowledge sources
 * DELETE /api/ingest?sourceId=xxx — Delete knowledge source + chunks
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '../../../lib/supabase/client';

// ---------------------------------------------------------------------------
// Auth helper
// ---------------------------------------------------------------------------
async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const supabase = createServiceClient();
  const { data, error } = await supabase.auth.getUser(authHeader.slice(7));
  if (error || !data.user) return null;
  return data.user;
}

// ---------------------------------------------------------------------------
// Text chunking — split on paragraph breaks with overlap
// ---------------------------------------------------------------------------
function chunkText(text: string, maxChars = 2000, overlap = 200): string[] {
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  let current = '';

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    // If a single paragraph exceeds maxChars, force-split it
    if (trimmed.length > maxChars) {
      // Flush current buffer first
      if (current.trim()) {
        chunks.push(current.trim());
        current = current.trim().slice(-overlap);
      }
      // Force-split the oversized paragraph on sentence boundaries or hard limit
      let remaining = trimmed;
      while (remaining.length > maxChars) {
        let splitAt = remaining.lastIndexOf('. ', maxChars);
        if (splitAt < maxChars * 0.3) splitAt = maxChars; // no good sentence break
        else splitAt += 1; // include the period
        chunks.push(remaining.slice(0, splitAt).trim());
        remaining = remaining.slice(Math.max(0, splitAt - overlap)).trim();
      }
      if (remaining) current = remaining;
      continue;
    }

    // Would adding this paragraph exceed the limit?
    const candidate = current ? `${current}\n\n${trimmed}` : trimmed;
    if (candidate.length > maxChars) {
      chunks.push(current.trim());
      // Start next chunk with overlap from end of previous
      const overlapText = current.trim().slice(-overlap);
      current = overlapText ? `${overlapText}\n\n${trimmed}` : trimmed;
    } else {
      current = candidate;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks.filter((c) => c.length > 0);
}

// ---------------------------------------------------------------------------
// Embedding generation — gracefully degrades if no OPENAI_API_KEY
// ---------------------------------------------------------------------------
async function generateEmbedding(text: string): Promise<number[] | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: text }),
    });

    if (!response.ok) {
      console.error(`OpenAI embedding error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    return data.data?.[0]?.embedding ?? null;
  } catch (err) {
    console.error('Embedding generation failed:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// File text extraction helpers
// ---------------------------------------------------------------------------
async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();

  if (name.endsWith('.txt') || name.endsWith('.md') || name.endsWith('.csv')) {
    return await file.text();
  }

  if (name.endsWith('.pdf')) {
    return await extractPdf(file);
  }

  if (name.endsWith('.docx')) {
    return await extractDocx(file);
  }

  // Fallback: try to read as text
  try {
    return await file.text();
  } catch {
    throw new Error(`Filtypen støttes ikke: ${name}`);
  }
}

async function extractPdf(file: File): Promise<string> {
  try {
    const pdfParse = (await import('pdf-parse')).default;
    const buffer = Buffer.from(await file.arrayBuffer());
    const data = await pdfParse(buffer);
    return data.text || '';
  } catch (err) {
    console.error('pdf-parse failed, trying fallback:', err);
    // Simple fallback: read as text (won't work for binary PDFs but won't crash)
    try {
      const text = await file.text();
      // If it starts with %PDF it's binary — return empty with warning
      if (text.startsWith('%PDF')) {
        throw new Error('Kunne ikke lese PDF-filen. Prøv å konvertere til tekst først.');
      }
      return text;
    } catch {
      throw new Error('Kunne ikke lese PDF-filen. Prøv å konvertere til tekst først.');
    }
  }
}

async function extractDocx(file: File): Promise<string> {
  try {
    const JSZip = (await import('jszip')).default;
    const buffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(buffer);

    const docXml = zip.file('word/document.xml');
    if (!docXml) {
      throw new Error('Ugyldig DOCX-fil: mangler word/document.xml');
    }

    const xmlContent = await docXml.async('string');

    // Strip XML tags, keep text content
    // Replace paragraph/line break tags with newlines first
    const text = xmlContent
      .replace(/<w:p[\s>]/g, '\n') // paragraph starts
      .replace(/<w:br[^>]*\/>/g, '\n') // line breaks
      .replace(/<w:tab[^>]*\/>/g, '\t') // tabs
      .replace(/<[^>]+>/g, '') // strip all remaining XML
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/\n{3,}/g, '\n\n') // collapse excessive newlines
      .trim();

    return text;
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('Ugyldig')) throw err;
    throw new Error('Kunne ikke lese DOCX-filen. Sjekk at filen er gyldig.');
  }
}

// ---------------------------------------------------------------------------
// POST /api/ingest — Upload and process content
// ---------------------------------------------------------------------------
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
    let sourceType: string = 'document';
    let rawText: string = '';
    let fileSize: number | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      siteId = formData.get('siteId') as string;
      title = (formData.get('title') as string) || '';
      sourceType = (formData.get('type') as string) || 'document';

      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ error: 'Fil er påkrevd' }, { status: 400 });
      }

      title = title || file.name;
      fileSize = file.size;
      rawText = await extractTextFromFile(file);
    } else {
      // JSON body — direct text ingestion
      let body: any;
      try {
        body = await request.json();
      } catch {
        return NextResponse.json({ error: 'Ugyldig JSON' }, { status: 400 });
      }

      siteId = body.siteId;
      title = body.title || 'Innhold uten tittel';
      sourceType = body.type || 'text';
      rawText = body.text || body.content || '';
    }

    if (!siteId) {
      return NextResponse.json({ error: 'siteId er påkrevd' }, { status: 400 });
    }

    if (!rawText.trim()) {
      return NextResponse.json({ error: 'Ingen tekst funnet i innholdet' }, { status: 400 });
    }

    // Verify site ownership
    const { data: site } = await supabase
      .from('sites')
      .select('id')
      .eq('id', siteId)
      .eq('user_id', user.id)
      .single();

    if (!site) {
      return NextResponse.json({ error: 'Nettsted ikke funnet eller ingen tilgang' }, { status: 404 });
    }

    // Create knowledge_sources record
    const { data: source, error: sourceError } = await supabase
      .from('knowledge_sources')
      .insert({
        site_id: siteId,
        type: sourceType,
        title,
        content: rawText,
        file_size: fileSize,
        chunk_count: 0,
        status: 'processing',
      })
      .select('id')
      .single();

    if (sourceError || !source) {
      console.error('Knowledge source insert error:', sourceError);
      return NextResponse.json({ error: 'Kunne ikke lagre kilde' }, { status: 500 });
    }

    const sourceId = source.id;

    // Chunk the text
    const textChunks = chunkText(rawText);
    let successCount = 0;
    let totalTokensUsed = 0;

    // Process chunks: generate embeddings + store
    for (const chunkContent of textChunks) {
      try {
        const embedding = await generateEmbedding(chunkContent);
        const estimatedTokens = Math.ceil(chunkContent.length / 4);
        if (embedding) totalTokensUsed += estimatedTokens;

        const insertData: Record<string, any> = {
          source_id: sourceId,
          site_id: siteId,
          content: chunkContent,
          metadata: { chunk_index: successCount, char_count: chunkContent.length },
        };

        // Only set embedding if we got one (pgvector expects array or null)
        if (embedding) {
          insertData.embedding = JSON.stringify(embedding);
        }

        const { error: chunkError } = await supabase
          .from('knowledge_chunks')
          .insert(insertData);

        if (chunkError) {
          console.error(`Chunk insert error (index ${successCount}):`, chunkError);
          continue;
        }

        successCount++;
      } catch (err) {
        console.error(`Chunk processing error:`, err);
        // Continue with remaining chunks
      }
    }

    // Update source with final chunk count and status
    const finalStatus = successCount > 0 ? 'ready' : 'error';
    await supabase
      .from('knowledge_sources')
      .update({ chunk_count: successCount, status: finalStatus })
      .eq('id', sourceId);

    // Log usage
    await supabase.from('usage_logs').insert({
      site_id: siteId,
      user_id: user.id,
      action_type: 'knowledge_ingest',
      tokens_used: totalTokensUsed,
      metadata: {
        source_id: sourceId,
        title,
        type: sourceType,
        total_chunks: textChunks.length,
        successful_chunks: successCount,
        has_embeddings: !!process.env.OPENAI_API_KEY,
      },
    });

    return NextResponse.json(
      {
        sourceId,
        title,
        chunks: successCount,
        totalChunks: textChunks.length,
        status: finalStatus,
      },
      { status: 201 }
    );
  } catch (err) {
    const error = err as Error;
    console.error(`Ingest POST error: ${error.message}`);
    return NextResponse.json(
      { error: error.message || 'Noe gikk galt under innlasting' },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// GET /api/ingest?siteId=xxx — List knowledge sources for a site
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Ikke autentisert' }, { status: 401 });
    }

    const siteId = request.nextUrl.searchParams.get('siteId');
    if (!siteId) {
      return NextResponse.json({ error: 'siteId er påkrevd' }, { status: 400 });
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
      return NextResponse.json({ error: 'Nettsted ikke funnet eller ingen tilgang' }, { status: 404 });
    }

    const { data: sources, error } = await supabase
      .from('knowledge_sources')
      .select('id, type, title, file_size, chunk_count, status, created_at')
      .eq('site_id', siteId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Knowledge sources fetch error:', error);
      return NextResponse.json({ error: 'Kunne ikke hente kilder' }, { status: 500 });
    }

    return NextResponse.json({ sources: sources || [] });
  } catch (err) {
    const error = err as Error;
    console.error(`Ingest GET error: ${error.message}`);
    return NextResponse.json({ error: 'Noe gikk galt' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/ingest?sourceId=xxx — Delete a knowledge source and its chunks
// ---------------------------------------------------------------------------
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Ikke autentisert' }, { status: 401 });
    }

    const sourceId = request.nextUrl.searchParams.get('sourceId');
    if (!sourceId) {
      return NextResponse.json({ error: 'sourceId er påkrevd' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Fetch source and verify ownership through site
    const { data: source } = await supabase
      .from('knowledge_sources')
      .select('id, site_id')
      .eq('id', sourceId)
      .single();

    if (!source) {
      return NextResponse.json({ error: 'Kilde ikke funnet' }, { status: 404 });
    }

    // Verify user owns the site this source belongs to
    const { data: site } = await supabase
      .from('sites')
      .select('id')
      .eq('id', source.site_id)
      .eq('user_id', user.id)
      .single();

    if (!site) {
      return NextResponse.json({ error: 'Ingen tilgang til denne kilden' }, { status: 403 });
    }

    // Delete chunks first (foreign key constraint)
    await supabase
      .from('knowledge_chunks')
      .delete()
      .eq('source_id', sourceId);

    // Delete the source
    const { error: deleteError } = await supabase
      .from('knowledge_sources')
      .delete()
      .eq('id', sourceId);

    if (deleteError) {
      console.error('Source delete error:', deleteError);
      return NextResponse.json({ error: 'Kunne ikke slette kilden' }, { status: 500 });
    }

    return NextResponse.json({ deleted: true });
  } catch (err) {
    const error = err as Error;
    console.error(`Ingest DELETE error: ${error.message}`);
    return NextResponse.json({ error: 'Noe gikk galt under sletting' }, { status: 500 });
  }
}
