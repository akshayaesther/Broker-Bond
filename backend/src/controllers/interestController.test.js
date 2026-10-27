const test = require('node:test');
const assert = require('node:assert/strict');
const { toPublicProfile, applyRecentlyUpdatedFilter } = require('./interestController');

test('browse projection exposes public profile fields only', () => {
  const profile = toPublicProfile({
    _id: 'target-id',
    name: 'Target',
    gender: 'Female',
    age: 29,
    city: 'Chennai',
    education: 'MBA',
    occupation: 'Designer',
    incomeRange: '10-15 LPA',
    religion: 'Christian',
    denomination: 'Baptist',
    familyEmail: 'family@example.com',
    email: 'target@example.com',
    phone: '123',
    pastorVerified: true,
    brokerVerified: true,
    brokerVerificationNote: 'ID checked',
    lastUpdated: new Date('2026-09-10T12:00:00.000Z'),
    faithProfile: { churchAttendance: 'Weekly' },
    partnerPreferences: { childrenPreference: 'Yes' },
    lifestyle: { dietaryPreference: 'Vegetarian' }
  });

  assert.deepEqual(profile, {
    _id: 'target-id',
    name: 'Target',
    gender: 'Female',
    age: 29,
    city: 'Chennai',
    education: 'MBA',
    occupation: 'Designer',
    incomeRange: '10-15 LPA',
    religion: 'Christian',
    denomination: 'Baptist',
    faithProfile: { churchAttendance: 'Weekly' },
    partnerPreferences: { childrenPreference: 'Yes' },
    lifestyle: { dietaryPreference: 'Vegetarian' },
    pastorVerified: true,
    brokerVerified: true,
    lastUpdated: new Date('2026-09-10T12:00:00.000Z'),
    locked: true
  });
});

test('recently updated filter includes only the last 30 days', () => {
  const now = new Date('2026-09-12T00:00:00.000Z');
  const query = applyRecentlyUpdatedFilter({}, 'true', now);

  assert.equal(query.lastUpdated.$gte.toISOString(), '2026-08-13T00:00:00.000Z');
});
