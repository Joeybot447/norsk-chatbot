/**
 * RAG Service — Knowledge Search
 * Searches knowledge_chunks using keyword matching with Norwegian stop word removal
 */

import { getMany, getOne } from '../db/client.ts';
import { logger } from '../utils/logger.js';

// Norwegian stop words to filter out
const STOP_WORDS = new Set([
  'og', 'er', 'i', 'en', 'et', 'det', 'som', 'for', 'å', 'med',
  'på', 'har', 'til', 'av', 'den', 'de', 'vi', 'kan', 'om', 'men',
  'var', 'fra', 'hva', 'ikke', 'vil', 'at', 'seg', 'sin', 'sitt',
  'så', 'han', 'hun', 'der', 'her', 'alle', 'da', 'ble', 'blir',
  'skal', 'skulle', 'hvis', 'eller', 'meg', 'deg', 'oss', 'dem',
  'din', 'ditt', 'min', 'mitt', 'hans', 'hennes', 'noe', 'noen',
  'the', 'is', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at',
  'to', 'for', 'of', 'with', 'by', 'this', 'that', 'it', 'be',
]);

/**
 * Search knowledge chunks relevant to a user query
 * @param {string} siteId - Site to search within
 * @param {string} query - User's question
 * @param {number} limit - Max results to return
 * @returns {Array} Matching chunks with source info
 */
export function searchKnowledge(siteId, query, limit = 5) {
  try {
    // Extract keywords from query
    const keywords = query
      .toLowerCase()
      .replace(/[^\wæøåÆØÅ\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 1 && !STOP_WORDS.has(word));

    if (keywords.length === 0) {
      logger.info('RAG: No keywords after stop word removal');
      return [];
    }

    // Get all knowledge chunks for this site
    const allChunks = getMany(
      `SELECT kc.id, kc.source_id, kc.content, kc.chunk_index,
              ks.name as source_name, ks.type as source_type
       FROM knowledge_chunks kc
       JOIN knowledge_sources ks ON ks.id = kc.source_id
       WHERE kc.site_id = ? AND ks.status = 'ready'`,
      [siteId]
    );

    // Also search the legacy chunks table (demo data)
    const legacyChunks = getMany(
      `SELECT c.id, c.document_id as source_id, c.content, c.chunk_index,
              d.title as source_name, d.type as source_type
       FROM chunks c
       JOIN documents d ON d.id = c.document_id
       WHERE c.site_id = ? AND d.status = 'active'`,
      [siteId]
    );

    const combinedChunks = [...allChunks, ...legacyChunks];

    if (combinedChunks.length === 0) {
      logger.info('RAG: No chunks in knowledge base');
      return [];
    }

    // Score chunks by keyword matches
    const scored = combinedChunks.map(chunk => {
      const content = chunk.content.toLowerCase();
      let score = 0;

      for (const keyword of keywords) {
        const regex = new RegExp(keyword, 'gi');
        const matches = (content.match(regex) || []).length;
        score += matches;
      }

      // Bonus for exact phrase match
      if (content.includes(query.toLowerCase())) {
        score += 5;
      }

      return { ...chunk, score };
    });

    // Filter and sort
    const results = scored
      .filter(c => c.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    logger.info(`RAG: Found ${results.length} relevant chunks for query "${query.substring(0, 50)}"`);

    return results;
  } catch (err) {
    logger.error(`RAG search error: ${err.message}`);
    return [];
  }
}

export default { searchKnowledge };
