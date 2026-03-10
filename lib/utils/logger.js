/**
 * Simple logger (no pino-pretty in serverless/build)
 */

const log = (level, msg, meta) => {
  const timestamp = new Date().toISOString();
  const output = meta ? `[${timestamp}] ${level.toUpperCase()}: ${msg}` : `[${timestamp}] ${level.toUpperCase()}: ${msg}`;
  console[level === 'error' ? 'error' : 'log'](output);
};

module.exports = {
  logger: {
    info: (msg, meta) => log('info', msg, meta),
    error: (msg, meta) => log('error', msg, meta),
    warn: (msg, meta) => log('warn', msg, meta),
    debug: (msg, meta) => log('debug', msg, meta),
  },
  kg: {
    info: (msg) => log('info', msg),
    error: (msg) => log('error', msg),
    warn: (msg) => log('warn', msg),
    debug: (msg) => log('debug', msg),
  },
};
