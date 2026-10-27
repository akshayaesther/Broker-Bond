const Match = require('../models/Match');
const Candidate = require('../models/Candidate');
const { createMatchForBroker } = require('../services/matchService');
const { recordActivity } = require('../services/activityService');

exports.getPipeline = async (req, res) => {
  try {
    const matches = await Match.find({ brokerId: req.brokerId })
      .populate('candidate1')
      .populate('candidate2');
    res.status(200).json(matches);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addMatchToPipeline = async (req, res) => {
  try {
    const { candidate1, candidate2 } = req.body;
    if (!candidate1 || !candidate2 || candidate1 === candidate2) {
      return res.status(400).json({ message: 'Two different candidates are required' });
    }

    const candidates = await Candidate.find({
      _id: { $in: [candidate1, candidate2] },
      brokerId: req.brokerId
    }).select('_id');
    if (candidates.length !== 2) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    const { match, created } = await createMatchForBroker({ brokerId: req.brokerId, candidate1, candidate2 });
    if (!created) {
      return res.status(409).json({ message: 'This match is already in the pipeline' });
    }
    await recordActivity({ brokerId: req.brokerId, type: 'match.created', description: 'Added a new deal to the pipeline', metadata: { matchId: match._id } });
    res.status(201).json(match);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateMatchStage = async (req, res) => {
  try {
    const { stage, commission } = req.body;
    const updateData = { stage };
    if (commission !== undefined) updateData.commission = commission;

    const match = await Match.findOneAndUpdate(
      { _id: req.params.id, brokerId: req.brokerId },
      updateData,
      { new: true }
    );
    if (!match) return res.status(404).json({ message: 'Match not found' });
    await recordActivity({ brokerId: req.brokerId, type: 'match.stage_changed', description: `Moved a deal to ${match.stage}`, metadata: { matchId: match._id, stage } });
    res.status(200).json(match);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteMatch = async (req, res) => {
  try {
    const match = await Match.findOneAndDelete({ _id: req.params.id, brokerId: req.brokerId });
    if (!match) return res.status(404).json({ message: 'Deal not found' });
    await recordActivity({ brokerId: req.brokerId, type: 'match.removed', description: 'Removed a deal from the pipeline', metadata: { matchId: match._id } });
    res.status(200).json({ message: 'Deal removed' });
  } catch (err) {
    console.error('Failed to remove pipeline deal', { matchId: req.params.id, brokerId: req.brokerId, error: err });
    res.status(500).json({ message: 'Server error' });
  }
};
