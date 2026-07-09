/**
 * Builds the prompt sent to the AI provider for Step 8 (Resume Rewrite).
 * Kept completely separate from the provider itself, mirroring
 * ai/promptBuilder.service.js, so the prompt can be revised without
 * touching any Gemini-specific code.
 *
 * Input: parsedResume (Step 4), analysis (Step 5), ats (Step 6), and
 * jdMatch (Step 7) — the last three are used only as *guidance context*
 * so the rewrite can emphasize what already matters for this resume;
 * none of them are ever asked to supply new facts.
 *
 * Output: a single prompt string instructing the model to return ONLY
 * the JSON shape consumed by rewriteNormalizer.service.js.
 *
 * IMPORTANT: the model is only ever trusted to return *rewritten* text.
 * It is explicitly told the exact number of experience/project lines to
 * return so rewriteNormalizer.service.js can zip its output back onto
 * the original resume lines with confidence — the "original" side of
 * every pair always comes from parsedResume, never from the model.
 */

const { getPromptDateContext } = require('../../utils/dateContext');

const formatContextList = (label, items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return `${label}: None`;
  }
  return `${label}:\n- ${items.join('\n- ')}`;
};

const formatNumberedLines = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return 'None provided.';
  }
  return items.map((item, index) => `${index + 1}. ${item}`).join('\n');
};

const buildResumeRewritePrompt = ({ parsedResume, analysis, ats, jdMatch }) => {
  const sections = parsedResume?.sections || {};
  const summaryText = sections.summary || 'Not provided';
  const experienceLines = Array.isArray(sections.experience) ? sections.experience : [];
  const projectLines = Array.isArray(sections.projects) ? sections.projects : [];
  const skills = Array.isArray(sections.skills) ? sections.skills : [];
  const education = Array.isArray(sections.education) ? sections.education : [];

  const guidanceContext = [
    formatContextList('Strengths noted by prior AI analysis', analysis?.strengths),
    formatContextList('Weaknesses noted by prior AI analysis', analysis?.weaknesses),
    formatContextList('Top ATS improvement points', ats?.topImprovements),
    formatContextList('Skills already matched to the target job', jdMatch?.matchedSkills),
    formatContextList('Skills missing versus the target job', jdMatch?.missingSkills),
    formatContextList('Job-description-based recommendations', jdMatch?.recommendations),
  ].join('\n\n');

  const backgroundContext = [
    formatContextList('Skills listed on the resume', skills),
    formatContextList('Education listed on the resume', education),
  ].join('\n\n');

  const hasOriginalSummary = Boolean(sections.summary);

  return `You are a professional resume writer producing a noticeably
stronger version of this candidate's resume. You are not a fact-checker
and you are not a career coach here — your job is to rewrite the text
below so it reads like it was written by an experienced resume writer:
clearer, more confident, more specific, and more ATS-friendly than the
original, while staying 100% factually accurate.

${getPromptDateContext()}

WRITING QUALITY BAR:
- Start each rewritten bullet/description line with a strong, specific
  action verb (e.g. "Built", "Designed", "Automated", "Reduced", "Led")
  instead of weak openers like "Worked on", "Responsible for", "Helped
  with", or "Was involved in".
- Fix grammar, tense consistency, and awkward phrasing.
- Tighten wordy phrasing into clear, concise, confident statements —
  cut filler words without losing meaning.
- Improve ATS-friendliness: prefer standard, industry-recognized phrasing
  for the same tools/skills already named, over vague description.
- A rewrite that is nearly identical to the original (same structure,
  same words, only trivial changes) is NOT acceptable for any descriptive
  or bullet line — meaningfully improve the phrasing and word choice of
  every such line, while preserving every fact exactly as given. Even a
  line you judge to already be "well written" must still be reworded, not
  copied verbatim — polish it further rather than leaving it untouched.
- SIMILARITY RULE: for every descriptive/bullet line, if your rewrite
  would end up more than roughly 90-95% identical to the original wording
  (i.e. mostly the same words in mostly the same order), that is not a
  finished rewrite — go back and rephrase it more substantially: change
  sentence structure, swap in a stronger verb, reorder clauses, cut filler
  — while still keeping every fact, number, technology, and name exactly
  as given. Returning the line essentially unchanged should be rare, and
  only acceptable when rewording it would risk altering its meaning or
  when the line genuinely cannot be improved beyond its current form.
- Before finalizing your answer, silently re-check each descriptive line
  against the rule above and rephrase any that are still too close to the
  original.
- EXCEPTION — job title / company / date lines: some lines in the
  experience list are structural, not descriptive (e.g. "Software
  Engineer, Acme Corp" or "Jan 2022 - Present"). For a line that is only
  a job title, company name, and/or a date range with no descriptive
  content, do NOT reword it or change the facts — you may only clean up
  formatting (spacing, punctuation, capitalization consistency). Apply
  the full rewrite treatment above only to lines that actually describe
  responsibilities, actions, or outcomes.

ORIGINAL SUMMARY:
${summaryText}

ORIGINAL EXPERIENCE LINES (rewrite each line independently, one-to-one, preserving order):
${formatNumberedLines(experienceLines)}

ORIGINAL PROJECT LINES (rewrite each line independently, one-to-one, preserving order):
${formatNumberedLines(projectLines)}

CANDIDATE BACKGROUND — use this ONLY as source material if you need to
generate a summary from scratch (see SUMMARY RULES below). Never use it
to add new facts into the experience or project rewrites:
${backgroundContext}

CONTEXT FOR GUIDANCE ONLY — use this only to decide what to emphasize.
Never copy it into the rewrite, and never treat it as new factual
material about the candidate:
${guidanceContext}

SUMMARY RULES:
${
  hasOriginalSummary
    ? `- The candidate already has a summary (see ORIGINAL SUMMARY above).
  Rewrite it to be sharper, more specific, and more professional while
  preserving every fact in it exactly — do not add new claims.`
    : `- The candidate has NO existing summary ("Not provided" above). Write
  a short, professional summary (2-4 sentences) FROM SCRATCH, built only
  from facts already visible in the experience lines, project lines, and
  candidate background (skills/education) provided above. Do not invent
  any employer, role, technology, metric, certification, or years of
  experience that isn't evidenced there. If there truly isn't enough
  material anywhere above to write a meaningful, non-generic summary,
  return an empty string instead of a vague, content-free one.`
}

STRICT RULES:
- Only improve clarity, tone, structure, word choice, and phrasing (plus
  the one-time summary generation described above when no summary exists).
- NEVER invent or add companies, job titles, dates, technologies, tools,
  metrics, percentages, achievements, certifications, or years of
  experience that are not already present in the material above.
- Do not use the guidance context to introduce a skill or achievement
  into a line that didn't already mention it — you may sharpen how an
  existing point is phrased, not add new points.
- If a line does not contain enough information to meaningfully improve
  beyond formatting (see the job title / date exception above), return it
  with only light polish rather than fabricating content.
- Do not merge, split, remove, or reorder lines. The "experience" array
  must contain exactly ${experienceLines.length} item(s) and the
  "projects" array must contain exactly ${projectLines.length} item(s),
  in the same order as the numbered lists above.

Respond with ONLY a single valid JSON object and nothing else — no
markdown code fences, no headings, no commentary before or after it.

The JSON object must match exactly this shape:
{
  "summary": "rewritten (or newly generated) summary text, or an empty string if none is possible",
  "experience": ["rewritten line 1", "rewritten line 2"],
  "projects": ["rewritten line 1", "rewritten line 2"]
}`;
};

/**
 * Builds a small, focused follow-up prompt used only when
 * rewrite.service.js detects (algorithmically, after the main pass)
 * that one or more descriptive lines came back too close to their
 * original wording. Deliberately narrow in scope — it only receives
 * the flagged lines themselves, not the full resume context — so it's
 * cheap to run and stays tightly anchored to "reword this specific
 * line further" rather than opening the door to fact invention.
 */
const buildRewriteRevisionPrompt = ({ lines }) => {
  const numbered = formatNumberedLines(lines);

  return `You are a professional resume writer doing a focused second pass.
The lines below came back from a first rewrite pass too close to their
original wording — nearly the same words in nearly the same order. Reword
each one more substantially this time.

${getPromptDateContext()}

For every line below:
- Preserve every fact, number, metric, technology, tool, company name,
  and date exactly as given — change nothing factual.
- Meaningfully change the sentence structure, word choice, and/or opening
  verb so the result reads clearly differently from the original, not
  just a synonym swap in the same structure.
- Use a strong, specific action verb, active voice, and concise,
  professional, ATS-friendly phrasing.
- Only return a line unchanged if rewording it would risk altering its
  meaning or inventing information — that should be the rare exception.

LINES TO REVISE (rewrite each independently, one-to-one, preserving order):
${numbered}

Respond with ONLY a single valid JSON object and nothing else — no
markdown code fences, no headings, no commentary before or after it.

The JSON object must match exactly this shape:
{
  "revisions": ["revised line 1", "revised line 2"]
}

The "revisions" array must contain exactly ${lines.length} item(s), in
the same order as the numbered list above.`;
};

module.exports = { buildResumeRewritePrompt, buildRewriteRevisionPrompt };
