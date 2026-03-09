/**
 * Rate Limiting Middleware
 * Uses session ID or IP address to limit requests
 */

import { redisClient } from '../utils/redis.js';
import { logger } from '../utils/logger.js';

const RATE_LIMIT_WINDOW = 60; // seconds
const RATE_LIMIT_MAX_REQUESTS = 100; // requests per window

/**
 * Rate limit middleware
 */
export async function rateLimitMiddleware(req, res, next) {
  try {
    // Get identifier: session ID > IP address
    const sessionId = req.headers['x-session-id'];
    const identifier = sessionId || req.ip || req.connection.remoteAddress;
    const key = `rate-limit:${identifier}`;

    // Get current count
    const current = await redisClient.incr(key);

    // Set expiration on first request
    if (current === 1) {
      await redisClient.expire(key, RATE_LIMIT_WINDOW);
    }

    // Check limit
    if (current > RATE_LIMIT_MAX_REQUESTS) {
      logger.warn(`Rate limit exceeded for ${identifier}`);
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: RATE_LIMIT_WINDOW,
      });
    }

    // Add headers
    res.setHeader('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS);
    res.setHeader('X-RateLimit-Remaining', RATE_LIMIT_MAX_REQUESTS - current);
    res.setHeader('X-RateLimit-Reset', Math.ceil(Date.now() / 1000) + RATE_LIMIT_WINDOW);

    next();
  } catch (err) {
    logger.error(`Rate limit middleware error: ${err.message}`);
    // On Redis error, allow request but log it
    next();
  }
}

export default rateLimitMiddleware;
