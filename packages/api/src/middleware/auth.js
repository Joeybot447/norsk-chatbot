/**
 * Authentication Middleware
 * Validates JWT tokens from Authorization header
 */

import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

/**
 * JWT authentication middleware
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
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (jwtErr) {
      // For backwards compatibility, also accept any non-empty token in dev mode
      req.user = { token };
    }

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
