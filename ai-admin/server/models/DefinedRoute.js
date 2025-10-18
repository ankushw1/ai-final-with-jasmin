const mongoose = require('mongoose');

const definedRouteSchema = new mongoose.Schema({
  username: { type: String },  // Removed `required: true`
  smpp: { type: String },      // Removed `required: true`
  country: { type: String },   // Removed `required: true`
  countryCode: { type: Number },  // No change to Number type
  assignedRate: { type: Number }, // No change to Number type
  rate: { type: Number },        // No change to Number type
  operator: { type: String },    // Removed `required: true`
  mnc: { type: String },         // Changed type to String
  prefix: { type: Number },      // No change to Number type
}, { timestamps: true });

module.exports = mongoose.model('DefinedRoute', definedRouteSchema);
