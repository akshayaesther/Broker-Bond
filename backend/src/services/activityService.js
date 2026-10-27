const Activity = require('../models/Activity');

async function recordActivity({ brokerId, type, description, metadata }) {
  try {
    await Activity.create({ brokerId, type, description, metadata });
  } catch (err) {
    console.error('Failed to record activity', { brokerId, type, error: err });
  }
}

module.exports = { recordActivity };