const Candidate = require('../models/Candidate');
const Match = require('../models/Match');
const { scoreCompatibility } = require('../services/compatibilityEngine');
const { recordActivity } = require('../services/activityService');

function cleanCandidatePayload(value) {
  if (value === '') return undefined;
  if (Array.isArray(value) || value === null || typeof value !== 'object') return value;
  const cleaned = {};
  Object.entries(value).forEach(([key, childValue]) => {
    const child = cleanCandidatePayload(childValue);
    if (child !== undefined) cleaned[key] = child;
  });
  return cleaned;
}

function normalizeCandidateUpdate(payload) {
  const data = {};
  const unset = {};

  const visit = (value, path) => {
    if (value === '') {
      if (path) unset[path] = 1;
      return;
    }
    if (Array.isArray(value) || value === null || typeof value !== 'object') {
      data[path] = value;
      return;
    }
    Object.entries(value).forEach(([key, childValue]) => {
      visit(childValue, `${path}.${key}`);
    });
  };

  Object.entries(payload).forEach(([key, value]) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) visit(value, key);
    else visit(value, key);
  });
  return { data, unset };
}

exports.cleanCandidatePayload = cleanCandidatePayload;
exports.normalizeCandidateUpdate = normalizeCandidateUpdate;

exports.createCandidate = async (req, res) => {
  try {
    const data = cleanCandidatePayload(req.body);
    const candidate = new Candidate({ ...data, brokerId: req.brokerId });
    await candidate.save();
    await recordActivity({ brokerId: req.brokerId, type: 'candidate.created', description: `Added candidate ${candidate.name}`, metadata: { candidateId: candidate._id } });
    res.status(201).json(candidate);
  } catch (err) {
    console.error('Failed to create candidate', { brokerId: req.brokerId, error: err });
    res.status(err.name === 'ValidationError' ? 400 : 500).json({ message: err.name === 'ValidationError' ? err.message : 'Server error' });
  }
};

exports.getCandidates = async (req, res) => {
  try {
    // Basic filtering from query
    const { ageMin, ageMax, city, education, community, maritalStatus } = req.query;
    let query = { brokerId: req.brokerId };
    
    if (ageMin || ageMax) {
      query.age = {};
      if (ageMin) query.age.$gte = Number(ageMin);
      if (ageMax) query.age.$lte = Number(ageMax);
    }
    if (city) query.city = new RegExp(city, 'i');
    if (education) query.education = new RegExp(education, 'i');
    if (community) query.community = new RegExp(community, 'i');
    if (maritalStatus) query.maritalStatus = maritalStatus;

    const candidates = await Candidate.find(query);
    res.status(200).json(candidates);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateCandidate = async (req, res) => {
  try {
    const { brokerId, ...candidateBody } = req.body;
    const { data: candidateUpdates, unset } = normalizeCandidateUpdate(candidateBody);
    candidateUpdates.lastUpdated = new Date();
    const candidate = await Candidate.findOneAndUpdate(
      { _id: req.params.id, brokerId: req.brokerId },
      { ...candidateUpdates, ...(Object.keys(unset).length ? { $unset: unset } : {}) },
      { new: true, runValidators: true }
    );
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
    res.status(200).json(candidate);
  } catch (err) {
    console.error('Failed to update candidate', { candidateId: req.params.id, brokerId: req.brokerId, error: err });
    res.status(err.name === 'ValidationError' ? 400 : 500).json({ message: err.name === 'ValidationError' ? err.message : 'Server error' });
  }
};

exports.deleteCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findOneAndDelete({ _id: req.params.id, brokerId: req.brokerId });
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
    await recordActivity({ brokerId: req.brokerId, type: 'candidate.deleted', description: `Removed candidate ${candidate.name}`, metadata: { candidateId: candidate._id } });
    res.status(200).json({ message: 'Candidate deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Match Scoring Logic
exports.autoScoreMatches = async (req, res) => {
  try {
    const candidateId = req.params.id;
    const currentCandidate = await Candidate.findOne({
      _id: candidateId,
      brokerId: req.brokerId
    });
    
    if (!currentCandidate) return res.status(404).json({ message: 'Candidate not found' });

    const targetGender = currentCandidate.gender === 'Male' ? 'Female' : 'Male';
    
    // Find opposite gender candidates for this broker
    const potentials = await Candidate.find({ 
      brokerId: req.brokerId, 
      gender: targetGender,
      _id: { $ne: currentCandidate._id }
    });

    const scoredMatches = potentials.map(pot => ({
      candidate: pot,
      ...scoreCompatibility(currentCandidate.toObject(), pot.toObject())
    }));

    // Sort descending by score
    scoredMatches.sort((a, b) => b.score - a.score);

    res.status(200).json(scoredMatches);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
