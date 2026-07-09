const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { uploadResumeFile } = require('../middleware/upload.middleware');
const {
  uploadResume,
  analyzeResume,
  generateAts,
  matchJobDescription,
  rewriteResume,
  generateInterviewQuestions,
} = require('../controllers/resume.controller');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.post('/upload', asyncHandler(protect), uploadResumeFile, asyncHandler(uploadResume));
router.post('/analyze', asyncHandler(protect), asyncHandler(analyzeResume));
router.post('/ats', asyncHandler(protect), asyncHandler(generateAts));
router.post('/jd-match', asyncHandler(protect), asyncHandler(matchJobDescription));
router.post('/rewrite', asyncHandler(protect), asyncHandler(rewriteResume));
router.post('/interview', asyncHandler(protect), asyncHandler(generateInterviewQuestions));

module.exports = router;
