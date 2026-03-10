/**
 * LLM Service
 * Handles OpenAI API calls with conversation history support
 */

import OpenAI from 'openai';
import { logger } from '../utils/logger.js';
import config from '../config.js';

const DEFAULT_MODEL = 'gpt-4o-mini';

let client = null;

function getClient() {
  if (!client) {
    const apiKey = config.openaiApiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    client = new OpenAI({ apiKey });
  }
  return client;
}

export const llmService = {
  /**
   * Generate response from OpenAI with optional conversation history
   * @param {Object} params
   * @param {string} params.userMessage - Current user message
   * @param {Object} params.context - System prompt and RAG context
   * @param {Array} [params.conversationHistory] - Previous messages [{role, content}]
   * @param {Object} [params.config] - Widget/site config
   */
  async generateResponse({ userMessage, context, conversationHistory = [], config: siteConfig }) {
    try {
      // Build system prompt
      let systemContent = context.systemPrompt;
      if (context.context) {
        systemContent += '\n\n' + context.context;
      }
      systemContent += '\n\nBruk informasjonen over til å svare. Hvis du ikke finner svaret i kunnskapsbasen, si "Jeg har begrenset informasjon om dette" og gi det beste svaret du kan, eller anbefal å kontakte bedriften direkte.';

      // Build messages array with system prompt + conversation history
      const messages = [{ role: 'system', content: systemContent }];

      // Add conversation history (limited to last 10 messages)
      const historyLimit = 10;
      const recentHistory = conversationHistory.slice(-historyLimit);
      for (const msg of recentHistory) {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }

      // Add current user message
      messages.push({
        role: 'user',
        content: userMessage,
      });

      const model = siteConfig?.model || DEFAULT_MODEL;

      const completion = await getClient().chat.completions.create({
        model,
        max_tokens: 2048,
        messages,
      });

      const content = completion.choices[0]?.message?.content || '';
      const tokensUsed = (completion.usage?.prompt_tokens || 0) + (completion.usage?.completion_tokens || 0);

      return {
        content,
        tokensUsed,
        stopReason: completion.choices[0]?.finish_reason || 'stop',
      };
    } catch (err) {
      // Handle OpenAI API errors gracefully
      if (err.status === 429) {
        logger.error('OpenAI API rate limited');
        return {
          content: 'Beklager, vi opplever høy trafikk akkurat nå. Vennligst prøv igjen om et øyeblikk.',
          tokensUsed: 0,
          stopReason: 'error',
        };
      }
      if (err.status === 401 || err.status === 403) {
        logger.error('OpenAI API authentication error');
        return {
          content: 'Beklager, det oppstod en teknisk feil. Vennligst prøv igjen senere.',
          tokensUsed: 0,
          stopReason: 'error',
        };
      }
      if (err.status >= 500) {
        logger.error(`OpenAI API server error: ${err.status}`);
        return {
          content: 'Beklager, tjenesten er midlertidig utilgjengelig. Vennligst prøv igjen senere.',
          tokensUsed: 0,
          stopReason: 'error',
        };
      }
      if (err.code === 'context_length_exceeded') {
        logger.error('OpenAI context length exceeded');
        return {
          content: 'Beklager, samtalen er for lang. Vennligst start en ny samtale.',
          tokensUsed: 0,
          stopReason: 'error',
        };
      }
      logger.error(`LLM service error: ${err.message}`);
      return {
        content: 'Beklager, jeg kunne ikke behandle forespørselen din. Vennligst prøv igjen.',
        tokensUsed: 0,
        stopReason: 'error',
      };
    }
  },

  /**
   * Calculate token estimate
   */
  estimateTokens(text) {
    return Math.ceil(text.length / 4);
  },
};

export default llmService;
