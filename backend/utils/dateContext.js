/**
 * Provides the current real-world date, formatted for embedding inside
 * AI prompts, so the model reasons about past/present/future dates
 * using today's actual date rather than its own training cutoff. Used
 * by every prompt builder (analysis, rewrite, interview) so a resume
 * with e.g. a 2025 certification or a "2026 - Present" role isn't
 * incorrectly flagged as future-dated.
 */

const getPromptDateContext = () => {
  const now = new Date();
  const formatted = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    `Today's real-world date is ${formatted}. Treat any resume date before this ` +
    `as the past, this exact date as current, and any date after this as the future. ` +
    `Do not rely on your own training cutoff to judge whether a date is valid, recent, ` +
    `or upcoming — use the date given here instead.`
  );
};

module.exports = { getPromptDateContext };
