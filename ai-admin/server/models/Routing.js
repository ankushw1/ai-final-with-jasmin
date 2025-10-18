const mongoose = require("mongoose")

const routingSchema = new mongoose.Schema(
  {
    username: String,
    groupname: String,
    smpp: String,
    country: String,
    countryCode: String,
    operators: [
      {
        operator: String,
        mnc: mongoose.Schema.Types.Mixed,
        rate: Number, 
        mcc: Number,
        assignedRate: Number, 
      },
    ],
  },
  { timestamps: true },
)

module.exports = mongoose.model("Routing", routingSchema)
