const mammoth = require('mammoth');

/**
 * Extracts raw text from a DOCX buffer.
 * @param {Buffer} buffer
 * @returns {Promise<string>}
 */
const extractTextFromDocx = async (buffer) => {
  const result = await mammoth.extractRawText({ buffer });
  return result.value || '';
};

module.exports = { extractTextFromDocx };
