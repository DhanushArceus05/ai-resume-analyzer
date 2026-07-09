/**
 * Public entry point for the Interview Question Generator module
 * (Step 9). Controllers must import from here
 * (`require('../services/interview')`) rather than reaching into
 * interview.service.js, interviewPromptBuilder.service.js, or
 * interviewNormalizer.service.js directly.
 */
const { generateInterviewQuestions } = require('./interview.service');

module.exports = { generateInterviewQuestions };
