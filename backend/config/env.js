require('dotenv').config();
const logger = require('../utils/logger');

/**
 * Centralized environment configuration.
 * Import this instead of reading `process.env` directly throughout the app.
 */
const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  // CLIENT_URL may be a single origin or a comma-separated list (e.g. a
  // Vercel production domain plus preview-deployment domains). clientUrl
  // stays a single string for backward compatibility; clientUrls is the
  // parsed array that CORS actually checks against.
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-resume-analyzer',
  jwt: {
    secret: process.env.JWT_SECRET || '',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    timeoutMs: Number(process.env.GEMINI_TIMEOUT_MS) || 60000,
  },
  isProduction: process.env.NODE_ENV === 'production',
};

if (!env.jwt.secret) {
  if (env.isProduction) {
    // Fail fast: never start a production server that would silently
    // sign/verify JWTs with an empty secret.
    throw new Error('JWT_SECRET is not set. Refusing to start in production without it.');
  }
  logger.warn(
    'JWT_SECRET is not set. Authentication endpoints will fail until it is configured in .env.'
  );
}

module.exports = env;
