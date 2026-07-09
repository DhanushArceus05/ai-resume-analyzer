const logger = require('../utils/logger');
const env = require('../config/env');

/**
 * Centralized error-handling middleware. Must be registered last.
 * Handles both known ApiError instances and unexpected errors.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500;
  const message = err.message || 'Internal server error';

  logger.error(`${req.method} ${req.originalUrl} - ${message}`);

  res.status(statusCode).json({
    success: false,
    message,
    ...(env.isProduction ? {} : { stack: err.stack }),
  });
};

module.exports = errorHandler;
