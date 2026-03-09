/**
 * Chat Routes
 * POST /v1/chat/message - Handle incoming messages
 */

import express from 'express';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import { getOne, query } from '../db/client.js';
import { logger } from '../utils/logger.js';
import { chatService } from '../services/chatService.js';

const router = express.Router();

// Validation schema
const chatMessageSchema = z.object({
  message: z.string().min(1).max(2000),
  sessionId: z.string().optional(),
  visitorName: z.string().optional(),
  visitorEmail: z.string().email().optional(),
  visitorCompany: z.string().optional(),
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
        error: 'Validation error',
        details: validation.error.errors,
      });
    }

    const { message, sessionId, visitorName, visitorEmail, visitorCompany } = validation.data;
    const siteId = req.siteId;
    const newSessionId = sessionId || uuid();

    // Get or create conversation
    let conversation = await getOne(
      `SELECT id FROM conversations WHERE site_id = $1 AND session_id = $2`,
      [siteId, newSessionId]
    );

    if (!conversation) {
      const result = await query(
        `INSERT INTO conversations 
          (site_id, session_id, visitor_name, visitor_email, visitor_company, ip_address, user_agent)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id`,
        [
          siteId,
          newSessionId,
          visitorName || null,
          visitorEmail || null,
          visitorCompany || null,
          req.ip || null,
          req.headers['user-agent'] || null,
        ]
      );
      conversation = result.rows[0];
    }

    // Store user message
    await query(
      `INSERT INTO messages (conversation_id, site_id, role, content, tokens_used)
       VALUES ($1, $2, $3, $4, $5)`,
      [conversation.id, siteId, 'user', message, Math.ceil(message.length / 4)]
    );

    // Get AI response using ChatService
    const response = await chatService.getResponse({
      siteId,
      conversationId: conversation.id,
      userMessage: message,
      widgetConfig: req.site.widget_config,
    });

    // Store assistant message
    await query(
      `INSERT INTO messages (conversation_id, site_id, role, content, confidence_score, sources, tokens_used)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
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
    await query(
      `UPDATE conversations SET message_count = message_count + 2 WHERE id = $1`,
      [conversation.id]
    );

    // Return response
    res.json({
      message: response.content,
      confidence: response.confidence,
      sources: response.sources,
      sessionId: newSessionId,
      conversationId: conversation.id,
    });
  } catch (err) {
    logger.error(`Chat route error: ${err.message}`);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

/**
 * POST /v1/chat/feedback
 * Submit feedback on a message
 */
router.post('/feedback', async (req, res) => {
  try {
    const { messageId, rating } = req.body;

    if (!messageId || ![-1, 1].includes(rating)) {
      return res.status(400).json({ error: 'Invalid feedback' });
    }

    await query(
      `UPDATE messages SET feedback = $1 WHERE id = $2 AND site_id = $3`,
      [rating, messageId, req.siteId]
    );

    res.json({ success: true });
  } catch (err) {
    logger.error(`Feedback route error: ${err.message}`);
    res.status(500).json({ error: 'Failed to save feedback' });
  }
});

export default router;
