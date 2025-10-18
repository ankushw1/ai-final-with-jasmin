const mongoose = require("mongoose")

const customerUserProfileSchema = new mongoose.Schema(
  {
    usid: { type: String, sparse: true }, // Changed: removed required and unique, added sparse
    groupname: { type: String },
    username: { type: String, required: true, unique: true }, // Make username the primary unique field
    password: { type: String },

    // Current balance information
    currentBalance: {
      balance: { type: Number, default: 0 },
      smsCount: { type: Number, default: 0 },
      earlyPercent: { type: Number, default: 0 },
      httpThroughput: { type: Number, default: 0 },
      smppsThroughput: { type: Number, default: 0 },
      lastUpdated: { type: Date, default: Date.now },
    },

    // Current permissions
    currentPermissions: {
      httpSend: { type: Boolean, default: false },
      dlrMethod: { type: Boolean, default: false },
      httpBalance: { type: Boolean, default: false },
      smppsSend: { type: Boolean, default: false },
      priority: { type: Boolean, default: false },
      longContent: { type: Boolean, default: false },
      srcAddr: { type: Boolean, default: false },
      dlrLevel: { type: Boolean, default: false },
      httpRate: { type: Boolean, default: false },
      validPeriod: { type: Boolean, default: false },
      httpBulk: { type: Boolean, default: false },
      hexContent: { type: Boolean, default: false },
      lastUpdated: { type: Date, default: Date.now },
    },

    // Current status
    currentStatus: {
      status: { type: String, enum: ["enabled", "disabled"], default: "enabled" },
      lastUpdated: { type: Date, default: Date.now },
    },

    // Metadata
    isActive: { type: Boolean, default: true },
    lastSyncWithJasmin: { type: Date, default: Date.now },
    totalUpdates: { type: Number, default: 0 },

    // Link to customer if applicable
    linkedCustomer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
  },
  { timestamps: true },
)

// Index for better performance - username is the primary unique identifier
customerUserProfileSchema.index({ username: 1 }, { unique: true })
customerUserProfileSchema.index({ usid: 1 }, { sparse: true }) // Sparse index allows multiple null values

module.exports = mongoose.model("CustomerUserProfile", customerUserProfileSchema)