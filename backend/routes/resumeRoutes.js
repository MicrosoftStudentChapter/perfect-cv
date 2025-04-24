const express = require('express');
const router = express.Router();
const multer = require('multer');
const { verifyToken } = require('../middleware/authMiddleware');
const { handleUpload, getATSChecksRemaining, getATSCheckHistory } = require('../controllers/resumeController');

const storage = multer.memoryStorage();
const uploadMiddleware = multer({ storage });

// Upload resume (add '?atsCheck=true' query param for ATS check)
router.post('/upload', verifyToken, uploadMiddleware.single('resume'), handleUpload);

// Get remaining ATS checks
router.get('/ats-checks', verifyToken, getATSChecksRemaining);

// Get ATS check history
router.get('/ats-history', verifyToken, getATSCheckHistory);

module.exports = router;