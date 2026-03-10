/**
 * Health Check Routes
 * GET /api/health - Basic health check
 * GET /api/health?check=ready - Readiness check
 * GET /api/health?check=detailed - Detailed health info
 * GET /api/health?check=demo - Demo site check
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import { getDb, getOne } from '../../../lib/db/client';
import config from '../../../lib/config';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const check = searchParams.get('check') || 'basic';

    if (check === 'ready') {
      const db = getDb();
      const result = db.prepare('SELECT 1 as ok').get();
      if (result && (result as any).ok === 1) {
        return NextResponse.json({
          status: 'ready',
          checks: { database: 'ok' },
        });
      }
      return NextResponse.json(
        { status: 'not ready', checks: { database: 'failed' } },
        { status: 503 }
      );
    }

    if (check === 'detailed') {
      const db = getDb();

      // DB file size
      let dbSizeBytes = 0;
      try {
        const dbPath = config.databaseUrl;
        const stats = fs.statSync(dbPath);
        dbSizeBytes = stats.size;
      } catch (_) {}

      // Counts
      const sitesCount =
        (db.prepare('SELECT COUNT(*) as count FROM sites').get() as any)
          ?.count || 0;
      const knowledgeChunksCount =
        (db.prepare('SELECT COUNT(*) as count FROM knowledge_chunks').get() as any)
          ?.count || 0;
      const legacyChunksCount =
        (db.prepare('SELECT COUNT(*) as count FROM chunks').get() as any)
          ?.count || 0;
      const conversationsCount =
        (db.prepare('SELECT COUNT(*) as count FROM conversations').get() as any)
          ?.count || 0;
      const messagesCount =
        (db.prepare('SELECT COUNT(*) as count FROM messages').get() as any)
          ?.count || 0;
      const sourcesCount =
        (db.prepare('SELECT COUNT(*) as count FROM knowledge_sources').get() as any)
          ?.count || 0;

      const memUsage = process.memoryUsage();

      return NextResponse.json({
        status: 'ok',
        uptime: Math.floor(process.uptime()),
        startedAt: new Date(config.startedAt).toISOString(),
        database: {
          sizeBytes: dbSizeBytes,
          sizeMB: (dbSizeBytes / (1024 * 1024)).toFixed(2),
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
    }

    if (check === 'demo') {
      const customer = getOne('SELECT id FROM customers WHERE email = ?', [
        'fjordtech@demo.no',
      ]);
      if (!customer) {
        return NextResponse.json(
          { error: 'Demo site not found' },
          { status: 404 }
        );
      }
      const site = getOne(
        'SELECT id, name FROM sites WHERE customer_id = ?',
        [customer.id]
      );
      if (!site) {
        return NextResponse.json(
          { error: 'Demo site not found' },
          { status: 404 }
        );
      }
      const protocol = request.headers.get('x-forwarded-proto') || 'http';
      const host = request.headers.get('host');
      return NextResponse.json({
        siteId: site.id,
        siteName: (site as any).name,
        demoUrl: `${protocol}://${host}/demo.html?siteId=${site.id}`,
      });
    }

    // Default: basic health check
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
    });
  } catch (err) {
    return NextResponse.json(
      { status: 'error', error: String(err) },
      { status: 500 }
    );
  }
}
