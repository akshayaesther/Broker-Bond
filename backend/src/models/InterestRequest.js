const mongoose = require('mongoose');

const interestRequestSchema = new mongoose.Schema({
  expressingCandidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
  targetCandidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
  expressingBroker: { type: mongoose.Schema.Types.ObjectId, ref: 'Broker', required: true },
  status: { type: String, enum: ['Pending', 'Reviewed', 'Deal Started', 'Dismissed'], default: 'Pending' },
  reviewedAt: { type: Date }
}, { timestamps: true });

interestRequestSchema.index({ expressingCandidate: 1, targetCandidate: 1 }, { unique: true });

module.exports = mongoose.model('InterestRequest', interestRequestSchema);
