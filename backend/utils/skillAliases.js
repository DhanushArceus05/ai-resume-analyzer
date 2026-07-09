/**
 * Shared skill-alias normalization used by both the ATS engine
 * (backend/services/ats) and the JD matching engine (backend/services/jd),
 * so the same underlying skill written differently — an abbreviation, a
 * ".js"/"js"-suffixed framework name, or an expanded acronym — is
 * recognized as the same skill everywhere. Purely deterministic string
 * data — no AI, no parsing side effects, no network calls.
 *
 * Each group's `terms` are lowercase literal strings as they might
 * appear in free text (a resume, a job description, or a raw skills
 * list entry); `canonical` is the single display label used for that
 * skill across ATS and JD output.
 */

const SKILL_ALIAS_GROUPS = [
  { canonical: 'JavaScript', terms: ['javascript', 'js'] },
  { canonical: 'React', terms: ['react', 'react.js', 'reactjs'] },
  { canonical: 'Node', terms: ['node', 'node.js', 'nodejs'] },
  { canonical: 'Express', terms: ['express', 'express.js', 'expressjs'] },
  { canonical: 'MongoDB', terms: ['mongodb', 'mongodb atlas'] },
  { canonical: 'Generative AI', terms: ['generative ai', 'genai', 'gen ai'] },
  {
    canonical: 'Large Language Model',
    terms: ['large language model', 'large language models', 'llm', 'llms'],
  },
  {
    canonical: 'Retrieval-Augmented Generation',
    terms: ['retrieval-augmented generation', 'retrieval augmented generation', 'rag'],
  },
  {
    canonical: 'REST APIs',
    terms: ['rest api', 'rest apis', 'restful api', 'restful apis'],
  },
];

// lowercase term -> canonical label (includes each canonical label as its own term).
const ALIAS_LOOKUP = new Map();
for (const { canonical, terms } of SKILL_ALIAS_GROUPS) {
  ALIAS_LOOKUP.set(canonical.toLowerCase(), canonical);
  for (const term of terms) {
    ALIAS_LOOKUP.set(term, canonical);
  }
}

/**
 * Canonicalizes a single, already-isolated skill string (e.g. one entry
 * from a resume's Skills list) so aliases of the same skill collapse
 * into one canonical label for deduplication/categorization purposes.
 * Falls back to the original (trimmed) text for anything outside this
 * known alias set — it never drops or invents a skill.
 */
const normalizeSkillLabel = (rawSkill) => {
  const cleaned = String(rawSkill || '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (!cleaned) return '';
  return ALIAS_LOOKUP.get(cleaned) || String(rawSkill).trim();
};

/**
 * Returns every known literal term (lowercase) that refers to the same
 * skill as `label`, including `label` itself — for alias-aware text
 * matching (e.g. a JD asking for "React" should also match a resume
 * that only ever wrote "ReactJS"). Falls back to `[label.toLowerCase()]`
 * when `label` isn't part of any known alias group, so matching for
 * skills outside this list behaves exactly as before.
 */
const getAliasTerms = (label) => {
  const key = String(label || '').trim().toLowerCase();
  const group = SKILL_ALIAS_GROUPS.find(
    (g) => g.canonical.toLowerCase() === key || g.terms.includes(key)
  );
  return group ? Array.from(new Set([...group.terms, group.canonical.toLowerCase()])) : [key];
};

module.exports = { SKILL_ALIAS_GROUPS, normalizeSkillLabel, getAliasTerms };
