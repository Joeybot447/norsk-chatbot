/**
 * Chat API Route
 * POST /api/chat - Send message and get response
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateConversation, addMessage, getConversationHistory, generateResponse } from '../../../lib/services/chatService';
import { z } from 'zod';

const ChatSchema = z.object({
  site_id: z.string(),
  session_id: z.string(),
  message: z.string(),
  visitor_info: z.object({
    email: z.string().optional(),
    name: z.string().optional(),
    company: z.string().optional(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { site_id, session_id, message, visitor_info } = ChatSchema.parse(body);

    // Get or create conversation
    const conversation = await getOrCreateConversation(site_id, session_id, visitor_info);

    // Add user message
    await addMessage(conversation.id, site_id, 'user', message);

    // Get conversation history
    const history = await getConversationHistory(conversation.id);

    // Generate response
    const { response, sources } = await generateResponse(site_id, message, history);

    // Add assistant message
    const assistantMsg = await addMessage(conversation.id, site_id, 'assistant', response, sources);

    return NextResponse.json({
      message: {
        id: assistantMsg.id,
        role: 'assistant',
        content: response,
        sources,
      },
      conversation_id: conversation.id,
    });
  } catch (err) {
    console.error('Chat error:', err);
    return NextResponse.json({ error: String(err) }, { status: 400 });
  }
}
