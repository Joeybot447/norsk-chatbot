/**
 * Centralized Configuration for Next.js
 * All environment variables and defaults in one place
 */

import path from 'path';
import os from 'os';

const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

// Use system temp or current directory for database
const dataDir = process.env.DATA_DIR || path.join(process.cwd(), 'data');

export const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev,
  
  // Database
  databaseUrl: process.env.DATABASE_URL || path.join(dataDir, 'norskbot.db'),
  dataDir,

  // Auth
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
  jwtExpiry: '7d',

  // API
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',

  // Rate Limiting
  chatRateLimit: {
    windowSeconds: 60,
    maxRequests: 30,
  },
  globalRateLimit: {
    windowSeconds: 60,
    maxRequests: 100,
  },

  // Ingest
  urlFetchTimeout: 10000,
  maxUploadSize: 10 * 1024 * 1024,

  // Startup time
  startedAt: Date.now(),
};

/**
 * Validate required configuration at startup
 */
export function validateConfig() {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (!process.env.ANTHROPIC_API_KEY) {
    errors.push('ANTHROPIC_API_KEY is not set — chat will not work');
  }

  if (config.jwtSecret === 'dev-secret-key-change-in-production') {
    warnings.push('JWT_SECRET is using default value — change in production!');
  }

  return { warnings, errors };
}

export default config;
