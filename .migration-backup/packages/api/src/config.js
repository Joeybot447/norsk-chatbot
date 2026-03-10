/**
 * Centralized Configuration
 * All environment variables and defaults in one place
 */

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',

  // Database
  databaseUrl: process.env.DATABASE_URL || path.join(__dirname, '../data/norskbot.db'),
  dataDir: path.join(__dirname, '../data'),

  // Auth
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
  jwtExpiry: '7d',

  // API
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  apiUrl: process.env.API_URL || null, // Resolved at runtime

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
  urlFetchTimeout: 10000, // 10 seconds
  maxUploadSize: 10 * 1024 * 1024, // 10MB

  // Paths
  publicDir: path.join(__dirname, '../public'),
  uploadsDir: path.join(__dirname, '../uploads'),
  dashboardDir: path.join(__dirname, '../../dashboard'),
  landingDir: path.join(__dirname, '../../landing'),

  // Startup time (for uptime calc)
  startedAt: Date.now(),
};

/**
 * Validate required configuration at startup
 */
export function validateConfig() {
  const warnings = [];
  const errors = [];

  if (!process.env.ANTHROPIC_API_KEY) {
    errors.push('ANTHROPIC_API_KEY is not set — chat will not work');
  }

  if (config.jwtSecret === 'dev-secret-key-change-in-production') {
    warnings.push('JWT_SECRET is using default value — change in production!');
  }

  if (!process.env.PORT) {
    warnings.push(`PORT not set, defaulting to ${config.port}`);
  }

  return { warnings, errors };
}

export default config;
