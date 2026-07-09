/**
 * Turns the raw signals produced by atsRules.service.js into the six
 * scored, explainable breakdown categories. All scoring math and all
 * user-facing "reason"/"lostPoints" text lives here — atsRules.service.js
 * never assigns points, and atsScoring.service.js never computes points
 * itself, it only calls these builders and aggregates their output.
 */

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const CATEGORY_MAX_SCORES = {
  resumeCompleteness: 20,
  skills: 25,
  experience: 20,
  education: 10,
  projects: 10,
  aiBonus: 15,
};

/** Resume Completeness — 20 pts (2 pts per detected field, 10 fields) */
const buildResumeCompletenessBreakdown = (fields) => {
  const maxScore = CATEGORY_MAX_SCORES.resumeCompleteness;
  const pointsPerField = maxScore / fields.length;

  const detectedCount = fields.filter((f) => f.detected).length;
  const score = Math.round(detectedCount * pointsPerField);

  const lostPoints = fields
    .filter((f) => !f.detected)
    .map((f) => `${f.label} ${['name', 'email', 'phone'].includes(f.key) ? 'was' : 'section was'} not detected.`);

  let reason;
  if (detectedCount === fields.length) {
    reason = 'All essential resume fields and sections were detected.';
  } else if (detectedCount >= fields.length - 2) {
    reason = 'Most essential resume sections were detected.';
  } else if (detectedCount >= fields.length / 2) {
    reason = 'Several resume sections are present, but some important ones are missing.';
  } else {
    reason = 'Many essential resume sections could not be detected.';
  }

  return { score, maxScore, reason, lostPoints };
};

/** Skills — 25 pts (coverage + diversity + hygiene) */
const buildSkillsBreakdown = (skillsSignal) => {
  const maxScore = CATEGORY_MAX_SCORES.skills;
  const { uniqueCount, duplicateCount, emptyCount, categoriesMatched } = skillsSignal;

  let countScore;
  if (uniqueCount === 0) countScore = 0;
  else if (uniqueCount <= 3) countScore = 5;
  else if (uniqueCount <= 7) countScore = 10;
  else if (uniqueCount <= 14) countScore = 13;
  else countScore = 15;

  const diversityCount = categoriesMatched.length;
  let diversityScore;
  if (diversityCount === 0) diversityScore = 0;
  else if (diversityCount === 1) diversityScore = 2;
  else if (diversityCount === 2) diversityScore = 4;
  else diversityScore = 6;

  const hygienePenalty = Math.min(duplicateCount + emptyCount, 4);
  const hygieneScore = uniqueCount > 0 ? 4 - hygienePenalty : 0;

  const score = clamp(countScore + diversityScore + hygieneScore, 0, maxScore);

  const lostPoints = [];
  if (countScore < 15) {
    lostPoints.push('Add more relevant listed skills to strengthen coverage.');
  }
  if (diversityScore < 6) {
    lostPoints.push('Add more cloud/devops or database skills if relevant.');
  }
  if (duplicateCount > 0) {
    lostPoints.push('Remove duplicate skill entries.');
  }
  if (emptyCount > 0) {
    lostPoints.push('Remove empty or placeholder skill entries.');
  }

  let reason;
  if (uniqueCount === 0) {
    reason = 'No skills were detected in the resume.';
  } else if (score >= 22) {
    reason = 'Strong technical skill coverage with good diversity.';
  } else if (score >= 14) {
    reason = 'Moderate skill coverage; breadth could be improved.';
  } else {
    reason = 'Skill coverage is limited.';
  }

  return { score, maxScore, reason, lostPoints };
};

/**
 * Experience — 20 pts (existence + multiplicity + depth + impact language)
 *
 * Fresher-friendly: a candidate with zero work-experience entries but
 * real project work isn't scored as if their experience were simply
 * "missing" — that unfairly tanks the overall score for students/early-
 * career candidates whose relevant work lives in their Projects section
 * instead. `projectsSignal` is used only to decide how much credit to
 * award in that specific case; the score still tops out below what a
 * candidate with genuine work experience can reach, and lostPoints
 * still explains exactly what's missing.
 */
const buildExperienceBreakdown = (experienceSignal, projectsSignal = { entryCount: 0 }) => {
  const maxScore = CATEGORY_MAX_SCORES.experience;
  const { entryCount, averageLength, actionVerbHits, quantifiedHits } = experienceSignal;

  if (entryCount === 0) {
    const projectEntryCount = projectsSignal?.entryCount || 0;

    let fresherCredit;
    if (projectEntryCount >= 3) fresherCredit = 10;
    else if (projectEntryCount >= 1) fresherCredit = 6;
    else fresherCredit = 0;

    const score = clamp(fresherCredit, 0, maxScore);

    const lostPoints =
      projectEntryCount > 0
        ? ['Add internships or part-time work experience if available — projects alone are currently covering this category.']
        : ['Experience section was not detected.'];

    let reason;
    if (projectEntryCount >= 3) {
      reason = 'No formal work experience was detected, but strong project work meaningfully offsets this for an early-career candidate.';
    } else if (projectEntryCount >= 1) {
      reason = 'No formal work experience was detected; some project work helps offset this, but more would strengthen the resume.';
    } else {
      reason = 'No work experience was detected.';
    }

    return { score, maxScore, reason, lostPoints };
  }

  const existenceScore = 6;

  let multiplicityScore;
  if (entryCount >= 4) multiplicityScore = 6;
  else if (entryCount >= 2) multiplicityScore = 4;
  else multiplicityScore = 2;

  let depthScore;
  if (averageLength >= 40) depthScore = 4;
  else if (averageLength >= 20) depthScore = 2;
  else depthScore = 0;

  let impactScore;
  if (actionVerbHits >= 2 || quantifiedHits >= 1) impactScore = 4;
  else if (actionVerbHits >= 1) impactScore = 2;
  else impactScore = 0;

  const score = clamp(existenceScore + multiplicityScore + depthScore + impactScore, 0, maxScore);

  const lostPoints = [];
  if (multiplicityScore < 6) lostPoints.push('Add more roles or bullet points to the experience section.');
  if (depthScore < 4) lostPoints.push('Expand experience bullets with more detail.');
  if (impactScore < 4) lostPoints.push('Add measurable outcomes (numbers, %, results) to experience bullets.');

  let reason;
  if (score >= 16) {
    reason = 'Experience section is present and meaningful.';
  } else if (score >= 10) {
    reason = 'Experience section is present but could be more detailed.';
  } else {
    reason = 'Experience section is thin and lacks detail.';
  }

  return { score, maxScore, reason, lostPoints };
};

/** Education — 10 pts (existence + degree/institution keywords) */
const buildEducationBreakdown = (educationSignal) => {
  const maxScore = CATEGORY_MAX_SCORES.education;
  const { entryCount, hasDegreeKeyword, hasInstitutionKeyword } = educationSignal;

  const existenceScore = entryCount > 0 ? 5 : 0;

  let keywordScore = 0;
  if (hasDegreeKeyword && hasInstitutionKeyword) keywordScore = 5;
  else if (hasDegreeKeyword || hasInstitutionKeyword) keywordScore = 3;

  const score = clamp(existenceScore + keywordScore, 0, maxScore);

  const lostPoints = [];
  if (entryCount === 0) {
    lostPoints.push('Education section was not detected.');
  } else if (keywordScore < 5) {
    lostPoints.push('Add a clear degree name and institution to the education section.');
  }

  let reason;
  if (entryCount === 0) {
    reason = 'No education section was detected.';
  } else if (score === maxScore) {
    reason = 'Education section is complete.';
  } else {
    reason = 'Education section is present but missing some detail.';
  }

  return { score, maxScore, reason, lostPoints };
};

/** Projects — 10 pts (count + description depth + tech keywords + measurable outcomes) */
const buildProjectsBreakdown = (projectsSignal) => {
  const maxScore = CATEGORY_MAX_SCORES.projects;
  const { entryCount, averageLength, hasTechKeyword, hasQuantifiedOutcome } = projectsSignal;

  let countScore;
  if (entryCount === 0) countScore = 0;
  else if (entryCount === 1) countScore = 3;
  else countScore = 5;

  const descriptionScore = averageLength >= 30 ? 3 : averageLength > 0 ? 1 : 0;
  const techScore = hasTechKeyword ? 1 : 0;
  const outcomeScore = hasQuantifiedOutcome ? 1 : 0;

  const score = clamp(countScore + descriptionScore + techScore + outcomeScore, 0, maxScore);

  const lostPoints = [];
  if (entryCount === 0) {
    lostPoints.push('Projects section was not detected.');
  } else {
    if (descriptionScore < 3) lostPoints.push('Add more detail to project descriptions.');
    if (!hasTechKeyword) lostPoints.push('Mention the specific technologies used in each project.');
    if (!hasQuantifiedOutcome) lostPoints.push('Add measurable project outcomes.');
  }

  let reason;
  if (entryCount === 0) {
    reason = 'No projects were detected.';
  } else if (score >= 8) {
    reason = 'Projects are present and well described.';
  } else {
    reason = 'Projects are present but can be stronger.';
  }

  return { score, maxScore, reason, lostPoints };
};

/**
 * AI Quality Bonus — 15 pts, built entirely from the existing Gemini
 * analysis passed in by the caller. Does NOT call Gemini.
 */
const buildAIBonusBreakdown = (aiSignal) => {
  const maxScore = CATEGORY_MAX_SCORES.aiBonus;
  const { strengths, weaknesses, recommendations, strengthsCount, weaknessesCount, recommendationsCount } =
    aiSignal;

  let strengthsScore;
  if (strengthsCount === 0) strengthsScore = 0;
  else if (strengthsCount <= 2) strengthsScore = 3;
  else strengthsScore = 6;

  let recommendationsScore;
  if (recommendationsCount === 0) recommendationsScore = 0;
  else if (recommendationsCount <= 2) recommendationsScore = 3;
  else recommendationsScore = 6;

  let severityScore;
  if (strengthsCount === 0 && recommendationsCount === 0) {
    severityScore = 0;
  } else if (weaknessesCount === 0) severityScore = 3;
  else if (weaknessesCount <= 2) severityScore = 2;
  else if (weaknessesCount <= 4) severityScore = 1;
  else severityScore = 0;

  const score = clamp(strengthsScore + recommendationsScore + severityScore, 0, maxScore);

  const lostPoints = weaknesses.slice(0, 3).map((weakness) => `AI detected: ${weakness}`);

  let reason;
  if (strengthsCount === 0 && recommendationsCount === 0) {
    reason = 'No AI analysis signals were available to award a bonus.';
  } else if (score >= 12) {
    reason = 'AI analysis found strong strengths with few notable weaknesses.';
  } else if (score >= 7) {
    reason = 'AI analysis found useful strengths but also improvement areas.';
  } else {
    reason = 'AI analysis found significant improvement areas.';
  }

  return { score, maxScore, reason, lostPoints };
};

module.exports = {
  CATEGORY_MAX_SCORES,
  buildResumeCompletenessBreakdown,
  buildSkillsBreakdown,
  buildExperienceBreakdown,
  buildEducationBreakdown,
  buildProjectsBreakdown,
  buildAIBonusBreakdown,
};
