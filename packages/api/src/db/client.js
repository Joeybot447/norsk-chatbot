/**
 * PostgreSQL Database Client
 * Handles all database connections and queries
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';

dotenv.config();

const { Pool } = pg;

const dbClient = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Log connection errors
dbClient.on('error', (err) => {
  logger.error(`Unexpected error on idle client: ${err.message}`);
});

// Export client
export { dbClient };

/**
 * Execute a query
 * @param {string} sql - SQL query
 * @param {array} params - Query parameters
 * @returns {Promise<object>} Query result
 */
export async function query(sql, params = []) {
  try {
    const result = await dbClient.query(sql, params);
    return result;
  } catch (err) {
    logger.error(`Database query error: ${err.message}`);
    throw err;
  }
}

/**
 * Get a single row
 * @param {string} sql - SQL query
 * @param {array} params - Query parameters
 * @returns {Promise<object>} First row or null
 */
export async function getOne(sql, params = []) {
  const result = await query(sql, params);
  return result.rows[0] || null;
}

/**
 * Get multiple rows
 * @param {string} sql - SQL query
 * @param {array} params - Query parameters
 * @returns {Promise<array>} Array of rows
 */
export async function getMany(sql, params = []) {
  const result = await query(sql, params);
  return result.rows;
}

/**
 * Execute a transaction
 * @param {function} callback - Function that runs inside transaction
 * @returns {Promise} Transaction result
 */
export async function transaction(callback) {
  const client = await dbClient.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error(`Transaction error: ${err.message}`);
    throw err;
  } finally {
    client.release();
  }
}

export default dbClient;
