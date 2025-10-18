const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
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
  billingCycle: { type: String },
  createdByAdmin: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  createdByReseller: { type: mongoose.Schema.Types.ObjectId, ref: "Reseller" },
  role: { type: Number, default: 3 },
  credit: { type: String, required: true },
  isActive: { type: Boolean, default: true },


  // Channels assigned to the Customer
  channels: { 
    type: [String], 
    enum: ["sms", "voice", "whatsapp", "rcs", "email"],
    default: [] 
  },
}, { timestamps: true });

module.exports = mongoose.model("Customer", customerSchema);
