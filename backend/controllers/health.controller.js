const { sendSuccess } = require('../utils/apiResponse');

/**
 * GET /api/health
 * Simple liveness check used by uptime monitors, load balancers,
 * and local development to confirm the API process is running.
 */
const getHealth = (req, res) => {
  sendSuccess(res, {
    message: 'API is running',
  });
};

module.exports = { getHealth };
