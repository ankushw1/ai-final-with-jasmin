// accountController.js
const Account = require("../models/Support");
const upload = require("../utils/supportFileUpload"); // Multer upload
const fs = require('fs');
const path = require('path');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Otp = require("../models/Otp"); // Assuming you have an OTP model
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const nodemailer = require("nodemailer");
const LoginHistory = require('../models/LoginHistory');
const axios = require('axios');

const sendAccountEmail = async (email, username, password, qrCodeDataURL, secretKey) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.zoho.in',
    port: 465,
    secure: true, // SSL
  auth: {
    user: 'cpaas.support@aimobile.in',
    pass: 'St5sdHBKXFEU', // use app password if TFA is on
  },
  });

  const mailOptions = {
    from: 'cpaas.support@aimobile.in',
    to: email,
    subject: "Your New Account Details",
    html: `
      <h2>Welcome to Our Platform!</h2>
      <p>Your account has been created. Below are your login details:</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Password:</strong> ${password}</p>
      <p>For security, please change your password after logging in.</p>
      
      <h3>Setup Two-Factor Authentication (2FA)</h3>
      <p>Scan the QR code below in Google Authenticator to enable 2FA:</p>
      <img src="cid:qrcode" alt="QR Code" style="width:200px;height:200px;"/>
      
      <p>Or manually enter this secret in Google Authenticator:</p>
      <p><strong>${secretKey}</strong></p>
       <p>You can log in using the link below:</p>
<p style="text-align: center;">
  <a href="https://smsc.aimobile.in/supportlogin" 
     style="
       display: inline-block;
       background-color: #2563eb; 
       color: #fff; 
       padding: 15px 30px; 
       font-size: 18px;
       text-decoration: none; 
       border-radius: 50px; 
       font-weight: bold; 
       transition: background-color 0.3s ease;
     "
     onmouseover="this.style.backgroundColor='#1e3a8a'"
     onmouseout="this.style.backgroundColor='#2563eb'"
  >
    Login Now
  </a>
</p>

  
      <p>Thanks for joining us!</p>
    `,
    attachments: [
      {
        filename: "qrcode.png",
        content: qrCodeDataURL.split("base64,")[1], // Extract base64 data
        encoding: "base64",
        cid: "qrcode", // Content ID (used in <img src="cid:qrcode">)
      }
    ]
  };


  await transporter.sendMail(mailOptions);
};

exports.createAccount = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: "Error uploading file", error: err });
    }

    try {
      const { username, password, email, firstName, lastName, mobile, address } = req.body;

      if (!username || !password || !email || !firstName || !lastName || !mobile || !address) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Hash the password before saving
      const hashedPassword = await bcrypt.hash(password, 10);

      let kycFile = req.file
        ? `${req.protocol}://${req.get("host")}/${req.file.path.replace(/\\/g, "/")}`
        : null; // Prepend the server's base URL

      const secret = speakeasy.generateSecret({ name: `AI_Support (${email})` });

      // Generate a QR Code for the user to scan
      const otpAuthUrl = secret.otpauth_url;
      const qrCodeDataURL = await QRCode.toDataURL(otpAuthUrl);

      const newAccount = new Account({
        username,
        password: hashedPassword, // Store the hashed password
        email,
        firstName,
        lastName,
        mobile,
        address,
        kyc: kycFile,
        googleAuthSecret: secret.base32, // Store this for verification
        createdByAdmin: req.user.id,
      });

      await newAccount.save();

      await sendAccountEmail(email, username, password, qrCodeDataURL, secret.base32);


      res.status(201).json({
        message: "Account created successfully!",
        account: newAccount,
      });
    } catch (error) {
      console.error("Error creating account:", error);
      res.status(500).json({ message: "Error creating account", error });
    }
  });
};



exports.getAllAccounts = async (req, res) => {
  try {
    const { page = 0, pageSize = 10, search = "" } = req.query; // Get page, pageSize, and search query from request
    const skip = parseInt(page) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    const filter = search
      ? {
        $or: [
          { username: { $regex: search, $options: "i" } }, // Case-insensitive search by username
          { email: { $regex: search, $options: "i" } }, // Case-insensitive search by email
        ],
      }
      : {};

    const supports = await Account.find(filter)
      .select("-password") // Exclude password field
      .skip(skip) // Skip records based on the page number
      .limit(limit) // Limit the number of records per page
      .populate("createdByAdmin", "username email"); // Populate createdByAdmin field with username and email

    const totalAccounts = await Account.countDocuments(filter); // Get total count based on the filter

    res.json({
      supports,
      total: totalAccounts,
    });
  } catch (error) {
    console.error("Error fetching accounts:", error);
    res.status(500).json({ message: "Error fetching accounts!", error });
  }
};


// Update Account (Admin only)
exports.updateAccount = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const account = await Account.findById(id);

    if (!account) {
      return res.status(404).json({ message: 'Account not found!' });
    }

    if (account.createdByAdmin.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied!' });
    }

    const updatedAccount = await Account.findByIdAndUpdate(id, updates, { new: true });
    res.json({ message: 'Account updated successfully!', account: updatedAccount });
  } catch (error) {
    console.error('Error updating account:', error);
    res.status(500).json({ message: 'Error updating account!', error });
  }
};

// Delete Account (Admin only)
exports.deleteAccount = async (req, res) => {
  const { id } = req.params;

  try {
    const account = await Account.findById(id);

    if (!account) {
      return res.status(404).json({ message: 'Account not found!' });
    }

    // Delete the KYC file if it exists
    if (account.kyc) {
      // Remove the protocol part (http://localhost:5000) from the file path
      const filePath = account.kyc.replace(/^.*?:\/\//, '').replace('localhost:5000/', ''); // Remove the full URL and just keep the relative path
      const fullFilePath = path.join(__dirname, '..', filePath); // Get the full file path

      // Check if the file exists and delete it
      try {
        await fs.promises.unlink(fullFilePath);
      } catch (err) {
        console.error('Error deleting file:', err);
      }

      // Delete the user's KYC folder and the parent email folder
      const kycFolderPath = path.dirname(fullFilePath); // Get the KYC folder path
      const emailFolderPath = path.dirname(kycFolderPath); // User's email folder path (parent of the KYC folder)

      // Check and delete the KYC folder if empty
      try {
        const kycFiles = await fs.promises.readdir(kycFolderPath);
        if (kycFiles.length === 0) {
          await fs.promises.rmdir(kycFolderPath);
        }
      } catch (err) {
        console.error('Error reading KYC directory:', err);
      }

      // Check and delete the user’s email folder if empty
      try {
        const emailFiles = await fs.promises.readdir(emailFolderPath);
        if (emailFiles.length === 0) {
          await fs.promises.rmdir(emailFolderPath);
        }

        // Check and delete the parent folder of the email folder (if it’s empty)
        const parentFolderPath = path.dirname(emailFolderPath); // Parent folder path
        const parentFiles = await fs.promises.readdir(parentFolderPath);
        if (parentFiles.length === 0) {
          await fs.promises.rmdir(parentFolderPath);
        }
      } catch (err) {
        console.error('Error deleting email or parent folder:', err);
      }
    }

    // Delete the account from the database
    await Account.findByIdAndDelete(id);
    res.json({ message: 'Account deleted successfully!' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ message: 'Error deleting account!', error });
  }
};

exports.supportLogin = async (req, res) => {
  const { email, password, otp, authMethod } = req.body;
  const ip = req.headers["x-forwarded-for"] || req.ip;

  try {
    // Find account by email
    const account = await Account.findOne({ email });
    if (!account) {
      return res.status(404).json({ message: "Account not found!" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, account.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials!" });
    }

    // Handle authentication based on the selected method
    if (authMethod === "email") {
      // Verify Email OTP
      const otpEntry = await Otp.findOne({ email }).sort({ expiresAt: -1 });
      if (!otpEntry || otpEntry.otp !== otp || new Date() > otpEntry.expiresAt) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }
      await Otp.deleteOne({ email }); // Delete OTP after successful verification
    } else if (authMethod === "google-auth") {
      // Verify Google Authenticator OTP
      const verified = speakeasy.totp.verify({
        secret: account.googleAuthSecret,
        encoding: "base32",
        token: otp,
      });

      if (!verified) {
        return res.status(400).json({ message: "Invalid Google Authenticator OTP" });
      }
    } else {
      return res.status(400).json({ message: "Invalid authentication method" });
    }

    // Generate JWT token
    const token = jwt.sign({ id: account._id, role: account.role }, process.env.JWT_SECRET, { expiresIn: "1h" });

    // Detect device type
    const userAgent = req.headers["user-agent"];
    const deviceType = /mobile/i.test(userAgent) ? "Mobile" : "Desktop";

    // Fetch location based on IP
    let location = {};
    try {
      const response = await axios.get(`http://ip-api.com/json/${ip}`);
      if (response.data.status === "success") {
        location = {
          country: response.data.country,
          city: response.data.city,
          region: response.data.regionName,
          latitude: response.data.lat,
          longitude: response.data.lon,
        };
      }
    } catch (error) {
      console.error("Error fetching location:", error);
    }

    // Save login history
    await new LoginHistory({
      userId: account._id,
      userType: "support",
      email: account.email,
      ip,
      deviceType,
      location,
    }).save();

    res.status(200).json({ token, username: account.username, email: account.email, role: account.role });
  } catch (error) {
    console.error("Login failed:", error);
    res.status(500).json({ message: "Login failed!", error });
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