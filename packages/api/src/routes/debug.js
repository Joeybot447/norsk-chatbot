/**
 * Debug routes (for MVP troubleshooting)
 */

import express from 'express';
import { getDb } from '../db/client.js';

const router = express.Router();

/**
 * GET /debug/db
 * Show current database contents
 */
router.get('/db', (req, res) => {
  try {
    const db = getDb();
    res.json({
      customers: db.data.customers,
      sites: db.data.sites,
      documents: db.data.documents.map((d) => ({ id: d.id, title: d.title, site_id: d.site_id })),
      chunks: {
        count: db.data.chunks.length,
      },
      conversations: {
        count: db.data.conversations.length,
      },
      messages: {
        count: db.data.messages.length,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
