const Customer = require("../models/Customer");
const Reseller = require("../models/Reseller");
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const nodemailer = require('nodemailer');
const axios = require('axios');
const CustomerUser = require("../models/CustomerUser");
const qs = require('qs');
const { createCustomer: createJasminCustomer, deleteCustomer: deleteJasminCustomer } = require('../utils/jasminWrapper');

const sendConfirmationEmail = async (primaryEmail, username, ip, password) => {
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
                  <td>Username</td>
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
             <p>You can log in using the link below:</p>
<p style="text-align: center;">
  <a href="https://portal.aimobile.in" 
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

exports.createCustomer = async (req, res) => {
  const {
    username,
    password,
    companyName,
    mobileNumber,
    primaryEmail,
    ratesEmail,
    billingEmail,
    supportEmail,
    address,
    accountType,
    contactPersonName,
    contactPersonMobile,
    billingCycle,
    channels,
    assignedAccountManager,
  } = req.body;

  const ip = req.headers["x-forwarded-for"] || req.ip;
  const groupname = `${username}_group`;
  const uid = `${username}_user`;

  try {
    let validChannels;
    if (req.user.role === 1) {
      validChannels = ["sms", "voice", "whatsapp", "rcs", "email"];
    } else if (req.user.role === 2) {
      const reseller = await Reseller.findById(req.user.id);
      if (!reseller) return res.status(404).json({ message: "Reseller not found!" });
      validChannels = reseller.channels;
    } else {
      return res.status(403).json({ message: "Unauthorized access!" });
    }

    const invalidChannels = channels?.filter(c => !validChannels.includes(c)) || [];
    if (invalidChannels.length > 0) {
      return res.status(400).json({ message: `Invalid channels: ${invalidChannels.join(", ")}` });
    }

    if (!password) {
      return res.status(400).json({ message: "Password is required!" });
    }

const existingUser = await Customer.findOne({
  $or: [
    { username: new RegExp(`^${username}$`, 'i') },
    { primaryEmail: new RegExp(`^${primaryEmail}$`, 'i') }
  ]
});

if (existingUser) {
  const duplicateField =
    existingUser.username.toLowerCase() === username.toLowerCase()
      ? "Username"
      : "Email";

  return res.status(400).json({ message: `${duplicateField} already exists!` });
}


    const hashedPassword = await bcrypt.hash(password, 10);
    const newCustomer = new Customer({
      username,
      password: hashedPassword,
      companyName,
      mobileNumber,
      primaryEmail,
      ratesEmail,
      billingEmail,
      supportEmail,
      address,
      accountType,
      contactPersonName,
      contactPersonMobile,
      billingCycle,
      channels,
      createdByAdmin: req.user.role === 1 ? req.user.id : undefined,
      createdByReseller: req.user.role === 2 ? req.user.id : undefined,
      assignedAccountManager: assignedAccountManager && assignedAccountManager !== "none" ? assignedAccountManager : undefined,
    });

    await newCustomer.save();
    await sendConfirmationEmail(primaryEmail, username, ip, password);

    // Create customer in Jasmin (group + user with 1 sec delay)
    await createJasminCustomer(username, username).catch(() => { });

    await new CustomerUser({
      usid: username,
      groupname,
      username,
      password: username,
    }).save();

    return res.status(201).json({
      message: "Customer and Jasmin user created successfully!",
      customer: newCustomer,
    });

  } catch (error) {
    return res.status(500).json({
      message: "Error creating Customer!",
      error: error.message || error,
    });
  }
};



// Get All Customers with Pagination and Search
exports.getAllCustomers = async (req, res) => {
  try {
    const { page = 0, pageSize = 10, search = "" } = req.query; // Get page, pageSize, and search query from request
    const skip = parseInt(page) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    // Assuming the user ID (admin or reseller) is available from the session or token
    const userId = req.user._id; // Modify this according to how you're storing the user info in the request
    const userRole = req.user.role; // Assuming user role is available (1 for admin, 2 for reseller)

    console.log('aa', userRole)

    let filter = {};

    if (userRole === 1 || userRole === 5) {
      // ✅ Admin (Role 1) can see all customers
      filter = {};
    } else if (userRole === 2) {
      // ✅ Reseller (Role 2) can see only their customers
      filter = { createdByReseller: userId };
    } else if (userRole === 4) {
      // ✅ Role 4 should only see their own customers
      filter = { assignedAccountManager: userId };
    } else {
      return res.status(403).json({ message: "Unauthorized access!" });
    }

    // If there's a search query, add it to the filter
    if (search) {
      filter.$and = [
        {
          $or: [
            { username: { $regex: search, $options: "i" } }, // Case-insensitive search by username
            { primaryEmail: { $regex: search, $options: "i" } }, // Case-insensitive search by email
          ],
        },
      ];
    }

    // Fetch customers with the filter
    const customers = await Customer.find(filter)
      .select("-password") // Exclude password field
      .skip(skip) // Skip records based on the page number
      .limit(limit) // Limit the number of records per page
      .sort({ createdAt: -1 });

    const totalCustomer = await Customer.countDocuments(filter); // Get total count based on the filter

    res.json({
      customers,
      total: totalCustomer,
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ message: "Error fetching customers", error });
  }
};



exports.updateCustomer = async (req, res) => {
  const { id } = req.params;
  let updates = { ...req.body };

  try {
    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found!" });
    }

    if (req.user.role !== 1) {
      return res.status(403).json({ message: "Access denied!" });
    }

    let updateQuery = {};

    // ✅ If assignedAccountManager is empty or "none", remove it from MongoDB
    if (updates.assignedAccountManager === "" || updates.assignedAccountManager === "none") {
      updateQuery.$unset = { assignedAccountManager: "" }; // Removes the field
      delete updates.assignedAccountManager;
    } else {
      updateQuery.$set = updates;
    }

    const updatedCustomer = await Customer.findByIdAndUpdate(id, updateQuery, { new: true });

    res.json({ message: "Customer updated successfully!", customer: updatedCustomer });
  } catch (error) {
    res.status(500).json({ message: "Error updating Customer!", error });
  }
};



exports.deleteCustomer = async (req, res) => {
  const { id } = req.params;

  try {
    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found!" });
    }

    // Delete customer from Jasmin (user + group)
    try {
      await deleteJasminCustomer(customer.username);
    } catch (_) { }

    // Delete local records
    await Customer.findByIdAndDelete(id);
    await CustomerUser.findOneAndDelete({ username: customer.username });

    res.json({ message: "Customer and associated Jasmin user/group deleted." });
  } catch (error) {
    res.status(500).json({ message: "Error deleting customer!", error: error.message });
  }
};





exports.customerLogin = async (req, res) => {
  const { email, password } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.ip; // Get IP address from the request

  try {

    const customer = await Customer.findOne({ primaryEmail: email });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found!" });
    }

    if (!customer.isActive) {
      return res.status(403).json({ message: "Your account is deactivated. Please contact support to activate your account." });
    }


    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials!" });
    }

    const token = jwt.sign({ id: customer._id, role: 'customer' }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({ token, email: customer.primaryEmail, role: 3 });
    await sendConfirmationLoginEmail(email, ip);

  } catch (error) {
    console.error('Error during login:', error); // Log the actual error
    res.status(500).json({ message: "Login failed!", error });
  }
};