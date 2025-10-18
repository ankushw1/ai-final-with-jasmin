const mongoose = require("mongoose");

const HttpCarrierSchema = new mongoose.Schema({
  uniqueId: { type: String, required: true, unique: true },
  host: { type: String, required: true },
  port: { type: String, required: true },
  username: { type: String, required: true },
  password: { type: String, required: true },
  user: { type: String, required: true },
  isActive: { type: Boolean, default: true },

});

module.exports = mongoose.model("SmppClient", HttpCarrierSchema);
