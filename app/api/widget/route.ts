/**
 * Widget Routes
 * GET /api/widget - Get widget configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOne } from '../../../lib/db/client';
import config from '../../../lib/config';

// Simple in-memory cache for widget configs (TTL: 5 minutes)
const widgetConfigCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedConfig(siteId: string) {
  const cached = widgetConfigCache.get(siteId) as any;
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  widgetConfigCache.delete(siteId);
  return null;
}

function setCachedConfig(siteId: string, data: any) {
  widgetConfigCache.set(siteId, { data, timestamp: Date.now() });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams, pathname } = request.nextUrl;
    const siteId = searchParams.get('siteId');

    if (!siteId) {
      return NextResponse.json(
        { error: 'siteId query parameter is required' },
        { status: 400 }
      );
    }

    // Check for script endpoint
    if (pathname.includes('/script')) {
      const site = getOne(
        `SELECT id FROM sites WHERE id = ?`,
        [siteId]
      );

      if (!site) {
        return NextResponse.json(
          { error: 'Site not found' },
          { status: 404 }
        );
      }

      const protocol = request.headers.get('x-forwarded-proto') || 'http';
      const host = request.headers.get('host');
      const apiUrl = config.apiUrl || `${protocol}://${host}`;
      const scriptUrl = `${apiUrl}/widget.min.js`;

      return NextResponse.json({
        scriptUrl,
        installCode: `<script src="${scriptUrl}" data-site="${siteId}" data-api-url="${apiUrl}"></script>`,
      });
    }

    // Check cache first
    const cached = getCachedConfig(siteId);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { 'X-Cache': 'HIT' },
      });
    }

    const site = getOne(
      `SELECT id, name, widget_config FROM sites WHERE id = ?`,
      [siteId]
    );

    if (!site) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      );
    }

    const widgetConfig =
      typeof (site as any).widget_config === 'string'
        ? JSON.parse((site as any).widget_config)
        : (site as any).widget_config || {};

    const responseData = {
      id: site.id,
      name: (site as any).name,
      config: widgetConfig,
    };

    // Cache the result
    setCachedConfig(siteId, responseData);

    return NextResponse.json(responseData, {
      headers: { 'X-Cache': 'MISS' },
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to load widget configuration' },
      { status: 500 }
    );
  }
}
