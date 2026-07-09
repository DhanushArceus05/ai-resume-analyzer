const ApiError = require('../../utils/ApiError');
const logger = require('../../utils/logger');
const { buildResumeAnalysisPrompt } = require('./promptBuilder.service');
const { normalizeAnalysisResponse } = require('./responseNormalizer.service');
const geminiProvider = require('./providers/gemini.provider');

/**
 * Coordinates the AI analysis pipeline:
 *   PromptBuilder -> GeminiProvider -> ResponseNormalizer
 *
 * Controllers should only ever call `analyzeResume` from this module.
 * They must never import promptBuilder, the normalizer, or any
 * provider directly.
 */

const STATUS_BY_ERROR_KIND = {
  invalid_key: 500,
  rate_limit: 429,
  timeout: 504,
  unavailable: 503,
  empty_response: 502,
  unknown: 502,
};

const MESSAGE_BY_ERROR_KIND = {
  invalid_key: 'The AI service is not configured correctly. Please contact support.',
  rate_limit: 'The AI service is receiving too many requests right now. Please try again shortly.',
  timeout: 'The AI service took too long to respond. Please try again.',
  unavailable: 'The AI service is temporarily unavailable. Please try again shortly.',
  empty_response: 'The AI service did not return a response. Please try again.',
  unknown: 'We could not analyze this resume right now. Please try again.',
};

/**
 * Runs AI analysis on an already-parsed resume object.
 * @param {object} parsedResume - output of resumeNormalizer.service.js
 * @returns {Promise<{overallSummary: string, strengths: string[], weaknesses: string[], recommendations: string[]}>}
 */
const analyzeResume = async (parsedResume) => {
  if (!parsedResume || typeof parsedResume !== 'object') {
    throw new ApiError(400, 'A parsed resume is required to run analysis.');
  }

  const prompt = buildResumeAnalysisPrompt(parsedResume);

  let rawText;
  try {
    rawText = await geminiProvider.generateAnalysis(prompt);
  } catch (error) {
    if (error instanceof geminiProvider.AIProviderError) {
      logger.error(`AI analysis failed (${error.kind}): ${error.message}`);
      throw new ApiError(
        STATUS_BY_ERROR_KIND[error.kind] || 502,
        MESSAGE_BY_ERROR_KIND[error.kind] || MESSAGE_BY_ERROR_KIND.unknown
      );
    }

    logger.error('AI analysis failed unexpectedly:', error.message);
    throw new ApiError(502, MESSAGE_BY_ERROR_KIND.unknown);
  }

  return normalizeAnalysisResponse(rawText);
};

module.exports = { analyzeResume };
