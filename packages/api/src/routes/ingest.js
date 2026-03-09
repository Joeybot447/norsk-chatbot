/**
 * Ingestion Routes
 * POST /v1/ingest/crawl - Trigger website crawl
 * POST /v1/ingest/document - Upload a document
 */

import express from 'express';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import { query } from '../db/client.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Validation schemas
const crawlSchema = z.object({
  url: z.string().url(),
  siteId: z.string().uuid(),
});

const documentSchema = z.object({
  siteId: z.string().uuid(),
  title: z.string().min(1),
  type: z.enum(['pdf', 'docx', 'txt', 'faq']),
});

/**
 * POST /v1/ingest/crawl
 * Trigger a website crawl for a given URL
 */
router.post('/crawl', async (req, res) => {
  try {
    const validation = crawlSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation error',
        details: validation.error.errors,
      });
    }

    const { url, siteId } = validation.data;

    // Queue crawl job (would use Bull queue in production)
    const jobId = uuid();
    await query(
      `INSERT INTO jobs (queue_name, job_id, data, state)
       VALUES ($1, $2, $3, $4)`,
      [
        'crawler',
        jobId,
        JSON.stringify({ url, siteId, startedAt: new Date().toISOString() }),
        'pending',
      ]
    );

    logger.info(`Crawl job queued: ${jobId} for URL: ${url}`);

    res.json({
      jobId,
      status: 'queued',
      message: 'Website crawl has been queued and will start shortly',
    });
  } catch (err) {
    logger.error(`Crawl route error: ${err.message}`);
    res.status(500).json({ error: 'Failed to queue crawl job' });
  }
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
    });

    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation error',
        details: validation.error.errors,
      });
    }

    const { siteId, title, type } = validation.data;
    const content = req.body.content || '';

    if (!content) {
      return res.status(400).json({ error: 'Document content is required' });
    }

    // Store document
    const result = await query(
      `INSERT INTO documents (site_id, type, title, content, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [siteId, type, title, content, 'active']
    );

    const documentId = result.rows[0].id;

    // Queue for chunking and embedding
    const jobId = uuid();
    await query(
      `INSERT INTO jobs (queue_name, job_id, data, state)
       VALUES ($1, $2, $3, $4)`,
      [
        'embedder',
        jobId,
        JSON.stringify({ documentId, siteId }),
        'pending',
      ]
    );

    logger.info(`Document uploaded and queued for processing: ${documentId}`);

    res.status(201).json({
      documentId,
      status: 'processing',
      message: 'Document uploaded and is being processed',
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

    const result = await query(
      `SELECT id, title, type, status, created_at, chunks_count
       FROM documents
       WHERE site_id = $1
       ORDER BY created_at DESC`,
      [siteId]
    );

    res.json({
      documents: result.rows,
      total: result.rows.length,
    });
  } catch (err) {
    logger.error(`Documents list error: ${err.message}`);
    res.status(500).json({ error: 'Failed to list documents' });
  }
});

export default router;
