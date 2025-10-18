const mongoose = require('mongoose');

// Dynamic Schema for Prefix model
const dynamicSchema = new mongoose.Schema({}, { strict: false });

const Prefix = mongoose.model('Prefix', dynamicSchema);

module.exports = Prefix;
