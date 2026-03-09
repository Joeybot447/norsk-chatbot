/**
 * Authentication Routes
 * Handles user registration and login for the dashboard
 */

import express from 'express';
import { v4 as uuid } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, getOne } from '../db/client.js';
import { logger } from '../utils/logger.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
const JWT_EXPIRY = '7d';

/**
 * POST /api/auth/register
 * Create a new user account
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, company_name } = req.body;

    // Validation
    if (!email || !password || !company_name) {
      return res.status(400).json({
        error: 'Email, password, and company name are required',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters',
      });
    }

    // Check if user exists
    const existingUser = getOne('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(409).json({
        error: 'Email already registered',
      });
    }

    // Hash password
    const password_hash = bcrypt.hashSync(password, 10);

    // Create user
    const userId = uuid();
    const api_key = 'sk_' + uuid().replace(/-/g, '').substring(0, 20);

    query(
      `INSERT INTO users (id, email, password_hash, company_name, api_key, plan, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, email, password_hash, company_name, api_key, 'starter', 'active']
    );

    // Generate JWT
    const token = jwt.sign(
      { userId, email, company_name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    logger.info(`User registered: ${email}`);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: userId,
        email,
        company_name,
        api_key,
        plan: 'starter',
      },
    });
  } catch (err) {
    logger.error(`Registration error: ${err.message}`);
    res.status(500).json({
      error: 'Registration failed',
      details: err.message,
    });
  }
});

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
      });
    }

    // Find user
    const user = getOne('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({
        error: 'Invalid email or password',
      });
    }

    // Verify password
    const passwordMatch = bcrypt.compareSync(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({
        error: 'Invalid email or password',
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, company_name: user.company_name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    logger.info(`User logged in: ${email}`);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        company_name: user.company_name,
        api_key: user.api_key,
        plan: user.plan,
      },
    });
  } catch (err) {
    logger.error(`Login error: ${err.message}`);
    res.status(500).json({
      error: 'Login failed',
      details: err.message,
    });
  }
});

/**
 * POST /api/auth/verify
 * Verify JWT token (for dashboard)
 */
router.post('/verify', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        error: 'No token provided',
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({
      success: true,
      user: decoded,
    });
  } catch (err) {
    res.status(401).json({
      error: 'Invalid or expired token',
    });
  }
});

export default router;
