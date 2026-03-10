/**
 * Chat Routes
 * POST /v1/chat/message - Handle incoming messages
 * POST /v1/chat/feedback - Submit feedback
 * GET  /v1/chat/history  - Get conversation history
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import { getOne, getMany, query } from '../../../lib/db/client';
import { logger } from '../../../packages/api/src/utils/logger.js';
import { chatService } from '../../../packages/api/src/services/chatService.js';

// Validation schema
const chatMessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(2000, 'Message too long (max 2000 chars)'),
  sessionId: z.string().optional(),
  visitorName: z.string().max(100).optional(),
  visitorEmail: z.string().email().optional(),
  visitorCompany: z.string().max(200).optional(),
});

/**
 * POST /api/chat/message
 * Send a message and get an AI response
 */
export async function POST(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname;

    // POST /api/chat/message
    if (pathname.endsWith('/message')) {
      const body = await request.json();

      // Validate request
      const validation = chatMessageSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          {
            error: 'Ugyldig forespørsel',
            details: validation.error.errors.map(e => e.message),
          },
          { status: 400 }
        );
      }

      const { message, sessionId, visitorName, visitorEmail, visitorCompany } = validation.data;
      const siteId = (request as any).siteId;
      const newSessionId = sessionId || uuid();

      // Get or create conversation
      let conversation = await getOne(
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
            request.ip || null,
            request.headers.get('user-agent') || null,
          ]
        );
        conversation = await getOne(
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
        widgetConfig: (request as any).site?.widget_config || {},
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
      return NextResponse.json({
        message: response.content,
        messageId: assistantMessageId,
        confidence: response.confidence,
        sources: response.sources,
        sessionId: newSessionId,
        conversationId: conversation.id,
      });
    }

    // POST /api/chat/feedback
    if (pathname.endsWith('/feedback')) {
      const body = await request.json();
      const { messageId, rating } = body;

      if (!messageId || typeof messageId !== 'string') {
        return NextResponse.json(
          { error: 'messageId is required' },
          { status: 400 }
        );
      }

      if (![-1, 1].includes(rating)) {
        return NextResponse.json(
          { error: 'Rating must be -1 or 1' },
          { status: 400 }
        );
      }

      query(
        `UPDATE messages SET feedback = ? WHERE id = ? AND site_id = ?`,
        [rating, messageId, (request as any).siteId]
      );

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Not found' },
      { status: 404 }
    );
  } catch (err) {
    const error = err as Error;
    logger.error(`Chat route error: ${error.message}`);
    return NextResponse.json(
      { error: 'Beklager, noe gikk galt. Vennligst prøv igjen.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/chat/history?sessionId=xxx
 * Get conversation history for a session
 */
export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get('sessionId');
    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json(
        { error: 'sessionId query parameter is required' },
        { status: 400 }
      );
    }

    const siteId = (request as any).siteId;

    const conversation = await getOne(
      `SELECT id FROM conversations WHERE site_id = ? AND session_id = ?`,
      [siteId, sessionId]
    );

    if (!conversation) {
      return NextResponse.json({
        messages: [],
        sessionId,
      });
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

    return NextResponse.json({
      messages: parsed,
      sessionId,
      conversationId: conversation.id,
    });
  } catch (err) {
    const error = err as Error;
    logger.error(`Chat history error: ${error.message}`);
    return NextResponse.json(
      { error: 'Failed to load conversation history' },
      { status: 500 }
    );
  }
}
