const mongoose = require('mongoose');

const referralRequestSchema = new mongoose.Schema({
  requestingBroker: { type: mongoose.Schema.Types.ObjectId, ref: 'Broker', required: true },
  owningBroker: { type: mongoose.Schema.Types.ObjectId, ref: 'Broker', required: true },
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
  status: { type: String, enum: ['Pending', 'Accepted', 'Rejected'], default: 'Pending' },
  agreedSplit: { type: String, default: '50/50' }
}, { timestamps: true });

module.exports = mongoose.model('ReferralRequest', referralRequestSchema);
