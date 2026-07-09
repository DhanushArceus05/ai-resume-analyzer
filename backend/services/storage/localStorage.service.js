const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const UPLOAD_DIR = path.join(__dirname, '../../uploads');

const buildUniqueFilename = (originalName) => {
  const extension = path.extname(originalName);
  return `${crypto.randomUUID()}${extension}`;
};

/**
 * Saves a buffered file to local disk under backend/uploads.
 *
 * Contract (must be preserved by any future storage backend, e.g. S3
 * or Cloudinary, so controllers never need to change):
 *   input:  { buffer, originalname, size }  (shape of Multer's req.file)
 *   output: { filename, originalName, size, uploadedAt }
 */
const saveFile = async (file) => {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  const filename = buildUniqueFilename(file.originalname);
  const destination = path.join(UPLOAD_DIR, filename);

  await fs.writeFile(destination, file.buffer);

  return {
    filename,
    originalName: file.originalname,
    size: file.size,
    uploadedAt: new Date().toISOString(),
  };
};

module.exports = { saveFile };
