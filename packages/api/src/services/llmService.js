/**
 * LLM Service
 * Handles Claude API calls
 */

import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger.js';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const llmService = {
  /**
   * Generate response from Claude
   */
  async generateResponse({ userMessage, context, config }) {
    try {
      // Build system prompt: system instructions + knowledge context
      let systemContent = context.systemPrompt;
      if (context.context) {
        systemContent += '\n\n' + context.context;
      }
      systemContent += '\n\nBruk BARE informasjonen over til å svare. Hvis du ikke finner svaret i kunnskapsbasen, si at du ikke har informasjon om dette og anbefal å kontakte bedriften direkte.';

      const response = await client.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        system: systemContent,
        messages: [
          {
            role: 'user',
            content: userMessage,
          },
        ],
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '';
      const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;

      return {
        content,
        tokensUsed,
        stopReason: response.stop_reason,
      };
    } catch (err) {
      logger.error(`LLM service error: ${err.message}`);
      throw err;
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
