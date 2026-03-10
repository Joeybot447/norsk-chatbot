/**
 * Dashboard Routes
 * Handles user dashboard data and settings
 */

import express from 'express';
import { v4 as uuid } from 'uuid';
import jwt from 'jsonwebtoken';
import { query, getOne, getAll } from '../db/client.js';
import { logger } from '../utils/logger.js';
import config from '../config.js';

const router = express.Router();

/**
 * Dashboard auth middleware
 */
const dashboardAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, config.jwtSecret, {
      algorithms: ['HS256'],
      clockTolerance: 30,
    });
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Apply auth middleware
router.use(dashboardAuth);

/**
 * GET /api/dashboard/stats
 */
router.get('/stats', (req, res) => {
  try {
    const userId = req.user.userId;
    const sites = getAll('SELECT id FROM sites WHERE user_id = ?', [userId]);

    if (sites.length === 0) {
      return res.json({
        total_conversations: 0,
        active_chatbots: 0,
        documents_uploaded: 0,
        knowledge_sources: 0,
      });
    }

    const siteIds = sites.map((s) => s.id);

    let totalConversations = 0;
    let totalDocuments = 0;
    let totalSources = 0;

    for (const siteId of siteIds) {
      const convResult = getOne('SELECT COUNT(*) as count FROM conversations WHERE site_id = ?', [siteId]);
      totalConversations += convResult?.count || 0;

      const docResult = getOne('SELECT COUNT(*) as count FROM documents WHERE site_id = ?', [siteId]);
      totalDocuments += docResult?.count || 0;

      const srcResult = getOne('SELECT COUNT(*) as count FROM knowledge_sources WHERE site_id = ?', [siteId]);
      totalSources += srcResult?.count || 0;
    }

    res.json({
      total_conversations: totalConversations,
      active_chatbots: sites.length,
      documents_uploaded: totalDocuments,
      knowledge_sources: totalSources,
    });
  } catch (err) {
    logger.error({ reqId: req.requestId }, `Stats error: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * GET /api/dashboard/sources/:site_id
 */
router.get('/sources/:site_id', (req, res) => {
  try {
    const userId = req.user.userId;
    const siteId = req.params.site_id;

    const site = getOne('SELECT id FROM sites WHERE id = ? AND user_id = ?', [siteId, userId]);
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    const sources = getAll('SELECT * FROM sources WHERE site_id = ? ORDER BY created_at DESC', [siteId]);
    res.json({ sources: sources || [] });
  } catch (err) {
    logger.error({ reqId: req.requestId }, `Sources error: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch sources' });
  }
});

/**
 * POST /api/dashboard/sources/url
 */
router.post('/sources/url', (req, res) => {
  try {
    const userId = req.user.userId;
    const { site_id, url } = req.body;

    if (!site_id || !url) {
      return res.status(400).json({ error: 'site_id and url are required' });
    }

    // Validate URL
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return res.status(400).json({ error: 'Only http/https URLs are allowed' });
      }
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    const site = getOne('SELECT id FROM sites WHERE id = ? AND user_id = ?', [site_id, userId]);
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    const sourceId = uuid();
    query(
      `INSERT INTO sources (id, site_id, type, url, status) VALUES (?, ?, ?, ?, ?)`,
      [sourceId, site_id, 'url', url, 'processing']
    );

    logger.info(`URL source added: ${url}`);
    res.status(201).json({
      success: true,
      source: { id: sourceId, type: 'url', url, status: 'processing' },
    });
  } catch (err) {
    logger.error({ reqId: req.requestId }, `Add URL source error: ${err.message}`);
    res.status(500).json({ error: 'Failed to add source' });
  }
});

/**
 * POST /api/dashboard/sources/upload
 */
router.post('/sources/upload', (req, res) => {
  try {
    const userId = req.user.userId;
    const { site_id, file_content, file_name } = req.body;

    if (!site_id || !file_content) {
      return res.status(400).json({ error: 'site_id and file_content are required' });
    }

    const site = getOne('SELECT id FROM sites WHERE id = ? AND user_id = ?', [site_id, userId]);
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    const sourceId = uuid();
    query(
      `INSERT INTO sources (id, site_id, type, name, content, status) VALUES (?, ?, ?, ?, ?, ?)`,
      [sourceId, site_id, 'file', file_name || 'uploaded-file', file_content, 'ready']
    );

    logger.info(`File source uploaded: ${file_name}`);
    res.status(201).json({
      success: true,
      source: { id: sourceId, type: 'file', name: file_name, status: 'ready' },
    });
  } catch (err) {
    logger.error({ reqId: req.requestId }, `Upload file error: ${err.message}`);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

/**
 * POST /api/dashboard/sources/text
 */
router.post('/sources/text', (req, res) => {
  try {
    const userId = req.user.userId;
    const { site_id, content } = req.body;

    if (!site_id || !content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ error: 'site_id and content are required' });
    }

    const site = getOne('SELECT id FROM sites WHERE id = ? AND user_id = ?', [site_id, userId]);
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    const sourceId = uuid();
    query(
      `INSERT INTO sources (id, site_id, type, content, status) VALUES (?, ?, ?, ?, ?)`,
      [sourceId, site_id, 'text', content, 'ready']
    );

    logger.info(`Text source added`);
    res.status(201).json({
      success: true,
      source: { id: sourceId, type: 'text', status: 'ready' },
    });
  } catch (err) {
    logger.error({ reqId: req.requestId }, `Add text source error: ${err.message}`);
    res.status(500).json({ error: 'Failed to add text source' });
  }
});

/**
 * DELETE /api/dashboard/sources/:source_id
 */
router.delete('/sources/:source_id', (req, res) => {
  try {
    const userId = req.user.userId;
    const sourceId = req.params.source_id;

    const source = getOne(
      `SELECT s.id FROM sources s JOIN sites st ON s.site_id = st.id WHERE s.id = ? AND st.user_id = ?`,
      [sourceId, userId]
    );

    if (!source) {
      return res.status(404).json({ error: 'Source not found' });
    }

    query('DELETE FROM sources WHERE id = ?', [sourceId]);
    logger.info(`Source deleted: ${sourceId}`);
    res.json({ success: true });
  } catch (err) {
    logger.error({ reqId: req.requestId }, `Delete source error: ${err.message}`);
    res.status(500).json({ error: 'Failed to delete source' });
  }
});

/**
 * GET /api/dashboard/conversations/:site_id
 */
router.get('/conversations/:site_id', (req, res) => {
  try {
    const userId = req.user.userId;
    const siteId = req.params.site_id;

    const site = getOne('SELECT id FROM sites WHERE id = ? AND user_id = ?', [siteId, userId]);
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    const conversations = getAll(
      `SELECT id, visitor_name, visitor_email, message_count, started_at, ended_at
       FROM conversations WHERE site_id = ?
       ORDER BY started_at DESC LIMIT 50`,
      [siteId]
    );

    res.json({ conversations: conversations || [] });
  } catch (err) {
    logger.error({ reqId: req.requestId }, `Conversations error: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

/**
 * GET /api/dashboard/settings/:site_id
 */
router.get('/settings/:site_id', (req, res) => {
  try {
    const userId = req.user.userId;
    const siteId = req.params.site_id;

    const site = getOne('SELECT * FROM sites WHERE id = ? AND user_id = ?', [siteId, userId]);
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    const settings = site.widget_config ? JSON.parse(site.widget_config) : {};
    res.json({ settings });
  } catch (err) {
    logger.error({ reqId: req.requestId }, `Settings error: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

/**
 * PUT /api/dashboard/settings/:site_id
 */
router.put('/settings/:site_id', (req, res) => {
  try {
    const userId = req.user.userId;
    const siteId = req.params.site_id;
    const settings = req.body;

    const site = getOne('SELECT id FROM sites WHERE id = ? AND user_id = ?', [siteId, userId]);
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    query('UPDATE sites SET widget_config = ? WHERE id = ?', [JSON.stringify(settings), siteId]);

    logger.info(`Settings updated for site: ${siteId}`);
    res.json({ success: true, settings });
  } catch (err) {
    logger.error({ reqId: req.requestId }, `Settings update error: ${err.message}`);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

/**
 * GET /api/dashboard/embed/:site_id
 */
router.get('/embed/:site_id', (req, res) => {
  try {
    const userId = req.user.userId;
    const siteId = req.params.site_id;

    const site = getOne('SELECT * FROM sites WHERE id = ? AND user_id = ?', [siteId, userId]);
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    const apiUrl = config.apiUrl || `${req.protocol}://${req.get('host')}`;
    const embedCode = `<script src="${apiUrl}/widget.min.js" data-site="${siteId}" data-api-url="${apiUrl}"></script>`;

    res.json({
      embed_code: embedCode,
      site_id: siteId,
    });
  } catch (err) {
    logger.error({ reqId: req.requestId }, `Embed error: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch embed code' });
  }
});

/**
 * GET /api/dashboard/sites
 * List all sites for logged-in user
 */
router.get('/sites', (req, res) => {
  try {
    const userId = req.user.userId;

    const sites = getAll(
      'SELECT id, name, domain, status, widget_config, created_at FROM sites WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    const parsed = (sites || []).map(s => ({
      ...s,
      widget_config: s.widget_config ? JSON.parse(s.widget_config) : {},
    }));

    res.json({ sites: parsed });
  } catch (err) {
    logger.error({ reqId: req.requestId }, `Sites error: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch sites' });
  }
});

/**
 * POST /api/dashboard/sites
 * Create a new site
 */
router.post('/sites', (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, domain } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'name is required' });
    }

    const siteId = uuid();
    const apiKey = 'sk_' + uuid().replace(/-/g, '').substring(0, 20);

    const defaultConfig = {
      name: name.trim(),
      primary_color: '#3182ce',
      position: 'bottom-right',
      welcome_message: `Hej! Jeg er assistenten for ${name.trim()}. Hva kan jeg hjelpe deg med?`,
    };

    // Need a customer_id — get or create one linked to the user
    let customer = getOne('SELECT id FROM customers WHERE email = (SELECT email FROM users WHERE id = ?)', [userId]);
    if (!customer) {
      const customerId = uuid();
      const user = getOne('SELECT email, company_name FROM users WHERE id = ?', [userId]);
      query(
        'INSERT INTO customers (id, name, email, plan, status) VALUES (?, ?, ?, ?, ?)',
        [customerId, user?.company_name || 'Customer', user?.email || 'unknown@example.com', 'starter', 'active']
      );
      customer = { id: customerId };
    }

    query(
      `INSERT INTO sites (id, user_id, customer_id, domain, name, api_key, widget_config, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [siteId, userId, customer.id, domain || name.trim(), name.trim(), apiKey, JSON.stringify(defaultConfig), 'active']
    );

    logger.info(`Site created: ${name}`);
    res.status(201).json({
      success: true,
      site: { id: siteId, name: name.trim(), api_key: apiKey },
    });
  } catch (err) {
    logger.error({ reqId: req.requestId }, `Create site error: ${err.message}`);
    res.status(500).json({ error: 'Failed to create site' });
  }
});

/**
 * PUT /api/dashboard/sites/:id  (also serves as PUT /api/sites/:id)
 * Update site settings (name, welcome message, colors)
 */
router.put('/sites/:id', (req, res) => {
  try {
    const userId = req.user.userId;
    const siteId = req.params.id;
    const { name, domain, welcome_message, primary_color, position } = req.body;

    const site = getOne('SELECT * FROM sites WHERE id = ? AND user_id = ?', [siteId, userId]);
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    // Update site name/domain if provided
    if (name) {
      query('UPDATE sites SET name = ? WHERE id = ?', [name.trim(), siteId]);
    }
    if (domain) {
      query('UPDATE sites SET domain = ? WHERE id = ?', [domain.trim(), siteId]);
    }

    // Update widget config if any config fields provided
    if (welcome_message || primary_color || position) {
      const currentConfig = site.widget_config ? JSON.parse(site.widget_config) : {};
      if (welcome_message) currentConfig.welcome_message = welcome_message;
      if (primary_color) currentConfig.primary_color = primary_color;
      if (position) currentConfig.position = position;
      if (name) currentConfig.name = name.trim();

      query('UPDATE sites SET widget_config = ? WHERE id = ?', [JSON.stringify(currentConfig), siteId]);
    }

    logger.info(`Site updated: ${siteId}`);

    const updated = getOne('SELECT id, name, domain, status, widget_config FROM sites WHERE id = ?', [siteId]);
    res.json({
      success: true,
      site: {
        ...updated,
        widget_config: updated.widget_config ? JSON.parse(updated.widget_config) : {},
      },
    });
  } catch (err) {
    logger.error({ reqId: req.requestId }, `Update site error: ${err.message}`);
    res.status(500).json({ error: 'Failed to update site' });
  }
});

export default router;
