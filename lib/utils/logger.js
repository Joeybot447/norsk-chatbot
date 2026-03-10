/**
 * Logging Utility
 * Structured logging with pino + request ID support
 */

import pino from 'pino';
import { v4 as uuid } from 'uuid';

const level = process.env.LOG_LEVEL || 'info';

export const logger = pino({
  level,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
      singleLine: false,
    },
  },
});

/**
 * Request logging middleware — attaches requestId to req and logs request lifecycle
 */
export function requestLoggerMiddleware(req, res, next) {
  req.requestId = req.headers['x-request-id'] || uuid();
  res.setHeader('X-Request-Id', req.requestId);

  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      reqId: req.requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    });
  });
  next();
}

export default logger;
