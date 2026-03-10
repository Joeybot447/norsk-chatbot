/**
 * SQLite Database Client
 * Uses better-sqlite3 for file-based persistence
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import { logger } from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '../../data');
const dbPath = process.env.DATABASE_URL || path.join(dataDir, 'norskbot.db');

let dbInstance = null;

/**
 * Initialize database
 */
export function initializeDb() {
  if (dbInstance) return dbInstance;

  try {
    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    dbInstance = new Database(dbPath);
    dbInstance.pragma('journal_mode = WAL');
    dbInstance.pragma('foreign_keys = ON');

    logger.info(`Database initialized at: ${dbPath}`);
    return dbInstance;
  } catch (err) {
    logger.error(`Failed to initialize database: ${err.message}`);
    throw err;
  }
}

/**
 * Get database instance
 */
export function getDb() {
  if (!dbInstance) {
    initializeDb();
  }
  return dbInstance;
}

/**
 * Execute a query
 */
export function query(sql, params = []) {
  try {
    const db = getDb();
    const trimmed = sql.trim().toUpperCase();

    if (trimmed.startsWith('SELECT') || trimmed.startsWith('WITH')) {
      const stmt = db.prepare(sql);
      const rows = stmt.all(...params);
      return {
        rows,
        rowCount: rows.length,
      };
    } else {
      const stmt = db.prepare(sql);
      const info = stmt.run(...params);
      return {
        rows: [{ id: info.lastInsertRowid }],
        rowCount: info.changes,
        lastId: info.lastInsertRowid,
      };
    }
  } catch (err) {
    logger.error(`Database query error: ${err.message} | SQL: ${sql.substring(0, 100)}`);
    throw err;
  }
}

/**
 * Get a single row
 */
export function getOne(sql, params = []) {
  try {
    const db = getDb();
    const stmt = db.prepare(sql);
    return stmt.get(...params) || null;
  } catch (err) {
    logger.error(`Database getOne error: ${err.message}`);
    throw err;
  }
}

/**
 * Get multiple rows
 */
export function getMany(sql, params = []) {
  try {
    const db = getDb();
    const stmt = db.prepare(sql);
    return stmt.all(...params);
  } catch (err) {
    logger.error(`Database getMany error: ${err.message}`);
    throw err;
  }
}

/**
 * Get all rows (alias)
 */
export function getAll(sql, params = []) {
  return getMany(sql, params);
}

/**
 * Execute a transaction
 */
export async function transaction(callback) {
  const db = getDb();
  const tx = db.transaction(() => callback(db));
  return tx();
}

/**
 * Backward-compatible dbClient
 */
export const dbClient = {
  query: (sql, params = []) => {
    try {
      return Promise.resolve(query(sql, params));
    } catch (err) {
      return Promise.reject(err);
    }
  },
};

export default dbInstance;
