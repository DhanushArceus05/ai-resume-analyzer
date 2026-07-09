/**
 * Builds the prompt sent to the AI provider. Kept completely separate
 * from the provider itself so the prompt can be revised, versioned, or
 * A/B tested without touching any Gemini-specific code.
 *
 * Input: a parsed resume object (see resumeNormalizer.service.js).
 * Output: a single prompt string instructing the model to return ONLY
 * the JSON shape consumed by responseNormalizer.service.js.
 */

const { getPromptDateContext } = require('../../utils/dateContext');

const formatField = (label, value) => {
  if (!value) {
    return `${label}: Not provided`;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return `${label}: Not provided`;
    }
    return `${label}:\n- ${value.join('\n- ')}`;
  }

  return `${label}: ${value}`;
};

const buildResumeAnalysisPrompt = (parsedResume) => {
  const basicInfo = parsedResume?.basicInfo || {};
  const sections = parsedResume?.sections || {};

  const resumeText = [
    formatField('Name', basicInfo.name),
    formatField('Email', basicInfo.email),
    formatField('Phone', basicInfo.phone),
    formatField('Links', basicInfo.links),
    formatField('Summary', sections.summary),
    formatField('Skills', sections.skills),
    formatField('Experience', sections.experience),
    formatField('Education', sections.education),
    formatField('Projects', sections.projects),
    formatField('Certifications', sections.certifications),
    formatField('Languages', sections.languages),
  ].join('\n\n');

  return `You are a senior technical recruiter with years of experience screening
resumes for hiring managers. You read fast, you've seen thousands of resumes,
and you give the kind of direct, specific, useful feedback a candidate would
actually pay for — never generic filler.

${getPromptDateContext()}

Analyze the resume data below and produce an honest, constructive assessment
of the candidate's profile exactly as it is written.

RESUME DATA:
${resumeText}

Respond with ONLY a single valid JSON object and nothing else — no markdown
code fences, no headings, no commentary before or after it.

The JSON object must match exactly this shape:
{
  "overallSummary": "2-4 sentences summarizing the candidate's profile",
  "strengths": ["specific strength", "..."],
  "weaknesses": ["specific weakness or gap", "..."],
  "recommendations": ["specific, actionable improvement", "..."]
}

Rules:
- Do NOT calculate or mention any ATS score or numeric rating.
- Do NOT compare this resume against any job description.
- NEVER invent facts, numbers, employers, tools, or achievements that are
  not present in the resume data above.
- Before calling anything "missing", re-check the resume data above for it
  under any related heading — only call it missing if it truly is not
  present anywhere. If a section exists but is thin, generic, or vague,
  call that out as a weakness ("weak" or "underdeveloped"), not as
  "missing" — these are different problems and must not be conflated.
- If the candidate appears to be a student, fresher, or has limited work
  history, calibrate your expectations accordingly: do not penalize the
  absence of years of professional experience, and instead focus feedback
  on how well projects, coursework, internships, and skills are presented
  and quantified. Recommendations for freshers should favor concrete,
  achievable next steps (e.g. quantify project impact, add a specific
  metric, link a live demo or repo) over advice that assumes an existing
  job history.
- Write like a recruiter, not a textbook: be specific about which section,
  line, or gap you're referring to rather than giving generic advice that
  could apply to any resume.
- Every recommendation must be concrete and actionable — name the exact
  section to change and what to change it to or add, not just "improve
  your resume" or "add more detail".
- Each of "strengths", "weaknesses", and "recommendations" should contain
  between 3 and 6 items.
- Return ONLY the JSON object — no markdown, no explanations, no extra text.`;
};

module.exports = { buildResumeAnalysisPrompt };
