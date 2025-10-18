const mongoose = require('mongoose');

const smsSchema = new mongoose.Schema({
  sender: { type: String, required: true }, // The sender of the SMS
  mobileNumbers: { type: [String], required: true }, // List of mobile numbers to which SMS is sent
  messageType: { 
    type: String, 
    enum: ['TEXT', 'FLASH', 'UNICODE', 'UNI_FLASH'], // Types of messages
    required: true 
  },
  message: { type: String, required: true }, // SMS content
  customer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Customer', 
    required: true 
  }, // Link to the customer who sent the SMS
  status: { 
    type: String, 
    enum: ['Sent', 'Failed'], 
    required: true 
  }, // SMS status ('Sent' or 'Failed')
  providerResponse: { 
    type: mongoose.Schema.Types.Mixed, 
    required: false 
  }, // To store the response from Jasmin API (or error)
  sentAt: { type: Date, default: Date.now } // Timestamp when the SMS was sent
}, { timestamps: true });

module.exports = mongoose.model('SingleSms', smsSchema);
