/**
 * Widget Routes
 * GET /v1/widget/:siteId - Get widget configuration (cached)
 * GET /v1/widget/script/:siteId - Get embeddable widget script
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOne } from '../../../lib/db/client';
import { logger } from '../../../packages/api/src/utils/logger.js';
import config from '../../../packages/api/src/config.js';

// Simple in-memory cache for widget configs (TTL: 5 minutes)
const widgetConfigCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedConfig(siteId: string): any | null {
  const cached = widgetConfigCache.get(siteId);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.data;
  }
  widgetConfigCache.delete(siteId);
  return null;
}

function setCachedConfig(siteId: string, data: any): void {
  widgetConfigCache.set(siteId, { data, timestamp: Date.now() });
}

/**
 * GET /api/widget/:siteId
 * Return widget configuration for the specified site (cached)
 */
export async function GET(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname;
    const pathParts = pathname.split('/');
    const siteId = pathParts[pathParts.length - 1];

    // GET /api/widget/script/:siteId
    if (pathname.includes('/script/') && pathParts[pathParts.length - 2] === 'script') {
      const site = await getOne(
        `SELECT id FROM sites WHERE id = ?`,
        [siteId]
      );

      if (!site) {
        return NextResponse.json(
          { error: 'Site not found' },
          { status: 404 }
        );
      }

      const apiUrl = config.apiUrl || `${request.nextUrl.protocol}//${request.headers.get('host')}`;
      const scriptUrl = `${apiUrl}/widget.min.js`;

      return NextResponse.json({
        scriptUrl,
        installCode: `<script src="${scriptUrl}" data-site="${siteId}" data-api-url="${apiUrl}"></script>`,
      });
    }

    // GET /api/widget/:siteId
    // Check cache first
    const cached = getCachedConfig(siteId);
    if (cached) {
      const response = NextResponse.json(cached);
      response.headers.set('X-Cache', 'HIT');
      return response;
    }

    const site = await getOne(
      `SELECT id, name, widget_config FROM sites WHERE id = ?`,
      [siteId]
    );

    if (!site) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      );
    }

    const widgetConfig = typeof site.widget_config === 'string'
      ? JSON.parse(site.widget_config)
      : site.widget_config || {};

    const responseData = {
      id: site.id,
      name: site.name,
      config: widgetConfig,
    };

    // Cache the result
    setCachedConfig(siteId, responseData);
    const response = NextResponse.json(responseData);
    response.headers.set('X-Cache', 'MISS');

    return response;
  } catch (err) {
    const error = err as Error;
    logger.error(`Widget route error: ${error.message}`);
    return NextResponse.json(
      { error: 'Failed to load widget configuration' },
      { status: 500 }
    );
  }
}
