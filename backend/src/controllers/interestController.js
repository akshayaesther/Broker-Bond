const mongoose = require('mongoose');
const Candidate = require('../models/Candidate');
const InterestRequest = require('../models/InterestRequest');
const Match = require('../models/Match');
const { createMatchForBroker } = require('../services/matchService');
const { recordActivity } = require('../services/activityService');
const { scoreCompatibility } = require('../services/compatibilityEngine');

const PUBLIC_FIELDS = 'name gender age city education occupation incomeRange religion denomination faithProfile partnerPreferences lifestyle pastorVerified brokerVerified lastUpdated';
const RECENT_UPDATE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

function applyRecentlyUpdatedFilter(query, recentlyUpdated, now = new Date()) {
  if (recentlyUpdated === 'true' || recentlyUpdated === true) {
    query.lastUpdated = { $gte: new Date(now.getTime() - RECENT_UPDATE_WINDOW_MS) };
  }
  return query;
}

function toPublicProfile(candidate) {
  const source = typeof candidate.toObject === 'function' ? candidate.toObject() : candidate;
  const compact = values => Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined && value !== null && value !== ''));
  return {
    _id: source._id,
    name: source.name,
    gender: source.gender,
    age: source.age,
    city: source.city,
    education: source.education,
    occupation: source.occupation,
    incomeRange: source.incomeRange,
    religion: source.religion,
    denomination: source.denomination,
    pastorVerified: source.pastorVerified === true,
    brokerVerified: source.brokerVerified === true,
    lastUpdated: source.lastUpdated,
    faithProfile: source.faithProfile ? compact({ churchAttendance: source.faithProfile.churchAttendance, faithImportance: source.faithProfile.faithImportance }) : undefined,
    partnerPreferences: source.partnerPreferences ? compact({ childrenPreference: source.partnerPreferences.childrenPreference, relocationPreference: source.partnerPreferences.relocationPreference, familyInvolvement: source.partnerPreferences.familyInvolvement }) : undefined,
    lifestyle: source.lifestyle ? compact({ dietaryPreference: source.lifestyle.dietaryPreference, smoking: source.lifestyle.smoking, drinking: source.lifestyle.drinking }) : undefined,
    locked: true
  };
}

function requireFamily(req, res) {
  if (req.role !== 'family' || !mongoose.Types.ObjectId.isValid(req.candidateId)) {
    res.status(403).json({ message: 'Family portal access required' });
    return false;
  }
  return true;
}

exports.browseProfiles = async (req, res) => {
  if (!requireFamily(req, res)) return;
  try {
    const current = await Candidate.findById(req.candidateId);
    if (!current) return res.status(404).json({ message: 'Candidate not found' });
    const { ageMin, ageMax, city, education, income, denomination, churchAttendance, faithImportance, recentlyUpdated } = req.query;
    const query = { _id: { $ne: req.candidateId }, gender: current.gender === 'Male' ? 'Female' : 'Male' };
    if (ageMin || ageMax) query.age = { ...(ageMin ? { $gte: Number(ageMin) } : {}), ...(ageMax ? { $lte: Number(ageMax) } : {}) };
    if (city) query.city = new RegExp(String(city).slice(0, 80), 'i');
    if (education) query.education = new RegExp(String(education).slice(0, 80), 'i');
    if (income) query.incomeRange = income;
    if (denomination) query.denomination = denomination;
    if (churchAttendance) query['faithProfile.churchAttendance'] = churchAttendance;
    if (faithImportance) query['faithProfile.faithImportance'] = faithImportance;
    applyRecentlyUpdatedFilter(query, recentlyUpdated);
    const candidates = await Candidate.find(query).select(PUBLIC_FIELDS).limit(100);
    res.status(200).json(candidates.map(candidate => {
      const compatibility = scoreCompatibility(current.toObject(), candidate.toObject());
      const hasScoringData = Object.values(compatibility.categories).some(category => category.score !== null);
      return {
        ...toPublicProfile(candidate),
        ...(hasScoringData ? { compatibilityScore: compatibility.score, compatibilityFactors: compatibility.factors.slice(0, 2) } : {})
      };
    }));
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createInterest = async (req, res) => {
  if (!requireFamily(req, res)) return;
  try {
    const { targetCandidateId } = req.body;
    if (!mongoose.Types.ObjectId.isValid(targetCandidateId) || targetCandidateId === req.candidateId) {
      return res.status(400).json({ message: 'A different target candidate is required' });
    }
    const expressingCandidate = await Candidate.findById(req.candidateId).select('brokerId gender');
    const targetCandidate = await Candidate.findById(targetCandidateId).select('_id name gender');
    if (!expressingCandidate || !targetCandidate) return res.status(404).json({ message: 'Candidate not found' });
    if (expressingCandidate.gender === targetCandidate.gender) return res.status(400).json({ message: 'Only opposite-gender profiles can receive interest' });
    const request = await InterestRequest.findOneAndUpdate(
      { expressingCandidate: expressingCandidate._id, targetCandidate: targetCandidate._id },
      { expressingBroker: expressingCandidate.brokerId, status: 'Pending', $setOnInsert: { createdAt: new Date() } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    await recordActivity({ brokerId: expressingCandidate.brokerId, type: 'interest.created', description: `New interest request for ${targetCandidate.name}`, metadata: { requestId: request._id, targetCandidateId: targetCandidate._id } });
    res.status(201).json({ requestId: request._id, message: 'Your interest has been sent to your broker, who will follow up with you.' });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Interest already sent to your broker' });
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getBrokerRequests = async (req, res) => {
  if (req.role !== 'broker' || !req.brokerId) return res.status(403).json({ message: 'Broker access required' });
  try {
    const requests = await InterestRequest.find({ expressingBroker: req.brokerId, status: { $ne: 'Dismissed' } })
      .populate('expressingCandidate', 'name age gender city')
      .populate('targetCandidate', 'name age gender city education religion denomination brokerId')
      .sort({ createdAt: -1 });
    res.status(200).json(requests.map(request => ({
      ...request.toObject(),
      crossBroker: String(request.targetCandidate?.brokerId) !== String(req.brokerId)
    })));
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.startDeal = async (req, res) => {
  if (req.role !== 'broker' || !req.brokerId) return res.status(403).json({ message: 'Broker access required' });
  try {
    const request = await InterestRequest.findOne({ _id: req.params.id, expressingBroker: req.brokerId })
      .populate('expressingCandidate', 'brokerId')
      .populate('targetCandidate', 'brokerId');
    if (!request) return res.status(404).json({ message: 'Interest request not found' });
    if (String(request.targetCandidate.brokerId) !== String(req.brokerId)) {
      return res.status(409).json({ message: 'Managed by another broker - consider using Broker Network to connect' });
    }
    const { match } = await createMatchForBroker({
      brokerId: req.brokerId,
      candidate1: request.expressingCandidate._id,
      candidate2: request.targetCandidate._id
    });
    request.status = 'Deal Started';
    request.reviewedAt = new Date();
    await request.save();
    await recordActivity({ brokerId: req.brokerId, type: 'match.created', description: 'Started a new deal', metadata: { matchId: match._id } });
    res.status(200).json({ match });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.reviewRequest = async (req, res) => {
  if (req.role !== 'broker' || !req.brokerId) return res.status(403).json({ message: 'Broker access required' });
  const request = await InterestRequest.findOneAndUpdate(
    { _id: req.params.id, expressingBroker: req.brokerId },
    { status: 'Reviewed', reviewedAt: new Date() },
    { new: true }
  );
  if (!request) return res.status(404).json({ message: 'Interest request not found' });
  await recordActivity({ brokerId: req.brokerId, type: 'interest.reviewed', description: 'Reviewed an interest request', metadata: { requestId: request._id } });
  res.status(200).json(request);
};

exports.dismissRequest = async (req, res) => {
  if (req.role !== 'broker' || !req.brokerId) return res.status(403).json({ message: 'Broker access required' });
  const request = await InterestRequest.findOneAndUpdate(
    { _id: req.params.id, expressingBroker: req.brokerId, status: 'Pending' },
    { status: 'Dismissed', reviewedAt: new Date() },
    { new: true }
  );
  if (!request) return res.status(404).json({ message: 'Pending interest request not found' });
  await recordActivity({ brokerId: req.brokerId, type: 'interest.dismissed', description: 'Dismissed an interest request', metadata: { requestId: request._id } });
  res.status(200).json(request);
};

module.exports = { ...module.exports, toPublicProfile, applyRecentlyUpdatedFilter };
