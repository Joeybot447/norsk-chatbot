/**
 * Health Check Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import { getDb, getOne } from '../../../packages/api/src/db/client.js';
import { logger } from '../../../packages/api/src/utils/logger.js';
import config from '../../../packages/api/src/config.js';

/**
 * GET /api/health
 */
export function GET(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname;

    // GET /api/health (root)
    if (pathname === '/api/health' || pathname.endsWith('/health')) {
      return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
      });
    }

    // GET /api/health/ready
    if (pathname.endsWith('/ready')) {
      try {
        const db = getDb();
        const result = db.prepare('SELECT 1 as ok').get() as { ok: number } | undefined;
        if (result && result.ok === 1) {
          return NextResponse.json({
            status: 'ready',
            checks: { database: 'ok' },
          });
        }
        return NextResponse.json(
          { status: 'not ready', checks: { database: 'failed' } },
          { status: 503 }
        );
      } catch (err) {
        const error = err as Error;
        logger.error(`Health check error: ${error.message}`);
        return NextResponse.json(
          { status: 'error', error: error.message },
          { status: 503 }
        );
      }
    }

    // GET /api/health/detailed
    if (pathname.endsWith('/detailed')) {
      try {
        const db = getDb();

        // DB file size
        let dbSizeBytes = 0;
        try {
          const dbPath = config.databaseUrl;
          const stats = fs.statSync(dbPath);
          dbSizeBytes = stats.size;
        } catch (_) {}

        // Counts
        const sitesCount = (db.prepare('SELECT COUNT(*) as count FROM sites').get() as { count: number })?.count || 0;
        const knowledgeChunksCount = (db.prepare('SELECT COUNT(*) as count FROM knowledge_chunks').get() as { count: number })?.count || 0;
        const legacyChunksCount = (db.prepare('SELECT COUNT(*) as count FROM chunks').get() as { count: number })?.count || 0;
        const conversationsCount = (db.prepare('SELECT COUNT(*) as count FROM conversations').get() as { count: number })?.count || 0;
        const messagesCount = (db.prepare('SELECT COUNT(*) as count FROM messages').get() as { count: number })?.count || 0;
        const sourcesCount = (db.prepare('SELECT COUNT(*) as count FROM knowledge_sources').get() as { count: number })?.count || 0;

        const memUsage = process.memoryUsage();

        return NextResponse.json({
          status: 'ok',
          uptime: Math.floor(process.uptime()),
          startedAt: new Date(config.startedAt).toISOString(),
          database: {
            sizeBytes: dbSizeBytes,
            sizeMB: (dbSizeBytes / (1024 * 1024)).toFixed(2),
            journalMode: db.pragma('journal_mode', { simple: true }),
          },
          counts: {
            sites: sitesCount,
            knowledgeSources: sourcesCount,
            knowledgeChunks: knowledgeChunksCount,
            legacyChunks: legacyChunksCount,
            totalChunks: knowledgeChunksCount + legacyChunksCount,
            conversations: conversationsCount,
            messages: messagesCount,
          },
          memory: {
            rss: `${(memUsage.rss / 1024 / 1024).toFixed(1)}MB`,
            heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(1)}MB`,
            heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(1)}MB`,
          },
          node: process.version,
        });
      } catch (err) {
        const error = err as Error;
        logger.error(`Detailed health check error: ${error.message}`);
        return NextResponse.json(
          { status: 'error', error: error.message },
          { status: 500 }
        );
      }
    }

    // GET /api/health/demo
    if (pathname.endsWith('/demo')) {
      try {
        const customer = getOne('SELECT id FROM customers WHERE email = ?', ['fjordtech@demo.no']);
        if (!customer) {
          return NextResponse.json(
            { error: 'Demo site not found' },
            { status: 404 }
          );
        }
        const site = getOne('SELECT id, name FROM sites WHERE customer_id = ?', [customer.id]);
        if (!site) {
          return NextResponse.json(
            { error: 'Demo site not found' },
            { status: 404 }
          );
        }
        return NextResponse.json({
          siteId: site.id,
          siteName: site.name,
          demoUrl: `http://${request.headers.get('host')}/demo.html?siteId=${site.id}`,
        });
      } catch (err) {
        const error = err as Error;
        logger.error(`Demo site error: ${error.message}`);
        return NextResponse.json(
          { error: 'Failed to get demo site ID' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Not found' },
      { status: 404 }
    );
  } catch (err) {
    const error = err as Error;
    logger.error(`Health check error: ${error.message}`);
    return NextResponse.json(
      { status: 'error', error: error.message },
      { status: 500 }
    );
  }
}
