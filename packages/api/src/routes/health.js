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
    const db = getDb();

    // Get the demo site (first site for fjordtech@demo.no customer)
    const customers = db.data.customers.filter((c) => c.email === 'fjordtech@demo.no');
    if (customers.length === 0) {
      return res.status(404).json({
        error: 'Demo site not found',
        message: 'Please ensure the API has been properly initialized',
      });
    }

    const customerId = customers[0].id;

    // Get demo site for this customer
    const sites = db.data.sites.filter((s) => s.customer_id === customerId);
    if (sites.length === 0) {
      return res.status(404).json({
        error: 'Demo site not found',
      });
    }

    const site = sites[0];

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
