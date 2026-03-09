/**
 * Chat Service
 * Handles RAG pipeline: retrieve docs → build context → call LLM → return response
 */

import { getMany } from '../db/client.js';
import { llmService } from './llmService.js';
import { ragService } from './ragService.js';
import { guardrailsService } from './guardrailsService.js';
import { logger } from '../utils/logger.js';

/**
 * Process user message and generate AI response
 */
export const chatService = {
  async getResponse({ siteId, conversationId, userMessage, widgetConfig }) {
    try {
      // Step 1: Input validation & guardrails
      const guardCheck = await guardrailsService.checkInput({
        siteId,
        message: userMessage,
      });

      if (guardCheck.blocked) {
        return {
          content: guardCheck.response || 'Jeg kan ikke svare på det spørsmålet.',
          confidence: 0.0,
          sources: [],
          tokensUsed: 0,
        };
      }

      // Step 2: Retrieve relevant chunks from knowledge base
      const chunks = await ragService.retrieveChunks({
        siteId,
        query: userMessage,
        limit: 5,
      });

      // Step 3: Build context for LLM
      const context = this.buildContext({
        chunks,
        conversationId,
        widgetConfig,
      });

      // Step 4: Call LLM with streaming
      const llmResponse = await llmService.generateResponse({
        userMessage,
        context,
        config: widgetConfig,
      });

      // Step 5: Extract sources and confidence
      const sources = this.extractSources(chunks, llmResponse);
      const confidence = this.calculateConfidence({
        llmResponse,
        retrievalScore: chunks.length > 0 ? chunks[0].score : 0,
      });

      // Step 6: Post-processing guardrails
      const postCheck = await guardrailsService.checkOutput({
        siteId,
        content: llmResponse.content,
        confidence,
      });

      if (postCheck.blocked) {
        return {
          content: 'Jeg beklager, men jeg kunne ikke generere et svar. Vennligst kontakt oss direkte.',
          confidence: 0.0,
          sources: [],
          tokensUsed: llmResponse.tokensUsed,
        };
      }

      return {
        content: postCheck.content || llmResponse.content,
        confidence,
        sources,
        tokensUsed: llmResponse.tokensUsed,
      };
    } catch (err) {
      logger.error(`Chat service error: ${err.message}`);
      throw err;
    }
  },

  /**
   * Build LLM prompt with context
   */
  buildContext({ chunks, conversationId, widgetConfig }) {
    const contextStr = chunks
      .map((chunk, idx) => `[Source ${idx + 1}]\n${chunk.content}`)
      .join('\n\n');

    return {
      systemPrompt: this.buildSystemPrompt(widgetConfig),
      context: contextStr,
      sourceMetadata: chunks.map((c) => ({
        id: c.id,
        title: c.metadata?.title || 'Unknown',
        url: c.metadata?.url || '',
      })),
    };
  },

  /**
   * Build system prompt with company context
   */
  buildSystemPrompt(config) {
    const tone = config.tone || 'professional';
    const language = config.language || 'norwegian';

    const basePrompt = `Du er en kundeservicebot for et norsk selskap.

Regler:
1. Svar BARE basert på informasjonen som er gitt nedenfor.
2. Hvis spørsmålet ikke er dekket av informasjonen, si: "Jeg har ikke informasjon om det. Vennligst kontakt oss direkte."
3. Vær alltid vennlig, profesjonell, og hjelpsom.
4. Gi korte svar (maksimalt 200 ord).
5. Sitér kilder når relevant: "Basert på [kilde]..."
6. Gi aldri ut sensibel informasjon (priser, ansattdetaljer, etc.) med mindre den er i kunnskapsbasen.

Tone: ${tone}
Language: ${language}

Kunnskapsbase:`;

    return basePrompt;
  },

  /**
   * Extract sources from chunks and response
   */
  extractSources(chunks, llmResponse) {
    return chunks.slice(0, 3).map((chunk) => ({
      title: chunk.metadata?.title || 'Unknown',
      url: chunk.metadata?.url || '',
      relevance: chunk.score || 0.8,
    }));
  },

  /**
   * Calculate confidence score
   */
  calculateConfidence({ llmResponse, retrievalScore }) {
    // Confidence is a combination of:
    // - Retrieval quality (did we find relevant docs?)
    // - Response certainty (does the response sound confident?)

    const hasUncertaintyPhrases =
      /muligens|kanskje|tror jeg|usikker|vet ikke|antar|omtrent/i.test(llmResponse.content);

    const baseConfidence = retrievalScore * 0.5 + 0.5; // 0.5-1.0
    const adjustedConfidence = hasUncertaintyPhrases ? baseConfidence * 0.7 : baseConfidence;

    return Math.min(1.0, Math.max(0.0, adjustedConfidence));
  },
};

export default chatService;
