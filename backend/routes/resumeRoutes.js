const express = require('express');
const router = express.Router();
const multer = require('multer');
const { verifyToken } = require('../middleware/authMiddleware');
const { 
  handleUpload, 
  runATSCheck, 
  getCurrentResume,
  getATSChecksRemaining, 
  finalSubmit,
  getATSCheckHistory 
} = require('../controllers/resumeController');

const storage = multer.memoryStorage();
const uploadMiddleware = multer({ storage });

// Upload resume
router.post('/upload', verifyToken, uploadMiddleware.single('resume'), handleUpload);

// Run ATS check on current resume
router.post('/ats-check', verifyToken, runATSCheck);

// Get current resume
router.get('/current', verifyToken, getCurrentResume);

// Get remaining ATS checks
router.get('/ats-checks', verifyToken, getATSChecksRemaining);

// Final submission
router.post('/final-submit', verifyToken, finalSubmit);

// Get ATS check history
router.get('/ats-history', verifyToken, getATSCheckHistory);

module.exports = router;