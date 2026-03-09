/**
 * RAG Service
 * Retrieves relevant chunks from vector database
 */

import { getMany } from '../db/client.js';
import { OpenAI } from 'openai';
import { logger } from '../utils/logger.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const ragService = {
  /**
   * Retrieve relevant chunks for a query
   */
  async retrieveChunks({ siteId, query, limit = 5 }) {
    try {
      // Step 1: Embed the query
      const queryEmbedding = await this.embedQuery(query);

      // Step 2: Search vector database
      const chunks = await getMany(
        `
        SELECT 
          c.id,
          c.content,
          c.metadata,
          (c.embedding <-> $1::vector) as distance
        FROM chunks c
        WHERE c.site_id = $2
        ORDER BY distance ASC
        LIMIT $3
        `,
        [JSON.stringify(queryEmbedding), siteId, limit]
      );

      // Step 3: Convert distance to similarity score (0-1, where 1 is most similar)
      const scored = chunks.map((chunk) => ({
        ...chunk,
        score: 1 - chunk.distance, // Invert distance to similarity
        metadata: chunk.metadata || {},
      }));

      logger.info(`Retrieved ${scored.length} relevant chunks for query`);

      return scored;
    } catch (err) {
      logger.error(`RAG retrieval error: ${err.message}`);
      // Return empty if retrieval fails, fall back to generic response
      return [];
    }
  },

  /**
   * Embed a query using OpenAI's embedding model
   */
  async embedQuery(query) {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: query,
        dimensions: 1536,
      });

      return response.data[0].embedding;
    } catch (err) {
      logger.error(`Embedding error: ${err.message}`);
      throw err;
    }
  },

  /**
   * Chunk and embed a document
   * Called by the embedder worker
   */
  async chunkAndEmbed({ documentId, content, siteId }) {
    try {
      // Step 1: Chunk the content
      const chunks = this.chunkContent(content);

      // Step 2: Embed each chunk
      const embeddings = await this.embedChunks(chunks.map((c) => c.content));

      // Step 3: Store chunks with embeddings in database
      const { query: queryFn } = await import('../db/client.js');
      for (let i = 0; i < chunks.length; i++) {
        await queryFn(
          `
          INSERT INTO chunks (document_id, site_id, chunk_index, content, tokens, embedding, metadata)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          `,
          [
            documentId,
            siteId,
            i,
            chunks[i].content,
            this.estimateTokens(chunks[i].content),
            JSON.stringify(embeddings[i]),
            JSON.stringify({ title: chunks[i].title }),
          ]
        );
      }

      logger.info(`Embedded ${chunks.length} chunks for document ${documentId}`);
      return chunks.length;
    } catch (err) {
      logger.error(`Chunk and embed error: ${err.message}`);
      throw err;
    }
  },

  /**
   * Split content into chunks
   * Target: 800-1000 tokens per chunk with 200 token overlap
   */
  chunkContent(content, chunkSize = 1000, overlap = 200) {
    const chunks = [];
    const words = content.split(/\s+/);
    let currentChunk = '';
    let title = '';

    for (const word of words) {
      const testChunk = currentChunk ? currentChunk + ' ' + word : word;
      const tokens = this.estimateTokens(testChunk);

      if (tokens > chunkSize && currentChunk) {
        // Save chunk
        chunks.push({
          content: currentChunk.trim(),
          title,
        });

        // Start new chunk with overlap
        const overlapWords = Math.ceil((overlap / chunkSize) * words.length);
        currentChunk = currentChunk.split(/\s+/).slice(-overlapWords).join(' ') + ' ' + word;
      } else {
        currentChunk = testChunk;

        // Extract title (usually first heading)
        if (currentChunk.startsWith('#') && !title) {
          title = currentChunk.split('\n')[0].replace(/#/g, '').trim();
        }
      }
    }

    if (currentChunk.trim()) {
      chunks.push({
        content: currentChunk.trim(),
        title,
      });
    }

    return chunks;
  },

  /**
   * Embed multiple chunks
   */
  async embedChunks(texts) {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: texts,
        dimensions: 1536,
      });

      return response.data.map((item) => item.embedding);
    } catch (err) {
      logger.error(`Batch embedding error: ${err.message}`);
      throw err;
    }
  },

  /**
   * Estimate tokens (rough: 1 token ≈ 4 characters)
   */
  estimateTokens(text) {
    return Math.ceil(text.length / 4);
  },
};

export default ragService;
