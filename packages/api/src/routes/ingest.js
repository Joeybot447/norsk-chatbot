/**
 * Ingestion Routes
 * POST /v1/ingest/document - Upload a document
 */

import express from 'express';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import { query } from '../db/client.js';
import { logger } from '../utils/logger.js';
import { ragService } from '../services/ragService.js';

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
 * Upload a document for ingestion
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

    // Store document
    query(
      `INSERT INTO documents (id, site_id, type, title, content, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [documentId, siteId, type, title, content, 'active']
    );

    // Chunk the content
    const chunks = ragService.chunkContent(content, 500);

    // Store chunks
    for (let i = 0; i < chunks.length; i++) {
      const chunkId = uuid();
      query(
        `INSERT INTO chunks (id, document_id, site_id, chunk_index, content, tokens)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          chunkId,
          documentId,
          siteId,
          i,
          chunks[i],
          ragService.estimateTokens(chunks[i]),
        ]
      );
    }

    // Update document chunks_count
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
 * GET /v1/ingest/documents/:siteId
 * List all documents for a site
 */
router.get('/documents/:siteId', async (req, res) => {
  try {
    const { siteId } = req.params;

    const result = query(
      `SELECT id, title, type, status, created_at, chunks_count
       FROM documents
       WHERE site_id = ?
       ORDER BY created_at DESC`,
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
