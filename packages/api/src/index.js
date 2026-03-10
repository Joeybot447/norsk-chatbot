/**
 * NorskBot API Server
 * Main entry point for the backend API
 */

import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load .env from project root (two levels up from packages/api/src)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '../../..');
dotenv.config({ path: path.join(projectRoot, '.env') });

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { logger, requestLoggerMiddleware } from './utils/logger.js';
import config, { validateConfig } from './config.js';
import { initializeDb, getOne } from './db/client.js';
import { initializeDatabase, seedDemoData } from './db/init.js';
import { authMiddleware } from './middleware/auth.js';
import { rateLimitMiddleware, generalRateLimiter } from './middleware/rateLimit.js';
import { tenantMiddleware } from './middleware/tenant.js';
import chatRouter from './routes/chat.js';
import widgetRouter from './routes/widget.js';
import ingestRouter from './routes/ingest.js';
import healthRouter from './routes/health.js';
import debugRouter from './routes/debug.js';
import authRouter from './routes/auth.js';
import dashboardRouter from './routes/dashboard.js';

const app = express();

// ===== SECURITY =====

// Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for widget embedding flexibility
  crossOriginEmbedderPolicy: false,
}));

// CORS — allow cross-origin for widget embedding
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Site-Id', 'X-Session-Id', 'X-API-Key', 'X-Request-Id'],
  exposedHeaders: ['X-Request-Id', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset', 'X-Processing'],
  credentials: false,
}));

// ===== MIDDLEWARE =====

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request ID + structured logging
app.use(requestLoggerMiddleware);

// Serve static files with cache headers
app.use(express.static(config.publicDir, {
  maxAge: config.isDev ? 0 : '1h',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
      // Widget JS gets shorter cache so updates propagate
      if (filePath.includes('widget')) {
        res.setHeader('Cache-Control', 'public, max-age=300'); // 5 min
      }
    }
  },
}));

// Serve dashboard and landing pages
app.use('/dashboard', express.static(config.dashboardDir, { maxAge: config.isDev ? 0 : '1h' }));
app.use('/landing', express.static(config.landingDir, { maxAge: config.isDev ? 0 : '1h' }));

// ===== ROUTES =====

// Health check (no auth required)
app.use('/health', healthRouter);

// Debug routes (dev only)
if (config.isDev) {
  app.use('/debug', debugRouter);
}

// Auth routes (public)
app.use('/api/auth', generalRateLimiter, authRouter);

// Demo info endpoint (public)
app.get('/api/demo-info', (req, res) => {
  try {
    const customer = getOne('SELECT id FROM customers WHERE email = ?', ['fjordtech@demo.no']);
    if (!customer) {
      return res.status(404).json({ error: 'Demo site not found' });
    }
    const site = getOne('SELECT id, name FROM sites WHERE customer_id = ?', [customer.id]);
    if (!site) {
      return res.status(404).json({ error: 'Demo site not found' });
    }
    res.json({ siteId: site.id, siteName: site.name });
  } catch (err) {
    logger.error(`Demo info error: ${err.message}`);
    res.status(500).json({ error: 'Failed to get demo info' });
  }
});

// Public API: GET /api/sites (requires JWT auth)
// PUT /api/sites/:id (requires JWT auth)
// These mirror dashboard routes for API consumers
app.use('/api/dashboard', dashboardRouter);

// Chat API (public, rate-limited, site_id in headers for multi-tenancy)
app.use('/v1/chat', rateLimitMiddleware, tenantMiddleware, chatRouter);

// Widget config (public)
app.use('/v1/widget', widgetRouter);

// Ingest API (requires API key / auth)
app.use('/v1/ingest', authMiddleware, ingestRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  logger.error({
    reqId: req.requestId,
    error: err.message,
    path: req.path,
  });

  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validation error',
      details: err.errors,
    });
  }

  // Never leak stack traces or internal details
  res.status(err.status || 500).json({
    error: config.isDev ? err.message : 'Internal server error',
  });
});

// ===== DATABASE & SERVER STARTUP =====

async function startServer() {
  try {
    // Validate configuration
    const { warnings, errors } = validateConfig();
    for (const w of warnings) {
      logger.warn(`⚠️  ${w}`);
    }
    for (const e of errors) {
      logger.error(`❌ ${e}`);
    }

    logger.info('Initializing database...');
    initializeDb();
    await initializeDatabase();

    logger.info('Seeding demo data...');
    await seedDemoData();

    app.listen(config.port, () => {
      logger.info(`🚀 NorskBot API running on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`Visit demo: http://localhost:${config.port}/demo.html`);
    });
  } catch (err) {
    logger.error(`Failed to start server: ${err.message}`);
    process.exit(1);
  }
}

startServer();

export default app;
