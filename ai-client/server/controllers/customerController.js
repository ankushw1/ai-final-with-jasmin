const Customer = require("../models/Customer"); // Renamed to uppercase for clarity
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const OTPStore = {}; // This can be a temporary in-memory store or use a database for persistence
const OTP = require('../models/forgotPasswordCustomerOTP'); // Import the OTP model
const LoginHistory = require('../models/LoginHistory');
const axios = require('axios');

// Create a transporter for sending emails
const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.in',
  port: 465,
  secure: true, // SSL
  auth: {
    user: 'noc.smsc@aimobile.in',
    pass: 'g-Ulpdw9', // Use your Zoho SMTP password
  },
});


exports.customerLogin = async (req, res) => {
  const { identifier, password } = req.body; // Changed from email to identifier
  const ip = (req.headers['x-forwarded-for'] || req.ip).split(',')[0].trim();

  try {
    // Search for customer by either email or username
    const customerData = await Customer.findOne({
      $or: [
        { primaryEmail: identifier },
        { username: identifier }
      ]
    });

    if (!customerData) {
      return res.status(404).json({ message: "Customer not found!" });
    }

    if (!customerData.isActive) {
      return res
        .status(403)
        .json({ message: "Your account is deactivated. Please contact support to activate your account." });
    }

    const isMatch = await bcrypt.compare(password, customerData.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials!" });
    }

    const token = jwt.sign(
      { 
        id: customerData._id, 
        role: 'customer', 
        username: customerData.username,
        email: customerData.primaryEmail 
      },
      'a7sdlk3', // Consider using environment variable for JWT secret
      { expiresIn: '1h' }
    );

    // Detect device type
    const userAgent = req.headers['user-agent'];
    const deviceType = /mobile/i.test(userAgent) ? "Mobile" : "Desktop";

    // Fetch location from IP
    let location = {};
    try {
      const response = await axios.get(`http://ip-api.com/json/${ip}`);

      if (response.data.status === "success") {
        location = {
          country: response.data.country,
          city: response.data.city,
          region: response.data.regionName,
          latitude: response.data.lat,
          longitude: response.data.lon
        };
      }
    } catch (error) {
      console.error("❌ Error fetching location:", error);
    }

    // Save customer login details
    const loginHistory = new LoginHistory({
      userId: customerData._id,
      userType: "customer",
      email: customerData.primaryEmail,
      ip,
      deviceType,
      location
    });

    await loginHistory.save();

    // Return response with customer data
    res.json({ 
      token, 
      email: customerData.primaryEmail,
      name: customerData.username, // or customerData.contactPersonName if you prefer
      role: customerData.role || 3 
    });

  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: "Login failed!", error: error.message });
  }
};

exports.requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  try {
    // Check if the customer exists in the database
    const customer = await Customer.findOne({ primaryEmail: email });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found!' });
    }

    // Generate OTP (6 digits)
    const otp = crypto.randomInt(100000, 999999).toString();

    // Store the OTP in the database with an expiration time (15 minutes)
    const otpRecord = new OTP({
      email,
      otp,
      expiresAt: Date.now() + 15 * 60 * 1000, // OTP expires in 15 minutes
    });

    // Save OTP to the database
    await otpRecord.save();

    // Send OTP to the customer's email address
    await transporter.sendMail({
      from: 'support@aimobiletelco.com',
      to: email,
      subject: 'Password Reset OTP',
      text: `Your OTP for password reset is: ${otp}`,
    });

    res.status(200).json({ message: 'OTP sent to email' });
  } catch (error) {
    console.error('Error requesting password reset:', error);
    res.status(500).json({ message: 'Error sending OTP', error: error.message });
  }
};



exports.verifyOTPAndResetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    // Fetch the OTP record from the database
    const otpRecord = await OTP.findOne({ email, otp });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Check if OTP is expired
    if (Date.now() > otpRecord.expiresAt) {
      await OTP.deleteOne({ email, otp }); // Delete expired OTP record
      return res.status(400).json({ message: 'OTP has expired' });
    }

    // Proceed to reset the password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update customer's password in the database
    await Customer.updateOne({ primaryEmail: email }, { password: hashedPassword });

    // Delete OTP record after successful password reset
    await OTP.deleteOne({ email, otp });

    res.status(200).json({ message: 'Password successfully reset' });
  } catch (error) {
    console.error('Error verifying OTP and resetting password:', error);
    res.status(500).json({ message: 'Error resetting password', error: error.message });
  }
};


exports.changePassword = async (req, res) => {
  const { email, currentPassword, newPassword, confirmNewPassword } = req.body;

  try {
    const customerId = req.user._id;
    // Fetch customer by email
    const customer = await Customer.findOne({ primaryEmail: email });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found!' });
    }

    // Check if current password matches the stored password
    const isMatch = await bcrypt.compare(currentPassword, customer.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect!' });
    }

    // Validate new password and confirm password match
    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: 'New password and confirm password do not match!' });
    }

    // Check if the new password is different from the current password
    if (currentPassword === newPassword) {
      return res.status(400).json({ message: 'New password cannot be the same as the current password!' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password in the database
    customer.password = hashedPassword;
    await customer.save();

    res.status(200).json({ message: 'Password successfully updated!' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Error changing password', error: error.message });
  }
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    // Assuming the customer ID is available in req.user._id
    const customerId = req.user._id;

    // Fetch customer by ID
    const customer = await Customer.findById(customerId);
    console.log('Customer ID:', customerId); // Debugging

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found!' });
    }

    // Check if current password matches the stored password
    const isMatch = await bcrypt.compare(currentPassword, customer.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect!' });
    }

    // Check if the new password is different from the current password
    if (currentPassword === newPassword) {
      return res.status(400).json({ message: 'New password cannot be the same as the current password!' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password in the database
    customer.password = hashedPassword;
    await customer.save();

    res.status(200).json({ message: 'Password successfully updated!' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Error changing password', error: error.message });
  }
};


exports.checkTokenExpiry = async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1]; // Extract token

  if (!token) {
    return res.status(200).json({ expired: true }); // No token means expired
  }

  try {
    jwt.verify(token, "a7sdlk3"); // Verify token
    res.status(200).json({ expired: false }); // Token is valid
  } catch (error) {
    res.status(200).json({ expired: true }); // Any error means token expired or invalid
  }
};