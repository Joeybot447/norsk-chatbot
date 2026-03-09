/**
 * NorskBot API Server
 * Main entry point for the backend API
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { logger } from './utils/logger.js';
import { dbClient } from './db/client.js';
import { authMiddleware } from './middleware/auth.js';
import { rateLimitMiddleware } from './middleware/rateLimit.js';
import { tenantMiddleware } from './middleware/tenant.js';
import chatRouter from './routes/chat.js';
import widgetRouter from './routes/widget.js';
import ingestRouter from './routes/ingest.js';
import healthRouter from './routes/health.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ===== MIDDLEWARE =====

// CORS configuration for widget embedding
app.use(cors({
  origin: '*', // In production: restrict to customer domains
  credentials: false,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

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

  // Zod validation errors
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validation error',
      details: err.errors,
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// ===== DATABASE & SERVER STARTUP =====

async function startServer() {
  try {
    // Test database connection
    await dbClient.query('SELECT 1');
    logger.info('Database connection successful');

    // Start server
    app.listen(PORT, () => {
      logger.info(`NorskBot API running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Database: ${process.env.DATABASE_URL?.split('@')[1] || 'unknown'}`);
    });
  } catch (err) {
    logger.error(`Failed to start server: ${err.message}`);
    process.exit(1);
  }
}

startServer();

export default app;
