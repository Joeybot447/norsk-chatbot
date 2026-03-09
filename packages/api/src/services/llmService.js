/**
 * LLM Service
 * Handles Claude API calls with streaming support
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
      const prompt = this.buildPrompt({ userMessage, context });

      const response = await client.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        system: context.systemPrompt + '\n\n' + context.context,
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
   * Build prompt for LLM
   */
  buildPrompt({ userMessage, context }) {
    return `${context.systemPrompt}

${context.context}

---

Brukerspørsmål: ${userMessage}`;
  },

  /**
   * Calculate token estimate
   */
  estimateTokens(text) {
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  },
};

export default llmService;
