/**
 * Builds the prompt sent to the AI provider for Step 9 (Interview
 * Question Generator). Kept completely separate from the provider
 * itself, mirroring ai/promptBuilder.service.js and
 * rewrite/rewritePromptBuilder.service.js.
 *
 * Input: parsedResume (Step 4), analysis (Step 5), ats (Step 6), jdMatch
 * (Step 7), and rewrite (Step 8). The rewritten experience/project text
 * is preferred over the raw parsed lines when available (it's the same
 * facts, just better-phrased), and analysis/ats/jdMatch are used only as
 * *guidance context* for what to emphasize — never as new facts.
 *
 * Output: a single prompt string instructing the model to return ONLY
 * the JSON shape consumed by interviewNormalizer.service.js.
 */

const { getPromptDateContext } = require('../../utils/dateContext');

const formatList = (label, items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return `${label}: None`;
  }
  return `${label}:\n- ${items.join('\n- ')}`;
};

const formatLines = (label, lines) => {
  if (!Array.isArray(lines) || lines.length === 0) {
    return `${label}: None provided.`;
  }
  return `${label}:\n${lines.map((line, index) => `${index + 1}. ${line}`).join('\n')}`;
};

/**
 * Prefers Step 8's rewritten lines (same facts, clearer phrasing) and
 * falls back to the raw parsed lines when no rewrite is available for
 * that section.
 */
const pickExperienceLines = (parsedResume, rewrite) => {
  const rewritten = rewrite?.sections?.experience;
  if (Array.isArray(rewritten) && rewritten.length > 0) {
    return rewritten.map((item) => item.rewritten);
  }
  const original = parsedResume?.sections?.experience;
  return Array.isArray(original) ? original : [];
};

const pickProjectLines = (parsedResume, rewrite) => {
  const rewritten = rewrite?.sections?.projects;
  if (Array.isArray(rewritten) && rewritten.length > 0) {
    return rewritten.map((item) => item.rewritten);
  }
  const original = parsedResume?.sections?.projects;
  return Array.isArray(original) ? original : [];
};

const pickSummary = (parsedResume, rewrite) => {
  return rewrite?.sections?.summary?.rewritten || parsedResume?.sections?.summary || 'Not provided';
};

/**
 * Flattens a previously-generated question set (Step 9's own output
 * shape) into a plain list of question strings, so a regeneration
 * request can tell the model what NOT to repeat. Returns an empty
 * array for anything that isn't a valid question set (e.g. null on the
 * first-ever generation).
 */
const flattenPreviousQuestions = (previousQuestions) => {
  if (!previousQuestions || typeof previousQuestions !== 'object') {
    return [];
  }

  const categories = ['technical', 'project', 'behavioral', 'hr'];
  return categories.flatMap((category) => {
    const items = previousQuestions[category];
    if (!Array.isArray(items)) return [];
    return items
      .map((item) => (typeof item?.question === 'string' ? item.question.trim() : ''))
      .filter((question) => question.length > 0);
  });
};

/**
 * Builds the "do not repeat yourself" block for regenerate requests.
 * Returns an empty string on a first-time generation (attempt <= 1 or
 * no previous questions available), so the base prompt is unaffected
 * when regeneration isn't in play.
 */
const formatRegenerationContext = (regeneration) => {
  const attempt = Number(regeneration?.attempt) || 1;
  const previousQuestions = flattenPreviousQuestions(regeneration?.previousQuestions);

  if (attempt <= 1 || previousQuestions.length === 0) {
    return '';
  }

  return `

REGENERATION CONTEXT:
This is regeneration attempt ${attempt} for the same candidate — the candidate
was not satisfied with (or wants variety beyond) the previously generated
questions and asked for a new set.

PREVIOUSLY ASKED QUESTIONS (do not repeat these, and do not just reword them):
- ${previousQuestions.join('\n- ')}

Produce a genuinely different set of 15 questions this time: cover different
angles of the same skills and projects, ask about different parts of the
experience/project lines, vary the phrasing and question style, and vary
which specific skill or project each technical/project question anchors on
wherever the resume offers more than one option. Stay strictly within the
resume and guidance context — do not introduce new facts just to create
variety.`;
};

const buildInterviewPrompt = ({ parsedResume, analysis, ats, jdMatch, rewrite, regeneration }) => {
  const sections = parsedResume?.sections || {};
  const skills = Array.isArray(sections.skills) ? sections.skills : [];
  const experienceLines = pickExperienceLines(parsedResume, rewrite);
  const projectLines = pickProjectLines(parsedResume, rewrite);
  const summary = pickSummary(parsedResume, rewrite);

  const resumeContext = [
    `Summary: ${summary}`,
    formatList('Skills', skills),
    formatLines('Experience', experienceLines),
    formatLines('Projects', projectLines),
  ].join('\n\n');

  const guidanceContext = [
    formatList('Resume strengths (from prior analysis)', analysis?.strengths),
    formatList('Resume weaknesses (from prior analysis)', analysis?.weaknesses),
    formatList('Top ATS improvement points', ats?.topImprovements),
    formatList('Skills already matched to the target job description', jdMatch?.matchedSkills),
    formatList('Skills missing versus the target job description', jdMatch?.missingSkills),
  ].join('\n\n');

  const regenerationBlock = formatRegenerationContext(regeneration);

  return `You are an experienced interviewer preparing personalized
interview questions for a candidate, based strictly on their own resume
and how it compares to a target job description.

${getPromptDateContext()}

RESUME CONTEXT (the only source of factual material about this candidate):
${resumeContext}

GUIDANCE CONTEXT — use this only to decide what to emphasize, including
how this candidate's skills compare to the target job description. Never
use it to introduce a technology, tool, project, or achievement that is
not already named in the resume context above:
${guidanceContext}
${regenerationBlock}

TASK:
Generate interview questions based only on the resume context and
guidance context above:
- Exactly 5 Technical questions
- Exactly 5 Project questions
- Exactly 3 Behavioral questions
- Exactly 2 HR questions

QUESTION QUALITY BAR:
- Ground every technical and project question in a specific line from the
  resume context — name the actual skill, tool, or project, and ask about
  a real decision, trade-off, failure mode, or "how would you scale/debug/
  extend this" scenario rather than a generic definitional question.
- When skills are missing versus the target job description (see guidance
  context), you may use 1-2 technical questions to probe how the
  candidate's existing, resume-grounded experience would transfer to that
  gap — never ask them to explain a tool they've never listed.
- Avoid two questions covering the same skill or project in the same way;
  spread coverage across different skills, projects, and experience lines
  where the resume offers enough material to do so.
- Behavioral and HR questions should sound like a real interviewer's
  phrasing, not a textbook list — draw on the specific situations implied
  by the candidate's projects and experience where possible instead of
  fully generic prompts.

STRICT RULES:
- Every technical and project question must reference a specific skill,
  technology, or project that is explicitly named in the resume context
  above. Do NOT ask about any technology, tool, or framework that is not
  mentioned there.
- Do NOT ask questions unrelated to this candidate's actual background.
- Behavioral and HR questions may be more general, but must still make
  sense for someone with this candidate's stated experience level.
- Each question needs a short "whyAsked" explanation (1-2 sentences)
  describing what the interviewer is trying to learn from it.
- Each question needs a "difficulty" of exactly one of: "Easy", "Medium",
  or "Hard".

Respond with ONLY a single valid JSON object and nothing else — no
markdown code fences, no headings, no commentary before or after it.

The JSON object must match exactly this shape:
{
  "technical": [{ "question": "...", "whyAsked": "...", "difficulty": "Easy" }],
  "project": [{ "question": "...", "whyAsked": "...", "difficulty": "Medium" }],
  "behavioral": [{ "question": "...", "whyAsked": "...", "difficulty": "Easy" }],
  "hr": [{ "question": "...", "whyAsked": "...", "difficulty": "Easy" }]
}

The "technical" array must contain exactly 5 items, "project" exactly 5,
"behavioral" exactly 3, and "hr" exactly 2 — 15 questions total.`;
};

module.exports = { buildInterviewPrompt };
