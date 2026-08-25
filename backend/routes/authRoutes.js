const express = require('express');
const router = express.Router();
const { sendOtp, verifyOtp, demoLogin } = require('../controllers/authController');

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/demo-login', demoLogin);

module.exports = router;