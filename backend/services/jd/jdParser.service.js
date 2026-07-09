/**
 * Pure, deterministic text-analysis helpers for job descriptions.
 * Nothing in this file touches the resume or assigns a score — it only
 * extracts structured signal (known skills + frequent keywords) out of
 * raw JD text. jdMatching.service.js is the only consumer of this output.
 *
 * No network calls. No Gemini. No randomness.
 */

const { SKILL_ALIAS_GROUPS } = require('../../utils/skillAliases');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Known skill/technology/process terms, each with a lowercase `term`
 * used for detection and a human-friendly `label` used for display.
 * Deliberately reuses the same technology families as the ATS engine
 * (Step 6) so skill vocabulary stays consistent across the product,
 * extended with common process/soft-skill terms that job descriptions
 * (but not necessarily resumes) tend to phrase explicitly.
 */
const SKILL_DICTIONARY = [
  // Languages
  { term: 'javascript', label: 'JavaScript' },
  { term: 'typescript', label: 'TypeScript' },
  { term: 'python', label: 'Python' },
  { term: 'java', label: 'Java' },
  { term: 'c++', label: 'C++' },
  { term: 'c#', label: 'C#' },
  { term: 'golang', label: 'Go' },
  { term: 'go', label: 'Go' },
  { term: 'ruby', label: 'Ruby' },
  { term: 'php', label: 'PHP' },
  { term: 'swift', label: 'Swift' },
  { term: 'kotlin', label: 'Kotlin' },
  { term: 'rust', label: 'Rust' },
  // Frontend
  { term: 'react', label: 'React' },
  { term: 'vue', label: 'Vue' },
  { term: 'angular', label: 'Angular' },
  { term: 'next.js', label: 'Next.js' },
  { term: 'svelte', label: 'Svelte' },
  { term: 'html', label: 'HTML' },
  { term: 'css', label: 'CSS' },
  { term: 'tailwind', label: 'Tailwind CSS' },
  // Backend
  { term: 'node.js', label: 'Node' },
  { term: 'express', label: 'Express' },
  { term: 'django', label: 'Django' },
  { term: 'flask', label: 'Flask' },
  { term: 'spring', label: 'Spring' },
  { term: 'rails', label: 'Ruby on Rails' },
  { term: 'fastapi', label: 'FastAPI' },
  { term: '.net', label: '.NET' },
  // Data
  { term: 'sql', label: 'SQL' },
  { term: 'mysql', label: 'MySQL' },
  { term: 'postgresql', label: 'PostgreSQL' },
  { term: 'postgres', label: 'PostgreSQL' },
  { term: 'mongodb', label: 'MongoDB' },
  { term: 'redis', label: 'Redis' },
  { term: 'dynamodb', label: 'DynamoDB' },
  { term: 'oracle', label: 'Oracle' },
  { term: 'sqlite', label: 'SQLite' },
  // Cloud / DevOps
  { term: 'aws', label: 'AWS' },
  { term: 'azure', label: 'Azure' },
  { term: 'gcp', label: 'GCP' },
  { term: 'docker', label: 'Docker' },
  { term: 'kubernetes', label: 'Kubernetes' },
  { term: 'k8s', label: 'Kubernetes' },
  { term: 'terraform', label: 'Terraform' },
  { term: 'ci/cd', label: 'CI/CD' },
  { term: 'jenkins', label: 'Jenkins' },
  { term: 'github actions', label: 'GitHub Actions' },
  { term: 'git', label: 'Git' },
  { term: 'linux', label: 'Linux' },
  // Practices / process
  { term: 'agile', label: 'Agile' },
  { term: 'scrum', label: 'Scrum' },
  { term: 'rest api', label: 'REST APIs' },
  { term: 'restful api', label: 'REST APIs' },
  { term: 'graphql', label: 'GraphQL' },
  { term: 'microservices', label: 'Microservices' },
  { term: 'unit testing', label: 'Unit Testing' },
  { term: 'testing', label: 'Testing' },
  { term: 'devops', label: 'DevOps' },
  { term: 'machine learning', label: 'Machine Learning' },
  { term: 'deep learning', label: 'Deep Learning' },
  { term: 'tensorflow', label: 'TensorFlow' },
  { term: 'pytorch', label: 'PyTorch' },
  { term: 'scikit-learn', label: 'Scikit-learn' },
  { term: 'keras', label: 'Keras' },
  { term: 'pandas', label: 'Pandas' },
  { term: 'numpy', label: 'NumPy' },
  { term: 'langchain', label: 'LangChain' },
  { term: 'nlp', label: 'NLP' },
  { term: 'computer vision', label: 'Computer Vision' },
  { term: 'opencv', label: 'OpenCV' },
  { term: 'data science', label: 'Data Science' },
  { term: 'neural network', label: 'Neural Networks' },
  { term: 'neural networks', label: 'Neural Networks' },
  { term: 'data analysis', label: 'Data Analysis' },
  { term: 'ui/ux', label: 'UI/UX' },
  { term: 'figma', label: 'Figma' },
  // Common soft skills phrased explicitly in JDs
  { term: 'communication', label: 'Communication' },
  { term: 'leadership', label: 'Leadership' },
  { term: 'problem solving', label: 'Problem Solving' },
  { term: 'teamwork', label: 'Teamwork' },
  { term: 'project management', label: 'Project Management' },
  { term: 'stakeholder management', label: 'Stakeholder Management' },
];

// Additional alias terms (from the shared skillAliases module) not already
// covered by SKILL_DICTIONARY above — e.g. "js" for JavaScript, "reactjs"
// for React, "genai"/"llm"/"rag" as their own recognized skills, and the
// plural "rest apis"/"restful apis" forms. Only terms not already present
// as a literal dictionary term are added, so existing entries (and their
// labels) are never overridden or duplicated.
const baseDictionaryTerms = new Set(SKILL_DICTIONARY.map((entry) => entry.term));

const ALIAS_DICTIONARY_ENTRIES = SKILL_ALIAS_GROUPS.flatMap(({ canonical, terms }) =>
  terms.filter((term) => !baseDictionaryTerms.has(term)).map((term) => ({ term, label: canonical }))
);

const FULL_SKILL_DICTIONARY = [...SKILL_DICTIONARY, ...ALIAS_DICTIONARY_ENTRIES];

const SKILL_PATTERNS = FULL_SKILL_DICTIONARY.map(({ term, label }) => ({
  term,
  label,
  regex: new RegExp(`(?<![a-zA-Z0-9])${escapeRegex(term)}(?![a-zA-Z0-9])`, 'i'),
}));

/**
 * Common filler words that carry no matching signal on their own.
 * Kept intentionally focused on JD/job-posting boilerplate rather than
 * an exhaustive general-purpose stopword list.
 */
const STOPWORDS = new Set([
  'the', 'and', 'a', 'an', 'to', 'of', 'in', 'on', 'for', 'with', 'is', 'are',
  'be', 'as', 'at', 'by', 'or', 'that', 'this', 'will', 'you', 'your', 'we',
  'our', 'their', 'have', 'has', 'had', 'from', 'it', 'its', 'can', 'job',
  'role', 'description', 'responsibilities', 'requirements', 'qualifications',
  'about', 'looking', 'who', 'what', 'when', 'where', 'how', 'into', 'across',
  'other', 'all', 'any', 'more', 'most', 'such', 'not', 'no', 'but', 'if',
  'then', 'than', 'so', 'these', 'those', 'they', 'them', 'us', 'per', 'via',
  'etc', 'including', 'related', 'strong', 'excellent', 'good', 'plus', 'must',
  'should', 'would', 'could', 'ability', 'able', 'work', 'working', 'team',
  'years', 'year', 'company', 'position', 'candidate', 'candidates', 'apply',
  // Generic terms that carry no matching signal on their own — they show up
  // in almost every JD regardless of the actual skills required, so letting
  // them count as "overlap" inflates the match score without meaning much.
  'using', 'use', 'used', 'applications', 'application', 'skills', 'skill',
  'engineer', 'engineers', 'engineering', 'develop', 'developing', 'developer',
  'developers', 'knowledge', 'experience', 'experienced', 'proficient',
  'proficiency', 'familiar', 'familiarity', 'understanding', 'various',
  'multiple', 'like', 'new', 'build', 'building', 'help', 'helping', 'well',
  'also', 'within', 'both', 'while', 'ensure', 'ensuring', 'various', 'level',
]);

const MIN_KEYWORD_LENGTH = 3;
const MAX_KEYWORDS = 15;

/** Tokenizes text into lowercase word-like tokens (letters/digits, allows + # . inside a token). */
const tokenize = (text) => {
  const matches = String(text).toLowerCase().match(/[a-z][a-z0-9+#.]*/g) || [];
  // A trailing "." is almost always sentence punctuation rather than part of
  // the token (e.g. "Node.js." at the end of a sentence), so strip it unless
  // doing so would remove the whole token.
  return matches.map((token) => (token.length > 1 ? token.replace(/\.+$/, '') : token));
};

/**
 * Scans `jdText` against the known skill dictionary and returns every
 * matched skill's display label, deduplicated.
 */
const extractSkillsFromJD = (jdText) => {
  const text = String(jdText || '');
  const seen = new Set();
  const skills = [];

  for (const { label, regex } of SKILL_PATTERNS) {
    if (regex.test(text) && !seen.has(label)) {
      seen.add(label);
      skills.push(label);
    }
  }

  return skills;
};

/**
 * Returns the most frequent meaningful (non-stopword, non-dictionary-skill)
 * words in `jdText`, most frequent first. Used as the general keyword-
 * overlap signal alongside the explicit skill list.
 */
const extractKeywords = (jdText, { exclude = [] } = {}) => {
  const excludeSet = new Set(exclude.map((term) => term.toLowerCase()));
  const tokens = tokenize(jdText).filter(
    (token) => token.length >= MIN_KEYWORD_LENGTH && !STOPWORDS.has(token) && !excludeSet.has(token)
  );

  const counts = new Map();
  for (const token of tokens) {
    counts.set(token, (counts.get(token) || 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, MAX_KEYWORDS)
    .map(([word]) => word);
};

module.exports = {
  extractSkillsFromJD,
  extractKeywords,
  tokenize,
  SKILL_DICTIONARY,
};
