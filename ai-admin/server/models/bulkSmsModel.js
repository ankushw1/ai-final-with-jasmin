const mongoose = require('mongoose');

const smsSchema = new mongoose.Schema({
  sender: { type: String, required: true },
  mobileNumbers: { type: [String], required: true },
  messageType: {
    type: String,
    enum: ['TEXT', 'FLASH', 'UNICODE', 'UNI_FLASH'],
    required: true,
  },
  message: { type: String, required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  status: {
    type: String,
    enum: ['Sent', 'Failed'],
    required: true,
  },
  providerResponse: { type: mongoose.Schema.Types.Mixed, required: false },
  sentAt: { type: Date, default: Date.now },
  filePath: { type: String, required: true }, // New field to store the file path
}, { timestamps: true });

module.exports = mongoose.model('BulkSms', smsSchema);
