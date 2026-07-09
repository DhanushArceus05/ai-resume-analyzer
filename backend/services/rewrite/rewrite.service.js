const ApiError = require('../../utils/ApiError');
const logger = require('../../utils/logger');
const { buildResumeRewritePrompt, buildRewriteRevisionPrompt } = require('./rewritePromptBuilder.service');
const { normalizeRewriteResponse } = require('./rewriteNormalizer.service');
const {
  needsRevision,
  similarityRatio,
  isStructuralLine,
  SIMILARITY_THRESHOLD,
} = require('./rewriteSimilarity.util');
const geminiProvider = require('../ai/providers/gemini.provider');

/**
 * Coordinates the Step 8 resume rewrite pipeline:
 *   Rewrite Service -> Rewrite Prompt Builder -> Gemini Provider -> Rewrite Normalizer
 *
 * Controllers should only ever call `generateResumeRewrite` from this
 * module. They must never import the prompt builder, the normalizer, or
 * the Gemini provider directly.
 *
 * This module reuses the exact same Gemini provider as Step 5's AI
 * analysis (services/ai/providers/gemini.provider.js) — no provider
 * logic is duplicated.
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
  unknown: 'We could not rewrite this resume right now. Please try again.',
};

// Bounds the follow-up "revise these lines" prompt so a very long resume
// can't turn one rewrite request into an unbounded number of extra calls.
const MAX_REVISION_LINES = 20;

const stripCodeFences = (text) => {
  const trimmed = text.trim();
  if (!trimmed.startsWith('```')) return trimmed;
  return trimmed
    .replace(/^```[a-zA-Z]*\n?/, '')
    .replace(/```\s*$/, '')
    .trim();
};

const extractJsonBlock = (text) => {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) return null;
  return text.slice(start, end + 1);
};

const stripTrailingCommas = (text) => text.replace(/,(\s*[}\]])/g, '$1');

/**
 * Parses the revision pass's `{ "revisions": [...] }` response. Scoped
 * to this one internal shape (never exposed to the frontend), so it's
 * kept local rather than reusing rewriteNormalizer.service.js, whose
 * parsing is tied to the public rewrite response contract. Returns
 * null on anything unusable — the caller treats that as "skip the
 * revision pass", never as a hard failure.
 */
const parseRevisionLines = (rawText, expectedLength) => {
  const cleaned = stripCodeFences(rawText);

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const block = extractJsonBlock(cleaned);
    if (!block) return null;
    try {
      parsed = JSON.parse(block);
    } catch {
      try {
        parsed = JSON.parse(stripTrailingCommas(block));
      } catch {
        return null;
      }
    }
  }

  if (!parsed || !Array.isArray(parsed.revisions) || parsed.revisions.length !== expectedLength) {
    return null;
  }

  return parsed.revisions;
};

/**
 * Best-effort quality gate that runs after the main rewrite pass: scans
 * the normalized result for descriptive lines whose rewrite is still
 * too close to the original (see rewriteSimilarity.util.js), and — only
 * if any are found — sends one bounded follow-up prompt asking the
 * model to reword just those lines more substantially. Never throws:
 * if the flagged set is empty, or the follow-up call/parse fails for
 * any reason, the first-pass result is returned unchanged. This never
 * changes the response shape — it only ever overwrites `.rewritten`
 * strings already present on the object.
 */
const applyRevisionPass = async (result) => {
  const flagged = [];

  if (needsRevision(result.sections.summary.original, result.sections.summary.rewritten)) {
    flagged.push({ location: 'summary', original: result.sections.summary.original });
  }

  result.sections.experience.forEach((item, index) => {
    if (needsRevision(item.original, item.rewritten)) {
      flagged.push({ location: 'experience', index, original: item.original });
    }
  });

  result.sections.projects.forEach((item, index) => {
    if (needsRevision(item.original, item.rewritten)) {
      flagged.push({ location: 'projects', index, original: item.original });
    }
  });

  if (flagged.length === 0) {
    return result;
  }

  const boundedFlagged = flagged.slice(0, MAX_REVISION_LINES);
  const revisionPrompt = buildRewriteRevisionPrompt({
    lines: boundedFlagged.map((item) => item.original),
  });

  let revisions;
  try {
    const rawRevisionText = await geminiProvider.generateAnalysis(revisionPrompt);
    revisions = parseRevisionLines(rawRevisionText, boundedFlagged.length);
  } catch (error) {
    logger.warn(`Resume rewrite revision pass skipped: ${error.message}`);
    return result;
  }

  if (!revisions) {
    return result;
  }

  boundedFlagged.forEach((flaggedItem, i) => {
    const revisedText = revisions[i];
    if (typeof revisedText !== 'string' || !revisedText.trim()) return;

    if (flaggedItem.location === 'summary') {
      result.sections.summary.rewritten = revisedText.trim();
    } else {
      result.sections[flaggedItem.location][flaggedItem.index].rewritten = revisedText.trim();
    }
  });

  return result;
};

/**
 * Phase 5 (Premium Release): labels each line so the frontend can tell
 * the user *why* a line looks unchanged, instead of it just looking
 * like nothing happened. This is purely additive — it only adds a
 * `status` (and, for the "already strong" case, a short `note`) field
 * onto objects that already carry `original`/`rewritten`. It never
 * removes or renames an existing field, so callers that only read
 * `original`/`rewritten` keep working exactly as before.
 *
 * Three statuses:
 *  - "kept": a structural line (title, company, dates) that the rewrite
 *    prompt intentionally leaves alone.
 *  - "already-strong": a descriptive line whose wording survived the
 *    revision pass still ~90%+ similar to the original — i.e. Gemini
 *    judged it solid rather than skipping it.
 *  - "improved": a descriptive line that was meaningfully reworded.
 */
const describeLineQuality = (original, rewritten) => {
  if (isStructuralLine(original)) {
    return { status: 'kept' };
  }

  if (similarityRatio(original, rewritten) >= SIMILARITY_THRESHOLD) {
    return {
      status: 'already-strong',
      note: 'This line was already strong, so we kept your original wording.',
    };
  }

  return { status: 'improved' };
};

const annotateLineArray = (items) =>
  items.map((item) => ({ ...item, ...describeLineQuality(item.original, item.rewritten) }));

/**
 * Applies describeLineQuality across the full result. Runs after
 * applyRevisionPass so the label reflects the final wording (post
 * second-pass), not the first draft.
 */
const annotateRewriteQuality = (result) => ({
  sections: {
    summary: {
      ...result.sections.summary,
      ...describeLineQuality(result.sections.summary.original, result.sections.summary.rewritten),
    },
    experience: annotateLineArray(result.sections.experience),
    projects: annotateLineArray(result.sections.projects),
  },
});

/**
 * Runs the resume rewrite on an already-parsed resume, using the prior
 * Step 5/6/7 results only as guidance context (never as new facts).
 *
 * @param {object} params
 * @param {object} params.parsedResume - output of resumeNormalizer.service.js
 * @param {object} params.analysis - output of Step 5's aiAnalysis.service.js
 * @param {object} params.ats - output of Step 6's atsScoring.service.js
 * @param {object} params.jdMatch - output of Step 7's jd/index.js
 * @returns {Promise<{sections: {summary: object, experience: Array, projects: Array}}>}
 */
const generateResumeRewrite = async ({ parsedResume, analysis, ats, jdMatch }) => {
  if (!parsedResume || typeof parsedResume !== 'object') {
    throw new ApiError(400, 'A parsed resume is required to generate a rewrite.');
  }

  if (!analysis || typeof analysis !== 'object') {
    throw new ApiError(400, 'AI analysis is required to generate a rewrite.');
  }

  if (!ats || typeof ats !== 'object') {
    throw new ApiError(400, 'An ATS result is required to generate a rewrite.');
  }

  if (!jdMatch || typeof jdMatch !== 'object') {
    throw new ApiError(400, 'A job description match result is required to generate a rewrite.');
  }

  const sections = parsedResume.sections || {};
  const originalSections = {
    summary: sections.summary || null,
    experience: Array.isArray(sections.experience) ? sections.experience : [],
    projects: Array.isArray(sections.projects) ? sections.projects : [],
  };

  const hasContent =
    Boolean(originalSections.summary) ||
    originalSections.experience.length > 0 ||
    originalSections.projects.length > 0;

  if (!hasContent) {
    throw new ApiError(
      400,
      'This resume does not have a summary, experience, or projects section to rewrite.'
    );
  }

  const prompt = buildResumeRewritePrompt({ parsedResume, analysis, ats, jdMatch });

  let rawText;
  try {
    rawText = await geminiProvider.generateAnalysis(prompt);
  } catch (error) {
    if (error instanceof geminiProvider.AIProviderError) {
      logger.error(`Resume rewrite failed (${error.kind}): ${error.message}`);
      throw new ApiError(
        STATUS_BY_ERROR_KIND[error.kind] || 502,
        MESSAGE_BY_ERROR_KIND[error.kind] || MESSAGE_BY_ERROR_KIND.unknown
      );
    }

    logger.error('Resume rewrite failed unexpectedly:', error.message);
    throw new ApiError(502, MESSAGE_BY_ERROR_KIND.unknown);
  }

  const result = normalizeRewriteResponse(rawText, originalSections);
  const revised = await applyRevisionPass(result);

  return annotateRewriteQuality(revised);
};

module.exports = { generateResumeRewrite };
