/**
 * Chat Service
 * Handles RAG pipeline: retrieve docs → build context → call LLM → return response
 * Now with conversation history support
 */

import { getMany } from '../db/client.ts';
import { llmService } from './llmService.js';
import { searchKnowledge } from './rag.js';
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

      // Step 2: Search knowledge base using RAG service
      const chunks = searchKnowledge(siteId, userMessage, 5);

      // Step 3: Build context for LLM
      const context = this.buildContext({
        chunks,
        widgetConfig,
      });

      // Step 4: Get conversation history (last 10 messages)
      const conversationHistory = this.getConversationHistory(conversationId);

      // Step 5: Call LLM with history
      const llmResponse = await llmService.generateResponse({
        userMessage,
        context,
        conversationHistory,
        config: widgetConfig,
      });

      // Step 6: Extract sources with real names
      const sources = this.extractSources(chunks);
      const confidence = this.calculateConfidence({
        llmResponse,
        chunkCount: chunks.length,
        topScore: chunks.length > 0 ? chunks[0].score : 0,
      });

      // Step 7: Post-processing guardrails
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
      // Return friendly error instead of throwing
      return {
        content: 'Beklager, det oppstod en feil. Vennligst prøv igjen eller kontakt oss direkte.',
        confidence: 0.0,
        sources: [],
        tokensUsed: 0,
      };
    }
  },

  /**
   * Get conversation history for context (last 10 messages)
   */
  getConversationHistory(conversationId) {
    if (!conversationId) return [];

    try {
      const messages = getMany(
        `SELECT role, content FROM messages 
         WHERE conversation_id = ? 
         ORDER BY created_at DESC 
         LIMIT 10`,
        [conversationId]
      );

      // Reverse to get chronological order
      return messages.reverse();
    } catch (err) {
      logger.warn(`Failed to load conversation history: ${err.message}`);
      return [];
    }
  },

  /**
   * Build LLM prompt context with knowledge chunks
   */
  buildContext({ chunks, widgetConfig }) {
    let contextStr = '';

    if (chunks.length > 0) {
      contextStr = chunks
        .map((chunk, idx) => `[Kilde ${idx + 1}: ${chunk.source_name || 'Ukjent'}]\n${chunk.content}`)
        .join('\n\n');
    }

    return {
      systemPrompt: this.buildSystemPrompt(widgetConfig, chunks.length > 0),
      context: contextStr,
    };
  },

  /**
   * Build system prompt — natural and helpful
   */
  buildSystemPrompt(config, hasKnowledge) {
    const siteName = config?.name || 'bedriften';

    const base = `Du er en vennlig og hjelpsom kundeassistent for ${siteName}. Svar alltid på norsk med en naturlig, varm tone — som en ekte kundeservicemedarbeider. Hold svarene konsise og relevante.

Retningslinjer:
- Vær imøtekommende og profesjonell, men ikke stiv
- Bruk enkelt og klart språk
- Gi presise svar basert på tilgjengelig informasjon
- Hvis du refererer til spesifikke fakta, nevn kilden kort
- Ikke finn på informasjon — vær ærlig om hva du vet og ikke vet`;

    if (hasKnowledge) {
      return base + '\n\nHer er relevant informasjon fra kunnskapsbasen som du kan bruke til å svare:';
    }

    return base + '\n\nDu har begrenset informasjon tilgjengelig. Svar så godt du kan, men vær ærlig om at du har begrenset informasjon om dette emnet.\n\nKunnskapsbase:';
  },

  /**
   * Extract source citations with real names/URLs
   */
  extractSources(chunks) {
    const seen = new Set();
    const sources = [];

    for (const chunk of chunks) {
      if (seen.has(chunk.source_id)) continue;
      seen.add(chunk.source_id);

      sources.push({
        title: chunk.source_name || 'Ukjent kilde',
        url: chunk.source_type === 'url' ? chunk.source_name : '',
        relevance: chunk.score || 0,
      });

      if (sources.length >= 3) break;
    }

    return sources;
  },

  /**
   * Calculate confidence score
   */
  calculateConfidence({ llmResponse, chunkCount, topScore }) {
    if (chunkCount === 0) return 0.3;

    const hasUncertaintyPhrases =
      /muligens|kanskje|tror jeg|usikker|vet ikke|antar|omtrent|begrenset informasjon/i.test(llmResponse.content);

    const retrievalConfidence = Math.min(1.0, topScore / 3);
    const baseConfidence = retrievalConfidence * 0.5 + 0.5;
    const adjustedConfidence = hasUncertaintyPhrases ? baseConfidence * 0.7 : baseConfidence;

    return Math.min(1.0, Math.max(0.0, adjustedConfidence));
  },
};

export default chatService;
