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
import { logger } from './utils/logger.js';
import { initializeDb, getOne } from './db/client.js';
import { initializeDatabase, seedDemoData } from './db/init.js';
import { authMiddleware } from './middleware/auth.js';
import { rateLimitMiddleware } from './middleware/rateLimit.js';
import { tenantMiddleware } from './middleware/tenant.js';
import chatRouter from './routes/chat.js';
import widgetRouter from './routes/widget.js';
import ingestRouter from './routes/ingest.js';
import healthRouter from './routes/health.js';
import debugRouter from './routes/debug.js';
import authRouter from './routes/auth.js';
import dashboardRouter from './routes/dashboard.js';

const app = express();
const PORT = process.env.PORT || 3000;

// ===== MIDDLEWARE =====

app.use(cors({
  origin: '*',
  credentials: false,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve static files from public directory (absolute path)
app.use(express.static(path.join(__dirname, '../public')));

// Serve dashboard and landing pages
app.use('/dashboard', express.static(path.join(__dirname, '../../../dashboard')));
app.use('/landing', express.static(path.join(__dirname, '../../../landing')));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
    });
  });
  next();
});

// ===== ROUTES =====

// Health check (no auth required)
app.use('/health', healthRouter);

// Debug routes (MVP only)
app.use('/debug', debugRouter);

// Auth routes (public)
app.use('/api/auth', authRouter);

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

// Dashboard routes (JWT auth required)
app.use('/api/dashboard', dashboardRouter);

// Chat API (public, site_id in headers for multi-tenancy)
app.use('/v1/chat', rateLimitMiddleware, tenantMiddleware, chatRouter);

// Widget config (public)
app.use('/v1/widget', widgetRouter);

// Ingest API (requires API key)
app.use('/v1/ingest', authMiddleware, ingestRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error({
    error: err.message,
    stack: err.stack,
    path: req.path,
  });

  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validation error',
      details: err.errors,
    });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// ===== DATABASE & SERVER STARTUP =====

async function startServer() {
  try {
    logger.info('Initializing database...');
    initializeDb();
    await initializeDatabase();

    logger.info('Seeding demo data...');
    await seedDemoData();

    app.listen(PORT, () => {
      logger.info(`NorskBot API running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Visit demo: http://localhost:${PORT}/demo.html`);
    });
  } catch (err) {
    logger.error(`Failed to start server: ${err.message}`);
    process.exit(1);
  }
}

startServer();

export default app;
