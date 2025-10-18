const nodemailer = require('nodemailer');
const Admin = require("../models/Admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Otp = require('../models/Otp');
const LoginHistory = require('../models/LoginHistory');
const axios = require('axios');
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");

const sendAccountEmail = async (email, password, qrCodeDataURL, secretKey) => {
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
  <a href="https://smsc.aimobile.in/" 
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


// Email sending function
const sendConfirmationEmail = async (email, name, ip, password) => {
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
    subject: 'Confirmation of Your Connection to AI Mobile Messaging Platform',
    html: `
      <html>
        <head>
          <style>
            /* Reset for mobile responsiveness */
            body, table, td, a {
              -ms-text-size-adjust: 100%;
              -webkit-text-size-adjust: 100%;
              margin: 0;
              padding: 0;
              font-family: 'Arial', sans-serif;
            }
            img {
              -ms-interpolation-mode: bicubic;
            }
            table {
              border-spacing: 0;
              border-collapse: collapse;
            }
            
            /* Background and container */
            .email-background {
              background: linear-gradient(135deg, #34d399, #1e40af); /* Gradient background */
              padding: 30px 0;
            }
  
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 10px;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
  
            .header {
              background-color: #ffffff;
              text-align: center;
              padding: 40px;
              border-bottom: 2px solid #f0f4f8;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
  
            .header h1 {
              color: #333;
              font-size: 28px;
              margin: 0;
              font-weight: bold;
              text-transform: uppercase;
            }
  
            .content {
              padding: 25px;
            }
  
            .content p {
              font-size: 16px;
              color: #555;
              line-height: 1.6;
            }
  
            .content table {
              width: 100%;
              margin: 20px 0;
            }
  
            .content td {
              padding: 10px 0;
              text-align: left;
            }
  
            .content td:first-child {
              font-weight: bold;
              color: #333;
            }
  
            .footer {
              background-color: #ffffff;
              text-align: center;
              padding: 15px;
              border-top: 2px solid #f0f4f8;
              font-size: 14px;
              color: #888;
            }
  
            /* Buttons */
            .btn {
              display: inline-block;
              background-color: #1e40af;
              color: #fff;
              padding: 12px 25px;
              font-size: 16px;
              text-decoration: none;
              border-radius: 50px;
              transition: background-color 0.3s ease;
            }
  
            .btn:hover {
              background-color: #1e3a8a;
            }
  
            /* Mobile responsiveness */
            @media only screen and (max-width: 600px) {
              .email-container {
                padding: 15px;
              }
  
              .header h1 {
                font-size: 24px;
              }
  
              .content p {
                font-size: 14px;
              }
  
              .btn {
                padding: 10px 20px;
                font-size: 14px;
              }
            }
          </style>
        </head>
        <body class="email-background">
          <div class="email-container">
            <div class="header">
              <h1>Confirmation of Your Connection to AI Mobile Messaging Platform</h1>
            </div>
            <div class="content">
              <p>Dear Customer,</p>
              <p>
                We are sending you this email to confirm your connection to the AI Mobile Messaging platform.
              </p>
              <table>
                <tr>
                  <td>Customer Name</td>
                  <td>: ${name}</td>
                </tr>
                <tr>
                  <td>Customer Email</td>
                  <td>: ${email}</td>
                </tr>
                <tr>
                  <td>Customer Password</td>
                  <td>: ${password}</td>
                </tr>
                <tr>
                  <td>Connection IP</td>
                  <td>: ${ip}</td>
                </tr>
                <tr>
                  <td>Connection Time</td>
                  <td>: ${new Date().toLocaleString()}</td>
                </tr>
              </table>
              <p>
                This email is intended to inform you about the security of your information and your AI Mobile Messaging services.
              </p>
              <p>
                If you did not connect to the AI Mobile Messaging platform, please contact our support immediately to secure your account.
              </p>
              <a href="mailto:cpaas.support@aimobile.in" class="btn">Contact Support</a>
            </div>
            <div class="footer">
              <p>Best regards, <br>AI Mobile Support Team</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };


  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending confirmation email:', error);
  }
};


const sendConfirmationLoginEmail = async (email, ip) => {
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
    subject: 'Successful Login to AI Mobile Messaging Platform',
    html: `
      <html>
        <head>
          <style>
            /* Reset for mobile responsiveness */
            body, table, td, a {
              -ms-text-size-adjust: 100%;
              -webkit-text-size-adjust: 100%;
              margin: 0;
              padding: 0;
              font-family: 'Arial', sans-serif;
            }
            img {
              -ms-interpolation-mode: bicubic;
            }
            table {
              border-spacing: 0;
              border-collapse: collapse;
            }
            
            /* Background and container */
            .email-background {
              background: linear-gradient(135deg, #6EE7B7, #3B82F6); /* Gradient background */
              padding: 30px 0;
            }
  
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 10px;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
  
            .header {
              background-color: #ffffff;
              text-align: center;
              padding: 40px;
              border-bottom: 2px solid #f0f4f8;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
  
            .header h1 {
              color: #333;
              font-size: 28px;
              margin: 0;
              font-weight: bold;
              text-transform: uppercase;
            }
  
            .content {
              padding: 25px;
            }
  
            .content p {
              font-size: 16px;
              color: #555;
              line-height: 1.6;
            }
  
            .content table {
              width: 100%;
              margin: 20px 0;
            }
  
            .content td {
              padding: 10px 0;
              text-align: left;
            }
  
            .content td:first-child {
              font-weight: bold;
              color: #333;
            }
  
            .footer {
              background-color: #ffffff;
              text-align: center;
              padding: 15px;
              border-top: 2px solid #f0f4f8;
              font-size: 14px;
              color: #888;
            }
  
            /* Buttons */
            .btn {
              display: inline-block;
              background-color: #3B82F6;
              color: #fff;
              padding: 12px 25px;
              font-size: 16px;
              text-decoration: none;
              border-radius: 50px;
              transition: background-color 0.3s ease;
            }
  
            .btn:hover {
              background-color: #2563eb;
            }
  
            /* Mobile responsiveness */
            @media only screen and (max-width: 600px) {
              .email-container {
                padding: 15px;
              }
  
              .header h1 {
                font-size: 24px;
              }
  
              .content p {
                font-size: 14px;
              }
  
              .btn {
                padding: 10px 20px;
                font-size: 14px;
              }
            }
          </style>
        </head>
        <body class="email-background">
          <div class="email-container">
            <div class="header">
              <h1>Successful Login to AI Mobile Messaging Platform</h1>
            </div>
            <div class="content">
              <p>Dear User,</p>
              <p>
                This email confirms your successful login to the AI Mobile Messaging platform.
              </p>
              <table>
                <tr>
                  <td>Customer Email</td>
                  <td>: ${email}</td>
                </tr>
                <tr>
                  <td>Login IP Address</td>
                  <td>: ${ip}</td>
                </tr>
                <tr>
                  <td>Login Time</td>
                  <td>: ${new Date().toLocaleString()}</td>
                </tr>
              </table>
              <p>
                If this login was not performed by you, please contact our support team immediately to secure your account.
              </p>
              <a href="mailto:cpaas.support@aimobile.in" class="btn">Contact Support</a>
            </div>
            <div class="footer">
              <p>Best regards, <br>AI Mobile Support Team</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };



  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending confirmation email:', error);
  }
};

exports.adminLogin = async (req, res) => {
  const { email, password, otp, authMethod } = req.body;
  const ip = req.headers["x-forwarded-for"] || req.ip;

  try {
    // Find admin by email
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found!" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, admin.password);
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
        secret: admin.googleAuthSecret,
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
    const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: "1h" });

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
      userId: admin._id,
      userType: "admin",
      email: admin.email,
      ip,
      deviceType,
      location,
    }).save();

    res.status(200).json({ token, name: admin.name, role: admin.role });
  } catch (error) {
    console.error("Login failed:", error);
    res.status(500).json({ message: "Login failed!", error });
  }
};


// Create Admin
exports.createAdmin = async (req, res) => {
  const { name, email, password, mobile } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.ip; // Get IP address from the request

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const secret = speakeasy.generateSecret({ name: `AI_Admin (${email})` });

    // Generate a QR Code for the user to scan
    const otpAuthUrl = secret.otpauth_url;
    const qrCodeDataURL = await QRCode.toDataURL(otpAuthUrl);

    const newAdmin = new Admin({ name, email, password: hashedPassword, mobile, googleAuthSecret: secret.base32, });

    await newAdmin.save();

    // Send confirmation email to the new admin
    await sendAccountEmail(email, password, qrCodeDataURL, secret.base32);

    res.status(201).json({
      message: "Admin created successfully!",
      admin: { name: newAdmin.name, email: newAdmin.email },
    });
  } catch (error) {
    console.log('aaa', error)
    res.status(500).json({ message: "Error creating Admin!", error });
  }
};

// Update Admin
exports.updateAdmin = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (req.user.role !== 1) {
    return res.status(403).json({ message: "Access denied!" });
  }

  try {
    const updatedAdmin = await Admin.findByIdAndUpdate(id, updates, { new: true });
    if (!updatedAdmin) {
      return res.status(404).json({ message: "Admin not found!" });
    }

    res.json({ message: "Admin updated successfully!", admin: updatedAdmin });
  } catch (error) {
    res.status(500).json({ message: "Error updating Admin!", error });
  }
};

// Delete Admin
exports.deleteAdmin = async (req, res) => {
  const { id } = req.params;

  if (req.user.role !== 1) {
    return res.status(403).json({ message: "Access denied!" });
  }

  try {
    const deletedAdmin = await Admin.findByIdAndDelete(id);
    if (!deletedAdmin) {
      return res.status(404).json({ message: "Admin not found!" });
    }

    res.json({ message: "Admin deleted successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting Admin!", error });
  }
};

exports.getAllAdmins = async (req, res) => {
  try {
    const { page = 0, pageSize = 10, search = "" } = req.query; // Get page, pageSize, and search query from request
    const skip = parseInt(page) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    // Build the filter based on the search query and exclude "superadmin@gmail.com"
    const filter = {
      email: { $ne: "superadmin@gmail.com" }, // Exclude superadmin email
      ...(search && {
        $or: [
          { name: { $regex: search, $options: "i" } }, // Case-insensitive search by name
          { email: { $regex: search, $options: "i" } }, // Case-insensitive search by email
        ],
      }),
    };

    const admins = await Admin.find(filter)
      .select("-password") // Exclude password field
      .skip(skip) // Skip records based on the page number
      .limit(limit) // Limit the number of records per page
      .sort({ createdAt: -1 });

    const totalAdmins = await Admin.countDocuments(filter); // Get total count based on the filter

    res.json({
      admins,
      total: totalAdmins,
    });
  } catch (error) {
    console.error("Error fetching admins:", error);
    res.status(500).json({ message: "Error fetching admins", error });
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