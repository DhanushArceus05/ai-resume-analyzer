const multer = require('multer');
const path = require('path');
const ApiError = require('../utils/ApiError');

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
]);

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx']);

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

// Buffer in memory; the storage service decides where the bytes end up
// (local disk today, S3/Cloudinary later) so this middleware doesn't
// need to know or care about the destination.
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase();
  const hasAllowedMimeType = ALLOWED_MIME_TYPES.has(file.mimetype);
  const hasAllowedExtension = ALLOWED_EXTENSIONS.has(extension);

  if (!hasAllowedMimeType || !hasAllowedExtension) {
    return cb(new ApiError(400, 'Only PDF and DOCX files are supported'));
  }

  return cb(null, true);
};

const multerUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 1,
  },
});

/**
 * Handles a single `resume` file upload. Wraps Multer's callback-style
 * error handling so both validation errors (wrong type) and Multer's
 * own errors (file too large) surface as a consistent ApiError that
 * the global error handler already knows how to format.
 */
const uploadResumeFile = (req, res, next) => {
  multerUpload.single('resume')(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error.code === 'LIMIT_FILE_SIZE') {
      return next(new ApiError(400, 'File exceeds the 10 MB size limit'));
    }

    if (error instanceof ApiError) {
      return next(error);
    }

    return next(new ApiError(400, error.message || 'Upload failed'));
  });
};

module.exports = { uploadResumeFile, MAX_FILE_SIZE_BYTES, ALLOWED_EXTENSIONS, ALLOWED_MIME_TYPES };
