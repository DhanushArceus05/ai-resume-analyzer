/**
 * Turns the raw matched/missing signal produced by jdMatching.service.js
 * into the final scored, explainable result. All scoring math and all
 * user-facing recommendation text lives here — jdMatching.service.js
 * never assigns points, and jdMatching's output is treated as pure input.
 */

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const SKILLS_WEIGHT = 70;
const KEYWORDS_WEIGHT = 30;

const LABEL_THRESHOLDS = [
  { min: 90, label: 'Excellent Match' },
  { min: 75, label: 'Strong Match' },
  { min: 60, label: 'Moderate Match' },
  { min: 40, label: 'Weak Match' },
  { min: 0, label: 'Poor Match' },
];

const getLabel = (matchScore) => {
  const match = LABEL_THRESHOLDS.find((tier) => matchScore >= tier.min);
  return match ? match.label : 'Poor Match';
};

/**
 * Weighted blend of skill coverage and general keyword overlap.
 * If the JD contained no recognizable dictionary skills at all, the
 * score falls back fully onto keyword overlap rather than penalizing
 * the resume for a JD we couldn't extract structured skills from.
 */
const calculateMatchScore = ({ matchedSkillsCount, totalJdSkills, keywordOverlapCount, totalJdKeywords }) => {
  const keywordRatio = totalJdKeywords > 0 ? keywordOverlapCount / totalJdKeywords : 0;

  if (totalJdSkills === 0) {
    return Math.round(clamp(keywordRatio * 100, 0, 100));
  }

  const skillsRatio = matchedSkillsCount / totalJdSkills;
  const score = skillsRatio * SKILLS_WEIGHT + keywordRatio * KEYWORDS_WEIGHT;

  return Math.round(clamp(score, 0, 100));
};

/**
 * Builds actionable, deterministic recommendations. Prioritizes the
 * missing skills the JD most emphasizes; when nothing is missing it
 * falls back to the resume's existing ATS/AI-analysis findings so the
 * user still gets forward-looking advice.
 */
const buildRecommendations = ({ missingSkills, atsResult, analysis }) => {
  const recommendations = [];

  for (const skill of missingSkills.slice(0, 5)) {
    recommendations.push(
      `Add experience or a mention of ${skill} — it appears in the job description but not in your resume.`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      'Your resume already covers the key skills mentioned in this job description.'
    );

    const atsImprovement = Array.isArray(atsResult?.topImprovements) ? atsResult.topImprovements[0] : null;
    const aiRecommendation = Array.isArray(analysis?.recommendations) ? analysis.recommendations[0] : null;

    if (atsImprovement) {
      recommendations.push(atsImprovement);
    } else if (aiRecommendation) {
      recommendations.push(aiRecommendation);
    }
  }

  if (missingSkills.length > 5) {
    recommendations.push(
      `${missingSkills.length - 5} more skill${missingSkills.length - 5 === 1 ? '' : 's'} from the job description were not found in your resume — review the full missing skills list above.`
    );
  }

  return recommendations.slice(0, 6);
};

/**
 * @param {object} params
 * @param {string[]} params.matchedSkills
 * @param {string[]} params.missingSkills
 * @param {number} params.totalJdSkills
 * @param {string[]} params.keywordOverlap
 * @param {number} params.totalJdKeywords
 * @param {object} [params.atsResult] - Step 6 output, used only for recommendation context
 * @param {object} [params.analysis] - Step 5 output, used only for recommendation context
 */
const generateJdScore = ({
  matchedSkills,
  missingSkills,
  totalJdSkills,
  keywordOverlap,
  totalJdKeywords,
  atsResult,
  analysis,
}) => {
  const matchScore = calculateMatchScore({
    matchedSkillsCount: matchedSkills.length,
    totalJdSkills,
    keywordOverlapCount: keywordOverlap.length,
    totalJdKeywords,
  });

  const label = getLabel(matchScore);
  const recommendations = buildRecommendations({ missingSkills, atsResult, analysis });

  return { matchScore, label, recommendations };
};

module.exports = { generateJdScore, getLabel, calculateMatchScore };
