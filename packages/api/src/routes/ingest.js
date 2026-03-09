/**
 * Ingestion Routes
 * POST /v1/ingest/document - Upload a document (JSON)
 * POST /v1/ingest/upload - Upload a file (multipart)
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import { query } from '../db/client.js';
import { logger } from '../utils/logger.js';
import { ragService } from '../services/ragService.js';

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

// Validation schema
const documentSchema = z.object({
  siteId: z.string(),
  title: z.string().min(1),
  type: z.enum(['pdf', 'docx', 'txt', 'faq', 'webpage']),
  content: z.string().min(1),
});

/**
 * POST /v1/ingest/document
 * Upload a document (JSON body)
 */
router.post('/document', async (req, res) => {
  try {
    const validation = documentSchema.safeParse({
      siteId: req.body.siteId,
      title: req.body.title,
      type: req.body.type,
      content: req.body.content,
    });

    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation error',
        details: validation.error.errors,
      });
    }

    const { siteId, title, type, content } = validation.data;
    const documentId = uuid();

    query(
      `INSERT INTO documents (id, site_id, type, title, content, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [documentId, siteId, type, title, content, 'active']
    );

    const chunks = ragService.chunkContent(content, 500);

    for (let i = 0; i < chunks.length; i++) {
      const chunkId = uuid();
      query(
        `INSERT INTO chunks (id, document_id, site_id, chunk_index, content, tokens)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [chunkId, documentId, siteId, i, chunks[i], ragService.estimateTokens(chunks[i])]
      );
    }

    query(
      `UPDATE documents SET chunks_count = ? WHERE id = ?`,
      [chunks.length, documentId]
    );

    logger.info(`Document uploaded and chunked: ${documentId}`);

    res.status(201).json({
      documentId,
      status: 'completed',
      chunksCount: chunks.length,
      message: 'Document uploaded and processed successfully',
    });
  } catch (err) {
    logger.error(`Document upload error: ${err.message}`);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

/**
 * POST /v1/ingest/upload
 * Upload a file (multipart form data)
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
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    let content = '';

    // Extract text content based on file type
    if (ext === 'txt') {
      content = fs.readFileSync(file.path, 'utf-8');
    } else if (ext === 'pdf' || ext === 'docx') {
      // For MVP: store file reference, basic text extraction
      content = `[Uploaded file: ${file.originalname}] - Full text extraction pending.`;
      // TODO: Add proper PDF/DOCX text extraction libraries
    }

    const documentId = uuid();
    const title = req.body.title || file.originalname;

    query(
      `INSERT INTO documents (id, site_id, type, source_url, title, content, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [documentId, siteId, ext, file.path, title, content, 'active']
    );

    if (content && content.length > 10) {
      const chunks = ragService.chunkContent(content, 500);
      for (let i = 0; i < chunks.length; i++) {
        const chunkId = uuid();
        query(
          `INSERT INTO chunks (id, document_id, site_id, chunk_index, content, tokens)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [chunkId, documentId, siteId, i, chunks[i], ragService.estimateTokens(chunks[i])]
        );
      }
      query(`UPDATE documents SET chunks_count = ? WHERE id = ?`, [chunks.length, documentId]);
    }

    logger.info(`File uploaded: ${file.originalname} -> ${file.filename}`);

    res.status(201).json({
      documentId,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      type: ext,
      status: 'completed',
      message: 'File uploaded successfully',
    });
  } catch (err) {
    logger.error(`File upload error: ${err.message}`);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

/**
 * GET /v1/ingest/documents/:siteId
 */
router.get('/documents/:siteId', async (req, res) => {
  try {
    const { siteId } = req.params;
    const result = query(
      `SELECT id, title, type, status, created_at, chunks_count
       FROM documents WHERE site_id = ? ORDER BY created_at DESC`,
      [siteId]
    );
    res.json({
      documents: result.rows || [],
      total: (result.rows || []).length,
    });
  } catch (err) {
    logger.error(`Documents list error: ${err.message}`);
    res.status(500).json({ error: 'Failed to list documents' });
  }
});

export default router;
