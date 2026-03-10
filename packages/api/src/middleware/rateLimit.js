/**
 * Rate Limiting Middleware
 * In-memory rate limiting per IP (no Redis dependency)
 */

import { logger } from '../utils/logger.js';
import config from '../config.js';

// In-memory store for rate limiting
const rateLimitStore = new Map();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore) {
    if (now - entry.windowStart > 120000) { // 2 min stale
      rateLimitStore.delete(key);
    }
  }
}, 300000);

/**
 * Create a rate limiter with configurable limits
 */
function createRateLimiter(windowSeconds, maxRequests) {
  return (req, res, next) => {
    try {
      const identifier = req.ip || req.connection?.remoteAddress || 'unknown';
      const key = `rl:${windowSeconds}:${maxRequests}:${identifier}`;
      const now = Date.now();
      const windowMs = windowSeconds * 1000;

      let entry = rateLimitStore.get(key);

      if (!entry || (now - entry.windowStart) > windowMs) {
        entry = { windowStart: now, count: 0 };
        rateLimitStore.set(key, entry);
      }

      entry.count++;

      // Set headers
      const remaining = Math.max(0, maxRequests - entry.count);
      const resetTime = Math.ceil((entry.windowStart + windowMs) / 1000);
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', resetTime);

      if (entry.count > maxRequests) {
        const retryAfter = Math.ceil((entry.windowStart + windowMs - now) / 1000);
        logger.warn({ reqId: req.requestId, ip: identifier }, `Rate limit exceeded`);
        res.setHeader('Retry-After', retryAfter);
        return res.status(429).json({
          error: 'For mange forespørsler. Vennligst vent litt.',
          retryAfter,
        });
      }

      next();
    } catch (err) {
      logger.error(`Rate limit middleware error: ${err.message}`);
      next(); // Allow on error
    }
  };
}

/**
 * Chat endpoint rate limiter (30 req/min per IP)
 */
export const rateLimitMiddleware = createRateLimiter(
  config.chatRateLimit.windowSeconds,
  config.chatRateLimit.maxRequests
);

/**
 * General API rate limiter (100 req/min per IP)
 */
export const generalRateLimiter = createRateLimiter(
  config.globalRateLimit.windowSeconds,
  config.globalRateLimit.maxRequests
);

export default rateLimitMiddleware;
