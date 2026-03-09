/**
 * Tenant Isolation Middleware
 * Ensures requests are scoped to the correct site_id
 */

import { getOne } from '../db/client.js';
import { logger } from '../utils/logger.js';

/**
 * Validate tenant context
 */
export async function tenantMiddleware(req, res, next) {
  try {
    // Get site ID from different sources depending on endpoint
    const siteId = req.headers['x-site-id'] || req.query.siteId || req.body?.siteId;

    if (!siteId) {
      return res.status(400).json({ error: 'Missing site ID' });
    }

    // Validate site exists (can be done async or cached)
    const site = await getOne(
      'SELECT id, customer_id, widget_config FROM sites WHERE id = $1',
      [siteId]
    );

    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    // Attach to request for use in handlers
    req.siteId = siteId;
    req.site = site;
    req.customerId = site.customer_id;

    next();
  } catch (err) {
    logger.error(`Tenant middleware error: ${err.message}`);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default tenantMiddleware;
