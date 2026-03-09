/**
 * Health Check Routes
 * GET /health - Basic health check
 * GET /health/ready - Readiness check (dependencies)
 */

import express from 'express';
import { dbClient } from '../db/client.js';
import { redisClient } from '../utils/redis.js';
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

    // Check Redis
    const redisReady = await checkRedis();

    if (dbReady && redisReady) {
      return res.json({
        status: 'ready',
        checks: {
          database: 'ok',
          redis: 'ok',
        },
      });
    }

    res.status(503).json({
      status: 'not ready',
      checks: {
        database: dbReady ? 'ok' : 'failed',
        redis: redisReady ? 'ok' : 'failed',
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
 * Check database connection
 */
async function checkDatabase() {
  try {
    const result = await dbClient.query('SELECT 1');
    return result.rowCount > 0;
  } catch (err) {
    logger.error(`Database health check failed: ${err.message}`);
    return false;
  }
}

/**
 * Check Redis connection
 */
async function checkRedis() {
  try {
    const pong = await redisClient.ping();
    return pong === 'PONG';
  } catch (err) {
    logger.error(`Redis health check failed: ${err.message}`);
    return false;
  }
}

export default router;
