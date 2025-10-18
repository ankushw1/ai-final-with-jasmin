const multer = require('multer');
const fs = require('fs');
const path = require('path');
const csvParser = require('csv-parser');
const axios = require('axios');
const Sms = require('../models/smsModal');
const Customer = require('../models/Customer');
const { upload } = require('../utils/smsCsvFileUpload.js');

// Bulk SMS Handler
exports.sendBulkSms = async (req, res) => {
  try {
    const { sender, mobileNumbers, messageType, message, file } = req.body; // file as base64

    const userId = req.user._id; // Extracted by auth middleware

    const customer = await Customer.findById(userId); // Ensure customer exists
    if (!customer) {
      return res.status(404).json({ message: "Customer not found." });
    }

    // If mobileNumbers are provided in the request body
    let numbersToProcess = [];
    
    if (mobileNumbers) {
      if (typeof mobileNumbers === 'string') {
        numbersToProcess.push(mobileNumbers); // Single mobile number
      } else if (Array.isArray(mobileNumbers)) {
        numbersToProcess = mobileNumbers; // Multiple mobile numbers
      } else {
        return res.status(400).json({ message: "Invalid mobile number format." });
      }

      // Process SMS sending for the provided numbers
      await processSmsSending(numbersToProcess, sender, message, messageType, userId, res);

    } else if (file) {
      // If file is provided as base64, decode it and save
      const fileBuffer = Buffer.from(file, 'base64');
      const filePath = path.join('./files', userId.toString(), `${Date.now()}.csv`);

      // Ensure the directory exists
      const directoryPath = path.dirname(filePath);
      if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath, { recursive: true });
      }

      // Write the base64 file to the filesystem
      fs.writeFileSync(filePath, fileBuffer);

      const mobileNumbersFromFile = [];

      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on('data', (row) => {
          if (row.mobile) mobileNumbersFromFile.push(row.mobile); // Assuming "mobile" is the column name
        })
        .on('end', async () => {

          if (!mobileNumbersFromFile.length) {
            return res.status(400).json({ message: "No valid mobile numbers found in the file." });
          }

          // Process SMS sending for the numbers from the file
          await processSmsSending(mobileNumbersFromFile, sender, message, messageType, userId, res, filePath);
        });

    } else {
      return res.status(400).json({ message: "No mobile numbers or file provided." });
    }

  } catch (error) {
    console.error("Error in bulk SMS controller:", error);
    return res.status(500).json({ message: "Error sending bulk SMS.", error });
  }
};

// Helper function to process SMS sending
async function processSmsSending(mobileNumbers, sender, message, messageType, userId, res, filePath = null) {
  const failedNumbers = [];
  const successfulNumbers = [];

  // Loop through mobile numbers and send SMS one by one
  for (const mobile of mobileNumbers) {
    const jasminData = {
      to: [mobile], // Recipient's phone number
      from: sender, // Sender's name or ID
      content: message, // The message content
      dlr: "yes", // Delivery receipt
      "dlr-url": "http://185.169.252.75:5001/dlr", // Optional callback URL
      "dlr-level": 3, // Optional delivery receipt level
    };

    try {
      const response = await axios.post(
        'http://185.169.252.75:1402/secure/send',
        jasminData,
        {
          headers: {
            Authorization: 'Basic ' + Buffer.from('testuser:testuser').toString('base64'),
            'Content-Type': 'application/json',
          },
        }
      );

      const status = response.status === 200 ? "Sent" : "Failed";
      if (status === "Sent") {
        successfulNumbers.push(mobile);
      } else {
        failedNumbers.push(mobile);
      }

      // Save individual SMS record to the database
      const sms = new Sms({
        sender,
        mobileNumbers: [mobile],
        messageType,
        message,
        customer: userId,
        providerResponse: {
          status,
          details: response.data || null,
        },
        status,
      });

      await sms.save();
    } catch (apiError) {
      console.error(`Error sending SMS to ${mobile}:`, apiError.message);
      failedNumbers.push(mobile);

      // Save failed SMS record to the database
      const sms = new Sms({
        sender,
        mobileNumbers: [mobile],
        messageType,
        message,
        customer: userId,
        providerResponse: {
          status: "Failed",
          error: apiError.message,
        },
        status: "Failed",
      });

      await sms.save();
    }
  }

  // Return summary response
  return res.status(200).json({
    message: "SMS processed completed!",
    details: {
      total: mobileNumbers.length,
      successful: successfulNumbers.length,
      failed: failedNumbers.length,
    },
  });
}
