/**
 * Health Check Route
 * GET /api/health — Simple health check with Supabase ping
 */

import { NextResponse } from 'next/server';
import { createServiceClient } from '../../../lib/supabase/client';

export async function GET() {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from('sites')
    .select('*', { count: 'exact', head: true });

  return NextResponse.json({
    status: error ? 'degraded' : 'ok',
    timestamp: new Date().toISOString(),
    database: error ? 'error' : 'connected',
  });
}
