const mongoose = require("mongoose")

const creditHistorySchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    transactionType: {
      type: String,
      required: true,
      enum: ["credit_added", "balance_updated", "credit_deducted"],
    },
    previousBalance: { type: Number, default: 0 },
    amountAdded: { type: Number, default: 0 },
    newBalance: { type: Number, required: true },
    description: { type: String, default: "" },
    addedBy: { type: String, required: true }, // Admin/Reseller who added credit
    addedByRole: { type: Number, required: true }, // Role of the person who added credit
  },
  { timestamps: true },
)

module.exports = mongoose.model("CreditHistory", creditHistorySchema)
