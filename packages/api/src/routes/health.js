/**
 * Health Check Routes
 * GET /health - Basic health check
 * GET /health/ready - Readiness check (dependencies)
 * GET /health/demo - Get demo site ID for MVP
 */

import express from 'express';
import { getDb, getOne } from '../db/client.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * GET /health
 * Simple liveness check
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
 * Readiness check - ensures all dependencies are available
 */
router.get('/ready', async (req, res) => {
  try {
    // Check database
    const dbReady = await checkDatabase();

    if (dbReady) {
      return res.json({
        status: 'ready',
        checks: {
          database: 'ok',
        },
      });
    }

    res.status(503).json({
      status: 'not ready',
      checks: {
        database: 'failed',
      },
    });
  } catch (err) {
    logger.error(`Health check error: ${err.message}`);
    res.status(503).json({
      status: 'error',
      error: err.message,
    });
  }
});

/**
 * GET /health/demo
 * Get demo site ID and configuration for MVP
 */
router.get('/demo', (req, res) => {
  try {
    // Get the demo site (first site for fjordtech@demo.no customer)
    const customer = getOne(
      'SELECT id FROM customers WHERE email = ?',
      ['fjordtech@demo.no']
    );

    if (!customer) {
      return res.status(404).json({
        error: 'Demo site not found',
        message: 'Please ensure the API has been properly initialized',
      });
    }

    // Get demo site for this customer
    const db = getDb();
    const site = db.prepare('SELECT id, name, widget_config FROM sites WHERE customer_id = ?').get(customer.id);

    if (!site) {
      return res.status(404).json({
        error: 'Demo site not found',
      });
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

/**
 * Check database connection
 */
async function checkDatabase() {
  try {
    const db = getDb();
    const result = db.prepare('SELECT 1').all();
    return result && result.length > 0;
  } catch (err) {
    logger.error(`Database health check failed: ${err.message}`);
    return false;
  }
}

export default router;
