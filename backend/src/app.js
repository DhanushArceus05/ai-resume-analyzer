const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

const env = require('../config/env');
const requestLogger = require('../middleware/requestLogger');
const notFound = require('../middleware/notFound');
const errorHandler = require('../middleware/errorHandler');
const apiRoutes = require('../routes');

const app = express();

// Render (and most PaaS hosts) sit behind a reverse proxy. This makes
// Express trust the X-Forwarded-* headers so req.ip, req.secure, and
// rate-limiting/logging based on client IP work correctly in production.
if (env.isProduction) {
  app.set('trust proxy', 1);
}

// --- Security & performance middleware ---
app.use(helmet());
app.use(
  cors({
    // Supports one or more allowed origins via CLIENT_URL (comma-separated).
    // Requests with no Origin header (e.g. server-to-server, curl, health
    // checks) are allowed through since there is no browser origin to check.
    origin: (origin, callback) => {
      if (!origin || env.clientUrls.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(compression());

// --- Body parsing ---
// Explicit size limits: this API only ever accepts small JSON payloads
// (auth credentials, JD text, etc.) — actual resume files go through
// Multer's own memory storage + limits in upload.middleware.js, not
// through these parsers.
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// --- Logging ---
app.use(requestLogger);

// --- Routes ---
app.use('/api', apiRoutes);

// --- 404 + error handling (must be last) ---
app.use(notFound);
app.use(errorHandler);

module.exports = app;
