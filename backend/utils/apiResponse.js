/**
 * Standardized JSON response shape used across the API:
 * { success, message, data }
 */
const sendSuccess = (res, { statusCode = 200, message = 'Success', data = null } = {}) => {
  const body = { success: true, message };
  // Only include `data` when the caller actually provides a payload,
  // so simple endpoints (e.g. health checks) return a lean response.
  if (data !== null) {
    body.data = data;
  }
  return res.status(statusCode).json(body);
};

const sendError = (res, { statusCode = 500, message = 'Something went wrong' } = {}) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = { sendSuccess, sendError };
