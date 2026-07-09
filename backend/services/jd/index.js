/**
 * Public entry point for the JD (job description) matching module.
 * Controllers must import from here (`require('../services/jd')`)
 * rather than reaching into jdParser.service.js, jdMatching.service.js,
 * or jdScoring.service.js directly.
 *
 * Pipeline:
 *   JD Parser (extract skills/keywords)
 *   -> JD Matching (compare against resume)
 *   -> JD Scoring (score, label, recommendations)
 *
 * Entirely deterministic — this module never calls Gemini or any
 * external provider. It reuses the AI analysis (Step 5) and ATS result
 * (Step 6) only as optional context for recommendation text.
 */
const ApiError = require('../../utils/ApiError');
const { extractSkillsFromJD, extractKeywords } = require('./jdParser.service');
const { matchSkills, matchKeywords } = require('./jdMatching.service');
const { generateJdScore } = require('./jdScoring.service');

const MIN_JD_LENGTH = 50;
const MIN_JD_WORD_COUNT = 10;

/**
 * @param {object} params
 * @param {object} params.parsedResume - output of resumeNormalizer.service.js
 * @param {object} params.ats - output of Step 6's atsScoring.service.js (context only)
 * @param {object} params.analysis - output of Step 5's aiAnalysis.service.js (context only)
 * @param {string} params.jobDescription - raw job description text
 * @returns {{matchScore:number, label:string, matchedSkills:string[], missingSkills:string[], keywordOverlap:string[], recommendations:string[]}}
 */
const generateJdMatch = ({ parsedResume, ats, analysis, jobDescription }) => {
  if (!parsedResume || typeof parsedResume !== 'object') {
    throw new ApiError(400, 'A parsed resume is required to generate a job description match.');
  }

  if (!ats || typeof ats !== 'object') {
    throw new ApiError(400, 'An ATS result is required to generate a job description match.');
  }

  if (!analysis || typeof analysis !== 'object') {
    throw new ApiError(400, 'AI analysis is required to generate a job description match.');
  }

  if (typeof jobDescription !== 'string' || !jobDescription.trim()) {
    throw new ApiError(400, 'A job description is required.');
  }

  const trimmedJD = jobDescription.trim();
  const wordCount = trimmedJD.split(/\s+/).filter(Boolean).length;

  if (trimmedJD.length < MIN_JD_LENGTH || wordCount < MIN_JD_WORD_COUNT) {
    throw new ApiError(
      400,
      'Job description is too short to analyze. Please paste the full job description.'
    );
  }

  const jdSkills = extractSkillsFromJD(trimmedJD);
  const jdKeywords = extractKeywords(trimmedJD, { exclude: jdSkills });

  const { matchedSkills, missingSkills } = matchSkills(jdSkills, parsedResume);
  const keywordOverlap = matchKeywords(jdKeywords, parsedResume);

  const { matchScore, label, recommendations } = generateJdScore({
    matchedSkills,
    missingSkills,
    totalJdSkills: jdSkills.length,
    keywordOverlap,
    totalJdKeywords: jdKeywords.length,
    atsResult: ats,
    analysis,
  });

  return {
    matchScore,
    label,
    matchedSkills,
    missingSkills,
    keywordOverlap,
    recommendations,
  };
};

module.exports = { generateJdMatch };
