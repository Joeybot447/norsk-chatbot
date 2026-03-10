/**
 * Chat Routes
 * POST /v1/chat/message - Handle incoming messages
 * POST /v1/chat/feedback - Submit feedback
 * GET  /v1/chat/history  - Get conversation history
 */

import express from 'express';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import { getOne, getMany, query } from '../db/client.js';
import { logger } from '../utils/logger.js';
import { chatService } from '../services/chatService.js';

const router = express.Router();

// Validation schema
const chatMessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(2000, 'Message too long (max 2000 chars)'),
  sessionId: z.string().optional(),
  visitorName: z.string().max(100).optional(),
  visitorEmail: z.string().email().optional(),
  visitorCompany: z.string().max(200).optional(),
});

/**
 * POST /v1/chat/message
 * Send a message and get an AI response
 */
router.post('/message', async (req, res) => {
  try {
    // Validate request
    const validation = chatMessageSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Ugyldig forespørsel',
        details: validation.error.errors.map(e => e.message),
      });
    }

    const { message, sessionId, visitorName, visitorEmail, visitorCompany } = validation.data;
    const siteId = req.siteId;
    const newSessionId = sessionId || uuid();

    // Set processing header
    res.setHeader('X-Processing', 'true');

    // Get or create conversation
    let conversation = getOne(
      `SELECT id FROM conversations WHERE site_id = ? AND session_id = ?`,
      [siteId, newSessionId]
    );

    if (!conversation) {
      query(
        `INSERT INTO conversations 
          (id, site_id, session_id, visitor_name, visitor_email, visitor_company, ip_address, user_agent)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          uuid(),
          siteId,
          newSessionId,
          visitorName || null,
          visitorEmail || null,
          visitorCompany || null,
          req.ip || null,
          req.headers['user-agent'] || null,
        ]
      );
      conversation = getOne(
        `SELECT id FROM conversations WHERE site_id = ? AND session_id = ?`,
        [siteId, newSessionId]
      );
    }

    // Store user message
    query(
      `INSERT INTO messages (id, conversation_id, site_id, role, content, tokens_used)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [uuid(), conversation.id, siteId, 'user', message, Math.ceil(message.length / 4)]
    );

    // Get AI response using ChatService (now includes conversation history)
    const response = await chatService.getResponse({
      siteId,
      conversationId: conversation.id,
      userMessage: message,
      widgetConfig: req.site.widget_config || {},
    });

    // Store assistant message
    const assistantMessageId = uuid();
    query(
      `INSERT INTO messages (id, conversation_id, site_id, role, content, confidence_score, sources, tokens_used)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        assistantMessageId,
        conversation.id,
        siteId,
        'assistant',
        response.content,
        response.confidence,
        JSON.stringify(response.sources),
        response.tokensUsed,
      ]
    );

    // Update conversation message count
    query(
      `UPDATE conversations SET message_count = message_count + 2 WHERE id = ?`,
      [conversation.id]
    );

    // Return response
    res.json({
      message: response.content,
      messageId: assistantMessageId,
      confidence: response.confidence,
      sources: response.sources,
      sessionId: newSessionId,
      conversationId: conversation.id,
    });
  } catch (err) {
    logger.error({ reqId: req.requestId }, `Chat route error: ${err.message}`);
    res.status(500).json({ error: 'Beklager, noe gikk galt. Vennligst prøv igjen.' });
  }
});

/**
 * POST /v1/chat/feedback
 * Submit feedback on a message
 */
router.post('/feedback', async (req, res) => {
  try {
    const { messageId, rating } = req.body;

    if (!messageId || typeof messageId !== 'string') {
      return res.status(400).json({ error: 'messageId is required' });
    }

    if (![-1, 1].includes(rating)) {
      return res.status(400).json({ error: 'Rating must be -1 or 1' });
    }

    query(
      `UPDATE messages SET feedback = ? WHERE id = ? AND site_id = ?`,
      [rating, messageId, req.siteId]
    );

    res.json({ success: true });
  } catch (err) {
    logger.error({ reqId: req.requestId }, `Feedback route error: ${err.message}`);
    res.status(500).json({ error: 'Failed to save feedback' });
  }
});

/**
 * GET /v1/chat/history?sessionId=xxx
 * Get conversation history for a session
 */
router.get('/history', async (req, res) => {
  try {
    const { sessionId } = req.query;
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'sessionId query parameter is required' });
    }

    const siteId = req.siteId;

    const conversation = getOne(
      `SELECT id FROM conversations WHERE site_id = ? AND session_id = ?`,
      [siteId, sessionId]
    );

    if (!conversation) {
      return res.json({ messages: [], sessionId });
    }

    const messages = getMany(
      `SELECT id, role, content, confidence_score, sources, feedback, created_at
       FROM messages
       WHERE conversation_id = ?
       ORDER BY created_at ASC`,
      [conversation.id]
    );

    // Parse sources JSON
    const parsed = messages.map(m => ({
      ...m,
      sources: m.sources ? JSON.parse(m.sources) : [],
    }));

    res.json({
      messages: parsed,
      sessionId,
      conversationId: conversation.id,
    });
  } catch (err) {
    logger.error({ reqId: req.requestId }, `Chat history error: ${err.message}`);
    res.status(500).json({ error: 'Failed to load conversation history' });
  }
});

export default router;
