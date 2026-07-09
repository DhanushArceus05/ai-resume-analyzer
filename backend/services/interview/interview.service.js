const ApiError = require('../../utils/ApiError');
const logger = require('../../utils/logger');
const { buildInterviewPrompt } = require('./interviewPromptBuilder.service');
const { normalizeInterviewResponse } = require('./interviewNormalizer.service');
const geminiProvider = require('../ai/providers/gemini.provider');

/**
 * Coordinates the Step 9 interview question generator pipeline:
 *   Interview Service -> Interview Prompt Builder -> Gemini Provider -> Interview Normalizer
 *
 * Controllers should only ever call `generateInterviewQuestions` from
 * this module. They must never import the prompt builder, the
 * normalizer, or the Gemini provider directly.
 *
 * This module reuses the exact same Gemini provider as Step 5's AI
 * analysis and Step 8's resume rewrite (services/ai/providers/gemini.provider.js)
 * — no provider logic is duplicated.
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
  unknown: 'We could not generate interview questions right now. Please try again.',
};

/**
 * Generates personalized interview questions from an already-parsed
 * resume, using the prior Step 5/6/7/8 results only as guidance context
 * (never as new facts).
 *
 * @param {object} params
 * @param {object} params.parsedResume - output of resumeNormalizer.service.js
 * @param {object} params.analysis - output of Step 5's aiAnalysis.service.js
 * @param {object} params.ats - output of Step 6's atsScoring.service.js
 * @param {object} params.jdMatch - output of Step 7's jd/index.js
 * @param {object} params.rewrite - output of Step 8's rewrite/index.js
 * @param {object} [params.regeneration] - optional { attempt: number, previousQuestions: object }
 *   sent by the client when the user clicks "Re-generate Questions", so the
 *   prompt can steer away from repeating the previous set. Not persisted
 *   anywhere server-side — it only exists for the lifetime of this request.
 * @returns {Promise<{technical: Array, project: Array, behavioral: Array, hr: Array}>}
 */
const generateInterviewQuestions = async ({ parsedResume, analysis, ats, jdMatch, rewrite, regeneration }) => {
  if (!parsedResume || typeof parsedResume !== 'object') {
    throw new ApiError(400, 'A parsed resume is required to generate interview questions.');
  }

  if (!analysis || typeof analysis !== 'object') {
    throw new ApiError(400, 'AI analysis is required to generate interview questions.');
  }

  if (!ats || typeof ats !== 'object') {
    throw new ApiError(400, 'An ATS result is required to generate interview questions.');
  }

  if (!jdMatch || typeof jdMatch !== 'object') {
    throw new ApiError(400, 'A job description match result is required to generate interview questions.');
  }

  if (!rewrite || typeof rewrite !== 'object') {
    throw new ApiError(400, 'A resume rewrite result is required to generate interview questions.');
  }

  const prompt = buildInterviewPrompt({ parsedResume, analysis, ats, jdMatch, rewrite, regeneration });

  let rawText;
  try {
    rawText = await geminiProvider.generateAnalysis(prompt);
  } catch (error) {
    if (error instanceof geminiProvider.AIProviderError) {
      logger.error(`Interview question generation failed (${error.kind}): ${error.message}`);
      throw new ApiError(
        STATUS_BY_ERROR_KIND[error.kind] || 502,
        MESSAGE_BY_ERROR_KIND[error.kind] || MESSAGE_BY_ERROR_KIND.unknown
      );
    }

    logger.error('Interview question generation failed unexpectedly:', error.message);
    throw new ApiError(502, MESSAGE_BY_ERROR_KIND.unknown);
  }

  return normalizeInterviewResponse(rawText);
};

module.exports = { generateInterviewQuestions };
