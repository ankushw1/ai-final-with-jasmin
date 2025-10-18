const mongoose = require('mongoose');

const LoginHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Can be Customer or Admin ID
  userType: { type: String, enum: ["customer", "admin","sales","support"], required: true }, // Differentiates users
  email: { type: String, required: true },
  ip: { type: String, required: true },
  deviceType: { type: String, required: true },
  location: {
    country: String,
    city: String,
    region: String,
    latitude: Number,
    longitude: Number
  },
  loginTime: { type: Date, default: Date.now }
});

module.exports = mongoose.model("LoginHistory", LoginHistorySchema);
