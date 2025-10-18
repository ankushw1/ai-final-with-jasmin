const mongoose = require("mongoose");

const HttpClientSchema = new mongoose.Schema({
  uniqueId: { type: String, required: true, unique: true },
  url: { type: String, required: true },
  httpMethod: { type: String, required: true, enum: ["GET", "POST"] },
  user: { type: String, required: true },
  password: { type: String, required: true },
  isActive: { type: Boolean, default: true },
});

module.exports = mongoose.model("HttpClient", HttpClientSchema);
