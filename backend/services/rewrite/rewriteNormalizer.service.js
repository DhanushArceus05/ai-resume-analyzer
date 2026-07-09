const ApiError = require('../../utils/ApiError');

/**
 * Validates and cleans the raw text returned by the AI provider for the
 * resume rewrite task (Step 8) into the exact shape the API guarantees
 * to the frontend.
 *
 * The JSON-extraction strategy (strip code fences, fall back to the
 * outermost {...} block) intentionally mirrors
 * ai/responseNormalizer.service.js. It is kept self-contained here
 * rather than imported, since rewrite has its own output shape and its
 * own reconciliation step against the original resume text below.
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

/**
 * Zips the model's rewritten lines onto the ORIGINAL resume lines by
 * index, so the response sent to the frontend can never contain
 * "original" text that didn't come directly from the parsed resume.
 * The model is only ever trusted for the "rewritten" half of each pair.
 * If the model omits an item, returns a non-string, or returns fewer
 * items than expected, that entry falls back to the original text
 * unchanged rather than failing the whole request.
 */
const buildLineArray = (originalLines, rewrittenLines) => {
  const rewritten = Array.isArray(rewrittenLines) ? rewrittenLines : [];

  return originalLines.map((original, index) => {
    const candidate = rewritten[index];
    const rewrittenText =
      typeof candidate === 'string' && candidate.trim().length > 0 ? candidate.trim() : original;

    return { original, rewritten: rewrittenText };
  });
};

/**
 * @param {string} rawText - raw model output
 * @param {object} originalSections - { summary: string|null, experience: string[], projects: string[] }
 *   pulled directly from the parsed resume by rewrite.service.js — never from the model.
 * @returns {{sections: {summary: {original:string, rewritten:string}, experience: Array, projects: Array}}}
 */
const normalizeRewriteResponse = (rawText, originalSections) => {
  const parsed = parseJson(rawText);

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new ApiError(502, 'The AI response was in an unexpected format.');
  }

  const fallbackSummary = 'No summary was provided in the original resume.';
  const originalSummary = originalSections.summary || fallbackSummary;

  // NOTE: the candidate is trusted here even when there was no original
  // summary — that's the one deliberate exception to "the model only
  // rewrites existing text": when the resume had no summary at all, the
  // rewrite prompt asks the model to generate a short one from the
  // candidate's own experience/project/skills/education data (never
  // inventing new facts). If the model returns nothing usable, we fall
  // back to originalSummary exactly as before.
  const rewrittenSummaryCandidate = parsed.summary;
  const rewrittenSummary =
    typeof rewrittenSummaryCandidate === 'string' && rewrittenSummaryCandidate.trim().length > 0
      ? rewrittenSummaryCandidate.trim()
      : originalSummary;

  const summarySection = {
    original: originalSummary,
    rewritten: rewrittenSummary,
  };

  const experienceSection = buildLineArray(originalSections.experience, parsed.experience);
  const projectsSection = buildLineArray(originalSections.projects, parsed.projects);

  return {
    sections: {
      summary: summarySection,
      experience: experienceSection,
      projects: projectsSection,
    },
  };
};

module.exports = { normalizeRewriteResponse };
