/**
 * Authentication Middleware
 * Validates JWT tokens and API keys
 */

import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger.js';
import config from '../config.js';

/**
 * JWT authentication middleware
 * Strictly validates token — no fallback in production
 */
export function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7);
    if (!token) {
      return res.status(401).json({ error: 'Invalid or empty token' });
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret, {
        algorithms: ['HS256'],
        clockTolerance: 30, // 30 seconds tolerance for clock skew
      });
      req.user = decoded;
      next();
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      }
      if (jwtErr.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token' });
      }
      return res.status(401).json({ error: 'Authentication failed' });
    }
  } catch (err) {
    logger.warn({ reqId: req.requestId }, `Authentication error: ${err.message}`);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

/**
 * API Key validation (for site-specific endpoints)
 */
export function apiKeyMiddleware(req, res, next) {
  try {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
      return res.status(401).json({ error: 'Missing API key' });
    }

    if (!apiKey.startsWith('sk_')) {
      return res.status(401).json({ error: 'Invalid API key format' });
    }

    req.apiKey = apiKey;
    next();
  } catch (err) {
    logger.warn({ reqId: req.requestId }, `API key validation failed: ${err.message}`);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

export default authMiddleware;
