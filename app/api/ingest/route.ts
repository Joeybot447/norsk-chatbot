/**
 * Ingestion Routes
 * POST /v1/ingest/url    - Ingest content from a URL
 * POST /v1/ingest/text   - Ingest raw text
 * POST /v1/ingest/upload - Upload a file (PDF, TXT, DOCX)
 * GET  /v1/ingest/sources?siteId=xxx - List sources
 * DELETE /v1/ingest/sources/:id - Delete a source and its chunks
 */

import { NextRequest, NextResponse } from 'next/server';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuid } from 'uuid';
import { createServiceClient } from '../../../lib/supabase/client';
import { logger } from '../../../lib/utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = config.uploadsDir;

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ─── Helpers ────────────────────────────────────────

/**
 * Sanitize text input — strip script tags and dangerous HTML
 */
function sanitizeText(text: string): string {
  if (!text) return '';
  return text
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object[^>]*>[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[^>]*>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
    .replace(/javascript:/gi, '');
}

/**
 * Split text into chunks of ~2000 chars (~500 tokens)
 */
function chunkText(text: string, maxChars = 2000): string[] {
  const chunks: string[] = [];
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);

  let current = '';
  for (const para of paragraphs) {
    if ((current + '\n\n' + para).length > maxChars && current.length > 0) {
      chunks.push(current.trim());
      current = para;
    } else {
      current = current ? current + '\n\n' + para : para;
    }
  }
  if (current.trim()) {
    chunks.push(current.trim());
  }

  if (chunks.length === 0 && text.trim().length > 0) {
    chunks.push(text.trim());
  }

  // Force-split oversized chunks
  const result: string[] = [];
  for (const chunk of chunks) {
    if (chunk.length <= maxChars) {
      result.push(chunk);
    } else {
      for (let i = 0; i < chunk.length; i += maxChars) {
        result.push(chunk.slice(i, i + maxChars).trim());
      }
    }
  }

  return result.filter(c => c.length > 0);
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

async function storeSourceAndChunks({
  siteId,
  type,
  name,
  text,
  metadata,
}: {
  siteId: string;
  type: string;
  name: string;
  text: string;
  metadata?: Record<string, any>;
}): Promise<{ sourceId: string; chunks: number; status: string }> {
  const sourceId = uuid();
  const sanitized = sanitizeText(text);
  const chunks = chunkText(sanitized);

  try {
    await query(
      `INSERT INTO knowledge_sources (id, site_id, type, name, status, metadata)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [sourceId, siteId, type, name, 'ready', metadata ? JSON.stringify(metadata) : null]
    );

    for (let i = 0; i < chunks.length; i++) {
      await query(
        `INSERT INTO knowledge_chunks (id, source_id, site_id, content, chunk_index, token_count)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [uuid(), sourceId, siteId, chunks[i], i, estimateTokens(chunks[i])]
      );
    }

    return { sourceId, chunks: chunks.length, status: 'ready' };
  } catch (err) {
    try {
      await query(`UPDATE knowledge_sources SET status = 'error' WHERE id = ?`, [sourceId]);
    } catch (_) {}
    throw err;
  }
}

async function stripHtmlAsync(html: string): Promise<string> {
  try {
    const cheerio = await import('cheerio');
    const $ = cheerio.load(html);
    $('script, style, nav, footer, header, noscript, iframe, object, embed').remove();
    const text = $('body').text() || $.root().text();
    return text.replace(/[ \t]+/g, ' ').replace(/\n\s*\n\s*\n/g, '\n\n').trim();
  } catch (e) {
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

// ─── Routes ─────────────────────────────────────────

/**
 * POST /api/ingest/url
 */
export async function POST(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname;

    // POST /api/ingest/url
    if (pathname.endsWith('/url')) {
      const body = await request.json();
      const { url, siteId } = body;

      if (!url || typeof url !== 'string' || !url.trim()) {
        return NextResponse.json(
          { error: 'url is required' },
          { status: 400 }
        );
      }
      if (!siteId || typeof siteId !== 'string') {
        return NextResponse.json(
          { error: 'siteId is required' },
          { status: 400 }
        );
      }

      // Validate URL
      let parsedUrl;
      try {
        parsedUrl = new URL(url);
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
          return NextResponse.json(
            { error: 'Only http and https URLs are allowed' },
            { status: 400 }
          );
        }
      } catch {
        return NextResponse.json(
          { error: 'Invalid URL format' },
          { status: 400 }
        );
      }

      // Fetch with timeout
      const axios = (await import('axios')).default;
      const response = await axios.get(url, {
        timeout: config.urlFetchTimeout,
        headers: {
          'User-Agent': 'NorskBot/1.0 (Knowledge Ingestion)',
          'Accept': 'text/html,application/xhtml+xml,text/plain',
        },
        maxRedirects: 5,
        maxContentLength: config.maxUploadSize,
      });

      const html = response.data;
      if (typeof html !== 'string' || html.length === 0) {
        return NextResponse.json(
          { error: 'Could not fetch content from URL' },
          { status: 400 }
        );
      }

      const text = await stripHtmlAsync(html);
      if (!text || text.length < 10) {
        return NextResponse.json(
          { error: 'No meaningful text content found at URL' },
          { status: 400 }
        );
      }

      const result = await storeSourceAndChunks({
        siteId,
        type: 'url',
        name: url,
        text,
        metadata: {
          url,
          wordCount: text.split(/\s+/).length,
          fetchedAt: new Date().toISOString(),
        },
      });

      logger.info(`URL ingested: ${url} → ${result.chunks} chunks`);
      return NextResponse.json(result, { status: 201 });
    }

    // POST /api/ingest/text
    if (pathname.endsWith('/text')) {
      const body = await request.json();
      const { text, name, siteId } = body;

      if (!siteId || typeof siteId !== 'string') {
        return NextResponse.json(
          { error: 'siteId is required' },
          { status: 400 }
        );
      }
      if (!text || typeof text !== 'string' || !text.trim()) {
        return NextResponse.json(
          { error: 'text is required and cannot be empty' },
          { status: 400 }
        );
      }
      if (text.length < 5) {
        return NextResponse.json(
          { error: 'Text too short (minimum 5 characters)' },
          { status: 400 }
        );
      }

      const sourceName = name || 'Text snippet';

      const result = await storeSourceAndChunks({
        siteId,
        type: 'text',
        name: sourceName,
        text,
        metadata: {
          wordCount: text.split(/\s+/).length,
        },
      });

      logger.info(`Text ingested: "${sourceName}" → ${result.chunks} chunks`);
      return NextResponse.json(result, { status: 201 });
    }

    // POST /api/ingest/upload
    if (pathname.endsWith('/upload')) {
      // Handle multipart form data for file upload
      // Note: In Next.js, we need to parse FormData differently
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const siteId = formData.get('siteId') as string || request.headers.get('x-site-id');

      if (!file) {
        return NextResponse.json(
          { error: 'No file uploaded' },
          { status: 400 }
        );
      }

      if (!siteId) {
        return NextResponse.json(
          { error: 'Missing siteId' },
          { status: 400 }
        );
      }

      const ext = path.extname(file.name).toLowerCase();
      let text = '';
      const buffer = await file.arrayBuffer();

      if (ext === '.txt') {
        text = new TextDecoder().decode(buffer);
      } else if (ext === '.pdf') {
        try {
          const pdfParse = (await import('pdf-parse')).default;
          const pdfData = await pdfParse(buffer);
          text = pdfData.text || '';
        } catch (pdfErr) {
          const error = pdfErr as Error;
          logger.error(`PDF parse error: ${error.message}`);
          return NextResponse.json(
            { error: 'Failed to parse PDF file' },
            { status: 400 }
          );
        }
      } else if (ext === '.docx') {
        try {
          const { execSync } = await import('child_process');
          // Write buffer to temp file
          const tmpFile = path.join('/tmp', `${uuid()}.docx`);
          fs.writeFileSync(tmpFile, Buffer.from(buffer));
          const docXml = execSync(`unzip -p "${tmpFile}" word/document.xml 2>/dev/null`, {
            encoding: 'utf-8',
            maxBuffer: 10 * 1024 * 1024,
          });
          text = docXml
            .replace(/<w:p[^>]*>/gi, '\n')
            .replace(/<[^>]+>/g, '')
            .replace(/\s+/g, ' ')
            .replace(/\n\s+/g, '\n')
            .trim();
          fs.unlinkSync(tmpFile);
        } catch (docxErr) {
          const error = docxErr as Error;
          logger.error(`DOCX parse error: ${error.message}`);
          return NextResponse.json(
            { error: 'Failed to parse DOCX file' },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { error: `File type ${ext} not allowed. Accepted: PDF, TXT, DOCX` },
          { status: 400 }
        );
      }

      if (!text || text.length < 10) {
        return NextResponse.json(
          { error: 'Could not extract text from file' },
          { status: 400 }
        );
      }

      const result = await storeSourceAndChunks({
        siteId,
        type: 'file',
        name: file.name,
        text,
        metadata: {
          originalName: file.name,
          size: file.size,
          mimeType: file.type,
          wordCount: text.split(/\s+/).length,
        },
      });

      logger.info(`File ingested: ${file.name} → ${result.chunks} chunks`);
      return NextResponse.json(result, { status: 201 });
    }

    return NextResponse.json(
      { error: 'Not found' },
      { status: 404 }
    );
  } catch (err) {
    const error = err as Error;
    if (error.message?.includes('timeout')) {
      return NextResponse.json(
        { error: 'URL fetch timed out (max 10 seconds)' },
        { status: 408 }
      );
    }
    logger.error(`Ingest route error: ${error.message}`);
    return NextResponse.json(
      { error: 'Failed to ingest content' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ingest/sources?siteId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const siteId = request.nextUrl.searchParams.get('siteId');
    const pathname = request.nextUrl.pathname;

    if (pathname.includes('/sources')) {
      if (!siteId) {
        return NextResponse.json(
          { error: 'siteId query parameter is required' },
          { status: 400 }
        );
      }

      const sources = getMany(
        `SELECT 
          ks.id, ks.type, ks.name, ks.status, ks.metadata, ks.created_at as createdAt,
          COUNT(kc.id) as chunkCount
         FROM knowledge_sources ks
         LEFT JOIN knowledge_chunks kc ON kc.source_id = ks.id
         WHERE ks.site_id = ?
         GROUP BY ks.id
         ORDER BY ks.created_at DESC`,
        [siteId]
      );

      return NextResponse.json(sources);
    }

    return NextResponse.json(
      { error: 'Not found' },
      { status: 404 }
    );
  } catch (err) {
    const error = err as Error;
    logger.error(`Sources list error: ${error.message}`);
    return NextResponse.json(
      { error: 'Failed to list sources' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ingest/sources/:id
 */
export async function DELETE(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname;
    const id = pathname.split('/').pop();

    if (!id) {
      return NextResponse.json(
        { error: 'Source ID is required' },
        { status: 400 }
      );
    }

    const source = await getOne('SELECT id FROM knowledge_sources WHERE id = ?', [id]);
    if (!source) {
      return NextResponse.json(
        { error: 'Source not found' },
        { status: 404 }
      );
    }

    await query('DELETE FROM knowledge_chunks WHERE source_id = ?', [id]);
    await query('DELETE FROM knowledge_sources WHERE id = ?', [id]);

    logger.info(`Source deleted: ${id}`);
    return NextResponse.json({ deleted: true });
  } catch (err) {
    const error = err as Error;
    logger.error(`Source delete error: ${error.message}`);
    return NextResponse.json(
      { error: 'Failed to delete source' },
      { status: 500 }
    );
  }
}
