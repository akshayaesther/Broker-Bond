const ReferralRequest = require('../models/ReferralRequest');
const Candidate = require('../models/Candidate');
const { recordActivity } = require('../services/activityService');

exports.getNetworkCandidates = async (req, res) => {
  try {
    // Return all candidates open to referral, not owned by this broker
    const candidates = await Candidate.find({ 
      isOpenToReferral: true, 
      brokerId: { $ne: req.brokerId } 
    }).select('gender age city education occupation incomeRange religion community maritalStatus'); // limited info
    res.status(200).json(candidates);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.requestReferral = async (req, res) => {
  try {
    const { candidateId, agreedSplit } = req.body;
    const candidate = await Candidate.findById(candidateId);
    if (!candidate || !candidate.isOpenToReferral) {
      return res.status(400).json({ message: 'Candidate not available for referral' });
    }

    const request = new ReferralRequest({
      requestingBroker: req.brokerId,
      owningBroker: candidate.brokerId,
      candidate: candidateId,
      agreedSplit: agreedSplit || '50/50'
    });

    await request.save();
    await recordActivity({ brokerId: req.brokerId, type: 'referral.created', description: 'Sent a referral request', metadata: { referralId: request._id, candidateId } });
    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getReferralRequests = async (req, res) => {
  try {
    // Requests sent by this broker OR received by this broker
    const requests = await ReferralRequest.find({
      $or: [{ requestingBroker: req.brokerId }, { owningBroker: req.brokerId }]
    })
    .populate('candidate', 'name age city gender')
    .populate('requestingBroker', 'name agencyName email')
    .populate('owningBroker', 'name agencyName email');
    res.status(200).json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateReferralStatus = async (req, res) => {
  try {
    const { status } = req.body; // 'Accepted' or 'Rejected'
    const request = await ReferralRequest.findOneAndUpdate(
      { _id: req.params.id, owningBroker: req.brokerId },
      { status },
      { new: true }
    );
    if (!request) return res.status(404).json({ message: 'Request not found' });
    await recordActivity({ brokerId: req.brokerId, type: 'referral.status_changed', description: `Referral request ${status.toLowerCase()}`, metadata: { referralId: request._id, status } });
    res.status(200).json(request);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
