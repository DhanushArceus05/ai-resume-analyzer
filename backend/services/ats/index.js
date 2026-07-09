/**
 * Public entry point for the ATS services module. Controllers must
 * import from here (`require('../services/ats')`) rather than reaching
 * into atsScoring.service.js, atsRules.service.js, or
 * atsBreakdown.service.js directly.
 */
const { generateAtsScore } = require('./atsScoring.service');

module.exports = { generateAtsScore };
