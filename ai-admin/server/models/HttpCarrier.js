const mongoose = require("mongoose");

const HttpCarrierSchema = new mongoose.Schema({
  uniqueId: { type: String, required: true, unique: true },
  url: { type: String, required: true },
  httpMethod: { type: String, required: true, enum: ["GET", "POST"] },
  isActive: { type: Boolean, default: true },
  password: { type: String, required: true },
});

module.exports = mongoose.model("HttpCarrier", HttpCarrierSchema);
