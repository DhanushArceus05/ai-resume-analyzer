const path = require('path');
const { extractTextFromPdf } = require('./pdfParser.service');
const { extractTextFromDocx } = require('./docxParser.service');
const { normalizeResumeText } = require('./resumeNormalizer.service');

/**
 * Thrown for any parsing-specific failure (unsupported type, extraction
 * failure, empty result). Kept distinct from ApiError so the controller
 * decides how to surface it (parsing failure shouldn't fail the whole
 * upload — the file is already safely stored).
 */
class ParsingError extends Error {}

const extractRawText = async (file) => {
  const extension = path.extname(file.originalname).toLowerCase();

  if (extension === '.pdf') {
    return extractTextFromPdf(file.buffer);
  }

  if (extension === '.docx') {
    return extractTextFromDocx(file.buffer);
  }

  throw new ParsingError(`Unsupported file type for parsing: ${extension}`);
};

/**
 * Parses an uploaded resume file (Multer's in-memory file object) into
 * the structured resume object. Deterministic only — no AI involved.
 * @param {{ buffer: Buffer, originalname: string }} file
 */
const parseResume = async (file) => {
  let rawText;

  try {
    rawText = await extractRawText(file);
  } catch (error) {
    if (error instanceof ParsingError) {
      throw error;
    }
    throw new ParsingError(`Failed to extract text: ${error.message}`);
  }

  if (!rawText || !rawText.trim()) {
    throw new ParsingError('No readable text could be extracted from this file');
  }

  return normalizeResumeText(rawText);
};

module.exports = { parseResume, ParsingError };
