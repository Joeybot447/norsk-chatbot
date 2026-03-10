/**
 * RAG Service (Simplified for MVP)
 * Retrieves relevant chunks using simple keyword matching instead of embeddings
 */

import { getMany } from '../db/client.js';
import { logger } from '../utils/logger.js';

export const ragService = {
  /**
   * Retrieve relevant chunks for a query using keyword matching
   */
  async retrieveChunks({ siteId, query: userQuery, limit = 5 }) {
    try {
      // Extract keywords from query
      const keywords = userQuery
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length > 3);

      if (keywords.length === 0) {
        logger.info('No keywords extracted from query');
        return [];
      }

      // Get all chunks for this site
      const allChunks = getMany(
        `SELECT id, document_id, content, metadata FROM chunks WHERE site_id = ?`,
        [siteId]
      );

      if (allChunks.length === 0) {
        logger.info('No chunks found in knowledge base');
        return [];
      }

      // Score chunks based on keyword matches
      const scoredChunks = allChunks
        .map((chunk) => {
          const content = chunk.content.toLowerCase();
          let score = 0;

          // Count keyword matches
          for (const keyword of keywords) {
            const matches = (content.match(new RegExp(keyword, 'g')) || []).length;
            score += matches;
          }

          // Bonus for consecutive keyword matches
          const fullQueryMatch = content.includes(userQuery.toLowerCase()) ? 3 : 0;
          score += fullQueryMatch;

          return {
            ...chunk,
            score: score / keywords.length, // Normalize by keyword count
            relevance: Math.min(1.0, score / keywords.length),
          };
        })
        .filter((chunk) => chunk.score > 0) // Only include chunks with matches
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      logger.info(`Retrieved ${scoredChunks.length} relevant chunks for query`);

      return scoredChunks;
    } catch (err) {
      logger.error(`RAG retrieval error: ${err.message}`);
      return [];
    }
  },

  /**
   * Chunk content into smaller pieces
   */
  chunkContent(content, chunkSize = 500) {
    const chunks = [];
    const sentences = content.split(/[\.\!\?]+/).filter((s) => s.trim().length > 0);

    let currentChunk = '';
    for (const sentence of sentences) {
      const testChunk = currentChunk ? currentChunk + '. ' + sentence : sentence;

      if (this.estimateTokens(testChunk) > chunkSize && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence.trim();
      } else {
        currentChunk = testChunk;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  },

  /**
   * Estimate tokens (rough: 1 token ≈ 4 characters)
   */
  estimateTokens(text) {
    return Math.ceil(text.length / 4);
  },
};

export default ragService;
