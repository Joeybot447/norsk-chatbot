/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getOne } from '../../../../lib/db/client';
import { logger } from '../../../../lib/utils/logger.js';
import config from '../../../../lib/config.js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'E-post og passord er påkrevd' },
        { status: 400 }
      );
    }

    const user = await getOne('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (!user) {
      return NextResponse.json(
        { error: 'Ugyldig e-post eller passord' },
        { status: 401 }
      );
    }

    const passwordMatch = bcrypt.compareSync(password, user.password_hash);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Ugyldig e-post eller passord' },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, company_name: user.company_name },
      config.jwtSecret as string,
      { expiresIn: '7d' }
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
  } catch (err) {
    const error = err as Error;
    logger.error(`Login error: ${error.message}`);
    return NextResponse.json(
      { error: 'Innlogging feilet. Vennligst prøv igjen.' },
      { status: 500 }
    );
  }
}
