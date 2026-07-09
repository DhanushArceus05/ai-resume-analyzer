/**
 * Custom error class carrying an HTTP status code.
 * Throw this from controllers/services; the global error
 * middleware knows how to translate it into a response.
 */
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
