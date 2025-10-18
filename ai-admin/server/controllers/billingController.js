// accountController.js
const Account = require("../models/Billing");
const upload = require("../utils/billingFileUpload"); // Multer upload
const fs = require('fs');
const path = require('path');

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

      let kycFile = req.file
        ? `${req.protocol}://${req.get("host")}/${req.file.path.replace(/\\/g, "/")}`
        : null; // Prepend the server's base URL

      const newAccount = new Account({
        username,
        password,
        email,
        firstName,
        lastName,
        mobile,
        address,
        kyc: kycFile,
        createdByAdmin: req.user.id,
      });

      await newAccount.save();

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

    const billings = await Account.find(filter)
      .select("-password") // Exclude password field
      .skip(skip) // Skip records based on the page number
      .limit(limit) // Limit the number of records per page
      .populate("createdByAdmin", "username email"); // Populate createdByAdmin field with username and email

    const totalAccounts = await Account.countDocuments(filter); // Get total count based on the filter

    res.json({
      billings,
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
// Delete Account (Admin only)
exports.deleteAccount = async (req, res) => {
  const { id } = req.params;

  try {
    const account = await Account.findById(id);

    if (!account) {
      return res.status(404).json({ message: 'Account not found!' });
    }

    if (account.createdByAdmin.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied!' });
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
