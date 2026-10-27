const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  brokerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Broker', required: true, index: true },
  type: { type: String, required: true },
  description: { type: String, required: true },
  metadata: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

activitySchema.index({ brokerId: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);