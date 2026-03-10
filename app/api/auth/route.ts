/**
 * Authentication Routes
 * POST /api/auth?action=register
 * POST /api/auth?action=login
 * POST /api/auth?action=verify
 */

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, getOne } from '../../../lib/db/client';
import config from '../../../lib/config';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const action = searchParams.get('action') || 'login';
    const body = await request.json();

    if (action === 'register') {
      const { email, password, company_name, companyName } = body;
      const company = company_name || companyName;

      // Validation
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

      const existingUser = getOne(
        'SELECT id FROM users WHERE email = ?',
        [email.toLowerCase().trim()]
      );
      if (existingUser) {
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 409 }
        );
      }

      const password_hash = bcryptjs.hashSync(password, 10);
      const userId = uuid();
      const api_key = 'sk_' + uuid().replace(/-/g, '').substring(0, 20);

      query(
        `INSERT INTO users (id, email, password_hash, company_name, api_key, plan, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          email.toLowerCase().trim(),
          password_hash,
          company.trim(),
          api_key,
          'starter',
          'active',
        ]
      );

      const token = jwt.sign(
        {
          userId,
          email: email.toLowerCase().trim(),
          company_name: company.trim(),
        },
        config.jwtSecret,
        { expiresIn: config.jwtExpiry }
      );

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

    if (action === 'login') {
      const { email, password } = body;

      if (!email || !password) {
        return NextResponse.json(
          { error: 'Email and password are required' },
          { status: 400 }
        );
      }

      const user = getOne(
        'SELECT * FROM users WHERE email = ?',
        [email.toLowerCase().trim()]
      );
      if (!user) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      const passwordMatch = bcryptjs.compareSync(
        password,
        (user as any).password_hash
      );
      if (!passwordMatch) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      const token = jwt.sign(
        {
          userId: user.id,
          email: (user as any).email,
          company_name: (user as any).company_name,
        },
        config.jwtSecret,
        { expiresIn: config.jwtExpiry }
      );

      return NextResponse.json({
        success: true,
        token,
        user: {
          id: user.id,
          email: (user as any).email,
          company_name: (user as any).company_name,
          plan: (user as any).plan,
        },
      });
    }

    if (action === 'verify') {
      const authHeader = request.headers.get('authorization');
      const token = authHeader?.replace('Bearer ', '');
      if (!token) {
        return NextResponse.json(
          { error: 'No token provided' },
          { status: 401 }
        );
      }

      try {
        const decoded = jwt.verify(token, config.jwtSecret, {
          algorithms: ['HS256'],
          clockTolerance: 30,
        });

        return NextResponse.json({
          success: true,
          user: decoded,
        });
      } catch {
        return NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
