const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const storageService = require('../services/storage');
const { parseResume } = require('../services/parser/resumeParser.service');
const aiAnalysisService = require('../services/ai');
const atsService = require('../services/ats');
const jdService = require('../services/jd');
const rewriteService = require('../services/rewrite');
const interviewService = require('../services/interview');
const logger = require('../utils/logger');

/**
 * POST /api/resume/upload
 * Stores the uploaded resume file, then attempts to extract and
 * normalize its text into a structured resume object. Parsing is
 * deterministic only (regex/heading detection) — no AI is involved.
 *
 * Storage and parsing both read `req.file`'s buffer independently and
 * don't depend on each other's result, so they run concurrently via
 * Promise.all rather than one after another — this doesn't change
 * either operation's own logic, only removes the artificial wait
 * between two unrelated pieces of I/O.
 *
 * A parsing failure does not fail the request: the file has already
 * been stored successfully, so the response still returns 201 with
 * `parsedResume: null` and a human-readable `parseError`.
 */
const uploadResume = async (req, res, next) => {
  if (!req.file) {
    return next(new ApiError(400, 'No file was uploaded'));
  }

  let parseError = null;

  // storageService.saveFile is allowed to reject the whole request (as
  // before); parseResume's failure is caught inline so it can never do
  // so — settling it into a plain {ok, value/error} result keeps that
  // same "parsing failure is non-fatal" behavior while still letting
  // both promises run concurrently.
  const [file, parseOutcome] = await Promise.all([
    storageService.saveFile(req.file),
    parseResume(req.file).then(
      (value) => ({ ok: true, value }),
      (error) => ({ ok: false, error })
    ),
  ]);

  let parsedResume = null;
  if (parseOutcome.ok) {
    parsedResume = parseOutcome.value;
  } else {
    logger.error('Resume parsing failed:', parseOutcome.error.message);
    parseError = 'We stored your resume, but were unable to read its text content automatically.';
  }

  return sendSuccess(res, {
    statusCode: 201,
    message: parsedResume
      ? 'Resume uploaded and parsed successfully'
      : 'Resume uploaded successfully, but parsing failed',
    data: { file, parsedResume, parseError },
  });
};

/**
 * POST /api/resume/analyze
 * Runs AI analysis on an already-parsed resume object. This route does
 * NOT parse files and does NOT touch storage — it only coordinates
 * with the AI services module, which owns all Gemini-related logic.
 */
const analyzeResume = async (req, res, next) => {
  const { parsedResume } = req.body;

  if (!parsedResume) {
    return next(new ApiError(400, 'parsedResume is required in the request body'));
  }

  const analysis = await aiAnalysisService.analyzeResume(parsedResume);

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Resume analyzed successfully',
    data: { analysis },
  });
};

/**
 * POST /api/resume/ats
 * Generates a deterministic, explainable ATS score from an already-
 * parsed resume and an already-generated AI analysis (Step 5's
 * output). This route does NOT call Gemini — the ATS service is
 * pure rule-based scoring.
 */
const generateAts = async (req, res, next) => {
  const { parsedResume, analysis } = req.body;

  if (!parsedResume) {
    return next(new ApiError(400, 'parsedResume is required in the request body'));
  }

  if (!analysis) {
    return next(new ApiError(400, 'analysis is required in the request body'));
  }

  const ats = atsService.generateAtsScore(parsedResume, analysis);

  return sendSuccess(res, {
    statusCode: 200,
    message: 'ATS score generated successfully',
    data: { ats },
  });
};

/**
 * POST /api/resume/jd-match
 * Compares an already-parsed resume, its AI analysis (Step 5), and its
 * ATS result (Step 6) against a pasted job description. This route
 * does NOT call Gemini — the JD service is pure rule-based matching.
 */
const matchJobDescription = async (req, res, next) => {
  const { parsedResume, ats, analysis, jobDescription } = req.body;

  if (!parsedResume) {
    return next(new ApiError(400, 'parsedResume is required in the request body'));
  }

  if (!ats) {
    return next(new ApiError(400, 'ats is required in the request body'));
  }

  if (!analysis) {
    return next(new ApiError(400, 'analysis is required in the request body'));
  }

  if (!jobDescription) {
    return next(new ApiError(400, 'jobDescription is required in the request body'));
  }

  const match = jdService.generateJdMatch({ parsedResume, ats, analysis, jobDescription });

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Job description match generated successfully',
    data: { match },
  });
};

/**
 * POST /api/resume/rewrite
 * Generates an improved rewrite of the resume's summary, experience,
 * and project lines (Step 8), using the parsed resume plus the prior
 * AI analysis (Step 5), ATS result (Step 6), and JD match (Step 7) only
 * as guidance context. This route does NOT parse files or touch
 * storage — it only coordinates with the rewrite services module,
 * which owns all Gemini-related logic for this feature.
 */
const rewriteResume = async (req, res, next) => {
  const { parsedResume, analysis, ats, jdMatch } = req.body;

  if (!parsedResume) {
    return next(new ApiError(400, 'parsedResume is required in the request body'));
  }

  if (!analysis) {
    return next(new ApiError(400, 'analysis is required in the request body'));
  }

  if (!ats) {
    return next(new ApiError(400, 'ats is required in the request body'));
  }

  if (!jdMatch) {
    return next(new ApiError(400, 'jdMatch is required in the request body'));
  }

  const rewrite = await rewriteService.generateResumeRewrite({ parsedResume, analysis, ats, jdMatch });

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Resume rewrite generated successfully',
    data: { rewrite },
  });
};

/**
 * POST /api/resume/interview
 * Generates personalized interview questions (technical, project,
 * behavioral, HR) from the parsed resume (Step 9), using the prior AI
 * analysis (Step 5), ATS result (Step 6), JD match (Step 7), and resume
 * rewrite (Step 8) only as guidance context. This route does NOT parse
 * files or touch storage — it only coordinates with the interview
 * services module, which owns all Gemini-related logic for this feature.
 */
const generateInterviewQuestions = async (req, res, next) => {
  const { parsedResume, analysis, ats, jdMatch, rewrite, regeneration } = req.body;

  if (!parsedResume) {
    return next(new ApiError(400, 'parsedResume is required in the request body'));
  }

  if (!analysis) {
    return next(new ApiError(400, 'analysis is required in the request body'));
  }

  if (!ats) {
    return next(new ApiError(400, 'ats is required in the request body'));
  }

  if (!jdMatch) {
    return next(new ApiError(400, 'jdMatch is required in the request body'));
  }

  if (!rewrite) {
    return next(new ApiError(400, 'rewrite is required in the request body'));
  }

  const interview = await interviewService.generateInterviewQuestions({
    parsedResume,
    analysis,
    ats,
    jdMatch,
    rewrite,
    regeneration,
  });

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Interview questions generated successfully',
    data: { interview },
  });
};

module.exports = {
  uploadResume,
  analyzeResume,
  generateAts,
  matchJobDescription,
  rewriteResume,
  generateInterviewQuestions,
};
