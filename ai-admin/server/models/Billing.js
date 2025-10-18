const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    mobile: { type: String, required: true },
    address: { type: String, required: true },
    kyc: { type: String },  // URL or path to the file stored, if you use Cloud Storage or Multer
    createdByAdmin: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true }, // Only created by Admin
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Billing", accountSchema);
