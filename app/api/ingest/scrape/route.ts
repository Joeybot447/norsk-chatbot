/**
 * URL Scraping API Route — Phase A
 * POST /api/ingest/scrape — Crawl a website via ScrapingBee, chunk, embed, store
 * GET  /api/ingest/scrape?sourceId=xxx — Check scrape status
 */

import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { createServiceClient } from '../../../../lib/supabase/client';

// ---------------------------------------------------------------------------
// Auth helper (same pattern as /api/ingest)
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
// Text chunking (reused from /api/ingest)
// ---------------------------------------------------------------------------
function chunkText(text: string, maxChars = 2000, overlap = 200): string[] {
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  let current = '';

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    if (trimmed.length > maxChars) {
      if (current.trim()) {
        chunks.push(current.trim());
        current = current.trim().slice(-overlap);
      }
      let remaining = trimmed;
      while (remaining.length > maxChars) {
        let splitAt = remaining.lastIndexOf('. ', maxChars);
        if (splitAt < maxChars * 0.3) splitAt = maxChars;
        else splitAt += 1;
        chunks.push(remaining.slice(0, splitAt).trim());
        remaining = remaining.slice(Math.max(0, splitAt - overlap)).trim();
      }
      if (remaining) current = remaining;
      continue;
    }

    const candidate = current ? `${current}\n\n${trimmed}` : trimmed;
    if (candidate.length > maxChars) {
      chunks.push(current.trim());
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
// Embedding generation (reused from /api/ingest)
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
// URL normalization + validation helpers
// ---------------------------------------------------------------------------
function normalizeUrl(href: string, baseUrl: string): string | null {
  try {
    const url = new URL(href, baseUrl);
    // Only http/https
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    // Strip fragment
    url.hash = '';
    // Strip trailing slash (except root)
    let normalized = url.href;
    if (normalized.endsWith('/') && url.pathname !== '/') {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  } catch {
    return null;
  }
}

function isHtmlUrl(url: string): boolean {
  const path = new URL(url).pathname.toLowerCase();
  const skipExtensions = [
    '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.ico',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.css', '.js', '.json', '.xml', '.zip', '.rar', '.gz',
    '.mp3', '.mp4', '.avi', '.mov', '.wmv', '.flv',
    '.woff', '.woff2', '.ttf', '.eot',
  ];
  return !skipExtensions.some((ext) => path.endsWith(ext));
}

// ---------------------------------------------------------------------------
// ScrapingBee fetch helper
// ---------------------------------------------------------------------------
async function fetchPageViaScrapingBee(
  url: string,
  apiKey: string
): Promise<{ text: string; links: string[] } | null> {
  try {
    const extractRules = JSON.stringify({
      text: { selector: 'body', output: 'text' },
      links: { selector: 'a', output: '@href', type: 'list' },
    });

    const params = new URLSearchParams({
      api_key: apiKey,
      url,
      render_js: 'false',
      extract_rules: extractRules,
    });

    const response = await fetch(
      `https://app.scrapingbee.com/api/v1?${params.toString()}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      console.error(`ScrapingBee error for ${url}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return {
      text: data.text || '',
      links: Array.isArray(data.links) ? data.links : [],
    };
  } catch (err) {
    console.error(`ScrapingBee fetch failed for ${url}:`, err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Clean extracted text via cheerio (strip nav, footer, script, style)
// ---------------------------------------------------------------------------
function cleanHtmlText(rawText: string): string {
  // rawText from ScrapingBee extract_rules is already body text,
  // but we still clean up whitespace and common noise
  return rawText
    .replace(/\s+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ---------------------------------------------------------------------------
// Extract same-domain links
// ---------------------------------------------------------------------------
function extractSameDomainLinks(
  links: string[],
  baseUrl: string,
  hostname: string
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const href of links) {
    const normalized = normalizeUrl(href, baseUrl);
    if (!normalized) continue;

    try {
      const linkUrl = new URL(normalized);
      if (linkUrl.hostname !== hostname) continue;
      if (!isHtmlUrl(normalized)) continue;
      if (seen.has(normalized)) continue;

      seen.add(normalized);
      result.push(normalized);
    } catch {
      continue;
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// POST /api/ingest/scrape — Crawl website, chunk, embed, store
// ---------------------------------------------------------------------------
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

    const { url, siteId, maxPages = 30 } = body;

    // Validate URL
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL er påkrevd' }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        throw new Error('Invalid protocol');
      }
    } catch {
      return NextResponse.json({ error: 'Ugyldig URL. Bruk http:// eller https://' }, { status: 400 });
    }

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
      return NextResponse.json(
        { error: 'Nettsted ikke funnet eller ingen tilgang' },
        { status: 404 }
      );
    }

    // Check ScrapingBee API key
    const scrapingBeeKey = process.env.SCRAPINGBEE_API_KEY;
    if (!scrapingBeeKey) {
      return NextResponse.json(
        { error: 'ScrapingBee API-nøkkel mangler i konfigurasjon' },
        { status: 500 }
      );
    }

    const hostname = parsedUrl.hostname;
    const domain = hostname.replace(/^www\./, '');

    // Create knowledge_source record
    const { data: source, error: sourceError } = await supabase
      .from('knowledge_sources')
      .insert({
        site_id: siteId,
        type: 'webpage',
        title: domain,
        status: 'processing',
        content: url,
        chunk_count: 0,
      })
      .select('id')
      .single();

    if (sourceError || !source) {
      console.error('Knowledge source insert error:', sourceError);
      return NextResponse.json({ error: 'Kunne ikke opprette kilde' }, { status: 500 });
    }

    const sourceId = source.id;

    // --- Fire-and-forget: crawl in background ---
    // We return the sourceId immediately so the UI can poll for progress
    const crawlInBackground = async () => {
      const bgSupabase = createServiceClient();
      try {
        const normalizedStart = normalizeUrl(url, url);
        if (!normalizedStart) {
          await bgSupabase
            .from('knowledge_sources')
            .update({ status: 'error', content: `${url} — Ugyldig start-URL` })
            .eq('id', sourceId);
          return;
        }

        const visited = new Set<string>();
        const queue: string[] = [normalizedStart];
        visited.add(normalizedStart);

        let pagesCrawled = 0;
        let chunksCreated = 0;
        let pagesFound = 1;
        const effectiveMaxPages = Math.min(Math.max(1, maxPages), 50);

        while (queue.length > 0 && pagesCrawled < effectiveMaxPages) {
          const currentUrl = queue.shift()!;

          // Update progress so frontend can show it
          await bgSupabase
            .from('knowledge_sources')
            .update({
              chunk_count: chunksCreated,
              content: `Skanner side ${pagesCrawled + 1}... (${pagesFound} sider funnet)`,
            })
            .eq('id', sourceId);

          const result = await fetchPageViaScrapingBee(currentUrl, scrapingBeeKey);
          if (!result || !result.text.trim()) {
            continue;
          }

          pagesCrawled++;

          const newLinks = extractSameDomainLinks(result.links, currentUrl, hostname);
          for (const link of newLinks) {
            if (!visited.has(link)) {
              visited.add(link);
              queue.push(link);
              pagesFound++;
            }
          }

          const cleanedText = cleanHtmlText(result.text);
          if (cleanedText.length < 50) continue;

          const textChunks = chunkText(cleanedText);

          for (const chunkContent of textChunks) {
            try {
              const embedding = await generateEmbedding(chunkContent);

              const insertData: Record<string, any> = {
                source_id: sourceId,
                site_id: siteId,
                content: chunkContent,
                metadata: {
                  chunk_index: chunksCreated,
                  char_count: chunkContent.length,
                  source_url: currentUrl,
                },
              };

              if (embedding) {
                insertData.embedding = JSON.stringify(embedding);
              }

              const { error: chunkError } = await bgSupabase
                .from('knowledge_chunks')
                .insert(insertData);

              if (chunkError) {
                console.error(`Chunk insert error:`, chunkError);
                continue;
              }

              chunksCreated++;
            } catch (err) {
              console.error(`Chunk processing error:`, err);
            }
          }

          // Update progress after each page
          await bgSupabase
            .from('knowledge_sources')
            .update({
              chunk_count: chunksCreated,
              content: `${pagesCrawled}/${pagesFound} sider skannet, ${chunksCreated} deler opprettet`,
            })
            .eq('id', sourceId);
        }

        // Final status
        const finalStatus = chunksCreated > 0 ? 'ready' : 'error';
        await bgSupabase
          .from('knowledge_sources')
          .update({
            status: finalStatus,
            chunk_count: chunksCreated,
            content: `${url} — ${pagesCrawled} sider, ${chunksCreated} deler`,
          })
          .eq('id', sourceId);

        console.log(`Scrape complete: ${domain} — ${pagesCrawled} pages, ${chunksCreated} chunks`);
      } catch (err) {
        console.error(`Background scrape error for ${domain}:`, err);
        await bgSupabase
          .from('knowledge_sources')
          .update({ status: 'error', content: `${url} — Feil under skanning` })
          .eq('id', sourceId);
      }
    };

    // Start crawl in background — don't await
    crawlInBackground().catch(console.error);

    // Return immediately so frontend can start polling
    return NextResponse.json(
      {
        sourceId,
        status: 'processing',
        message: 'Skanning startet. Bruk GET /api/ingest/scrape?sourceId=' + sourceId + ' for status.',
      },
      { status: 202 }
    );
  } catch (err) {
    const error = err as Error;
    console.error(`Scrape POST error: ${error.message}`);
    return NextResponse.json(
      { error: error.message || 'Noe gikk galt under skanning' },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// GET /api/ingest/scrape?sourceId=xxx — Check scrape status
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
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

    // Fetch source
    const { data: source, error } = await supabase
      .from('knowledge_sources')
      .select('id, site_id, type, title, status, chunk_count, content, created_at')
      .eq('id', sourceId)
      .single();

    if (error || !source) {
      return NextResponse.json({ error: 'Kilde ikke funnet' }, { status: 404 });
    }

    // Verify ownership through site
    const { data: site } = await supabase
      .from('sites')
      .select('id')
      .eq('id', source.site_id)
      .eq('user_id', user.id)
      .single();

    if (!site) {
      return NextResponse.json({ error: 'Ingen tilgang' }, { status: 403 });
    }

    return NextResponse.json({
      sourceId: source.id,
      status: source.status,
      title: source.title,
      chunksCreated: source.chunk_count || 0,
      progressText: source.status === 'processing' ? (source.content || 'Skanner...') : undefined,
    });
  } catch (err) {
    const error = err as Error;
    console.error(`Scrape GET error: ${error.message}`);
    return NextResponse.json(
      { error: 'Noe gikk galt' },
      { status: 500 }
    );
  }
}
