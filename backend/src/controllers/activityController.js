const Activity = require('../models/Activity');

exports.getRecentActivity = async (req, res) => {
  if (req.role !== 'broker' || !req.brokerId) return res.status(403).json({ message: 'Broker access required' });
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 8, 1), 10);
    const activities = await Activity.find({ brokerId: req.brokerId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('type description metadata createdAt');
    res.status(200).json(activities);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};