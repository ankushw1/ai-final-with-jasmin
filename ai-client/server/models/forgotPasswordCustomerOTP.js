const mongoose = require('mongoose');

// OTP Schema
const otpsSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

const OTP = mongoose.model('forgotPasswordCustomerOTP', otpsSchema);

module.exports = OTP;
