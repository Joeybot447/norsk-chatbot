/**
 * Health Check Routes
 * Supports: /api/health (basic), /api/health/ready (db check), /api/health/detailed (stats)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '../../../lib/supabase/client';
import { logger } from '../../../lib/utils/logger.js';

/**
 * GET /api/health
 * Basic health check - always returns 200
 */
export async function GET(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname;

    // GET /api/health (root)
    if (pathname === '/api/health' || pathname.endsWith('/health')) {
      return NextResponse.json(
        {
          status: 'ok',
          timestamp: new Date().toISOString(),
          uptime: Math.floor(process.uptime()),
        },
        { status: 200 }
      );
    }

    // GET /api/health/ready - checks database connectivity
    if (pathname.endsWith('/ready')) {
      try {
        // Test database connectivity with a simple query
        const result = await getOne('SELECT 1 as ok');
        if (result && (result.ok === 1 || result.ok === '1')) {
          return NextResponse.json(
            {
              status: 'ready',
              checks: { database: 'ok' },
              timestamp: new Date().toISOString(),
            },
            { status: 200 }
          );
        }
        return NextResponse.json(
          { status: 'not ready', checks: { database: 'failed' } },
          { status: 503 }
        );
      } catch (err) {
        const error = err as Error;
        logger.error(`Health check error: ${error.message}`);
        return NextResponse.json(
          { status: 'error', error: error.message, checks: { database: 'error' } },
          { status: 503 }
        );
      }
    }

    // GET /api/health/detailed - comprehensive stats
    if (pathname.endsWith('/detailed')) {
      try {
        // Test database connectivity
        await getOne('SELECT 1 as ok');

        // Get counts safely
        let sitesCount = 0;
        let knowledgeChunksCount = 0;
        let legacyChunksCount = 0;
        let conversationsCount = 0;
        let messagesCount = 0;
        let sourcesCount = 0;

        try {
          const result1 = await getOne('SELECT COUNT(*) as count FROM sites');
          sitesCount = result1?.count || 0;
        } catch (_) {
          logger.warn('Failed to count sites');
        }

        try {
          const result2 = await getOne('SELECT COUNT(*) as count FROM knowledge_chunks');
          knowledgeChunksCount = result2?.count || 0;
        } catch (_) {
          logger.warn('Failed to count knowledge_chunks');
        }

        try {
          const result3 = await getOne('SELECT COUNT(*) as count FROM chunks');
          legacyChunksCount = result3?.count || 0;
        } catch (_) {
          logger.warn('Failed to count legacy chunks');
        }

        try {
          const result4 = await getOne('SELECT COUNT(*) as count FROM conversations');
          conversationsCount = result4?.count || 0;
        } catch (_) {
          logger.warn('Failed to count conversations');
        }

        try {
          const result5 = await getOne('SELECT COUNT(*) as count FROM messages');
          messagesCount = result5?.count || 0;
        } catch (_) {
          logger.warn('Failed to count messages');
        }

        try {
          const result6 = await getOne('SELECT COUNT(*) as count FROM knowledge_sources');
          sourcesCount = result6?.count || 0;
        } catch (_) {
          logger.warn('Failed to count knowledge_sources');
        }

        const memUsage = process.memoryUsage();

        return NextResponse.json(
          {
            status: 'ok',
            uptime: Math.floor(process.uptime()),
            timestamp: new Date().toISOString(),
            database: {
              type: 'Vercel Postgres',
              status: 'connected',
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
          },
          { status: 200 }
        );
      } catch (err) {
        const error = err as Error;
        logger.error(`Detailed health check error: ${error.message}`);
        return NextResponse.json(
          { status: 'error', error: error.message },
          { status: 500 }
        );
      }
    }

    // GET /api/health/demo - get demo site info
    if (pathname.endsWith('/demo')) {
      try {
        const customer = await getOne('SELECT id FROM customers WHERE email = ?', ['fjordtech@demo.no']);
        if (!customer) {
          return NextResponse.json(
            { error: 'Demo site not found' },
            { status: 404 }
          );
        }
        const site = await getOne('SELECT id, name FROM sites WHERE customer_id = ?', [customer.id]);
        if (!site) {
          return NextResponse.json(
            { error: 'Demo site not found' },
            { status: 404 }
          );
        }
        return NextResponse.json({
          siteId: site.id,
          siteName: site.name,
          demoUrl: `${request.nextUrl.protocol}//${request.headers.get('host')}/demo.html?siteId=${site.id}`,
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
