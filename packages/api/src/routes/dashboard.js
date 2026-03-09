/**
 * Dashboard Routes
 * Handles user dashboard data and settings
 */

import express from 'express';
import { v4 as uuid } from 'uuid';
import jwt from 'jsonwebtoken';
import { query, getOne, getAll } from '../db/client.js';
import { logger } from '../utils/logger.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

/**
 * Middleware to verify JWT and attach user to request
 */
const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Apply auth middleware to all dashboard routes
router.use(authMiddleware);

/**
 * GET /api/dashboard/stats
 * Get overview stats for logged-in user
 */
router.get('/stats', (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user's sites
    const sites = getAll('SELECT id FROM sites WHERE user_id = ?', [userId]);

    if (sites.length === 0) {
      return res.json({
        total_conversations: 0,
        active_chatbots: 0,
        documents_uploaded: 0,
      });
    }

    const siteIds = sites.map((s) => s.id);

    // Count conversations
    let totalConversations = 0;
    for (const siteId of siteIds) {
      const result = getOne(
        'SELECT COUNT(*) as count FROM conversations WHERE site_id = ?',
        [siteId]
      );
      totalConversations += result?.count || 0;
    }

    // Count documents
    let totalDocuments = 0;
    for (const siteId of siteIds) {
      const result = getOne(
        'SELECT COUNT(*) as count FROM documents WHERE site_id = ?',
        [siteId]
      );
      totalDocuments += result?.count || 0;
    }

    res.json({
      total_conversations: totalConversations,
      active_chatbots: sites.length,
      documents_uploaded: totalDocuments,
    });
  } catch (err) {
    logger.error(`Stats error: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * GET /api/dashboard/sources
 * List knowledge sources for a site
 */
router.get('/sources/:site_id', (req, res) => {
  try {
    const userId = req.user.userId;
    const siteId = req.params.site_id;

    // Verify user owns this site
    const site = getOne('SELECT id FROM sites WHERE id = ? AND user_id = ?', [
      siteId,
      userId,
    ]);
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    // Get sources
    const sources = getAll('SELECT * FROM sources WHERE site_id = ? ORDER BY created_at DESC', [
      siteId,
    ]);

    res.json({
      sources: sources || [],
    });
  } catch (err) {
    logger.error(`Sources error: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch sources' });
  }
});

/**
 * POST /api/dashboard/sources/url
 * Add URL source (triggers crawl)
 */
router.post('/sources/url', (req, res) => {
  try {
    const userId = req.user.userId;
    const { site_id, url } = req.body;

    if (!site_id || !url) {
      return res.status(400).json({ error: 'site_id and url are required' });
    }

    // Verify user owns this site
    const site = getOne('SELECT id FROM sites WHERE id = ? AND user_id = ?', [
      site_id,
      userId,
    ]);
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    const sourceId = uuid();

    query(
      `INSERT INTO sources (id, site_id, type, url, status)
       VALUES (?, ?, ?, ?, ?)`,
      [sourceId, site_id, 'url', url, 'processing']
    );

    logger.info(`URL source added: ${url}`);

    res.status(201).json({
      success: true,
      source: {
        id: sourceId,
        type: 'url',
        url,
        status: 'processing',
      },
    });
  } catch (err) {
    logger.error(`Add URL source error: ${err.message}`);
    res.status(500).json({ error: 'Failed to add source' });
  }
});

/**
 * POST /api/dashboard/sources/upload
 * Upload file as knowledge source
 */
router.post('/sources/upload', (req, res) => {
  try {
    const userId = req.user.userId;
    const { site_id, file_content, file_name } = req.body;

    if (!site_id || !file_content) {
      return res.status(400).json({ error: 'site_id and file_content are required' });
    }

    // Verify user owns this site
    const site = getOne('SELECT id FROM sites WHERE id = ? AND user_id = ?', [
      site_id,
      userId,
    ]);
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    const sourceId = uuid();

    query(
      `INSERT INTO sources (id, site_id, type, name, content, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [sourceId, site_id, 'file', file_name || 'uploaded-file', file_content, 'ready']
    );

    logger.info(`File source uploaded: ${file_name}`);

    res.status(201).json({
      success: true,
      source: {
        id: sourceId,
        type: 'file',
        name: file_name,
        status: 'ready',
      },
    });
  } catch (err) {
    logger.error(`Upload file error: ${err.message}`);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

/**
 * POST /api/dashboard/sources/text
 * Add raw text as knowledge source
 */
router.post('/sources/text', (req, res) => {
  try {
    const userId = req.user.userId;
    const { site_id, content } = req.body;

    if (!site_id || !content) {
      return res.status(400).json({ error: 'site_id and content are required' });
    }

    // Verify user owns this site
    const site = getOne('SELECT id FROM sites WHERE id = ? AND user_id = ?', [
      site_id,
      userId,
    ]);
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    const sourceId = uuid();

    query(
      `INSERT INTO sources (id, site_id, type, content, status)
       VALUES (?, ?, ?, ?, ?)`,
      [sourceId, site_id, 'text', content, 'ready']
    );

    logger.info(`Text source added`);

    res.status(201).json({
      success: true,
      source: {
        id: sourceId,
        type: 'text',
        status: 'ready',
      },
    });
  } catch (err) {
    logger.error(`Add text source error: ${err.message}`);
    res.status(500).json({ error: 'Failed to add text source' });
  }
});

/**
 * DELETE /api/dashboard/sources/:source_id
 * Delete a knowledge source
 */
router.delete('/sources/:source_id', (req, res) => {
  try {
    const userId = req.user.userId;
    const sourceId = req.params.source_id;

    // Verify user owns this source (via site)
    const source = getOne(
      `SELECT s.id FROM sources s
       JOIN sites st ON s.site_id = st.id
       WHERE s.id = ? AND st.user_id = ?`,
      [sourceId, userId]
    );

    if (!source) {
      return res.status(404).json({ error: 'Source not found' });
    }

    query('DELETE FROM sources WHERE id = ?', [sourceId]);

    logger.info(`Source deleted: ${sourceId}`);

    res.json({ success: true });
  } catch (err) {
    logger.error(`Delete source error: ${err.message}`);
    res.status(500).json({ error: 'Failed to delete source' });
  }
});

/**
 * GET /api/dashboard/conversations/:site_id
 * List recent conversations for a site
 */
router.get('/conversations/:site_id', (req, res) => {
  try {
    const userId = req.user.userId;
    const siteId = req.params.site_id;

    // Verify user owns this site
    const site = getOne('SELECT id FROM sites WHERE id = ? AND user_id = ?', [
      siteId,
      userId,
    ]);
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    // Get recent conversations
    const conversations = getAll(
      `SELECT id, visitor_name, visitor_email, message_count, started_at, ended_at
       FROM conversations WHERE site_id = ?
       ORDER BY started_at DESC LIMIT 50`,
      [siteId]
    );

    res.json({
      conversations: conversations || [],
    });
  } catch (err) {
    logger.error(`Conversations error: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

/**
 * GET /api/dashboard/settings/:site_id
 * Get widget settings for a site
 */
router.get('/settings/:site_id', (req, res) => {
  try {
    const userId = req.user.userId;
    const siteId = req.params.site_id;

    // Verify user owns this site
    const site = getOne('SELECT * FROM sites WHERE id = ? AND user_id = ?', [
      siteId,
      userId,
    ]);
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    const settings = site.widget_config ? JSON.parse(site.widget_config) : {};

    res.json({
      settings,
    });
  } catch (err) {
    logger.error(`Settings error: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

/**
 * PUT /api/dashboard/settings/:site_id
 * Update widget settings for a site
 */
router.put('/settings/:site_id', (req, res) => {
  try {
    const userId = req.user.userId;
    const siteId = req.params.site_id;
    const settings = req.body;

    // Verify user owns this site
    const site = getOne('SELECT id FROM sites WHERE id = ? AND user_id = ?', [
      siteId,
      userId,
    ]);
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    query('UPDATE sites SET widget_config = ? WHERE id = ?', [
      JSON.stringify(settings),
      siteId,
    ]);

    logger.info(`Settings updated for site: ${siteId}`);

    res.json({
      success: true,
      settings,
    });
  } catch (err) {
    logger.error(`Settings update error: ${err.message}`);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

/**
 * GET /api/dashboard/embed/:site_id
 * Get embed code and API key
 */
router.get('/embed/:site_id', (req, res) => {
  try {
    const userId = req.user.userId;
    const siteId = req.params.site_id;

    // Verify user owns this site
    const site = getOne('SELECT * FROM sites WHERE id = ? AND user_id = ?', [
      siteId,
      userId,
    ]);
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    const embedCode = `<script src="https://norskbot.no/widget.js" data-site="${siteId}"></script>`;

    res.json({
      embed_code: embedCode,
      api_key: site.api_key,
      site_id: siteId,
    });
  } catch (err) {
    logger.error(`Embed error: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch embed code' });
  }
});

/**
 * GET /api/dashboard/sites
 * Get all sites for logged-in user
 */
router.get('/sites', (req, res) => {
  try {
    const userId = req.user.userId;

    const sites = getAll('SELECT * FROM sites WHERE user_id = ? ORDER BY created_at DESC', [
      userId,
    ]);

    res.json({
      sites: sites || [],
    });
  } catch (err) {
    logger.error(`Sites error: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch sites' });
  }
});

/**
 * POST /api/dashboard/sites
 * Create a new site for logged-in user
 */
router.post('/sites', (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, domain } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    const siteId = uuid();
    const apiKey = 'sk_' + uuid().replace(/-/g, '').substring(0, 20);

    const defaultConfig = {
      name: name,
      primary_color: '#3182ce',
      position: 'bottom-right',
      welcome_message: `Hej! Jeg er assistenten for ${name}. Hva kan jeg hjelpe deg med?`,
    };

    query(
      `INSERT INTO sites (id, user_id, domain, name, api_key, widget_config, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [siteId, userId, domain || name, name, apiKey, JSON.stringify(defaultConfig), 'active']
    );

    logger.info(`Site created: ${name}`);

    res.status(201).json({
      success: true,
      site: {
        id: siteId,
        name,
        api_key: apiKey,
      },
    });
  } catch (err) {
    logger.error(`Create site error: ${err.message}`);
    res.status(500).json({ error: 'Failed to create site' });
  }
});

export default router;
