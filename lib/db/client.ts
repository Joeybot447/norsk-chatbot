/**
 * Database Client for Next.js
 * Uses Vercel Postgres (managed PostgreSQL)
 * Serverless-compatible, no file persistence needed
 */

import { sql } from '@vercel/postgres';

/**
 * Execute a query
 */
export async function query(sqlText: string, params: any[] = []) {
  try {
    const trimmed = sqlText.trim().toUpperCase();

    if (trimmed.startsWith('SELECT') || trimmed.startsWith('WITH')) {
      const result = await sql.query(sqlText, params);
      return {
        rows: result.rows || [],
        rowCount: result.rows?.length || 0,
      };
    } else {
      const result = await sql.query(sqlText, params);
      return {
        rows: result.rows || [{ id: null }],
        rowCount: result.rowCount || 1,
        lastId: result.rows?.[0]?.id || null,
      };
    }
  } catch (err: any) {
    console.error(`Database query error: ${err.message}`);
    throw err;
  }
}

/**
 * Get a single row
 */
export async function getOne<T = any>(sqlText: string, params: any[] = []): Promise<T | null> {
  try {
    const result = await sql.query(sqlText, params);
    return (result.rows?.[0] as T) || null;
  } catch (err: any) {
    console.error(`Database getOne error: ${err.message}`);
    throw err;
  }
}

/**
 * Get multiple rows
 */
export async function getMany<T = any>(sqlText: string, params: any[] = []): Promise<T[]> {
  try {
    const result = await sql.query(sqlText, params);
    return (result.rows as T[]) || [];
  } catch (err: any) {
    console.error(`Database getMany error: ${err.message}`);
    throw err;
  }
}

/**
 * Initialize database (no-op for Vercel Postgres, connection is automatic)
 */
export async function initializeDb() {
  console.log('Using Vercel Postgres (serverless-ready)');
  return sql;
}

/**
 * Get database instance
 */
export async function getDb() {
  return sql;
}
