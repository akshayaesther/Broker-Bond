const mongoose = require('mongoose');

const familyPortalSessionSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true }
}, { timestamps: true });

module.exports = mongoose.model('FamilyPortalSession', familyPortalSessionSchema);
