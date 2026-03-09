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

    const site = await getOne(
      `SELECT id, name, widget_config FROM sites WHERE id = $1`,
      [siteId]
    );

    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    res.json({
      id: site.id,
      name: site.name,
      config: site.widget_config,
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
    const site = await getOne(
      `SELECT id FROM sites WHERE id = $1`,
      [siteId]
    );

    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    // For now, return widget.min.js placeholder
    // In production, this would be the minified widget bundle
    const scriptUrl = process.env.WIDGET_CDN_URL || 'http://localhost:5173/widget.min.js';

    res.json({
      scriptUrl,
      installCode: `<script src="${scriptUrl}" data-site-id="${siteId}"></script>`,
    });
  } catch (err) {
    logger.error(`Widget script error: ${err.message}`);
    res.status(500).json({ error: 'Failed to load widget script' });
  }
});

export default router;
