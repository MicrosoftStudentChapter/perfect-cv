const express = require('express');
const router = express.Router();
const multer = require('multer');
const { upload } = require('../utils/cloudinary');
const { handleUpload } = require('../controllers/resumeController');

const storage = multer.memoryStorage();
const uploadMiddleware = multer({ storage });

router.post('/upload', uploadMiddleware.single('resume'), handleUpload);

module.exports = router;