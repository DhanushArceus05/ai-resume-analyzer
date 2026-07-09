/**
 * Small, dependency-free string-similarity helper used only by
 * rewrite.service.js to decide whether a rewritten line is still too
 * close to its original wording and needs a focused second pass. This
 * is purely an internal quality gate — it never affects the parsed
 * resume, the response shape, or any other feature.
 */

const levenshteinDistance = (a, b) => {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let prevRow = new Array(n + 1);
  let currRow = new Array(n + 1);
  for (let j = 0; j <= n; j += 1) prevRow[j] = j;

  for (let i = 1; i <= m; i += 1) {
    currRow[0] = i;
    for (let j = 1; j <= n; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      currRow[j] = Math.min(prevRow[j] + 1, currRow[j - 1] + 1, prevRow[j - 1] + cost);
    }
    [prevRow, currRow] = [currRow, prevRow];
  }

  return prevRow[n];
};

const normalize = (text) => (text || '').trim().toLowerCase().replace(/\s+/g, ' ');

/**
 * Returns a 0-1 similarity ratio between two strings (1 = identical
 * after case/whitespace normalization). Whitespace/capitalization-only
 * differences intentionally don't count as "rewritten".
 */
const similarityRatio = (a, b) => {
  const na = normalize(a);
  const nb = normalize(b);

  if (na.length === 0 && nb.length === 0) return 1;
  if (na.length === 0 || nb.length === 0) return 0;

  const distance = levenshteinDistance(na, nb);
  const maxLen = Math.max(na.length, nb.length);
  return 1 - distance / maxLen;
};

const wordCount = (text) => (text || '').trim().split(/\s+/).filter(Boolean).length;

/**
 * Short lines (job titles, company names, date ranges — e.g. "Software
 * Engineer, Acme Corp" or "Jan 2022 - Present") are intentionally meant
 * to stay close to unchanged per the rewrite prompt's own instructions,
 * so they're excluded from the "must be meaningfully reworded" check.
 * This is a conservative heuristic scoped entirely to this quality gate
 * — it does not touch resume parsing in any way.
 */
const isStructuralLine = (text) => wordCount(text) < 6;

const SIMILARITY_THRESHOLD = 0.9;

/**
 * True only for a genuine descriptive line whose rewrite is still
 * ~90%+ identical to the original wording.
 */
const needsRevision = (original, rewritten) => {
  if (isStructuralLine(original)) return false;
  if (!rewritten || !rewritten.trim()) return false;
  return similarityRatio(original, rewritten) >= SIMILARITY_THRESHOLD;
};

module.exports = { similarityRatio, needsRevision, isStructuralLine, SIMILARITY_THRESHOLD };
