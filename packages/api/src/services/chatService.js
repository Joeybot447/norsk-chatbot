/**
 * Chat Service
 * Handles RAG pipeline: retrieve docs → build context → call LLM → return response
 */

import { getMany } from '../db/client.js';
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

      // Step 2: Search knowledge base using new RAG service
      const chunks = searchKnowledge(siteId, userMessage, 5);

      // Step 3: Build context for LLM
      const context = this.buildContext({
        chunks,
        widgetConfig,
      });

      // Step 4: Call LLM
      const llmResponse = await llmService.generateResponse({
        userMessage,
        context,
        config: widgetConfig,
      });

      // Step 5: Extract sources with real names
      const sources = this.extractSources(chunks);
      const confidence = this.calculateConfidence({
        llmResponse,
        chunkCount: chunks.length,
        topScore: chunks.length > 0 ? chunks[0].score : 0,
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
   * Build system prompt with RAG-aware instructions
   */
  buildSystemPrompt(config, hasKnowledge) {
    const siteName = config?.name || 'bedriften';

    if (hasKnowledge) {
      return `Du er en kundeservicebot for ${siteName}.
Svar alltid på norsk. Vær hjelpsom og profesjonell.

Her er relevant informasjon fra kunnskapsbasen:`;
    }

    return `Du er en kundeservicebot for ${siteName}.
Svar alltid på norsk. Vær hjelpsom og profesjonell.

Regler:
1. Svar basert på informasjonen som er gitt.
2. Hvis du ikke har nok informasjon, si at du ikke har informasjon om dette og anbefal å kontakte bedriften direkte.
3. Gi korte, presise svar.
4. Sitér kilder når relevant.

Kunnskapsbase:`;
  },

  /**
   * Extract source citations with real names/URLs
   */
  extractSources(chunks) {
    // Deduplicate by source_id
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
      /muligens|kanskje|tror jeg|usikker|vet ikke|antar|omtrent/i.test(llmResponse.content);

    const retrievalConfidence = Math.min(1.0, topScore / 3);
    const baseConfidence = retrievalConfidence * 0.5 + 0.5;
    const adjustedConfidence = hasUncertaintyPhrases ? baseConfidence * 0.7 : baseConfidence;

    return Math.min(1.0, Math.max(0.0, adjustedConfidence));
  },
};

export default chatService;
