const mongoose = require("mongoose")

// FIXED: Updated schema to handle both numeric and wildcard MNC values
const routingRateSchema = new mongoose.Schema(
  {
    MCC: {
      type: Number,
      required: true,
      index: true,
    },
    MNC: {
      // ✅ FIXED: Changed from Number to Mixed to allow both numbers and "*"
      type: mongoose.Schema.Types.Mixed,
      required: true,
      index: true,
      validate: {
        validator: (value) => {
          // Allow numbers or the wildcard "*"
          return typeof value === "number" || value === "*"
        },
        message: 'MNC must be a number or "*" for wildcard',
      },
    },
    smppId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SMPP",
      required: true,
      index: true,
    },
    rate: {
      type: Number,
      required: true,
      min: 0,
    },
    label: {
      type: String,
      default: "",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)

// ✅ Compound index for efficient queries
routingRateSchema.index({ MCC: 1, MNC: 1, smppId: 1 }, { unique: true })

module.exports = mongoose.model("RoutingRate", routingRateSchema)
