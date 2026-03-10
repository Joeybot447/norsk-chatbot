/**
 * Widget Routes
 * GET /v1/widget/:siteId - Get widget configuration (cached)
 * GET /v1/widget/script/:siteId - Get embeddable widget script
 */

import express from 'express';
import { getOne } from '../db/client.js';
import { logger } from '../utils/logger.js';
import config from '../config.js';

const router = express.Router();

// Simple in-memory cache for widget configs (TTL: 5 minutes)
const widgetConfigCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedConfig(siteId) {
  const cached = widgetConfigCache.get(siteId);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.data;
  }
  widgetConfigCache.delete(siteId);
  return null;
}

function setCachedConfig(siteId, data) {
  widgetConfigCache.set(siteId, { data, timestamp: Date.now() });
}

/**
 * GET /v1/widget/:siteId
 * Return widget configuration for the specified site (cached)
 */
router.get('/:siteId', (req, res) => {
  try {
    const { siteId } = req.params;

    // Check cache first
    const cached = getCachedConfig(siteId);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

    const site = getOne(
      `SELECT id, name, widget_config FROM sites WHERE id = ?`,
      [siteId]
    );

    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    const widgetConfig = typeof site.widget_config === 'string'
      ? JSON.parse(site.widget_config)
      : site.widget_config || {};

    const responseData = {
      id: site.id,
      name: site.name,
      config: widgetConfig,
    };

    // Cache the result
    setCachedConfig(siteId, responseData);
    res.setHeader('X-Cache', 'MISS');

    res.json(responseData);
  } catch (err) {
    logger.error(`Widget config error: ${err.message}`);
    res.status(500).json({ error: 'Failed to load widget configuration' });
  }
});

/**
 * GET /v1/widget/script/:siteId
 * Return the embeddable widget script info
 */
router.get('/script/:siteId', (req, res) => {
  try {
    const { siteId } = req.params;

    const site = getOne(
      `SELECT id FROM sites WHERE id = ?`,
      [siteId]
    );

    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    const apiUrl = config.apiUrl || `${req.protocol}://${req.get('host')}`;
    const scriptUrl = `${apiUrl}/widget.min.js`;

    res.json({
      scriptUrl,
      installCode: `<script src="${scriptUrl}" data-site="${siteId}" data-api-url="${apiUrl}"></script>`,
    });
  } catch (err) {
    logger.error(`Widget script error: ${err.message}`);
    res.status(500).json({ error: 'Failed to load widget script' });
  }
});

export default router;
