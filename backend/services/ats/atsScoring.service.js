const ApiError = require('../../utils/ApiError');
const rules = require('./atsRules.service');
const breakdown = require('./atsBreakdown.service');

/**
 * Coordinates the deterministic ATS scoring pipeline:
 *   ATS Scoring Service -> Rules Service -> Breakdown Service -> Result
 *
 * This is the ONLY module controllers should import for ATS scoring.
 * It never calls Gemini or any external provider — the AI analysis it
 * uses as input was already generated in Step 5.
 */

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const LABEL_THRESHOLDS = [
  { min: 95, label: 'Excellent' },
  { min: 85, label: 'Very Strong' },
  { min: 70, label: 'Good' },
  { min: 50, label: 'Needs Improvement' },
  { min: 0, label: 'Poor' },
];

const getLabel = (overallScore) => {
  const match = LABEL_THRESHOLDS.find((tier) => overallScore >= tier.min);
  return match ? match.label : 'Poor';
};

/**
 * Confidence reflects how much resume data we had to work with — not
 * how good the resume is. A short/sparse parse should never produce a
 * high-confidence score even if the little data present looks good.
 */
const calculateConfidence = ({ completenessFields, textSignal, aiSignal }) => {
  const detectedRatio = completenessFields.filter((f) => f.detected).length / completenessFields.length;
  const sectionsContribution = detectedRatio * 50;

  let textContribution;
  if (!textSignal.hasRawText) {
    textContribution = 0;
  } else if (textSignal.wordCount >= 150) {
    textContribution = 30;
  } else if (textSignal.wordCount >= 50) {
    textContribution = 20;
  } else if (textSignal.wordCount > 0) {
    textContribution = 10;
  } else {
    textContribution = 0;
  }

  const totalAiItems = aiSignal.strengthsCount + aiSignal.weaknessesCount + aiSignal.recommendationsCount;
  let aiContribution;
  if (totalAiItems >= 6) aiContribution = 20;
  else if (totalAiItems >= 3) aiContribution = 12;
  else if (totalAiItems >= 1) aiContribution = 6;
  else aiContribution = 0;

  let confidence = sectionsContribution + textContribution + aiContribution;

  // Missing raw text entirely is a strong signal the parse was unreliable,
  // regardless of what individual fields happened to be detected.
  if (!textSignal.hasRawText) {
    confidence = Math.min(confidence, 40);
  }

  return Math.round(clamp(confidence, 0, 100));
};

/**
 * Picks the most actionable improvements across all categories,
 * prioritizing categories that lost the most points.
 */
const buildTopImprovements = (breakdownResult) => {
  const categoriesByDeficit = Object.values(breakdownResult)
    .map((category) => ({ ...category, deficit: category.maxScore - category.score }))
    .filter((category) => category.deficit > 0 && category.lostPoints.length > 0)
    .sort((a, b) => b.deficit - a.deficit);

  const improvements = [];
  for (const category of categoriesByDeficit) {
    for (const point of category.lostPoints) {
      if (!improvements.includes(point)) {
        improvements.push(point);
      }
      if (improvements.length >= 5) break;
    }
    if (improvements.length >= 5) break;
  }

  if (improvements.length === 0) {
    improvements.push('No major issues detected — keep refining measurable achievements.');
  }

  return improvements;
};

/**
 * @param {object} parsedResume - output of resumeNormalizer.service.js
 * @param {object} analysis - output of Step 5's aiAnalysis.service.js
 * @returns {{overallScore:number, label:string, confidence:number, breakdown:object, topImprovements:string[]}}
 */
const generateAtsScore = (parsedResume, analysis) => {
  if (!parsedResume || typeof parsedResume !== 'object') {
    throw new ApiError(400, 'A parsed resume is required to generate an ATS score.');
  }

  if (!analysis || typeof analysis !== 'object') {
    throw new ApiError(400, 'AI analysis is required to generate an ATS score.');
  }

  const completenessFields = rules.detectCompletenessFields(parsedResume);
  const skillsSignal = rules.analyzeSkills(parsedResume);
  const experienceSignal = rules.analyzeExperience(parsedResume);
  const educationSignal = rules.analyzeEducation(parsedResume);
  const projectsSignal = rules.analyzeProjects(parsedResume);
  const aiSignal = rules.analyzeAIBonusSignals(analysis);
  const textSignal = rules.analyzeTextSignals(parsedResume);

  const breakdownResult = {
    resumeCompleteness: breakdown.buildResumeCompletenessBreakdown(completenessFields),
    skills: breakdown.buildSkillsBreakdown(skillsSignal),
    experience: breakdown.buildExperienceBreakdown(experienceSignal, projectsSignal),
    education: breakdown.buildEducationBreakdown(educationSignal),
    projects: breakdown.buildProjectsBreakdown(projectsSignal),
    aiBonus: breakdown.buildAIBonusBreakdown(aiSignal),
  };

  const overallScore = clamp(
    Object.values(breakdownResult).reduce((sum, category) => sum + category.score, 0),
    0,
    100
  );

  const label = getLabel(overallScore);
  const confidence = calculateConfidence({ completenessFields, textSignal, aiSignal });
  const topImprovements = buildTopImprovements(breakdownResult);

  return {
    overallScore,
    label,
    confidence,
    breakdown: breakdownResult,
    topImprovements,
  };
};

module.exports = { generateAtsScore };
