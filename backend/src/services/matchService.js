const Match = require('../models/Match');

async function createMatchForBroker({ brokerId, candidate1, candidate2 }) {
  const existingMatch = await Match.findOne({
    brokerId,
    $or: [
      { candidate1, candidate2 },
      { candidate1: candidate2, candidate2: candidate1 }
    ]
  });
  if (existingMatch) return { match: existingMatch, created: false };
  const match = await Match.create({ brokerId, candidate1, candidate2, stage: 'Interested' });
  return { match, created: true };
}

module.exports = { createMatchForBroker };
