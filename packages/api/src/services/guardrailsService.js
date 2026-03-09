/**
 * Guardrails Service
 * Input and output validation to prevent misuse
 */

import { getMany } from '../db/client.js';
import { logger } from '../utils/logger.js';

const PROFANITY_LIST = [
  'jævle', 'helvete', 'dritt', 'fuck', 'shit',
  'idiot', 'troll', 'drittsekk', 'mongol'
];

export const guardrailsService = {
  /**
   * Check user input for guardrail violations
   */
  async checkInput({ siteId, message }) {
    // Check for profanity
    if (this.hasProfanity(message)) {
      logger.warn(`Profanity detected: ${siteId}`);
      return {
        blocked: true,
        response: 'Vennligst hold deg til høflige og respektfulle spørsmål.',
      };
    }

    // Check for prompt injection
    if (this.hasPromptInjection(message)) {
      logger.warn(`Prompt injection detected: ${siteId}`);
      return {
        blocked: true,
        response: 'Ugyldig forespørsel.',
      };
    }

    // Check message length
    if (message.length > 2000) {
      return {
        blocked: true,
        response: 'Meldingen er for lang. Vennligst gjør den kortere.',
      };
    }

    // Check for PII
    if (this.hasPII(message)) {
      logger.warn(`PII detected in message: ${siteId}`);
      return {
        blocked: false,
        warning: 'Personlig informasjon detectet',
      };
    }

    return { blocked: false };
  },

  /**
   * Check LLM output for guardrail violations
   */
  async checkOutput({ siteId, content, confidence }) {
    // Check for PII in response
    if (this.hasPII(content)) {
      logger.error(`PII in response: ${siteId}`);
      return {
        blocked: true,
        response: 'Kunne ikke generere svar (sikkerhetskontroll mislyktes)',
      };
    }

    // Check confidence level
    if (confidence < 0.4) {
      logger.warn(`Low confidence response: ${confidence}`);
      return {
        blocked: false,
        content: 'Jeg er ikke sikker på svaret. Vennligst kontakt oss direkte for mer informasjon.',
      };
    }

    // Check response length
    if (content.length > 2000) {
      return {
        blocked: false,
        content: content.substring(0, 2000) + '...',
      };
    }

    return { blocked: false };
  },

  /**
   * Detect profanity
   */
  hasProfanity(text) {
    const lower = text.toLowerCase();
    return PROFANITY_LIST.some((word) => lower.includes(word));
  },

  /**
   * Detect prompt injection patterns
   */
  hasPromptInjection(text) {
    const injectionPatterns = [
      /ignore .{0,20}instructions/i,
      /override .{0,20}system/i,
      /forget .{0,20}prompt/i,
      /you are now a/i,
      /system override/i,
      /admin mode/i,
    ];

    return injectionPatterns.some((pattern) => pattern.test(text));
  },

  /**
   * Detect personally identifiable information
   */
  hasPII(text) {
    // Norwegian SSN pattern: DDMMYY-XXXXX (where - may be missing)
    const ssnPattern = /\d{6}[-]?\d{5}/g;

    // Credit card pattern
    const ccPattern = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g;

    // Full Norwegian phone
    const phonePattern = /[\+]?47[\s]?[\d]{4}[\s]?[\d]{4}/g;

    return ssnPattern.test(text) || ccPattern.test(text) || phonePattern.test(text);
  },

  /**
   * Get guardrail rules for a site
   */
  async getRules(siteId) {
    try {
      const rules = await getMany(
        `SELECT * FROM guardrail_rules WHERE site_id = $1 AND enabled = true`,
        [siteId]
      );
      return rules;
    } catch (err) {
      logger.error(`Failed to fetch guardrail rules: ${err.message}`);
      return [];
    }
  },
};

export default guardrailsService;
