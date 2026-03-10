import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const siteId = request.nextUrl.searchParams.get('siteId');
  const apiKey = request.nextUrl.searchParams.get('apiKey');
  const host = request.headers.get('host');
  const protocol = request.nextUrl.protocol;
  const baseUrl = `${protocol}//${host}`;

  const snippet = `<script src="${baseUrl}/widget.js" data-site-id="${siteId || 'DITT_NETTSTED_ID'}" data-api-key="${apiKey || 'DIN_API_NOKKEL'}"></script>`;

  return NextResponse.json({ snippet, baseUrl });
}
