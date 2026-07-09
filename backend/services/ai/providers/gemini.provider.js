const { GoogleGenAI } = require('@google/genai');
const env = require('../../../config/env');
const logger = require('../../../utils/logger');

/**
 * Thin wrapper around the Gemini SDK. This is the ONLY file in the
 * codebase that talks to Google's API directly, so swapping providers
 * later (OpenAI, Claude, etc.) means writing a new file in this
 * `providers/` folder rather than touching promptBuilder, the
 * normalizer, or aiAnalysis.service.
 */

const MODEL_NAME = env.gemini.model || 'gemini-2.5-flash';
// Configurable via GEMINI_TIMEOUT_MS (defaults to 60s in config/env.js).
// Previously hardcoded to 20s, which was too aggressive for Gemini's
// real-world response times and caused frequent false-positive timeouts.
const REQUEST_TIMEOUT_MS = env.gemini.timeoutMs;

/**
 * Typed error so upstream callers (aiAnalysis.service) can map a
 * failure to the right HTTP status / user-facing message without
 * parsing SDK-specific error shapes themselves.
 */
class AIProviderError extends Error {
  constructor(kind, message) {
    super(message);
    this.name = 'AIProviderError';
    this.kind = kind; // 'invalid_key' | 'rate_limit' | 'timeout' | 'unavailable' | 'empty_response' | 'unknown'
  }
}

let cachedClient = null;

const getClient = () => {
  if (!env.gemini.apiKey) {
    throw new AIProviderError('invalid_key', 'GEMINI_API_KEY is not configured.');
  }

  if (!cachedClient) {
    cachedClient = new GoogleGenAI({ apiKey: env.gemini.apiKey });
  }

  return cachedClient;
};

const withTimeout = (promise, ms) => {
  let timeoutHandle;

  const timeout = new Promise((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new AIProviderError('timeout', 'Gemini did not respond in time.'));
    }, ms);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutHandle));
};

/**
 * Best-effort classification of an SDK/network error into one of our
 * known error kinds, based on HTTP status (if present) and message text.
 */
const classifyError = (error) => {
  const status = error?.status ?? error?.response?.status ?? error?.code;
  const message = String(error?.message || '').toLowerCase();

  if (status === 401 || status === 403 || message.includes('api key') || message.includes('permission')) {
    return new AIProviderError('invalid_key', 'Gemini rejected the configured API key.');
  }

  if (status === 429 || message.includes('rate limit') || message.includes('quota')) {
    return new AIProviderError('rate_limit', 'Gemini rate limit was reached.');
  }

  if (status === 503 || message.includes('unavailable') || message.includes('overloaded')) {
    return new AIProviderError('unavailable', 'Gemini is temporarily unavailable.');
  }

  if (message.includes('network') || message.includes('fetch failed') || message.includes('enotfound')) {
    return new AIProviderError('unavailable', 'Could not reach Gemini. Check your internet connection.');
  }

  return new AIProviderError('unknown', error?.message || 'Gemini request failed unexpectedly.');
};

// A single automatic retry, and only for timeouts — retrying on
// invalid_key/rate_limit/unavailable would just burn time on a request
// that's very likely to fail the same way again.
const MAX_TIMEOUT_RETRIES = 1;

const callGemini = async (prompt) => {
  const client = getClient();

  const response = await withTimeout(
    client.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.4,
      },
    }),
    REQUEST_TIMEOUT_MS
  );

  const rawText = typeof response?.text === 'function' ? response.text() : response?.text;
  const trimmed = typeof rawText === 'string' ? rawText.trim() : '';

  if (!trimmed) {
    throw new AIProviderError('empty_response', 'Gemini returned an empty response.');
  }

  return trimmed;
};

/**
 * Sends `prompt` to Gemini and returns the raw text response.
 * Throws `AIProviderError` on any failure — never throws a raw SDK error.
 * On a `timeout` specifically, retries once before giving up; every other
 * error kind is thrown immediately without retrying.
 */
const generateAnalysis = async (prompt) => {
  let lastError;

  for (let attempt = 0; attempt <= MAX_TIMEOUT_RETRIES; attempt += 1) {
    try {
      return await callGemini(prompt);
    } catch (error) {
      const classified = error instanceof AIProviderError ? error : classifyError(error);

      if (!(error instanceof AIProviderError)) {
        logger.error('Gemini request failed:', error.message);
      }

      lastError = classified;

      const canRetry = classified.kind === 'timeout' && attempt < MAX_TIMEOUT_RETRIES;
      if (canRetry) {
        logger.warn(
          `Gemini request timed out, retrying (attempt ${attempt + 2}/${MAX_TIMEOUT_RETRIES + 1})...`
        );
        continue;
      }

      throw classified;
    }
  }

  // Unreachable in practice (the loop always returns or throws), but keeps
  // the function's return type honest for static analysis.
  throw lastError;
};

module.exports = { generateAnalysis, AIProviderError, MODEL_NAME };
