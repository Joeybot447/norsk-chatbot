/**
 * In-Memory Cache (MVP alternative to Redis)
 * Used for rate limiting and simple caching
 */

import { logger } from './logger.js';

class InMemoryCache {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
  }

  /**
   * Set a key-value pair with optional expiration
   */
  set(key, value, expirationSeconds = null) {
    // Cancel existing timer if any
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    this.cache.set(key, value);

    // Set expiration timer
    if (expirationSeconds) {
      const timer = setTimeout(() => {
        this.cache.delete(key);
        this.timers.delete(key);
      }, expirationSeconds * 1000);

      this.timers.set(key, timer);
    }
  }

  /**
   * Get a value
   */
  get(key) {
    return this.cache.get(key) ?? null;
  }

  /**
   * Increment a value
   */
  incr(key) {
    const current = this.cache.get(key) ?? 0;
    const newValue = current + 1;
    this.cache.set(key, newValue);
    return newValue;
  }

  /**
   * Delete a key
   */
  del(key) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
    this.cache.delete(key);
  }

  /**
   * Set expiration on existing key
   */
  expire(key, seconds) {
    if (!this.cache.has(key)) {
      return false;
    }

    // Cancel existing timer if any
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    // Set new expiration
    const timer = setTimeout(() => {
      this.cache.delete(key);
      this.timers.delete(key);
    }, seconds * 1000);

    this.timers.set(key, timer);
    return true;
  }

  /**
   * Clear all cache
   */
  clear() {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.cache.clear();
    this.timers.clear();
  }

  /**
   * Mock Redis client API for compatibility
   */
  async connect() {
    return true;
  }

  async ping() {
    return 'PONG';
  }
}

const cacheInstance = new InMemoryCache();

/**
 * Mock Redis client with async methods for backward compatibility
 */
export const redisClient = {
  get: async (key) => cacheInstance.get(key),
  set: async (key, value, options) => {
    const expirationSeconds = options?.EX;
    cacheInstance.set(key, value, expirationSeconds);
    return 'OK';
  },
  incr: async (key) => cacheInstance.incr(key),
  expire: async (key, seconds) => cacheInstance.expire(key, seconds),
  del: async (key) => {
    cacheInstance.del(key);
    return 1;
  },
  connect: async () => true,
  ping: async () => 'PONG',
  disconnect: async () => true,
  on: () => {},
};

export default redisClient;
