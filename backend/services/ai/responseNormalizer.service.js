const ApiError = require('../../utils/ApiError');

/**
 * Validates and cleans the raw text returned by the AI provider into
 * the exact shape the API guarantees to the frontend. This is the only
 * place in the codebase that trusts-but-verifies AI output — nothing
 * downstream should ever have to defend against malformed AI data.
 */

const stripCodeFences = (text) => {
  const trimmed = text.trim();

  if (!trimmed.startsWith('```')) {
    return trimmed;
  }

  return trimmed
    .replace(/^```[a-zA-Z]*\n?/, '')
    .replace(/```\s*$/, '')
    .trim();
};

/**
 * Fallback for when the model wraps the JSON in extra prose despite
 * instructions not to: grabs the outermost {...} block.
 */
const extractJsonBlock = (text) => {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');

  if (start === -1 || end === -1 || end < start) {
    return null;
  }

  return text.slice(start, end + 1);
};

/**
 * Repairs the most common way Gemini produces near-valid JSON: a
 * trailing comma before a closing `}` or `]`. Applied only as a last
 * resort after both direct parsing and brace-extraction have failed.
 */
const stripTrailingCommas = (text) => text.replace(/,(\s*[}\]])/g, '$1');

const parseJson = (rawText) => {
  const cleaned = stripCodeFences(rawText);

  try {
    return JSON.parse(cleaned);
  } catch (initialError) {
    const block = extractJsonBlock(cleaned);
    if (!block) {
      throw new ApiError(502, 'The AI response could not be understood. Please try again.');
    }

    try {
      return JSON.parse(block);
    } catch (secondError) {
      try {
        return JSON.parse(stripTrailingCommas(block));
      } catch (thirdError) {
        throw new ApiError(502, 'The AI response could not be understood. Please try again.');
      }
    }
  }
};

const toStringArray = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item) => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim());
};

/**
 * Parses and validates the raw model output into:
 * { overallSummary, strengths, weaknesses, recommendations }
 * Throws ApiError(502, ...) if the response can't be salvaged into
 * something usable.
 */
const normalizeAnalysisResponse = (rawText) => {
  const parsed = parseJson(rawText);

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new ApiError(502, 'The AI response was in an unexpected format.');
  }

  const overallSummary =
    typeof parsed.overallSummary === 'string' && parsed.overallSummary.trim().length > 0
      ? parsed.overallSummary.trim()
      : 'No summary was returned for this resume.';

  const normalized = {
    overallSummary,
    strengths: toStringArray(parsed.strengths),
    weaknesses: toStringArray(parsed.weaknesses),
    recommendations: toStringArray(parsed.recommendations),
  };

  const isEffectivelyEmpty =
    normalized.strengths.length === 0 &&
    normalized.weaknesses.length === 0 &&
    normalized.recommendations.length === 0;

  if (isEffectivelyEmpty) {
    throw new ApiError(502, 'The AI response did not contain usable analysis data.');
  }

  return normalized;
};

module.exports = { normalizeAnalysisResponse };
