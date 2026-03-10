/**
 * Authentication Routes
 * Handles user registration and login for the dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, getOne } from '../../../lib/db/client';
import { logger } from '../../../lib/utils/logger.js';
import config from '../../../lib/config.js';

/**
 * POST /api/auth/register
 */
export async function POST(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname;
    
    // Route to /api/auth/register
    if (pathname.endsWith('/register')) {
      const body = await request.json();
      const { email, password, company_name, companyName } = body;
      const company = company_name || companyName;

      if (!email || typeof email !== 'string' || !email.trim()) {
        return NextResponse.json(
          { error: 'Email is required' },
          { status: 400 }
        );
      }
      if (!password || typeof password !== 'string') {
        return NextResponse.json(
          { error: 'Password is required' },
          { status: 400 }
        );
      }
      if (!company || typeof company !== 'string' || !company.trim()) {
        return NextResponse.json(
          { error: 'Company name is required' },
          { status: 400 }
        );
      }
      if (password.length < 8) {
        return NextResponse.json(
          { error: 'Password must be at least 8 characters' },
          { status: 400 }
        );
      }

      // Basic email validation
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }

      const existingUser = await getOne('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
      if (existingUser) {
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 409 }
        );
      }

      const password_hash = bcrypt.hashSync(password, 10);
      const userId = uuid();
      const api_key = 'sk_' + uuid().replace(/-/g, '').substring(0, 20);

      query(
        `INSERT INTO users (id, email, password_hash, company_name, api_key, plan, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, email.toLowerCase().trim(), password_hash, company.trim(), api_key, 'starter', 'active']
      );

      const token = jwt.sign(
        { userId, email: email.toLowerCase().trim(), company_name: company.trim() },
        config.jwtSecret as any,
        { expiresIn: config.jwtExpiry }
      );

      logger.info(`User registered: ${email}`);

      return NextResponse.json(
        {
          success: true,
          token,
          user: {
            id: userId,
            email: email.toLowerCase().trim(),
            company_name: company.trim(),
            api_key,
            plan: 'starter',
          },
        },
        { status: 201 }
      );
    }

    // Route to /api/auth/login
    if (pathname.endsWith('/login')) {
      const body = await request.json();
      const { email, password } = body;

      if (!email || !password) {
        return NextResponse.json(
          { error: 'Email and password are required' },
          { status: 400 }
        );
      }

      const user = await getOne('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
      if (!user) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      const passwordMatch = bcrypt.compareSync(password, user.password_hash);
      if (!passwordMatch) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, company_name: user.company_name },
        config.jwtSecret as any,
        { expiresIn: config.jwtExpiry }
      );

      logger.info(`User logged in: ${email}`);

      return NextResponse.json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          company_name: user.company_name,
          plan: user.plan,
        },
      });
    }

    // Route to /api/auth/verify
    if (pathname.endsWith('/verify')) {
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
    }

    return NextResponse.json(
      { error: 'Not found' },
      { status: 404 }
    );
  } catch (err) {
    const error = err as Error;
    logger.error(`Auth route error: ${error.message}`);
    return NextResponse.json(
      { error: 'Auth operation failed. Please try again.' },
      { status: 500 }
    );
  }
}
