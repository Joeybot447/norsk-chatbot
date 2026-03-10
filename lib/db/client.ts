/**
 * SQLite Database Client for Next.js
 * Uses sql.js for serverless/Vercel compatibility (pure JavaScript SQLite)
 */

import fs from 'fs';
import path from 'path';
import initSqlJs from 'sql.js';
import { config } from '../config';

let dbInstance: any = null;
let SQL: any = null;

/**
 * Initialize SQL.js
 */
async function initSqlJs() {
  if (SQL) return SQL;
  SQL = await initSqlJs();
  return SQL;
}

/**
 * Load or create database
 */
export async function initializeDb() {
  if (dbInstance) return dbInstance;

  try {
    // Initialize SQL.js
    const SqlJsLib = await initSqlJs();

    // Ensure data directory exists
    if (!fs.existsSync(config.dataDir)) {
      fs.mkdirSync(config.dataDir, { recursive: true });
    }

    const dbPath = config.databaseUrl;

    // Load existing database or create new one
    let db;
    if (fs.existsSync(dbPath)) {
      const fileBuffer = fs.readFileSync(dbPath);
      db = new SqlJsLib.Database(fileBuffer);
    } else {
      db = new SqlJsLib.Database();
    }

    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');

    dbInstance = db;
    console.log(`Database initialized at: ${dbPath}`);
    return dbInstance;
  } catch (err) {
    console.error(`Failed to initialize database: ${err}`);
    throw err;
  }
}

/**
 * Save database to disk (call after mutations)
 */
function saveDb() {
  try {
    if (!dbInstance) return;
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(config.databaseUrl, buffer);
  } catch (err) {
    console.error(`Failed to save database: ${err}`);
  }
}

/**
 * Get database instance
 */
export async function getDb() {
  if (!dbInstance) {
    await initializeDb();
  }
  return dbInstance;
}

/**
 * Execute a query
 */
export async function query(sql: string, params: any[] = []) {
  try {
    const db = await getDb();
    const trimmed = sql.trim().toUpperCase();

    if (trimmed.startsWith('SELECT') || trimmed.startsWith('WITH')) {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();
      return {
        rows,
        rowCount: rows.length,
      };
    } else {
      db.run(sql, params);
      saveDb();
      
      // Get lastInsertRowid
      const result = db.exec('SELECT last_insert_rowid() as id');
      const lastId = result[0]?.values[0]?.[0] || null;

      return {
        rows: [{ id: lastId }],
        rowCount: 1,
        lastId,
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
export async function getOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  try {
    const db = await getDb();
    const stmt = db.prepare(sql);
    stmt.bind(params);
    
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row as T;
    }
    
    stmt.free();
    return null;
  } catch (err) {
    console.error(`Database getOne error: ${err}`);
    throw err;
  }
}

/**
 * Get multiple rows
 */
export async function getMany<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  try {
    const db = await getDb();
    const stmt = db.prepare(sql);
    stmt.bind(params);
    
    const rows: T[] = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject() as T);
    }
    
    stmt.free();
    return rows;
  } catch (err) {
    console.error(`Database getMany error: ${err}`);
    throw err;
  }
}
