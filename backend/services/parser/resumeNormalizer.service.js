const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_REGEX = /(\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;
const COMMON_TLDS = 'com|org|net|io|dev|co|me|app|ai|edu|gov';
const URL_REGEX = new RegExp(
  `\\b(https?:\\/\\/[^\\s,;()<>]+|www\\.[^\\s,;()<>]+|[a-zA-Z0-9-]+\\.(?:${COMMON_TLDS})(?:\\/[^\\s,;()<>]*)?)`,
  'gi'
);

// Section headings are matched as a whole line (after trimming), case-insensitively.
// Kept intentionally short/specific so ordinary sentences don't get misdetected as headers.
const SECTION_PATTERNS = [
  {
    key: 'summary',
    pattern:
      /^(?:(?:professional|career|executive|personal)\s+)?(?:summary|profile|objective)(?:\s+of\s+qualifications)?$|^about(?:\s+me)?$/i,
  },
  { key: 'skills', pattern: /^(skills|technical skills|core competencies|key skills)$/i },
  {
    key: 'experience',
    pattern: /^(experience|work experience|employment history|professional experience)$/i,
  },
  { key: 'education', pattern: /^(education|academic background|educational background)$/i },
  { key: 'projects', pattern: /^(projects|personal projects|academic projects)$/i },
  { key: 'certifications', pattern: /^(certifications?|licenses?( ?(and|&) ?certifications?)?)$/i },
  { key: 'languages', pattern: /^(languages)$/i },
];

const cleanLine = (line) => line.replace(/\s+/g, ' ').trim();

/**
 * Returns the section key if `line` (on its own) reads as a section
 * heading, otherwise null. Headings must be short — a long line that
 * happens to contain the word "experience" mid-sentence should not match.
 */
const detectSectionKey = (line) => {
  const cleaned = cleanLine(line).replace(/[:：]$/, '');
  if (!cleaned || cleaned.length > 40) return null;

  const match = SECTION_PATTERNS.find(({ pattern }) => pattern.test(cleaned));
  return match ? match.key : null;
};

/**
 * Splits raw section lines into discrete list items, tolerating
 * comma-, bullet-, or newline-separated formats.
 */
const splitIntoListItems = (lines) => {
  return lines
    .join('\n')
    .split(/[\n,•*·\u2022|]/)
    .map((item) => cleanLine(item))
    .filter((item) => item.length > 0);
};

const extractEmail = (text) => {
  const match = text.match(EMAIL_REGEX);
  return match ? match[0] : null;
};

const extractPhone = (text) => {
  const match = text.match(PHONE_REGEX);
  if (!match) return null;

  // Guard against matching a stray 7+ digit number that isn't really a phone
  // (e.g. a zip+something run together) by requiring at least 10 digits total.
  const digitCount = match[0].replace(/\D/g, '').length;
  if (digitCount < 10) return null;

  return cleanLine(match[0]);
};

const extractLinks = (text) => {
  const emailLike = extractEmail(text);
  const searchText = emailLike ? text.replace(emailLike, ' ') : text;

  const matches = searchText.match(URL_REGEX) || [];

  const unique = Array.from(new Set(matches.map((link) => link.trim())));

  return unique;
};

/**
 * Heuristic: a resume's name is usually the first short line that
 * isn't an email, phone, URL, or a section heading.
 */
const extractName = (lines) => {
  for (const line of lines.slice(0, 5)) {
    const cleaned = cleanLine(line);
    if (!cleaned) continue;
    if (cleaned.length > 60) continue;
    if (EMAIL_REGEX.test(cleaned)) continue;
    if (PHONE_REGEX.test(cleaned)) continue;
    if (/^https?:\/\//i.test(cleaned)) continue;
    if (detectSectionKey(cleaned)) continue;
    return cleaned;
  }
  return null;
};

/**
 * Converts raw extracted text into the structured resume object.
 * Pure regex/heuristics — no AI, no external calls.
 */
const normalizeResumeText = (rawText) => {
  const lines = rawText.split(/\r?\n/).map((line) => line.replace(/\s+$/, ''));

  const sectionsContent = {
    summary: [],
    skills: [],
    experience: [],
    education: [],
    projects: [],
    certifications: [],
    languages: [],
  };

  let currentSection = null;

  for (const rawLine of lines) {
    const detected = detectSectionKey(rawLine);
    if (detected) {
      currentSection = detected;
      continue;
    }

    if (currentSection && cleanLine(rawLine)) {
      sectionsContent[currentSection].push(rawLine);
    }
  }

  const sections = {
    summary: sectionsContent.summary.length
      ? sectionsContent.summary.map(cleanLine).join(' ')
      : null,
    skills: splitIntoListItems(sectionsContent.skills),
    experience: sectionsContent.experience.map(cleanLine).filter(Boolean),
    education: sectionsContent.education.map(cleanLine).filter(Boolean),
    projects: sectionsContent.projects.map(cleanLine).filter(Boolean),
    certifications: sectionsContent.certifications.map(cleanLine).filter(Boolean),
    languages: splitIntoListItems(sectionsContent.languages),
  };

  const basicInfo = {
    name: extractName(lines),
    email: extractEmail(rawText),
    phone: extractPhone(rawText),
    links: extractLinks(rawText),
  };

  const trimmedText = rawText.trim();
  const wordCount = trimmedText ? trimmedText.split(/\s+/).length : 0;

  return {
    rawText,
    basicInfo,
    sections,
    metadata: {
      wordCount,
      characterCount: rawText.length,
      parsedAt: new Date().toISOString(),
    },
  };
};

module.exports = { normalizeResumeText };
