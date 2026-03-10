/**
 * Chat Service
 * Handles conversation logic, RAG, and LLM calls
 */

import { getMany, getOne, query } from '../db/client';
import { v4 as uuid } from 'uuid';
import OpenAI from 'openai';
import { config } from '../config';

const DEFAULT_MODEL = 'gpt-4o-mini';

const client = new OpenAI({
  apiKey: config.openaiApiKey || process.env.OPENAI_API_KEY,
});

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  created_at: string;
}

export interface Conversation {
  id: string;
  site_id: string;
  session_id: string;
  visitor_email?: string;
  visitor_name?: string;
  message_count: number;
}

export async function getOrCreateConversation(
  siteId: string,
  sessionId: string,
  visitorInfo?: { email?: string; name?: string; company?: string }
): Promise<Conversation> {
  const existing = getOne<Conversation>(
    'SELECT * FROM conversations WHERE site_id = ? AND session_id = ?',
    [siteId, sessionId]
  );

  if (existing) return existing;

  const conversationId = uuid();
  query(
    `INSERT INTO conversations (id, site_id, session_id, visitor_email, visitor_name, visitor_company)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      conversationId,
      siteId,
      sessionId,
      visitorInfo?.email,
      visitorInfo?.name,
      visitorInfo?.company,
    ]
  );

  return {
    id: conversationId,
    site_id: siteId,
    session_id: sessionId,
    visitor_email: visitorInfo?.email,
    visitor_name: visitorInfo?.name,
    message_count: 0,
  };
}

export async function addMessage(
  conversationId: string,
  siteId: string,
  role: 'user' | 'assistant',
  content: string,
  sources?: string[]
): Promise<Message> {
  const messageId = uuid();
  query(
    `INSERT INTO messages (id, conversation_id, site_id, role, content, sources)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [messageId, conversationId, siteId, role, content, JSON.stringify(sources || [])]
  );

  // Update message count
  query('UPDATE conversations SET message_count = message_count + 1 WHERE id = ?', [conversationId]);

  return {
    id: messageId,
    role,
    content,
    sources,
    created_at: new Date().toISOString(),
  };
}

export async function getConversationHistory(conversationId: string): Promise<Message[]> {
  return getMany<Message>(
    'SELECT id, role, content, sources, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC',
    [conversationId]
  );
}

export async function generateResponse(
  siteId: string,
  userMessage: string,
  conversationHistory: Message[]
): Promise<{ response: string; sources: string[] }> {
  // Retrieve relevant chunks from knowledge base
  const chunks = getMany<{ content: string; metadata?: string }>(
    `SELECT DISTINCT c.content, c.metadata FROM chunks c
     JOIN documents d ON c.document_id = d.id
     WHERE d.site_id = ? AND d.status = 'active'
     LIMIT 5`,
    [siteId]
  );

  const context = chunks.map((c) => c.content).join('\n\n');

  // Build messages for OpenAI
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

  const systemPrompt = `Du er en kundeservicechatbot for en norsk bedrift. 
Svar på norsk, vær høflig og profesjonell.
Bruk følgende kontekst for å svare på spørsmål:

${context || 'Ingen kontekst tilgjengelig'}

Hvis du ikke vet svaret, si at du ikke kan hjelpe med det spørsmålet.`;

  messages.push({ role: 'system', content: systemPrompt });

  for (const msg of conversationHistory) {
    messages.push({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    });
  }

  messages.push({
    role: 'user',
    content: userMessage,
  });

  const completion = await client.chat.completions.create({
    model: DEFAULT_MODEL,
    max_tokens: 2048,
    messages,
  });

  const assistantMessage = completion.choices[0]?.message?.content || '';
  const sourceIds = chunks.map((c) => c.metadata || 'unknown').filter(Boolean);

  return {
    response: assistantMessage,
    sources: sourceIds,
  };
}
