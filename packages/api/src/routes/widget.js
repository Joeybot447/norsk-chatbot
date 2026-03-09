/**
 * Widget Routes
 * GET /v1/widget/:siteId - Get widget configuration
 * GET /v1/widget/script - Get embeddable widget script
 */

import express from 'express';
import { getOne } from '../db/client.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * GET /v1/widget/:siteId
 * Return widget configuration for the specified site
 */
router.get('/:siteId', async (req, res) => {
  try {
    const { siteId } = req.params;

    const site = getOne(
      `SELECT id, name, widget_config FROM sites WHERE id = ?`,
      [siteId]
    );

    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    const config = typeof site.widget_config === 'string'
      ? JSON.parse(site.widget_config)
      : site.widget_config || {};

    res.json({
      id: site.id,
      name: site.name,
      config,
    });
  } catch (err) {
    logger.error(`Widget config error: ${err.message}`);
    res.status(500).json({ error: 'Failed to load widget configuration' });
  }
});

/**
 * GET /v1/widget/script/:siteId
 * Return the embeddable widget script
 */
router.get('/script/:siteId', async (req, res) => {
  try {
    const { siteId } = req.params;

    // Verify site exists
    const site = getOne(
      `SELECT id FROM sites WHERE id = ?`,
      [siteId]
    );

    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    // Return widget script URL
    const apiUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 3000}`;
    const scriptUrl = `${apiUrl}/widget.min.js`;

    res.json({
      scriptUrl,
      installCode: `<script src="${scriptUrl}" data-site-id="${siteId}" data-api-url="${apiUrl}"></script>`,
    });
  } catch (err) {
    logger.error(`Widget script error: ${err.message}`);
    res.status(500).json({ error: 'Failed to load widget script' });
  }
});

export default router;
