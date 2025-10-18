const mongoose = require("mongoose")

const userUpdateHistorySchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    uid: { type: String, required: true },
    gid: { type: String },
    updateType: {
      type: String,
      required: true,
      enum: ["balance_update", "permissions_update", "status_change", "user_creation", "user_deletion"],
    },

    // Balance related fields
    balanceData: {
      previousBalance: { type: Number },
      newBalance: { type: Number },
      balanceSms: { type: Number },
      balancePercent: { type: Number },
      httpThroughput: { type: Number },
      smppThroughput: { type: Number },
    },

    // Permissions related fields
    permissionsData: {
      httpSend: { type: Boolean },
      dlrMethod: { type: Boolean },
      httpBalance: { type: Boolean },
      smppsSend: { type: Boolean },
      priority: { type: Boolean },
      longContent: { type: Boolean },
      srcAddr: { type: Boolean },
      dlrLevel: { type: Boolean },
      httpRate: { type: Boolean },
      validPeriod: { type: Boolean },
      httpBulk: { type: Boolean },
      hexContent: { type: Boolean },
    },

    // Status change fields
    statusData: {
      previousStatus: { type: String },
      newStatus: { type: String },
    },

    // General fields
    description: { type: String },
    updatedBy: { type: String, required: true }, // Admin/Reseller who made the update
    updatedByRole: { type: Number, required: true }, // Role of the person who made the update
    ipAddress: { type: String },
    userAgent: { type: String },

    // Raw data for debugging
    rawJasminResponse: { type: mongoose.Schema.Types.Mixed },
    rawRequestData: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true },
)

// Index for better query performance
userUpdateHistorySchema.index({ username: 1, createdAt: -1 })
userUpdateHistorySchema.index({ updateType: 1, createdAt: -1 })

module.exports = mongoose.model("UserUpdateHistory", userUpdateHistorySchema)
