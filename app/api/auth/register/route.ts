/**
 * POST /api/auth/register
 * Create new user account and return JWT token
 */

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, getOne } from '../../../../lib/db/client';
import { logger } from '../../../../lib/utils/logger.js';
import config from '../../../../lib/config.js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, company_name, companyName, name } = body;
    const company = company_name || companyName;

    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json(
        { error: 'E-post er påkrevd' },
        { status: 400 }
      );
    }
    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Passord er påkrevd' },
        { status: 400 }
      );
    }
    if (!company || typeof company !== 'string' || !company.trim()) {
      return NextResponse.json(
        { error: 'Bedriftsnavn er påkrevd' },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Passord må være minst 8 tegn' },
        { status: 400 }
      );
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Ugyldig e-postformat' },
        { status: 400 }
      );
    }

    const existingUser = await getOne('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existingUser) {
      return NextResponse.json(
        { error: 'E-postadressen er allerede registrert' },
        { status: 409 }
      );
    }

    const password_hash = bcrypt.hashSync(password, 10);
    const userId = uuid();
    const api_key = 'sk_' + uuid().replace(/-/g, '').substring(0, 20);

    await query(
      `INSERT INTO users (id, email, password_hash, company_name, api_key, plan, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, email.toLowerCase().trim(), password_hash, company.trim(), api_key, 'starter', 'active']
    );

    const token = jwt.sign(
      { userId, email: email.toLowerCase().trim(), company_name: company.trim() },
      config.jwtSecret as string,
      { expiresIn: '7d' }
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
  } catch (err) {
    const error = err as Error;
    logger.error(`Registration error: ${error.message}`);
    return NextResponse.json(
      { error: 'Registrering feilet. Vennligst prøv igjen.' },
      { status: 500 }
    );
  }
}
