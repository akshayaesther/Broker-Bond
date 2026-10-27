const test = require('node:test');
const assert = require('node:assert/strict');
const Candidate = require('../models/Candidate');
const { updateCandidate, cleanCandidatePayload, normalizeCandidateUpdate } = require('./candidateController');

const requiredCandidate = { name: 'Test Candidate', age: 30, gender: 'Male', city: 'Kochi', education: 'MBA', brokerId: '000000000000000000000001' };

test('editing a candidate stamps lastUpdated without allowing broker reassignment', async () => {
  const originalFindOneAndUpdate = Candidate.findOneAndUpdate;
  let update;
  let options;
  Candidate.findOneAndUpdate = async (filter, candidateUpdate, candidateOptions) => {
    assert.deepEqual(filter, { _id: 'candidate-id', brokerId: 'broker-id' });
    update = candidateUpdate;
    options = candidateOptions;
    return { _id: 'candidate-id', ...candidateUpdate };
  };

  const response = { statusCode: 0, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; } };
  await updateCandidate({ params: { id: 'candidate-id' }, brokerId: 'broker-id', body: { city: 'Kochi', brokerId: 'other-broker' } }, response);
  Candidate.findOneAndUpdate = originalFindOneAndUpdate;

  assert.equal(update.city, 'Kochi');
  assert.equal(update.brokerId, undefined);
  assert.ok(update.lastUpdated instanceof Date);
  assert.deepEqual(options, { new: true, runValidators: true });
  assert.equal(response.statusCode, 200);
});

test('empty optional form values are omitted instead of violating enum validation', () => {
  const candidate = new Candidate({
    ...requiredCandidate,
    ...cleanCandidatePayload({
      religion: '', denomination: '',
      faithProfile: { faithImportance: '', churchAttendance: '' },
      partnerPreferences: { preferredDenomination: '', childrenPreference: '' },
      familyEmail: '', brokerVerificationNote: '',
      pastorVerified: false, brokerVerified: false, isOpenToReferral: false,
      privacyMasking: { phone: true, email: true, exactLocation: true }
    })
  });

  assert.equal(candidate.validateSync(), undefined);
  assert.equal(candidate.pastorVerified, false);
  assert.equal(candidate.privacyMasking.phone, true);
});

test('fully populated optional form values retain valid types and enum values', () => {
  const candidate = new Candidate({
    ...requiredCandidate,
    ...cleanCandidatePayload({
      religion: 'Christian', denomination: 'Baptist',
      faithProfile: { faithImportance: 'Very Important', churchAttendance: 'Weekly' },
      partnerPreferences: { preferredDenomination: ['Baptist', 'Catholic'], childrenPreference: 'Wants children', relocationPreference: 'Open', familyInvolvement: 'Important' },
      familyEmail: 'family@example.com', brokerVerificationNote: 'ID checked',
      pastorVerified: true, brokerVerified: true, isOpenToReferral: true,
      privacyMasking: { phone: false, email: true, exactLocation: false }
    })
  });

  assert.equal(candidate.validateSync(), undefined);
  assert.deepEqual(candidate.partnerPreferences.preferredDenomination, ['Baptist', 'Catholic']);
  assert.equal(candidate.privacyMasking.phone, false);
});

test('clearing nested optional values creates unset paths without string booleans', () => {
  const { data, unset } = normalizeCandidateUpdate({
    denomination: '',
    faithProfile: { faithImportance: '', churchAttendance: 'Weekly' },
    brokerVerified: false
  });

  assert.equal(data['faithProfile.churchAttendance'], 'Weekly');
  assert.equal(data.brokerVerified, false);
  assert.equal(unset.denomination, 1);
  assert.equal(unset['faithProfile.faithImportance'], 1);
});
