const mongoose = require('mongoose');

const smppSchema = new mongoose.Schema({
    name: { type: String, unique: true },
    status: { type: String, enum: ['enabled', 'disabled'], default: 'disabled' },
    host: { type: String },
    port: { type: Number },
    bindType: { type: String, enum: ['transmitter', 'receiver', 'transceiver'] },
    srcTON: { type: Number },
    srcNPI: { type: Number },
    dstTON: { type: Number },
    dstNPI: { type: Number },
    bindTON: { type: Number },
    bindNPI: { type: Number },
    throughput: { type: Number, default: 1 }, // submit_throughput
    username: { type: String },
    password: { type: String },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('SMPP', smppSchema);
