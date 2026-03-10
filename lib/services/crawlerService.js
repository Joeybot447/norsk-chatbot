/**
 * Website Crawler Service
 * Crawls websites and extracts content for the knowledge base
 */

import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import { query } from '../db/client.ts';
import { ragService } from './ragService.js';
import { logger } from '../utils/logger.js';

const MAX_PAGES = process.env.MAX_PAGES_PER_CRAWL || 100;
const CRAWL_TIMEOUT = (process.env.CRAWL_TIMEOUT_SECONDS || 10) * 1000;
const CRAWL_DELAY = process.env.CRAWL_DELAY_MILLISECONDS || 1000;

export const crawlerService = {
  /**
   * Crawl a website starting from a domain
   */
  async crawlWebsite({ siteId, domain }) {
    try {
      logger.info(`Starting crawl for domain: ${domain}`);

      let browser;
      try {
        browser = await puppeteer.launch({ headless: 'new' });

        const visited = new Set();
        const queue = [new URL(domain).href];
        let pagesProcessed = 0;

        while (queue.length > 0 && pagesProcessed < MAX_PAGES) {
          const url = queue.shift();

          if (visited.has(url)) continue;
          visited.add(url);

          try {
            const content = await this.fetchPage(browser, url);
            if (content) {
              // Store document
              const result = await query(
                `INSERT INTO documents (site_id, type, source_url, title, content, status)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING id`,
                [siteId, 'webpage', url, content.title || url, content.text, 'active']
              );

              const documentId = result.rows[0].id;

              // Queue for chunking and embedding
              await ragService.chunkAndEmbed({
                documentId,
                content: content.text,
                siteId,
              });

              pagesProcessed++;

              // Extract and queue new links
              const links = this.extractLinks(content.html, new URL(domain).hostname);
              for (const link of links) {
                if (!visited.has(link) && queue.length < 1000) {
                  queue.push(link);
                }
              }
            }

            // Rate limiting
            await new Promise((resolve) => setTimeout(resolve, CRAWL_DELAY));
          } catch (err) {
            logger.warn(`Failed to crawl ${url}: ${err.message}`);
          }
        }

        logger.info(`Crawl completed: ${pagesProcessed} pages processed`);
        return {
          pagesProcessed,
          status: 'completed',
        };
      } finally {
        if (browser) {
          await browser.close();
        }
      }
    } catch (err) {
      logger.error(`Crawler error: ${err.message}`);
      throw err;
    }
  },

  /**
   * Fetch and parse a single page
   */
  async fetchPage(browser, url) {
    try {
      const page = await browser.newPage();
      await page.setDefaultNavigationTimeout(CRAWL_TIMEOUT);
      await page.setDefaultTimeout(CRAWL_TIMEOUT);

      await page.goto(url, { waitUntil: 'domcontentloaded' });
      const html = await page.content();
      await page.close();

      return this.parseHTML(html, url);
    } catch (err) {
      logger.warn(`Failed to fetch ${url}: ${err.message}`);
      return null;
    }
  },

  /**
   * Parse HTML and extract content
   */
  parseHTML(html, url) {
    try {
      const $ = cheerio.load(html);

      // Remove script and style tags
      $('script, style, nav, footer').remove();

      // Extract title
      const title = $('h1').first().text() || $('title').text() || url;

      // Extract main content
      let text = '';
      $('article, main, .content, .post, [role="main"]').each((_, el) => {
        text += $(el).text() + '\n';
      });

      // Fallback: get all paragraphs if no main content found
      if (!text.trim()) {
        $('p, h1, h2, h3, h4, h5, h6, li').each((_, el) => {
          text += $(el).text() + '\n';
        });
      }

      // Clean up text
      text = text
        .replace(/\s+/g, ' ')
        .replace(/[\n\r]+/g, '\n')
        .trim();

      if (!text) return null;

      return {
        title,
        text,
        html,
        url,
      };
    } catch (err) {
      logger.error(`HTML parsing error: ${err.message}`);
      return null;
    }
  },

  /**
   * Extract links from HTML
   */
  extractLinks(html, hostname) {
    try {
      const $ = cheerio.load(html);
      const links = new Set();

      $('a[href]').each((_, el) => {
        const href = $(el).attr('href');
        if (!href) return;

        try {
          const url = new URL(href, `http://${hostname}`);

          // Only internal links
          if (url.hostname === hostname && !url.hash) {
            links.add(url.href);
          }
        } catch (err) {
          // Invalid URL, skip
        }
      });

      return Array.from(links);
    } catch (err) {
      logger.error(`Link extraction error: ${err.message}`);
      return [];
    }
  },
};

export default crawlerService;
