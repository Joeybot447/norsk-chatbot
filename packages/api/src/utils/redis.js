/**
 * Redis Client
 * Used for caching, sessions, and rate limiting
 */

import redis from 'redis';
import dotenv from 'dotenv';
import { logger } from './logger.js';

dotenv.config();

export const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (err) => {
  logger.error(`Redis error: ${err.message}`);
});

redisClient.on('connect', () => {
  logger.info('Connected to Redis');
});

// Connect
await redisClient.connect();

export default redisClient;
