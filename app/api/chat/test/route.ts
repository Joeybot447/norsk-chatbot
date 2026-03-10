/**
 * Test Chat API Route
 * POST /api/chat/test — Send message, get AI response (Supabase session auth)
 *
 * This endpoint is identical to /api/chat but authenticates via Supabase
 * session token instead of API key. Used by the dashboard Chat Playground.
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createServiceClient } from '../../../../lib/supabase/client';

const DEFAULT_MODEL = 'gpt-4o-mini';

async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  const supabase = createServiceClient();

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;

  return data.user;
}

/**
 * POST /api/chat/test
 * Body: { siteId, message, conversationId? }
 * Auth: Bearer token (Supabase session)
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate via Supabase session
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Ikke autentisert' }, { status: 401 });
    }

    // 2. Parse body
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Ugyldig JSON i forespørsel' }, { status: 400 });
    }

    const { siteId, message, conversationId } = body;

    if (!siteId || typeof siteId !== 'string') {
      return NextResponse.json({ error: 'siteId er påkrevd' }, { status: 400 });
    }
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Melding er påkrevd' }, { status: 400 });
    }
    if (message.length > 4000) {
      return NextResponse.json({ error: 'Meldingen er for lang (maks 4000 tegn)' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // 3. Verify the user owns this site
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('id, name, welcome_message, bot_name, theme_config, bot_config, is_active')
      .eq('id', siteId)
      .eq('user_id', user.id)
      .single();

    if (siteError || !site) {
      return NextResponse.json({ error: 'Nettsted ikke funnet eller ingen tilgang' }, { status: 404 });
    }

    if (!site.is_active) {
      return NextResponse.json({ error: 'Nettstedet er deaktivert' }, { status: 403 });
    }

    // 4. Get or create conversation
    let convId = conversationId;
    if (convId) {
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', convId)
        .eq('site_id', siteId)
        .single();
      if (!existing) {
        convId = null;
      }
    }

    if (!convId) {
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          site_id: siteId,
          visitor_id: `dashboard-test-${user.id}`,
          status: 'active',
          metadata: { source: 'dashboard-test', userId: user.id },
          started_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (convError || !newConv) {
        console.error('Conversation create error:', convError);
        return NextResponse.json({ error: 'Kunne ikke opprette samtale' }, { status: 500 });
      }
      convId = newConv.id;
    }

    // 5. Store user message
    const userTokens = Math.ceil(message.length / 4);
    await supabase.from('messages').insert({
      conversation_id: convId,
      role: 'user',
      content: message.trim(),
      tokens_used: userTokens,
    });

    // 6. Load conversation history (last 20 messages)
    const { data: historyRows } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
      .limit(20);

    const history: OpenAI.Chat.ChatCompletionMessageParam[] = (historyRows || []).map((m: any) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // 7. RAG — search knowledge_chunks for relevant context
    let ragContext = '';
    let sources: { content: string; similarity?: number }[] = [];
    try {
      let matchedChunks: { content: string; similarity?: number }[] | null = null;

      if (process.env.OPENAI_API_KEY) {
        try {
          const openaiEmb = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
          const embResponse = await openaiEmb.embeddings.create({
            model: 'text-embedding-3-small',
            input: message.trim(),
          });

          const queryEmbedding = embResponse.data?.[0]?.embedding;

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
        } catch (embErr) {
          console.error('Vector search failed, falling back to text search:', embErr);
        }
      }

      // Fallback: basic text search
      if (!matchedChunks || matchedChunks.length === 0) {
        const { data: textChunks } = await supabase
          .from('knowledge_chunks')
          .select('content')
          .eq('site_id', siteId)
          .limit(5);
        matchedChunks = textChunks;
      }

      if (matchedChunks && matchedChunks.length > 0) {
        sources = matchedChunks.map((c) => ({
          content: c.content.slice(0, 200),
          similarity: (c as any).similarity,
        }));
        ragContext = matchedChunks.map((c) => c.content).join('\n\n---\n\n');
      }
    } catch (ragErr) {
      console.error('RAG context retrieval failed:', ragErr);
    }

    // 8. Build system prompt using bot_config if available
    const botName = site.bot_name || 'NorskBot';
    const botConfig = site.bot_config || {};
    const configuredTemp = typeof botConfig.temperature === 'number' ? botConfig.temperature : 0.7;
    const configuredMaxTokens = typeof botConfig.max_tokens === 'number' ? Math.max(100, Math.min(2000, botConfig.max_tokens)) : 1024;
    const configuredModel = botConfig.model || DEFAULT_MODEL;

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

    let systemPrompt: string;
    if (botConfig.system_prompt && botConfig.system_prompt.trim()) {
      systemPrompt = botConfig.system_prompt.replace('{site_name}', site.name);
    } else {
      systemPrompt = `Du er ${botName}, en hjelpsom AI-assistent for ${site.name}. Svar alltid på norsk med mindre brukeren skriver på et annet språk.`;
    }

    systemPrompt += `\n\n${toneInstruction} ${lengthInstruction}`;

    if (site.welcome_message) {
      systemPrompt += `\n\nVelkomstmelding for denne nettsiden: ${site.welcome_message}`;
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

    // 9. Call OpenAI with bot_config settings
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const chatMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...history,
    ];

    let completion: OpenAI.Chat.ChatCompletion;
    try {
      completion = await openai.chat.completions.create({
        model: configuredModel,
        max_tokens: configuredMaxTokens,
        temperature: configuredTemp,
        messages: chatMessages,
      });
    } catch (apiErr: any) {
      // Handle OpenAI API errors with Norwegian messages
      if (apiErr?.status === 429) {
        console.error('OpenAI API rate limited');
        return NextResponse.json(
          { error: 'For mange forespørsler. Vennligst vent litt og prøv igjen.' },
          { status: 429 }
        );
      }
      if (apiErr?.status === 401 || apiErr?.status === 403) {
        console.error('OpenAI API authentication error');
        return NextResponse.json(
          { error: 'Tjenesten er midlertidig utilgjengelig. Vennligst prøv igjen senere.' },
          { status: 503 }
        );
      }
      if (apiErr?.code === 'context_length_exceeded') {
        console.error('OpenAI context length exceeded');
        return NextResponse.json(
          { error: 'Samtalen er for lang. Vennligst start en ny samtale.' },
          { status: 400 }
        );
      }
      throw apiErr; // Re-throw unexpected errors
    }

    const assistantContent = completion.choices[0]?.message?.content || '';
    const promptTokens = completion.usage?.prompt_tokens || 0;
    const completionTokens = completion.usage?.completion_tokens || 0;
    const totalTokens = promptTokens + completionTokens;

    // 10. Store assistant message
    await supabase.from('messages').insert({
      conversation_id: convId,
      role: 'assistant',
      content: assistantContent,
      tokens_used: completionTokens,
    });

    // 11. Log usage
    await supabase.from('usage_logs').insert({
      site_id: siteId,
      user_id: user.id,
      action_type: 'chat_message',
      tokens_used: totalTokens,
      metadata: {
        model: configuredModel,
        conversation_id: convId,
        source: 'dashboard-test',
      },
    });

    // 12. Return response (omit sources if include_sources is false)
    return NextResponse.json({
      response: assistantContent,
      conversationId: convId,
      sources: botConfig.include_sources === false ? [] : sources,
      tokensUsed: totalTokens,
    });
  } catch (err) {
    const error = err as Error;
    console.error(`Chat test POST error: ${error.message}`);
    return NextResponse.json(
      { error: 'Beklager, noe gikk galt. Vennligst prøv igjen.' },
      { status: 500 }
    );
  }
}
