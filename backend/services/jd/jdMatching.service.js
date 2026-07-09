/**
 * Compares JD-derived signal (from jdParser.service.js) against a parsed
 * resume. Pure detection only — no scoring math and no user-facing text
 * lives here; jdScoring.service.js turns this output into the final
 * match result.
 *
 * No network calls. No Gemini. No randomness.
 */

const { tokenize } = require('./jdParser.service');
const { getAliasTerms } = require('../../utils/skillAliases');

const toSafeArray = (value) => (Array.isArray(value) ? value : []);
const toSafeString = (value) => (typeof value === 'string' ? value : '');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Lowercased, trimmed set of the resume's own listed skills. */
const buildResumeSkillsSet = (parsedResume) => {
  const rawSkills = toSafeArray(parsedResume?.sections?.skills);
  return new Set(
    rawSkills
      .map((skill) => toSafeString(skill).trim().toLowerCase())
      .filter((skill) => skill.length > 0)
  );
};

/**
 * Flattens the whole resume (raw text + every section) into one
 * lowercase string, so a skill mentioned in "Experience" or "Projects"
 * but not explicitly listed under "Skills" still counts as a match.
 */
const buildResumeCorpus = (parsedResume) => {
  const rawText = toSafeString(parsedResume?.rawText);
  const sections = parsedResume?.sections || {};

  const sectionText = Object.values(sections)
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .filter((value) => typeof value === 'string')
    .join(' ');

  return `${rawText} ${sectionText}`.toLowerCase();
};

/** True if `term` (which may be a multi-word phrase) appears as a whole match inside `corpus`. */
const corpusContainsTerm = (corpus, term) => {
  const pattern = new RegExp(`(?<![a-zA-Z0-9])${escapeRegex(term.toLowerCase())}(?![a-zA-Z0-9])`, 'i');
  return pattern.test(corpus);
};

/**
 * Splits JD skills into matched/missing based on whether the resume's
 * skills list or overall corpus mentions each one — checking every
 * known alias of that skill (e.g. "React" also matches "React.js" or
 * "ReactJS" in the resume), not just the exact canonical label text.
 */
const matchSkills = (jdSkills, parsedResume) => {
  const resumeSkillsSet = buildResumeSkillsSet(parsedResume);
  const corpus = buildResumeCorpus(parsedResume);

  const matchedSkills = [];
  const missingSkills = [];

  for (const skill of jdSkills) {
    const candidateTerms = getAliasTerms(skill);
    const detected =
      candidateTerms.some((term) => resumeSkillsSet.has(term)) ||
      candidateTerms.some((term) => corpusContainsTerm(corpus, term));

    if (detected) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  }

  return { matchedSkills, missingSkills };
};

/** Returns the subset of JD keywords that also appear somewhere in the resume. */
const matchKeywords = (jdKeywords, parsedResume) => {
  const corpus = buildResumeCorpus(parsedResume);
  const resumeTokenSet = new Set(tokenize(corpus));

  return jdKeywords.filter((keyword) => resumeTokenSet.has(keyword.toLowerCase()));
};

module.exports = {
  matchSkills,
  matchKeywords,
  buildResumeSkillsSet,
  buildResumeCorpus,
};
