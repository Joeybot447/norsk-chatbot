/**
 * Health Check Routes
 */

import express from 'express';
import { getDb, getOne } from '../db/client.js';
import { logger } from '../utils/logger.js';

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
router.get('/ready', async (req, res) => {
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
