/**
 * Pure, deterministic detection helpers. Nothing in this file assigns
 * points or writes user-facing text — it only inspects the parsed
 * resume / AI analysis and reports what it finds. atsBreakdown.service.js
 * is the only place that turns these signals into scores and messages.
 *
 * No network calls. No Gemini. No randomness.
 */

const { normalizeSkillLabel } = require('../../utils/skillAliases');

const toSafeArray = (value) => (Array.isArray(value) ? value : []);
const toSafeString = (value) => (typeof value === 'string' ? value : '');

const ACTION_VERB_REGEX =
  /\b(led|managed|built|develop(ed)?|design(ed)?|implement(ed)?|launch(ed)?|improv(ed)?|increas(ed)?|reduc(ed)?|optimi[sz](ed)?|creat(ed)?|architect(ed)?|deliver(ed)?|automat(ed)?|migrat(ed)?|mentor(ed)?|spearhead(ed)?|drove|scal(ed)?|deploy(ed)?|owned|shipped)\b/i;

const QUANTIFIED_RESULT_REGEX = /(\d+(\.\d+)?\s?%|\$\s?\d+([,.]\d+)?\s?[kKmMbB]?\b|\b\d{2,}\+?\s?(users|customers|requests|projects|members|countries|hours|days)\b)/i;

const DEGREE_KEYWORD_REGEX =
  /\b(bachelor|master|b\.?\s?sc\.?|b\.?\s?tech|m\.?\s?tech|mba|ph\.?d|doctorate|associate degree|diploma|b\.?\s?e\.?|m\.?\s?e\.?)\b/i;

const INSTITUTION_KEYWORD_REGEX = /\b(university|college|institute|polytechnic|school of)\b/i;

const SKILL_CATEGORY_PATTERNS = {
  languages: /\b(javascript|typescript|python|java|c\+\+|c#|golang|go|ruby|php|swift|kotlin|rust)\b/i,
  frontend: /\b(react|vue|angular|next\.?js|svelte|html|css|tailwind)\b/i,
  backend: /\b(node(\.js)?|express|django|flask|spring|rails|fastapi|\.net)\b/i,
  database: /\b(sql|mysql|postgres(ql)?|mongodb|redis|dynamodb|oracle|sqlite)\b/i,
  cloudDevops: /\b(aws|azure|gcp|docker|kubernetes|k8s|terraform|ci\/cd|jenkins|github actions)\b/i,
  aiMl:
    /\b(machine learning|deep learning|tensorflow|pytorch|scikit-learn|scikit learn|keras|pandas|numpy|nlp|computer vision|generative ai|large language model|retrieval-augmented generation|langchain|opencv|data science|neural network)\b/i,
};

const TECH_KEYWORD_REGEX = new RegExp(
  Object.values(SKILL_CATEGORY_PATTERNS)
    .map((re) => re.source)
    .join('|'),
  'i'
);

/**
 * Which top-level resume fields are present. Used for both the
 * Resume Completeness category and the confidence calculation.
 */
const detectCompletenessFields = (parsedResume) => {
  const basicInfo = parsedResume?.basicInfo || {};
  const sections = parsedResume?.sections || {};

  return [
    { key: 'name', label: 'Name', detected: Boolean(basicInfo.name) },
    { key: 'email', label: 'Email', detected: Boolean(basicInfo.email) },
    { key: 'phone', label: 'Phone', detected: Boolean(basicInfo.phone) },
    { key: 'summary', label: 'Summary', detected: Boolean(sections.summary) },
    { key: 'skills', label: 'Skills', detected: toSafeArray(sections.skills).length > 0 },
    { key: 'experience', label: 'Experience', detected: toSafeArray(sections.experience).length > 0 },
    { key: 'education', label: 'Education', detected: toSafeArray(sections.education).length > 0 },
    { key: 'projects', label: 'Projects', detected: toSafeArray(sections.projects).length > 0 },
    {
      key: 'certifications',
      label: 'Certifications',
      detected: toSafeArray(sections.certifications).length > 0,
    },
    { key: 'languages', label: 'Languages', detected: toSafeArray(sections.languages).length > 0 },
  ];
};

/**
 * Skills section signals: count, duplicates, empty entries, category diversity.
 * Deduplication and category detection are alias-aware (via
 * normalizeSkillLabel) so e.g. "JS" and "JavaScript", or "React.js" and
 * "React", are correctly treated as the same skill rather than counted
 * twice or miscategorized.
 */
const analyzeSkills = (parsedResume) => {
  const rawSkills = toSafeArray(parsedResume?.sections?.skills);
  const nonEmpty = rawSkills.map((s) => toSafeString(s).trim()).filter((s) => s.length > 0);

  const seen = new Set();
  const uniqueSkills = [];
  let duplicateCount = 0;

  for (const skill of nonEmpty) {
    const key = normalizeSkillLabel(skill).toLowerCase();
    if (seen.has(key)) {
      duplicateCount += 1;
    } else {
      seen.add(key);
      uniqueSkills.push(skill);
    }
  }

  const emptyCount = rawSkills.length - nonEmpty.length;

  const categoriesMatched = Object.keys(SKILL_CATEGORY_PATTERNS).filter((category) =>
    uniqueSkills.some((skill) => SKILL_CATEGORY_PATTERNS[category].test(normalizeSkillLabel(skill)))
  );

  return {
    totalCount: rawSkills.length,
    uniqueCount: uniqueSkills.length,
    duplicateCount,
    emptyCount,
    categoriesMatched,
  };
};

/**
 * Experience section signals: entry count, description depth,
 * action/result-oriented language.
 */
const analyzeExperience = (parsedResume) => {
  const lines = toSafeArray(parsedResume?.sections?.experience)
    .map((line) => toSafeString(line).trim())
    .filter((line) => line.length > 0);

  const entryCount = lines.length;
  const averageLength = entryCount > 0 ? lines.reduce((sum, l) => sum + l.length, 0) / entryCount : 0;
  const actionVerbHits = lines.filter((line) => ACTION_VERB_REGEX.test(line)).length;
  const quantifiedHits = lines.filter((line) => QUANTIFIED_RESULT_REGEX.test(line)).length;

  return { entryCount, averageLength, actionVerbHits, quantifiedHits };
};

/**
 * Education section signals: presence, degree/institution keywords.
 */
const analyzeEducation = (parsedResume) => {
  const lines = toSafeArray(parsedResume?.sections?.education)
    .map((line) => toSafeString(line).trim())
    .filter((line) => line.length > 0);

  const joined = lines.join(' ');

  return {
    entryCount: lines.length,
    hasDegreeKeyword: DEGREE_KEYWORD_REGEX.test(joined),
    hasInstitutionKeyword: INSTITUTION_KEYWORD_REGEX.test(joined),
  };
};

/**
 * Projects section signals: count, description depth, technical
 * keywords, measurable outcomes.
 */
const analyzeProjects = (parsedResume) => {
  const lines = toSafeArray(parsedResume?.sections?.projects)
    .map((line) => toSafeString(line).trim())
    .filter((line) => line.length > 0);

  const entryCount = lines.length;
  const averageLength = entryCount > 0 ? lines.reduce((sum, l) => sum + l.length, 0) / entryCount : 0;
  const hasTechKeyword = lines.some((line) => TECH_KEYWORD_REGEX.test(line));
  const hasQuantifiedOutcome = lines.some((line) => QUANTIFIED_RESULT_REGEX.test(line));

  return { entryCount, averageLength, hasTechKeyword, hasQuantifiedOutcome };
};

/**
 * Signals from the existing (already-generated) Gemini analysis.
 * This function never calls Gemini — it only reads the object the
 * caller already has from Step 5.
 */
const analyzeAIBonusSignals = (analysis) => {
  const strengths = toSafeArray(analysis?.strengths).filter((s) => typeof s === 'string' && s.trim());
  const weaknesses = toSafeArray(analysis?.weaknesses).filter((s) => typeof s === 'string' && s.trim());
  const recommendations = toSafeArray(analysis?.recommendations).filter(
    (s) => typeof s === 'string' && s.trim()
  );

  return {
    strengths,
    weaknesses,
    recommendations,
    strengthsCount: strengths.length,
    weaknessesCount: weaknesses.length,
    recommendationsCount: recommendations.length,
  };
};

/**
 * Raw text / metadata signals, used only for the confidence calculation.
 */
const analyzeTextSignals = (parsedResume) => {
  const rawText = toSafeString(parsedResume?.rawText);
  const wordCount = Number.isFinite(parsedResume?.metadata?.wordCount)
    ? parsedResume.metadata.wordCount
    : rawText.trim().split(/\s+/).filter(Boolean).length;

  return { hasRawText: rawText.trim().length > 0, wordCount };
};

module.exports = {
  detectCompletenessFields,
  analyzeSkills,
  analyzeExperience,
  analyzeEducation,
  analyzeProjects,
  analyzeAIBonusSignals,
  analyzeTextSignals,
};
