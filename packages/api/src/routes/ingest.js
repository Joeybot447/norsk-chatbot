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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '../../uploads');

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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const router = express.Router();

// ─── Helpers ────────────────────────────────────────

/**
 * Split text into chunks of ~2000 chars (~500 tokens)
 */
function chunkText(text, maxChars = 2000) {
  const chunks = [];
  // Split on paragraph boundaries first
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

  // If no paragraph splits happened (single block of text), split by sentences
  if (chunks.length === 0 && text.trim().length > 0) {
    chunks.push(text.trim());
  }

  // If any chunk is still too long, force-split
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

/**
 * Estimate token count (~4 chars per token)
 */
function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

/**
 * Store a source and its chunks in the database
 */
function storeSourceAndChunks({ siteId, type, name, text, metadata }) {
  const sourceId = uuid();
  const chunks = chunkText(text);

  try {
    // Insert source
    query(
      `INSERT INTO knowledge_sources (id, site_id, type, name, status, metadata)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [sourceId, siteId, type, name, 'ready', metadata ? JSON.stringify(metadata) : null]
    );

    // Insert chunks
    for (let i = 0; i < chunks.length; i++) {
      query(
        `INSERT INTO knowledge_chunks (id, source_id, site_id, content, chunk_index, token_count)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [uuid(), sourceId, siteId, chunks[i], i, estimateTokens(chunks[i])]
      );
    }

    return { sourceId, chunks: chunks.length, status: 'ready' };
  } catch (err) {
    // Update source status to error if something fails
    try {
      query(`UPDATE knowledge_sources SET status = 'error' WHERE id = ?`, [sourceId]);
    } catch (_) {}
    throw err;
  }
}

/**
 * Strip HTML tags and extract readable text using cheerio
 */
async function stripHtmlAsync(html) {
  try {
    const cheerio = await import('cheerio');
    const $ = cheerio.load(html);
    $('script, style, nav, footer, header, noscript, iframe').remove();
    const text = $('body').text() || $.root().text();
    return text.replace(/[ \t]+/g, ' ').replace(/\n\s*\n\s*\n/g, '\n\n').trim();
  } catch (e) {
    // Fallback: regex strip
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
 * Fetch a URL, extract text, chunk and store
 */
router.post('/url', async (req, res) => {
  try {
    const { url, siteId } = req.body;

    if (!url || !siteId) {
      return res.status(400).json({ error: 'url and siteId are required' });
    }

    // Validate URL
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL' });
    }

    // Fetch the page
    const axios = (await import('axios')).default;
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'NorskBot/1.0 (Knowledge Ingestion)',
        'Accept': 'text/html,application/xhtml+xml,text/plain',
      },
      maxRedirects: 5,
    });

    const html = response.data;
    if (typeof html !== 'string' || html.length === 0) {
      return res.status(400).json({ error: 'Could not fetch content from URL' });
    }

    // Extract text
    const text = await stripHtmlAsync(html);
    if (!text || text.length < 10) {
      return res.status(400).json({ error: 'No meaningful text content found at URL' });
    }

    // Store
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
    logger.error(`URL ingest error: ${err.message}`);
    res.status(500).json({ error: 'Failed to ingest URL', details: err.message });
  }
});

/**
 * POST /v1/ingest/text
 * Ingest raw text content
 */
router.post('/text', async (req, res) => {
  try {
    const { text, name, siteId } = req.body;

    if (!text || !siteId) {
      return res.status(400).json({ error: 'text and siteId are required' });
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
    logger.error(`Text ingest error: ${err.message}`);
    res.status(500).json({ error: 'Failed to ingest text', details: err.message });
  }
});

/**
 * POST /v1/ingest/upload
 * Upload a file (PDF, TXT, DOCX)
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
        // DOCX is a ZIP file — use Node's built-in zlib via child_process
        const { execSync } = await import('child_process');
        // Extract word/document.xml from the docx zip
        const docXml = execSync(`unzip -p "${file.path}" word/document.xml 2>/dev/null`, {
          encoding: 'utf-8',
          maxBuffer: 10 * 1024 * 1024,
        });
        // Strip XML tags and clean up
        text = docXml
          .replace(/<w:p[^>]*>/gi, '\n')  // Paragraph breaks
          .replace(/<[^>]+>/g, '')         // Remove all XML tags
          .replace(/\s+/g, ' ')
          .replace(/\n\s+/g, '\n')
          .trim();
      } catch (docxErr) {
        logger.error(`DOCX parse error: ${docxErr.message}`);
        return res.status(400).json({ error: 'Failed to parse DOCX file. Make sure it is a valid .docx document.' });
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
    logger.error(`File upload error: ${err.message}`);
    res.status(500).json({ error: 'Failed to upload file', details: err.message });
  }
});

/**
 * GET /v1/ingest/sources?siteId=xxx
 * List all knowledge sources for a site
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
    logger.error(`Sources list error: ${err.message}`);
    res.status(500).json({ error: 'Failed to list sources' });
  }
});

/**
 * DELETE /v1/ingest/sources/:id
 * Delete a source and all its chunks
 */
router.delete('/sources/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check source exists
    const source = getOne('SELECT id FROM knowledge_sources WHERE id = ?', [id]);
    if (!source) {
      return res.status(404).json({ error: 'Source not found' });
    }

    // Delete chunks first (FK constraint)
    query('DELETE FROM knowledge_chunks WHERE source_id = ?', [id]);
    // Delete source
    query('DELETE FROM knowledge_sources WHERE id = ?', [id]);

    logger.info(`Source deleted: ${id}`);

    res.json({ deleted: true });
  } catch (err) {
    logger.error(`Source delete error: ${err.message}`);
    res.status(500).json({ error: 'Failed to delete source' });
  }
});

export default router;
