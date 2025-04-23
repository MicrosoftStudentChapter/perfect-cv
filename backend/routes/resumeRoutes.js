const express = require('express');
const router = express.Router();
const multer = require('multer');
const { verifyToken } = require('../middleware/authMiddleware');
const { handleUpload } = require('../controllers/resumeController');

const storage = multer.memoryStorage();
const uploadMiddleware = multer({ storage });

router.post('/upload', verifyToken, uploadMiddleware.single('resume'), handleUpload);

module.exports = router;