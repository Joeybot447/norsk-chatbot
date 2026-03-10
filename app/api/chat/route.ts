/**
 * Chat API Route
 * POST /api/chat — Send message, get AI response (API key auth)
 * GET  /api/chat — Fetch conversation history (API key auth)
 * OPTIONS /api/chat — CORS preflight
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServiceClient } from '../../../lib/supabase/client';
import { extractApiKey, validateApiKey } from '../../../lib/api/middleware';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
};

function corsJson(data: any, init?: ResponseInit) {
  const res = NextResponse.json(data, init);
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * POST /api/chat
 * Body: { message, conversationId?, visitorId? }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate via API key
    const apiKey = extractApiKey(request);
    if (!apiKey) {
      return corsJson({ error: 'API-nøkkel mangler' }, { status: 401 });
    }

    const auth = await validateApiKey(apiKey);
    if (!auth) {
      return corsJson({ error: 'Ugyldig API-nøkkel' }, { status: 401 });
    }

    const { siteId, siteName } = auth;

    // 2. Parse body
    let body: any;
    try {
      body = await request.json();
    } catch {
      return corsJson({ error: 'Ugyldig JSON i forespørsel' }, { status: 400 });
    }

    const { message, conversationId, visitorId } = body;
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return corsJson({ error: 'Melding er påkrevd' }, { status: 400 });
    }
    if (message.length > 4000) {
      return corsJson({ error: 'Meldingen er for lang (maks 4000 tegn)' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // 3. Get or create conversation
    let convId = conversationId;
    if (convId) {
      // Verify conversation belongs to this site
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', convId)
        .eq('site_id', siteId)
        .single();
      if (!existing) {
        convId = null; // will create new
      }
    }

    if (!convId) {
      const vid = visitorId || crypto.randomUUID();
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          site_id: siteId,
          visitor_id: vid,
          status: 'active',
          started_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (convError || !newConv) {
        console.error('Conversation create error:', convError);
        return corsJson({ error: 'Kunne ikke opprette samtale' }, { status: 500 });
      }
      convId = newConv.id;
    }

    // 4. Store user message
    const userTokens = Math.ceil(message.length / 4);
    await supabase.from('messages').insert({
      conversation_id: convId,
      role: 'user',
      content: message.trim(),
      tokens_used: userTokens,
    });

    // 5. Load conversation history (last 20 messages)
    const { data: historyRows } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
      .limit(20);

    const history = (historyRows || []).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // 6. RAG — search knowledge_chunks for relevant context (vector or text fallback)
    let ragContext = '';
    try {
      let matchedChunks: { content: string }[] | null = null;

      // Try vector search if OpenAI key is available
      if (process.env.OPENAI_API_KEY) {
        try {
          const embResponse = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ model: 'text-embedding-3-small', input: message.trim() }),
          });

          if (embResponse.ok) {
            const embData = await embResponse.json();
            const queryEmbedding = embData.data?.[0]?.embedding;

            if (queryEmbedding) {
              const { data: vectorChunks } = await supabase.rpc('match_knowledge_chunks', {
                query_embedding: queryEmbedding,
                match_site_id: siteId,
                match_threshold: 0.7,
                match_count: 5,
              });

              if (vectorChunks && vectorChunks.length > 0) {
                matchedChunks = vectorChunks;
              }
            }
          }
        } catch (embErr) {
          console.error('Vector search failed, falling back to text search:', embErr);
        }
      }

      // Fallback: basic text search if vector search didn't return results
      if (!matchedChunks || matchedChunks.length === 0) {
        const { data: textChunks } = await supabase
          .from('knowledge_chunks')
          .select('content')
          .eq('site_id', siteId)
          .limit(5);

        matchedChunks = textChunks;
      }

      if (matchedChunks && matchedChunks.length > 0) {
        ragContext = matchedChunks.map((c) => c.content).join('\n\n---\n\n');
      }
    } catch (ragErr) {
      console.error('RAG context retrieval failed:', ragErr);
      // Continue without RAG context
    }

    // 7. Get site config for system prompt (including bot_config)
    const { data: siteConfig } = await supabase
      .from('sites')
      .select('welcome_message, bot_name, theme_config, bot_config')
      .eq('id', siteId)
      .single();

    const botName = siteConfig?.bot_name || 'NorskBot';
    const botConfig = siteConfig?.bot_config || {};
    const configuredTemp = typeof botConfig.temperature === 'number' ? botConfig.temperature : 0.7;
    const configuredMaxTokens = typeof botConfig.max_tokens === 'number' ? Math.max(100, Math.min(2000, botConfig.max_tokens)) : 1024;

    // Tone instructions
    const toneMap: Record<string, string> = {
      profesjonell: 'Bruk en profesjonell og formell tone.',
      vennlig: 'Vær vennlig og imøtekommende.',
      uformell: 'Bruk en uformell og avslappet tone.',
      teknisk: 'Bruk en teknisk og presis tone med fagterminologi.',
    };
    const toneInstruction = toneMap[botConfig.tone] || toneMap.vennlig;

    // Response length instructions
    const lengthMap: Record<string, string> = {
      kort: 'Hold svarene korte og konsise, maks 2-3 setninger.',
      medium: 'Gi moderat detaljerte svar.',
      detaljert: 'Gi detaljerte og grundige svar.',
    };
    const lengthInstruction = lengthMap[botConfig.response_length] || lengthMap.medium;

    // 8. Build system prompt using bot_config
    let systemPrompt: string;
    if (botConfig.system_prompt && botConfig.system_prompt.trim()) {
      systemPrompt = botConfig.system_prompt.replace('{site_name}', siteName);
    } else {
      systemPrompt = `Du er ${botName}, en hjelpsom AI-assistent for ${siteName}. Svar alltid på norsk med mindre brukeren skriver på et annet språk.`;
    }

    systemPrompt += `\n\n${toneInstruction} ${lengthInstruction}`;

    if (siteConfig?.welcome_message) {
      systemPrompt += `\n\nVelkomstmelding for denne nettsiden: ${siteConfig.welcome_message}`;
    }

    // Fallback instruction
    const fallbackMsg = botConfig.fallback_message || 'Beklager, jeg fant ikke svar på det. Kontakt oss direkte for hjelp.';
    if (!ragContext || ragContext.trim().length === 0) {
      systemPrompt += `\n\nHvis du ikke har relevant informasjon til å svare, si: "${fallbackMsg}"`;
    }

    if (ragContext) {
      systemPrompt += `\n\nHer er relevant informasjon fra kunnskapsbasen som du kan bruke til å svare:\n\n${ragContext}`;
      if (botConfig.include_sources === false) {
        systemPrompt += `\n\nIkke referer til kildene i svaret ditt.`;
      }
    }

    // 9. Call Claude with bot_config settings
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const claudeResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: configuredMaxTokens,
      temperature: configuredTemp,
      system: systemPrompt,
      messages: history,
    });

    const assistantContent =
      claudeResponse.content[0].type === 'text'
        ? claudeResponse.content[0].text
        : '';
    const assistantTokens = claudeResponse.usage?.output_tokens || Math.ceil(assistantContent.length / 4);
    const totalTokens = (claudeResponse.usage?.input_tokens || 0) + assistantTokens;

    // 10. Store assistant message
    await supabase.from('messages').insert({
      conversation_id: convId,
      role: 'assistant',
      content: assistantContent,
      tokens_used: assistantTokens,
    });

    // 11. Log usage
    await supabase.from('usage_logs').insert({
      site_id: siteId,
      action_type: 'chat_message',
      tokens_used: totalTokens,
      metadata: {
        model: 'claude-sonnet-4-20250514',
        conversation_id: convId,
      },
    });

    // 12. Return response
    return corsJson({
      message: assistantContent,
      conversationId: convId,
      tokensUsed: totalTokens,
    });
  } catch (err) {
    const error = err as Error;
    console.error(`Chat POST error: ${error.message}`);
    return corsJson(
      { error: 'Beklager, noe gikk galt. Vennligst prøv igjen.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/chat?conversationId=xxx
 * Fetch conversation history
 */
export async function GET(request: NextRequest) {
  try {
    const apiKey = extractApiKey(request);
    if (!apiKey) {
      return corsJson({ error: 'API-nøkkel mangler' }, { status: 401 });
    }

    const auth = await validateApiKey(apiKey);
    if (!auth) {
      return corsJson({ error: 'Ugyldig API-nøkkel' }, { status: 401 });
    }

    const conversationId = request.nextUrl.searchParams.get('conversationId');
    if (!conversationId) {
      return corsJson({ error: 'conversationId er påkrevd' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Verify conversation belongs to this site
    const { data: conv } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('site_id', auth.siteId)
      .single();

    if (!conv) {
      return corsJson({ error: 'Samtale ikke funnet' }, { status: 404 });
    }

    const { data: messages } = await supabase
      .from('messages')
      .select('id, role, content, tokens_used, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    return corsJson({
      conversationId,
      messages: messages || [],
    });
  } catch (err) {
    const error = err as Error;
    console.error(`Chat GET error: ${error.message}`);
    return corsJson(
      { error: 'Kunne ikke hente samtalehistorikk' },
      { status: 500 }
    );
  }
}
