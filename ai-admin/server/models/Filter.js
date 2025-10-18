const mongoose = require('mongoose');

const FilterSchema = new mongoose.Schema({
    filterId: { type: String, unique: true, required: true }, // Unique filterId
    filterType: { type: String, required: true },
    filterP: { type: [String] },
    prefix: { type: [String] },
    country: { type: String },
    operator: { type: String },
    mnc: { type: String },
    costPrice: { type: Number },
    sellingPrice: { type: Number },
    group: { type: String },
    routesmpp: { type: String },
    cc: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Filter', FilterSchema);

// country
// operator
// mcc
// prefix
// cp
//sp