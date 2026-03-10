/**
 * LLM Service
 * Handles Claude API calls with conversation history support
 */

import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger.js';
import config from '../config.js';

let client = null;

function getClient() {
  if (!client) {
    if (!config.anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }
    client = new Anthropic({ apiKey: config.anthropicApiKey });
  }
  return client;
}

export const llmService = {
  /**
   * Generate response from Claude with optional conversation history
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

      // Build messages array with conversation history
      const messages = [];

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

      const response = await getClient().messages.create({
        model: 'claude-opus-4-1-20250805',
        max_tokens: 2048,
        system: systemContent,
        messages,
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '';
      const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;

      return {
        content,
        tokensUsed,
        stopReason: response.stop_reason,
      };
    } catch (err) {
      // Handle Claude API errors gracefully
      if (err.status === 429) {
        logger.error('Claude API rate limited');
        return {
          content: 'Beklager, vi opplever høy trafikk akkurat nå. Vennligst prøv igjen om et øyeblikk.',
          tokensUsed: 0,
          stopReason: 'error',
        };
      }
      if (err.status === 401 || err.status === 403) {
        logger.error('Claude API authentication error');
        return {
          content: 'Beklager, det oppstod en teknisk feil. Vennligst prøv igjen senere.',
          tokensUsed: 0,
          stopReason: 'error',
        };
      }
      if (err.status >= 500) {
        logger.error(`Claude API server error: ${err.status}`);
        return {
          content: 'Beklager, tjenesten er midlertidig utilgjengelig. Vennligst prøv igjen senere.',
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
