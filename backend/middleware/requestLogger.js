const morgan = require('morgan');
const logger = require('../utils/logger');
const env = require('../config/env');

/**
 * HTTP request logger. Uses a concise format in production
 * and a verbose one in development.
 */
const stream = {
  write: (message) => logger.info(message.trim()),
};

const requestLogger = morgan(env.isProduction ? 'combined' : 'dev', { stream });

module.exports = requestLogger;
