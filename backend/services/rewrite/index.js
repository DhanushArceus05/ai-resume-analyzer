/**
 * Public entry point for the Resume Rewrite module (Step 8). Controllers
 * must import from here (`require('../services/rewrite')`) rather than
 * reaching into rewrite.service.js, rewritePromptBuilder.service.js, or
 * rewriteNormalizer.service.js directly.
 */
const { generateResumeRewrite } = require('./rewrite.service');

module.exports = { generateResumeRewrite };
