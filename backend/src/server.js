const app = require('./app');
const env = require('../config/env');
const logger = require('../utils/logger');
const connectDB = require('../config/db');

const startServer = async () => {
  await connectDB();

  const server = app.listen(env.port, () => {
    logger.info(`Server running in ${env.nodeEnv} mode on port ${env.port}`);
  });

  // Fail loudly instead of leaving the process in a broken state.
  process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Rejection:', err.message);
    server.close(() => process.exit(1));
  });

  return server;
};

module.exports = startServer();
