/**
 * Ingestion Routes
 * POST /v1/ingest/url    - Ingest content from a URL
 * POST /v1/ingest/text   - Ingest raw text
 * POST /v1/ingest/upload - Upload a file (PDF, TXT, DOCX)
 * GET  /v1/ingest/sources?siteId=xxx - List sources
 * DELETE /v1/ingest/sources/:id - Delete a source and its chunks
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuid } from 'uuid';
import { query, getOne, getMany } from '../db/client.js';
import { logger } from '../utils/logger.js';
import config from '../config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = config.uploadsDir;

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuid()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.pdf', '.txt', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${ext} not allowed. Accepted: PDF, TXT, DOCX`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: config.maxUploadSize },
});

const router = express.Router();

// ─── Helpers ────────────────────────────────────────

/**
 * Sanitize text input — strip script tags and dangerous HTML
 */
function sanitizeText(text) {
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
function chunkText(text, maxChars = 2000) {
  const chunks = [];
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
  const result = [];
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

function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

function storeSourceAndChunks({ siteId, type, name, text, metadata }) {
  const sourceId = uuid();
  const sanitized = sanitizeText(text);
  const chunks = chunkText(sanitized);

  try {
    query(
      `INSERT INTO knowledge_sources (id, site_id, type, name, status, metadata)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [sourceId, siteId, type, name, 'ready', metadata ? JSON.stringify(metadata) : null]
    );

    for (let i = 0; i < chunks.length; i++) {
      query(
        `INSERT INTO knowledge_chunks (id, source_id, site_id, content, chunk_index, token_count)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [uuid(), sourceId, siteId, chunks[i], i, estimateTokens(chunks[i])]
      );
    }

    return { sourceId, chunks: chunks.length, status: 'ready' };
  } catch (err) {
    try {
      query(`UPDATE knowledge_sources SET status = 'error' WHERE id = ?`, [sourceId]);
    } catch (_) {}
    throw err;
  }
}

async function stripHtmlAsync(html) {
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
 * POST /v1/ingest/url
 */
router.post('/url', async (req, res) => {
  try {
    const { url, siteId } = req.body;

    if (!url || typeof url !== 'string' || !url.trim()) {
      return res.status(400).json({ error: 'url is required' });
    }
    if (!siteId || typeof siteId !== 'string') {
      return res.status(400).json({ error: 'siteId is required' });
    }

    // Validate URL
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return res.status(400).json({ error: 'Only http and https URLs are allowed' });
      }
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
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
      return res.status(400).json({ error: 'Could not fetch content from URL' });
    }

    const text = await stripHtmlAsync(html);
    if (!text || text.length < 10) {
      return res.status(400).json({ error: 'No meaningful text content found at URL' });
    }

    const result = storeSourceAndChunks({
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
    res.status(201).json(result);
  } catch (err) {
    if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
      return res.status(408).json({ error: 'URL fetch timed out (max 10 seconds)' });
    }
    logger.error({ reqId: req.requestId }, `URL ingest error: ${err.message}`);
    res.status(500).json({ error: 'Failed to ingest URL' });
  }
});

/**
 * POST /v1/ingest/text
 */
router.post('/text', async (req, res) => {
  try {
    const { text, name, siteId } = req.body;

    if (!siteId || typeof siteId !== 'string') {
      return res.status(400).json({ error: 'siteId is required' });
    }
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'text is required and cannot be empty' });
    }
    if (text.length < 5) {
      return res.status(400).json({ error: 'Text too short (minimum 5 characters)' });
    }

    const sourceName = name || 'Text snippet';

    const result = storeSourceAndChunks({
      siteId,
      type: 'text',
      name: sourceName,
      text,
      metadata: {
        wordCount: text.split(/\s+/).length,
      },
    });

    logger.info(`Text ingested: "${sourceName}" → ${result.chunks} chunks`);
    res.status(201).json(result);
  } catch (err) {
    logger.error({ reqId: req.requestId }, `Text ingest error: ${err.message}`);
    res.status(500).json({ error: 'Failed to ingest text' });
  }
});

/**
 * POST /v1/ingest/upload
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const siteId = req.body.siteId || req.headers['x-site-id'];
    if (!siteId) {
      return res.status(400).json({ error: 'Missing siteId' });
    }

    const file = req.file;
    const ext = path.extname(file.originalname).toLowerCase();
    let text = '';

    if (ext === '.txt') {
      text = fs.readFileSync(file.path, 'utf-8');
    } else if (ext === '.pdf') {
      try {
        const pdfParse = (await import('pdf-parse')).default;
        const dataBuffer = fs.readFileSync(file.path);
        const pdfData = await pdfParse(dataBuffer);
        text = pdfData.text || '';
      } catch (pdfErr) {
        logger.error(`PDF parse error: ${pdfErr.message}`);
        return res.status(400).json({ error: 'Failed to parse PDF file' });
      }
    } else if (ext === '.docx') {
      try {
        const { execSync } = await import('child_process');
        const docXml = execSync(`unzip -p "${file.path}" word/document.xml 2>/dev/null`, {
          encoding: 'utf-8',
          maxBuffer: 10 * 1024 * 1024,
        });
        text = docXml
          .replace(/<w:p[^>]*>/gi, '\n')
          .replace(/<[^>]+>/g, '')
          .replace(/\s+/g, ' ')
          .replace(/\n\s+/g, '\n')
          .trim();
      } catch (docxErr) {
        logger.error(`DOCX parse error: ${docxErr.message}`);
        return res.status(400).json({ error: 'Failed to parse DOCX file' });
      }
    }

    if (!text || text.length < 10) {
      return res.status(400).json({ error: 'Could not extract text from file' });
    }

    const result = storeSourceAndChunks({
      siteId,
      type: 'file',
      name: file.originalname,
      text,
      metadata: {
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        wordCount: text.split(/\s+/).length,
      },
    });

    logger.info(`File ingested: ${file.originalname} → ${result.chunks} chunks`);
    res.status(201).json(result);
  } catch (err) {
    logger.error({ reqId: req.requestId }, `File upload error: ${err.message}`);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

/**
 * GET /v1/ingest/sources?siteId=xxx
 */
router.get('/sources', async (req, res) => {
  try {
    const siteId = req.query.siteId;
    if (!siteId) {
      return res.status(400).json({ error: 'siteId query parameter is required' });
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

    res.json(sources);
  } catch (err) {
    logger.error({ reqId: req.requestId }, `Sources list error: ${err.message}`);
    res.status(500).json({ error: 'Failed to list sources' });
  }
});

/**
 * DELETE /v1/ingest/sources/:id
 */
router.delete('/sources/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const source = getOne('SELECT id FROM knowledge_sources WHERE id = ?', [id]);
    if (!source) {
      return res.status(404).json({ error: 'Source not found' });
    }

    query('DELETE FROM knowledge_chunks WHERE source_id = ?', [id]);
    query('DELETE FROM knowledge_sources WHERE id = ?', [id]);

    logger.info(`Source deleted: ${id}`);
    res.json({ deleted: true });
  } catch (err) {
    logger.error({ reqId: req.requestId }, `Source delete error: ${err.message}`);
    res.status(500).json({ error: 'Failed to delete source' });
  }
});

export default router;
