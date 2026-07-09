const ApiError = require('../../utils/ApiError');

/**
 * Validates and cleans the raw text returned by the AI provider for the
 * interview question generator (Step 9) into the exact shape the API
 * guarantees to the frontend.
 *
 * The JSON-extraction strategy (strip code fences, fall back to the
 * outermost {...} block) intentionally mirrors
 * ai/responseNormalizer.service.js and rewrite/rewriteNormalizer.service.js.
 * It is kept self-contained here rather than imported, since each module
 * owns its own output shape and validation rules.
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

const VALID_DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

const EXPECTED_COUNTS = { technical: 5, project: 5, behavioral: 3, hr: 2 };

/**
 * Cleans one category's question list: drops malformed entries (missing
 * question/whyAsked text), defaults an invalid/missing difficulty to
 * "Medium" rather than failing the whole request, and caps the list at
 * the expected count for that category. A short list (fewer valid
 * questions than expected) is returned as-is rather than padded with
 * fabricated questions.
 */
const normalizeQuestionList = (rawList, expectedCount) => {
  if (!Array.isArray(rawList)) {
    return [];
  }

  const cleaned = rawList
    .filter((item) => item && typeof item === 'object' && !Array.isArray(item))
    .map((item) => {
      const question = typeof item.question === 'string' ? item.question.trim() : '';
      const whyAsked = typeof item.whyAsked === 'string' ? item.whyAsked.trim() : '';
      const difficulty = VALID_DIFFICULTIES.includes(item.difficulty) ? item.difficulty : 'Medium';

      return { question, whyAsked, difficulty };
    })
    .filter((item) => item.question.length > 0 && item.whyAsked.length > 0);

  return cleaned.slice(0, expectedCount);
};

/**
 * @param {string} rawText - raw model output
 * @returns {{technical: Array, project: Array, behavioral: Array, hr: Array}}
 * Throws ApiError(502, ...) if the response can't be salvaged into
 * anything usable at all.
 */
const normalizeInterviewResponse = (rawText) => {
  const parsed = parseJson(rawText);

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new ApiError(502, 'The AI response was in an unexpected format.');
  }

  const normalized = {
    technical: normalizeQuestionList(parsed.technical, EXPECTED_COUNTS.technical),
    project: normalizeQuestionList(parsed.project, EXPECTED_COUNTS.project),
    behavioral: normalizeQuestionList(parsed.behavioral, EXPECTED_COUNTS.behavioral),
    hr: normalizeQuestionList(parsed.hr, EXPECTED_COUNTS.hr),
  };

  const totalQuestions =
    normalized.technical.length +
    normalized.project.length +
    normalized.behavioral.length +
    normalized.hr.length;

  if (totalQuestions === 0) {
    throw new ApiError(502, 'The AI response did not contain any usable interview questions.');
  }

  return normalized;
};

module.exports = { normalizeInterviewResponse };
