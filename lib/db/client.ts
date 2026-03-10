/**
 * SQLite Database Client for Next.js
 * Uses better-sqlite3 for file-based persistence
 */

import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { config } from '../config';

let dbInstance: Database.Database | null = null;

/**
 * Initialize database
 */
export function initializeDb(): Database.Database {
  if (dbInstance) return dbInstance;

  try {
    // Ensure data directory exists
    if (!fs.existsSync(config.dataDir)) {
      fs.mkdirSync(config.dataDir, { recursive: true });
    }

    dbInstance = new Database(config.databaseUrl);
    dbInstance.pragma('journal_mode = WAL');
    dbInstance.pragma('foreign_keys = ON');

    console.log(`Database initialized at: ${config.databaseUrl}`);
    return dbInstance;
  } catch (err) {
    console.error(`Failed to initialize database: ${err}`);
    throw err;
  }
}

/**
 * Get database instance
 */
export function getDb(): Database.Database {
  if (!dbInstance) {
    initializeDb();
  }
  return dbInstance!;
}

/**
 * Execute a query
 */
export function query(sql: string, params: any[] = []) {
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
    console.error(`Database query error: ${err}`);
    throw err;
  }
}

/**
 * Get a single row
 */
export function getOne<T = any>(sql: string, params: any[] = []): T | null {
  try {
    const db = getDb();
    const stmt = db.prepare(sql);
    return (stmt.get(...params) as T) || null;
  } catch (err) {
    console.error(`Database getOne error: ${err}`);
    throw err;
  }
}

/**
 * Get multiple rows
 */
export function getMany<T = any>(sql: string, params: any[] = []): T[] {
  try {
    const db = getDb();
    const stmt = db.prepare(sql);
    return stmt.all(...params) as T[];
  } catch (err) {
    console.error(`Database getMany error: ${err}`);
    throw err;
  }
}

/**
 * Execute a transaction
 */
export function transaction<T>(callback: (db: Database.Database) => T): T {
  const db = getDb();
  const tx = db.transaction(() => callback(db));
  return tx();
}

export default getDb;
