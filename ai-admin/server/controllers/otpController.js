
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const Otp = require('../models/Otp'); 

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.in',
  port: 465,
  secure: true, // SSL
  auth: {
    user: 'cpaas.support@aimobile.in',
    pass: 'St5sdHBKXFEU', // use app password if TFA is on
  },
});

// Generate OTP and send email
exports.sendOtp = async (req, res) => {
  const { email } = req.body;

  try {
    // Generate a 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Set expiration time (2 minutes)
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000);

    // Delete any existing OTP for the email
    await Otp.deleteOne({ email });

    // Save new OTP in the database with the updated expiry time
    await Otp.create({ email, otp, expiresAt });

    // Send OTP email
    await transporter.sendMail({
      from: '"AI Mobile Telco" <cpaas.support@aimobile.in>',
      to: email,
      subject: 'Your CPaaS Re-authentication Code',
  text: `We noticed a login attempt to your AI Mobile Network account and want to confirm it was you. Please add this code - ${otp}`,
    });

    res.status(200).json({ message: 'OTP sent successfully!' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ message: 'Failed to send OTP', error });
  }
};



exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    // Find the most recent OTP for the email
    const otpEntry = await Otp.findOne({ email }).sort({ expiresAt: -1 });

    if (!otpEntry) {
      return res.status(404).json({ message: 'OTP not found or expired' });
    }

    console.log('OTP Entry:', otpEntry); // Debug log: Check the OTP and expiry time

    // Check if the OTP matches
    if (otpEntry.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Check if the OTP has expired
    if (new Date() > otpEntry.expiresAt) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    // If OTP is valid, delete it to prevent reuse
    await Otp.deleteOne({ email });

    res.status(200).json({ message: 'OTP verified successfully!' });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ message: 'Failed to verify OTP', error });
  }
};
