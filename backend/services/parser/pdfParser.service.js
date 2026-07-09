const { PDFParse } = require('pdf-parse');

/**
 * Extracts raw text from a PDF buffer.
 * @param {Buffer} buffer
 * @returns {Promise<string>}
 */
const extractTextFromPdf = async (buffer) => {
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    const text = result.text || '';
    // pdf-parse v2 inserts page-break markers like "-- 1 of 2 --" between
    // pages in the combined text; strip them so they don't leak into
    // extracted sections (e.g. showing up as a fake "language").
    return text.replace(/--\s*\d+\s*of\s*\d+\s*--/g, '');
  } finally {
    await parser.destroy();
  }
};

module.exports = { extractTextFromPdf };
