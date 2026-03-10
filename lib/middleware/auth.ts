/**
 * Authentication Middleware
 * JWT verification and user context
 */

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { getOne } from '../db/client';

export interface AuthContext {
  userId: string;
  email: string;
  role: string;
}

export function verifyToken(token: string): AuthContext | null {
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as any;
    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role || 'user',
    };
  } catch (err) {
    return null;
  }
}

export function generateToken(userId: string, email: string): string {
  return jwt.sign(
    { userId, email, role: 'user' },
    config.jwtSecret,
    { expiresIn: config.jwtExpiry }
  );
}

export async function requireAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7);
  const auth = verifyToken(token);

  if (!auth) return null;

  // Verify user still exists
  const user = getOne('SELECT id, email FROM users WHERE id = ?', [auth.userId]);
  return user ? auth : null;
}

export async function requireSiteAuth(request: NextRequest, siteId: string) {
  const auth = await requireAuth(request);
  if (!auth) return null;

  // Verify user owns this site
  const site = getOne(
    'SELECT id FROM sites WHERE id = ? AND user_id = ?',
    [siteId, auth.userId]
  );

  return site ? auth : null;
}
