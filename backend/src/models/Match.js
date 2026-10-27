const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  candidate1: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
  candidate2: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
  brokerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Broker', required: true }, // The broker managing the pipeline
  stage: { 
    type: String, 
    enum: ['Interested', 'Meeting Arranged', 'Family Approved', 'Married'],
    default: 'Interested'
  },
  commission: { type: Number, default: 0 },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Match', matchSchema);
