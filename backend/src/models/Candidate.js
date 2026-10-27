const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  brokerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Broker', required: true },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  city: { type: String, required: true },
  education: { type: String, required: true },
  occupation: { type: String },
  incomeRange: { type: String },
  religion: { type: String },
  denomination: { type: String, enum: ['Catholic', 'Protestant', 'Pentecostal', 'CSI', 'CNI', 'Baptist', 'Methodist', 'Orthodox', 'Mar Thoma', 'Evangelical', 'Other'] },
  community: { type: String },
  faithProfile: {
    faithImportance: { type: String, enum: ['Essential', 'Very Important', 'Important', 'Flexible'] },
    churchAttendance: { type: String, enum: ['Weekly', 'Several times a month', 'Occasionally', 'Rarely'] },
    prayerImportance: { type: String, enum: ['Very Important', 'Important', 'Flexible'] },
    bibleStudyImportance: { type: String, enum: ['Very Important', 'Important', 'Not a major factor'] },
    weddingType: { type: String, enum: ['Church wedding', 'Civil + church', 'Open to discussion'] },
    childrenFaithImportance: { type: String, enum: ['Essential', 'Very Important', 'Important', 'Flexible'] }
  },
  partnerPreferences: {
    preferredDenomination: { type: mongoose.Schema.Types.Mixed },
    childrenPreference: { type: String },
    relocationPreference: { type: String },
    familyInvolvement: { type: String }
  },
  lifestyle: {
    dietaryPreference: { type: String },
    smoking: { type: String },
    drinking: { type: String }
  },
  maritalStatus: { type: String, enum: ['Unmarried', 'Divorced', 'Widowed'], default: 'Unmarried' },
  interests: [{ type: String }],
  photoUrl: { type: String },
  phone: { type: String },
  email: { type: String },
  familyEmail: { type: String, lowercase: true, trim: true },
  pastorReferenceContact: { type: String, trim: true },
  pastorVerified: { type: Boolean, default: false },
  brokerVerified: { type: Boolean, default: false },
  brokerVerificationNote: { type: String, trim: true },
  lastUpdated: { type: Date, default: Date.now },
  isOpenToReferral: { type: Boolean, default: false },
  privacyMasking: {
    phone: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
    exactLocation: { type: Boolean, default: true }
  }
}, { timestamps: true });

module.exports = mongoose.model('Candidate', candidateSchema);
