/**
 * POST /api/auth/verify
 * Verify JWT token and return user info
 */

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { logger } from '../../../../lib/utils/logger.js';
import config from '../../../../lib/config.js';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret as string, {
        algorithms: ['HS256'],
        clockTolerance: 30,
      });

      return NextResponse.json({ success: true, user: decoded });
    } catch (err) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }
  } catch (err) {
    const error = err as Error;
    logger.error(`Token verification error: ${error.message}`);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}
