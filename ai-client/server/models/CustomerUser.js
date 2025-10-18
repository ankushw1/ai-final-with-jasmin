const mongoose = require("mongoose");

const customerUserSchema = new mongoose.Schema(
  {
    usid: { type: String, required: true, unique: true }, // External User ID
    groupname: { type: String, required: true }, // No default, must be provided
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Storing password (if needed)
  },
  { timestamps: true }
);

module.exports = mongoose.model("CustomerUser", customerUserSchema);
