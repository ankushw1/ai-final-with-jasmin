const axios = require('axios');
const Sms = require('../models/singleSmsModel'); // Assuming you have a model for SMS
const Customer = require('../models/Customer'); // Assuming you're linking customers to SMS

exports.sendSingleSms = async (req, res) => {
  try {
    const { sender, mobileNumbers, messageType, message } = req.body;
    const userId = req.user._id; // User's ID from JWT token


    // Fetch customer details using userId (ensure this customer exists in DB)
    const customer = await Customer.findById(userId); 

    if (!customer) {
      return res.status(404).json({ message: "Customer not found!" });
    }

    // Prepare the data to send to Jasmin API
    let jasminData;
    if (Array.isArray(mobileNumbers) && mobileNumbers.length > 1) {
      // Use the batch API if there are multiple phone numbers
      jasminData = {
        messages: [
          {
            to: mobileNumbers,  // List of recipient's phone numbers
            content: message,    // The message content
          }
        ]
      };

      // Sending the SMS via Jasmin batch API
      const response = await axios.post(
        'http://185.169.252.75:1402/secure/sendbatch', // Jasmin batch API endpoint
        jasminData,
        {
          headers: {
            'Authorization': 'Basic ' + Buffer.from('testuser:testuser').toString('base64'),
            'Content-Type': 'application/json'
          }
        }
      );

      // Handle the response for batch SMS
      const status = response.status === 200 ? 'Sent' : 'Failed';

      // Create an SMS record to store in the database with response from Jasmin API
      const sms = new Sms({
        sender,
        mobileNumbers,
        messageType,
        message,
        customer: userId,  // Link the SMS to the logged-in customer
        providerResponse: response.data,  // Store the response from Jasmin API
        status: status,  // Mark the status as either 'Sent' or 'Failed'
      });

      await sms.save();

      // Return response to the client
      if (status === 'Sent') {
        return res.status(200).json({ message: "SMS sent successfully!", sms: response.data });
      } else {
        return res.status(500).json({ message: "Failed to send SMS through Jasmin API", error: response.data });
      }

    } else {
      // If there's only one number, send a single SMS using the regular API
      jasminData = {
        to: mobileNumbers,  // Recipient's phone number
        from: sender,       // Sender's name or ID
        content: message,   // The message content
        dlr: "yes",         // Delivery receipt
        "dlr-url": "http://185.169.252.75:5001/dlr", // Optional callback URL
        "dlr-level": 3      // Optional delivery receipt level
      };

      // Sending the SMS via Jasmin API
      const response = await axios.post(
        'http://185.169.252.75:1402/secure/send', // Jasmin API endpoint
        jasminData,
        {
          headers: {
            'Authorization': 'Basic ' + Buffer.from('testuser:testuser').toString('base64'),
            'Content-Type': 'application/json'
          }
        }
      );

      // SMS status based on API response
      const status = response.status === 200 ? 'Sent' : 'Failed';

      // Create an SMS record to store in the database with response from Jasmin API
      const sms = new Sms({
        sender,
        mobileNumbers,
        messageType,
        message,
        customer: userId,  // Link the SMS to the logged-in customer
        providerResponse: response.data,  // Store the response from Jasmin API
        status: status,  // Mark the status as either 'Sent' or 'Failed'
      });

      await sms.save();

      // Return response to the client
      if (status === 'Sent') {
        return res.status(200).json({ message: "SMS sent successfully!", sms: response.data });
      } else {
        return res.status(500).json({ message: "Failed to send SMS through Jasmin API", error: response.data });
      }
    }

  } catch (error) {
    console.error("Error sending SMS:", error);
    const { sender, mobileNumbers, messageType, message } = req.body;

    // Create an SMS record even if there is an error with status as 'Failed'
    const sms = new Sms({
      sender,
      mobileNumbers,
      messageType,
      message,
      customer: req.user._id,  // Link the SMS to the logged-in customer
      providerResponse: error.message,  // Store the error message in providerResponse
      status: 'Failed',   // Mark the status as 'Failed'
    });

    await sms.save();

    return res.status(500).json({ message: "Error sending SMS.", error });
  }
};



// Get Sent SMS History (Optional)
exports.getSentSmsHistory = async (req, res) => {
  try {
    const userId = req.user._id; // User's ID from JWT token
    const sentSms = await Sms.find({ customer: userId });

    return res.status(200).json(sentSms);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error fetching SMS history.", error });
  }
};
