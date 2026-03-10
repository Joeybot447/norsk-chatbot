/**
 * Health Check Routes
 */

import express from 'express';
import fs from 'fs';
import { getDb, getOne } from '../db/client.js';
import { logger } from '../utils/logger.js';
import config from '../config.js';

const router = express.Router();

/**
 * GET /health
 */
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});

/**
 * GET /health/ready
 */
router.get('/ready', (req, res) => {
  try {
    const db = getDb();
    const result = db.prepare('SELECT 1 as ok').get();
    if (result && result.ok === 1) {
      return res.json({
        status: 'ready',
        checks: { database: 'ok' },
      });
    }
    res.status(503).json({ status: 'not ready', checks: { database: 'failed' } });
  } catch (err) {
    logger.error(`Health check error: ${err.message}`);
    res.status(503).json({ status: 'error', error: err.message });
  }
});

/**
 * GET /health/detailed
 * Detailed health info: DB size, total chunks, total sites, uptime, memory
 */
router.get('/detailed', (req, res) => {
  try {
    const db = getDb();

    // DB file size
    let dbSizeBytes = 0;
    try {
      const dbPath = config.databaseUrl;
      const stats = fs.statSync(dbPath);
      dbSizeBytes = stats.size;
    } catch (_) {}

    // Counts
    const sitesCount = db.prepare('SELECT COUNT(*) as count FROM sites').get()?.count || 0;
    const knowledgeChunksCount = db.prepare('SELECT COUNT(*) as count FROM knowledge_chunks').get()?.count || 0;
    const legacyChunksCount = db.prepare('SELECT COUNT(*) as count FROM chunks').get()?.count || 0;
    const conversationsCount = db.prepare('SELECT COUNT(*) as count FROM conversations').get()?.count || 0;
    const messagesCount = db.prepare('SELECT COUNT(*) as count FROM messages').get()?.count || 0;
    const sourcesCount = db.prepare('SELECT COUNT(*) as count FROM knowledge_sources').get()?.count || 0;

    const memUsage = process.memoryUsage();

    res.json({
      status: 'ok',
      uptime: Math.floor(process.uptime()),
      startedAt: new Date(config.startedAt).toISOString(),
      database: {
        sizeBytes: dbSizeBytes,
        sizeMB: (dbSizeBytes / (1024 * 1024)).toFixed(2),
        journalMode: db.pragma('journal_mode', { simple: true }),
      },
      counts: {
        sites: sitesCount,
        knowledgeSources: sourcesCount,
        knowledgeChunks: knowledgeChunksCount,
        legacyChunks: legacyChunksCount,
        totalChunks: knowledgeChunksCount + legacyChunksCount,
        conversations: conversationsCount,
        messages: messagesCount,
      },
      memory: {
        rss: `${(memUsage.rss / 1024 / 1024).toFixed(1)}MB`,
        heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(1)}MB`,
        heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(1)}MB`,
      },
      node: process.version,
    });
  } catch (err) {
    logger.error(`Detailed health check error: ${err.message}`);
    res.status(500).json({ status: 'error', error: err.message });
  }
});

/**
 * GET /health/demo
 */
router.get('/demo', (req, res) => {
  try {
    const customer = getOne('SELECT id FROM customers WHERE email = ?', ['fjordtech@demo.no']);
    if (!customer) {
      return res.status(404).json({ error: 'Demo site not found' });
    }
    const site = getOne('SELECT id, name FROM sites WHERE customer_id = ?', [customer.id]);
    if (!site) {
      return res.status(404).json({ error: 'Demo site not found' });
    }
    res.json({
      siteId: site.id,
      siteName: site.name,
      demoUrl: `http://${req.get('host')}/demo.html?siteId=${site.id}`,
    });
  } catch (err) {
    logger.error(`Demo site error: ${err.message}`);
    res.status(500).json({ error: 'Failed to get demo site ID' });
  }
});

export default router;
