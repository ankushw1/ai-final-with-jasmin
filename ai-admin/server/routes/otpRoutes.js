const express = require('express');
const router = express.Router();
const {  verifyOtp, sendOtp } = require('../controllers/otpController');

// Route to generate and send OTP
router.post('/send-otp', sendOtp);

// Route to verify OTP
router.post('/verify-otp', verifyOtp);

module.exports = router;
