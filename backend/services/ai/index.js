/**
 * Public entry point for the AI services module. Controllers must
 * import from here (`require('../services/ai')`) rather than reaching
 * into aiAnalysis.service.js, promptBuilder.service.js, the
 * normalizer, or any provider directly.
 */
const { analyzeResume } = require('./aiAnalysis.service');

module.exports = { analyzeResume };
