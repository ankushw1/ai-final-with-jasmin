const mongoose = require("mongoose");

const resellerSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  companyName: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  primaryEmail: { type: String, required: true, unique: true },
  supportEmail: { type: String },
  ratesEmail: { type: String },
  billingEmail: { type: String },
  address: { type: String },
  contactPersonName: { type: String },
  contactPersonMobile: { type: String },
  accountType: { type: String, enum: ["Postpaid", "Prepaid"], required: true },
  billingCycle: { type: String, enum: ["Monthly", "Yearly"] },  // Limit to Monthly or Yearly
  createdByAdmin: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
  credit: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  channels: { 
    type: [String], 
    enum: ["sms", "voice", "whatsapp", "rcs", "email"],
    default: []
  },
}, { timestamps: true });

module.exports = mongoose.model("Reseller", resellerSchema);
