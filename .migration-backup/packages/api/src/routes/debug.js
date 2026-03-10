/**
 * Debug routes (development only)
 */

import express from 'express';
import { getDb } from '../db/client.js';

const router = express.Router();

/**
 * GET /debug/db
 * Show current database table counts (dev only)
 */
router.get('/db', (req, res) => {
  try {
    const db = getDb();

    const counts = {};
    const tables = ['customers', 'sites', 'users', 'documents', 'chunks',
                     'conversations', 'messages', 'knowledge_sources', 'knowledge_chunks'];

    for (const table of tables) {
      try {
        const result = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
        counts[table] = result?.count || 0;
      } catch {
        counts[table] = 'table not found';
      }
    }

    res.json({ counts });
  } catch (err) {
    res.status(500).json({ error: 'Debug query failed' });
  }
});

export default router;
