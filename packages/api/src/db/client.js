/**
 * SQLite Database Client (MVP)
 * Handles all database connections and queries
 * Uses the built-in sqlite3 module
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DATABASE_URL || path.join(__dirname, '../../norsk-chatbot.db');

let dbInstance = null;

/**
 * Simple in-memory SQLite implementation
 * Since better-sqlite3 requires compilation, we'll use a simpler approach
 */
class SimpleSQLiteDB {
  constructor() {
    this.data = {
      users: [],
      customers: [],
      sites: [],
      documents: [],
      chunks: [],
      conversations: [],
      messages: [],
      guardrail_rules: [],
      sources: [],
    };
    this.nextIds = {
      users: 1,
      customers: 1,
      sites: 1,
      documents: 1,
      chunks: 1,
      conversations: 1,
      messages: 1,
      sources: 1,
    };
  }

  exec(sql) {
    // No-op for schema creation
    return null;
  }

  prepare(sql) {
    const self = this;
    return {
      all: (...params) => self.executeSelect(sql, params),
      run: (...params) => self.executeInsertUpdateDelete(sql, params),
      get: (...params) => {
        const results = self.executeSelect(sql, params);
        return results[0] || null;
      },
    };
  }

  pragma(pragmaStr) {
    // Ignore pragma for in-memory DB
    return null;
  }

  executeSelect(sql, params) {
    try {
      // Very basic parsing for SELECT statements
      const upperSql = sql.toUpperCase();

      // Handle COUNT queries
      if (upperSql.includes('COUNT(*)')) {
        if (upperSql.includes('FROM CONVERSATIONS')) {
          let results = this.data.conversations;
          if (sql.includes('WHERE')) {
            if (sql.includes('site_id')) {
              results = results.filter((c) => c.site_id === params[0]);
            }
          }
          return [{ count: results.length }];
        } else if (upperSql.includes('FROM DOCUMENTS')) {
          let results = this.data.documents;
          if (sql.includes('WHERE')) {
            if (sql.includes('site_id')) {
              results = results.filter((d) => d.site_id === params[0]);
            }
          }
          return [{ count: results.length }];
        } else if (upperSql.includes('FROM SITES')) {
          let results = this.data.sites;
          if (sql.includes('WHERE')) {
            if (sql.includes('user_id')) {
              results = results.filter((s) => s.user_id === params[0]);
            }
          }
          return [{ count: results.length }];
        }
      }

      if (upperSql.includes('FROM USERS')) {
        let results = this.data.users;
        if (sql.includes('WHERE')) {
          if (sql.includes('email')) {
            results = results.filter((u) => u.email === params[0]);
          } else if (sql.includes('id')) {
            results = results.filter((u) => u.id === params[0]);
          } else if (sql.includes('api_key')) {
            results = results.filter((u) => u.api_key === params[0]);
          }
        }
        return results;
      } else if (upperSql.includes('FROM SOURCES')) {
        let results = this.data.sources;
        if (sql.includes('WHERE')) {
          if (sql.includes('site_id')) {
            results = results.filter((s) => s.site_id === params[0]);
          } else if (sql.includes('id')) {
            results = results.filter((s) => s.id === params[0]);
          }
        }
        if (sql.includes('ORDER BY')) {
          results = results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }
        return results;
      } else if (upperSql.includes('FROM CUSTOMERS')) {
        let results = this.data.customers;
        if (sql.includes('WHERE')) {
          // Basic WHERE clause handling
          if (sql.includes('email')) {
            results = results.filter((c) => c.email === params[0]);
          } else if (sql.includes('id')) {
            results = results.filter((c) => c.id === params[0]);
          }
        }
        return results;
      } else if (upperSql.includes('FROM SITES')) {
        let results = this.data.sites;
        if (sql.includes('WHERE')) {
          // More specific WHERE clause checks
          if (sql.includes('WHERE api_key')) {
            results = results.filter((s) => s.api_key === params[0]);
          } else if (sql.includes('WHERE customer_id')) {
            results = results.filter((s) => s.customer_id === params[0]);
          } else if (sql.includes('WHERE id') && sql.includes('AND user_id')) {
            results = results.filter((s) => s.id === params[0] && s.user_id === params[1]);
          } else if (sql.includes('WHERE user_id')) {
            results = results.filter((s) => s.user_id === params[0]);
          } else if (sql.includes('WHERE id')) {
            results = results.filter((s) => s.id === params[0]);
          }
        }
        if (sql.includes('ORDER BY')) {
          results = results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }
        return results;
      } else if (upperSql.includes('FROM CHUNKS')) {
        let results = this.data.chunks;
        if (sql.includes('WHERE')) {
          if (sql.includes('site_id')) {
            results = results.filter((c) => c.site_id === params[0]);
          } else if (sql.includes('document_id')) {
            results = results.filter((c) => c.document_id === params[0]);
          }
        }
        return results;
      } else if (upperSql.includes('FROM DOCUMENTS')) {
        let results = this.data.documents;
        if (sql.includes('WHERE')) {
          if (sql.includes('site_id')) {
            results = results.filter((d) => d.site_id === params[0]);
          } else if (sql.includes('id')) {
            results = results.filter((d) => d.id === params[0]);
          }
        }
        if (sql.includes('ORDER BY')) {
          results = results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }
        return results;
      } else if (upperSql.includes('FROM CONVERSATIONS')) {
        let results = this.data.conversations;
        if (sql.includes('WHERE')) {
          if (sql.includes('site_id') && sql.includes('session_id')) {
            results = results.filter((c) => c.site_id === params[0] && c.session_id === params[1]);
          } else if (sql.includes('site_id')) {
            results = results.filter((c) => c.site_id === params[0]);
          } else if (sql.includes('id')) {
            results = results.filter((c) => c.id === params[0]);
          }
        }
        return results;
      } else if (upperSql.includes('FROM MESSAGES')) {
        let results = this.data.messages;
        if (sql.includes('WHERE')) {
          if (sql.includes('conversation_id')) {
            results = results.filter((m) => m.conversation_id === params[0]);
          } else if (sql.includes('site_id') && sql.includes('id')) {
            results = results.filter((m) => m.site_id === params[1] && m.id === params[0]);
          }
        }
        if (sql.includes('ORDER BY')) {
          results = results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }
        return results;
      }

      return [];
    } catch (err) {
      logger.error(`Select error: ${err.message}`);
      return [];
    }
  }

  executeInsertUpdateDelete(sql, params) {
    try {
      const upperSql = sql.toUpperCase();

      if (upperSql.includes('INSERT INTO USERS')) {
        const id = params[0];
        const user = {
          id,
          email: params[1],
          password_hash: params[2],
          company_name: params[3] || null,
          api_key: params[4] || null,
          plan: params[5] || 'starter',
          status: params[6] || 'active',
          metadata: params[7] || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        this.data.users.push(user);
        return { lastInsertRowid: id, changes: 1 };
      }

      if (upperSql.includes('INSERT INTO SOURCES')) {
        const id = params[0];
        const source = {
          id,
          site_id: params[1],
          type: params[2],
          name: params[3] || null,
          url: params[4] || null,
          content: params[5] || null,
          status: params[6] || 'processing',
          processed_at: null,
          metadata: params[7] || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        this.data.sources.push(source);
        return { lastInsertRowid: id, changes: 1 };
      }

      if (upperSql.includes('INSERT INTO CUSTOMERS')) {
        const id = params[0];
        const customer = {
          id,
          name: params[1],
          email: params[2],
          plan: params[3],
          status: params[4],
          metadata: params[5] || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        this.data.customers.push(customer);
        return { lastInsertRowid: id, changes: 1 };
      }

      if (upperSql.includes('INSERT INTO SITES')) {
        const id = params[0];
        const site = {
          id,
          user_id: params[1] || null,
          customer_id: params[2] || null,
          domain: params[3],
          name: params[4],
          api_key: params[5],
          widget_config: params[6],
          status: params[7] || 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        this.data.sites.push(site);
        return { lastInsertRowid: id, changes: 1 };
      }

      if (upperSql.includes('INSERT INTO DOCUMENTS')) {
        const id = params[0];
        const doc = {
          id,
          site_id: params[1],
          type: params[2],
          title: params[4],
          content: params[5],
          source_url: params[3] || null,
          metadata: params[6] || null,
          chunks_count: 0,
          status: params[7],
          last_crawled: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        this.data.documents.push(doc);
        return { lastInsertRowid: id, changes: 1 };
      }

      if (upperSql.includes('INSERT INTO CHUNKS')) {
        const id = params[0];
        const chunk = {
          id,
          document_id: params[1],
          site_id: params[2],
          chunk_index: params[3],
          content: params[4],
          tokens: params[5],
          metadata: params[6] || null,
          created_at: new Date().toISOString(),
        };
        this.data.chunks.push(chunk);
        return { lastInsertRowid: id, changes: 1 };
      }

      if (upperSql.includes('INSERT INTO CONVERSATIONS')) {
        const id = params[0];
        const conversation = {
          id,
          site_id: params[1],
          session_id: params[2],
          visitor_name: params[3],
          visitor_email: params[4],
          visitor_company: params[5],
          ip_address: params[6],
          user_agent: params[7],
          started_at: new Date().toISOString(),
          ended_at: null,
          message_count: 0,
          metadata: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        this.data.conversations.push(conversation);
        return { lastInsertRowid: id, changes: 1 };
      }

      if (upperSql.includes('INSERT INTO MESSAGES')) {
        const id = params[0];
        const message = {
          id,
          conversation_id: params[1],
          site_id: params[2],
          role: params[3],
          content: params[4],
          tokens_used: params[5],
          confidence_score: params[6] || null,
          sources: params[7] || null,
          feedback: null,
          metadata: null,
          created_at: new Date().toISOString(),
        };
        this.data.messages.push(message);
        return { lastInsertRowid: id, changes: 1 };
      }

      if (upperSql.includes('UPDATE CONVERSATIONS SET message_count')) {
        const id = params[1];
        const conversation = this.data.conversations.find((c) => c.id === id);
        if (conversation) {
          conversation.message_count += 2;
          conversation.updated_at = new Date().toISOString();
          return { changes: 1 };
        }
        return { changes: 0 };
      }

      if (upperSql.includes('UPDATE DOCUMENTS SET chunks_count')) {
        const id = params[1];
        const doc = this.data.documents.find((d) => d.id === id);
        if (doc) {
          doc.chunks_count = params[0];
          doc.updated_at = new Date().toISOString();
          return { changes: 1 };
        }
        return { changes: 0 };
      }

      if (upperSql.includes('UPDATE SITES SET widget_config')) {
        const id = params[1];
        const site = this.data.sites.find((s) => s.id === id);
        if (site) {
          site.widget_config = params[0];
          site.updated_at = new Date().toISOString();
          return { changes: 1 };
        }
        return { changes: 0 };
      }

      if (upperSql.includes('UPDATE MESSAGES SET feedback')) {
        const messageId = params[1];
        const siteId = params[2];
        const message = this.data.messages.find((m) => m.id === messageId && m.site_id === siteId);
        if (message) {
          message.feedback = params[0];
          return { changes: 1 };
        }
        return { changes: 0 };
      }

      if (upperSql.includes('DELETE FROM SOURCES')) {
        const id = params[0];
        const idx = this.data.sources.findIndex((s) => s.id === id);
        if (idx >= 0) {
          this.data.sources.splice(idx, 1);
          return { changes: 1 };
        }
        return { changes: 0 };
      }

      return { changes: 0 };
    } catch (err) {
      logger.error(`Insert/Update error: ${err.message}`);
      return { changes: 0 };
    }
  }

  generateId(table) {
    const id = this.nextIds[table] || 1;
    this.nextIds[table] = id + 1;
    return `${table[0]}${id}`;
  }
}

/**
 * Initialize database
 */
export function initializeDb() {
  if (dbInstance) return dbInstance;

  try {
    dbInstance = new SimpleSQLiteDB();
    logger.info('In-memory database initialized (MVP mode)');
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
 * Execute a query (with prepared statement support)
 * @param {string} sql - SQL query
 * @param {array} params - Query parameters
 * @returns {object} Query result with rows
 */
export function query(sql, params = []) {
  try {
    const db = getDb();
    const stmt = db.prepare(sql);

    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      const rows = stmt.all(...params);
      return {
        rows,
        rowCount: rows.length,
      };
    } else if (sql.trim().toUpperCase().startsWith('INSERT')) {
      const info = stmt.run(...params);
      return {
        rows: [{ id: info.lastInsertRowid }],
        rowCount: info.changes,
        lastId: info.lastInsertRowid,
      };
    } else {
      const info = stmt.run(...params);
      return {
        rows: [],
        rowCount: info.changes,
      };
    }
  } catch (err) {
    logger.error(`Database query error: ${err.message}`);
    throw err;
  }
}

/**
 * Get a single row
 * @param {string} sql - SQL query
 * @param {array} params - Query parameters
 * @returns {object|null} First row or null
 */
export function getOne(sql, params = []) {
  const result = query(sql, params);
  return result.rows[0] || null;
}

/**
 * Get multiple rows
 * @param {string} sql - SQL query
 * @param {array} params - Query parameters
 * @returns {array} Array of rows
 */
export function getMany(sql, params = []) {
  const result = query(sql, params);
  return result.rows;
}

/**
 * Get all rows (alias for getMany)
 * @param {string} sql - SQL query
 * @param {array} params - Query parameters
 * @returns {array} Array of rows
 */
export function getAll(sql, params = []) {
  const result = query(sql, params);
  return result.rows;
}

/**
 * Execute a transaction
 * @param {function} callback - Function that runs inside transaction
 * @returns {Promise} Transaction result
 */
export async function transaction(callback) {
  const db = getDb();
  try {
    // Simple transaction support
    const result = await callback(db);
    return result;
  } catch (err) {
    logger.error(`Transaction error: ${err.message}`);
    throw err;
  }
}

// Create a mock dbClient object for backward compatibility
export const dbClient = {
  query: (sql, params = []) => {
    try {
      const db = getDb();
      const stmt = db.prepare(sql);

      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        const rows = stmt.all(...params);
        return Promise.resolve({
          rows,
          rowCount: rows.length,
        });
      } else if (sql.trim().toUpperCase().startsWith('INSERT')) {
        const info = stmt.run(...params);
        return Promise.resolve({
          rows: [{ id: info.lastInsertRowid }],
          rowCount: info.changes,
          lastId: info.lastInsertRowid,
        });
      } else {
        const info = stmt.run(...params);
        return Promise.resolve({
          rows: [],
          rowCount: info.changes,
        });
      }
    } catch (err) {
      logger.error(`Database query error: ${err.message}`);
      return Promise.reject(err);
    }
  },
};

export default dbInstance;
