/**
 * API Key Authentication Middleware
 * Validates API key from Authorization header
 */

import { logger } from '../utils/logger.js';

/**
 * JWT authentication middleware (simplified for MVP)
 */
export function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    // For MVP, we'll just check if the token exists
    // In production, this would validate a JWT
    const token = authHeader.substring(7);
    if (!token) {
      return res.status(401).json({ error: 'Invalid or empty token' });
    }

    req.user = { token };
    next();
  } catch (err) {
    logger.warn(`Authentication failed: ${err.message}`);
    return res.status(401).json({ error: 'Invalid or expired token' });
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

    // In production: verify against database
    // For MVP: simple validation
    if (!apiKey.startsWith('sk_sit_')) {
      return res.status(401).json({ error: 'Invalid API key format' });
    }

    req.apiKey = apiKey;
    next();
  } catch (err) {
    logger.warn(`API key validation failed: ${err.message}`);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

export default authMiddleware;
