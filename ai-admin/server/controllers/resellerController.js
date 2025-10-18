const Reseller = require("../models/Reseller");
const Admin = require("../models/Admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const sendConfirmationEmail = async (primaryEmail, username, ip,password) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.zoho.in",
    port: 465,
    secure: true, // SSL
  auth: {
    user: 'cpaas.support@aimobile.in',
    pass: 'St5sdHBKXFEU', // use app password if TFA is on
  },
  });

  const mailOptions = {
    from: 'cpaas.support@aimobile.in',
    to: primaryEmail,
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
                  <td>: ${username}</td>
                </tr>
                <tr>
                  <td>Customer Email</td>
                  <td>: ${primaryEmail}</td>
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
    console.error("Error sending confirmation email:", error);
  }
};

const sendConfirmationLoginEmail = async (email,  ip) => {
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

// Create a new Reseller
exports.createReseller = async (req, res) => {
  const {
    username,
    password,
    companyName,
    mobileNumber,
    primaryEmail,
    supportEmail,
    ratesEmail,
    billingEmail,
    address,
    contactPersonName,
    contactPersonMobile,
    accountType,
    billingCycle,
    channels,
    credit,
  } = req.body;

  const ip = req.headers["x-forwarded-for"] || req.ip; // Get IP address from the request

  // Ensure only Admins can create resellers
  if (req.user.role !== 1) {
    return res
      .status(403)
      .json({ message: "Access denied! Only Admins can create Resellers." });
  }

  // Validation for required fields
  if (
    !username ||
    !password ||
    !companyName ||
    !mobileNumber ||
    !primaryEmail ||
    !accountType
  ) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {
    // Validate Channels (optional, can be an empty array)
    const validChannels = ["sms", "voice", "whatsapp", "rcs", "email"];
    const invalidChannels =
      channels?.filter((channel) => !validChannels.includes(channel)) || [];
    if (invalidChannels.length > 0) {
      return res
        .status(400)
        .json({ message: `Invalid channels: ${invalidChannels.join(", ")}` });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new Reseller document
    const newReseller = new Reseller({
      username,
      password: hashedPassword,
      companyName,
      mobileNumber,
      primaryEmail,
      supportEmail,
      ratesEmail,
      billingEmail,
      address,
      contactPersonName,
      contactPersonMobile,
      accountType,
      billingCycle,
      createdByAdmin: req.user.id,
      channels: channels || [], // Default to empty array if no channels provided
      credit: credit,
    });

    // Save the new Reseller to the database
    await newReseller.save();

    await sendConfirmationEmail(primaryEmail, username, ip,password);

    // Return success response with the created reseller (excluding password)
    res.status(201).json({
      message: "Reseller created successfully!",
      reseller: {
        username: newReseller.username,
        companyName: newReseller.companyName,
        mobileNumber: newReseller.mobileNumber,
        primaryEmail: newReseller.primaryEmail,
        supportEmail: newReseller.supportEmail,
        ratesEmail: newReseller.ratesEmail,
        billingEmail: newReseller.billingEmail,
        address: newReseller.address,
        contactPersonName: newReseller.contactPersonName,
        contactPersonMobile: newReseller.contactPersonMobile,
        accountType: newReseller.accountType,
        billingCycle: newReseller.billingCycle,
        channels: newReseller.channels,
        createdAt: newReseller.createdAt,
        updatedAt: newReseller.updatedAt,
        credit: newReseller.credit,
      },
    });
  } catch (error) {
    console.error("Error creating Reseller:", error);
    res.status(500).json({ message: "Error creating Reseller!", error });
  }
};

// Get All Admins with Pagination and Search
exports.getAllResellers = async (req, res) => {
  try {
    const { page = 0, pageSize = 10, search = "" } = req.query; // Get page, pageSize, and search query from request
    const skip = parseInt(page) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    const filter = search
      ? {
          $or: [
            { username: { $regex: search, $options: "i" } }, // Case-insensitive search by name
            { primaryEmail: { $regex: search, $options: "i" } }, // Case-insensitive search by email
          ],
        }
      : {};

    const resellers = await Reseller.find(filter)
      .select("-password") // Exclude password field
      .skip(skip) // Skip records based on the page number
      .limit(limit); // Limit the number of records per page

    const totalReseller = await Reseller.countDocuments(filter); // Get total count based on the filter

    res.json({
      resellers,
      total: totalReseller,
    });
  } catch (error) {
    console.error("Error fetching resellers:", error);
    res.status(500).json({ message: "Error fetching resellers", error });
  }
};

// Update Reseller (Admin Only)
exports.updateReseller = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (req.user.role !== 1) {
    return res
      .status(403)
      .json({ message: "Access denied! Only Admins can update Resellers." });
  }

  try {
    const updatedReseller = await Reseller.findByIdAndUpdate(id, updates, {
      new: true,
    });
    if (!updatedReseller) {
      return res.status(404).json({ message: "Reseller not found!" });
    }

    res.json({
      message: "Reseller updated successfully!",
      reseller: updatedReseller,
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating Reseller!", error });
  }
};

// Delete Reseller (Admin Only)
exports.deleteReseller = async (req, res) => {
  const { id } = req.params;

  if (req.user.role !== 1) {
    return res
      .status(403)
      .json({ message: "Access denied! Only Admins can delete Resellers." });
  }

  try {
    const deletedReseller = await Reseller.findByIdAndDelete(id);
    if (!deletedReseller) {
      return res.status(404).json({ message: "Reseller not found!" });
    }

    res.json({ message: "Reseller deleted successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting Reseller!", error });
  }
};

// Reseller Login
exports.resellerLogin = async (req, res) => {
  const { email, password } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.ip; // Get IP address from the request


  try {
    // Find the reseller by email
    const reseller = await Reseller.findOne({ primaryEmail: email });
    if (!reseller) {
      return res.status(404).json({ message: "Reseller not found!" });
    }

    
    if (!reseller.isActive) {
      return res.status(403).json({ message: "Your account is deactivated. Please contact support to activate your account." });
    }

    // Compare the password with the hashed password stored in the database
    const isMatch = await bcrypt.compare(password, reseller.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials!" });
    }

    // Generate a token
    const token = jwt.sign(
      { id: reseller._id, role: 2 },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Respond with the token and reseller details
    res.json({ token, name: reseller.username, role: 2 });
    await sendConfirmationLoginEmail(email, ip);

  } catch (error) {
    res.status(500).json({ message: "Login failed!", error });
  }
};
