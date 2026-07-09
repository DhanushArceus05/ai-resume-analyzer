const mongoose = require('mongoose');
const logger = require('../utils/logger');
const env = require('./env');

/**
 * Connects to MongoDB via Mongoose.
 *
 * In production, a failed connection is fatal and exits the process
 * (fail fast). In development, it logs a clear warning instead of
 * crashing, so the rest of the API (e.g. /api/health) stays usable
 * while the database is being set up.
 */
const connectDB = async () => {
  try {
    await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    logger.info('MongoDB connected');
  } catch (error) {
    logger.error('MongoDB connection failed:', error.message);

    if (env.isProduction) {
      process.exit(1);
    }

    logger.warn(
      'Continuing without a database connection (development mode). Auth endpoints will fail until MongoDB is reachable.'
    );
  }
};

module.exports = connectDB;
