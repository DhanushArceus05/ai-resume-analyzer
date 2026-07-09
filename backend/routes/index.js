const express = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const resumeRoutes = require('./resume.routes');

const router = express.Router();

// Mount versioned/domain route groups here as the API grows.
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/resume', resumeRoutes);

module.exports = router;
