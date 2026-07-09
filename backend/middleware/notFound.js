const ApiError = require('../utils/ApiError');

/**
 * Catches any request that doesn't match a defined route
 * and forwards a 404 ApiError to the global error handler.
 */
const notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found - ${req.method} ${req.originalUrl}`));
};

module.exports = notFound;
