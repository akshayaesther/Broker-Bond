const test = require('node:test');
const assert = require('node:assert/strict');
const { scoreCompatibility } = require('./compatibilityEngine');

test('scores complete Christian profiles with category breakdown and explanation', () => {
  const result = scoreCompatibility(
    {
      age: 30,
      city: 'Chennai',
      education: 'MBA',
      incomeRange: '10-15 LPA',
      religion: 'Christian',
      denomination: 'Baptist',
      faithProfile: {
        faithImportance: 'Very Important',
        churchAttendance: 'Weekly',
        prayerImportance: 'Very Important',
        bibleStudyImportance: 'Important',
        weddingType: 'Church wedding',
        childrenFaithImportance: 'Very Important'
      },
      partnerPreferences: {
        preferredDenomination: 'Same as mine'
      }
    },
    {
      age: 31,
      city: 'Chennai',
      education: 'MBA',
      incomeRange: '10-15 LPA',
      religion: 'Christian',
      denomination: 'Baptist',
      faithProfile: {
        faithImportance: 'Very Important',
        churchAttendance: 'Weekly',
        prayerImportance: 'Very Important',
        bibleStudyImportance: 'Important',
        weddingType: 'Church wedding',
        childrenFaithImportance: 'Very Important'
      },
      partnerPreferences: {
        preferredDenomination: 'Same as mine'
      }
    }
  );

  assert.equal(result.categories.denomination.score, 100);
  assert.equal(result.categories.faith.score, 100);
  assert.equal(result.categories.location.score, 100);
  assert.match(result.explanation, /same denomination/i);
  assert.match(result.explanation, /faith/i);
});

test('does not penalize candidates without Christian data', () => {
  const result = scoreCompatibility(
    { age: 30, city: 'Chennai', education: 'MBA', incomeRange: '10-15 LPA', religion: 'Hindu' },
    { age: 31, city: 'Chennai', education: 'MBA', incomeRange: '10-15 LPA', religion: 'Hindu' }
  );

  assert.equal(result.categories.faith.score, null);
  assert.equal(result.categories.denomination.score, null);
  assert.equal(result.score, 100);
});

test('applies selected denomination preference as a mismatch', () => {
  const result = scoreCompatibility(
    { religion: 'Christian', denomination: 'Baptist', partnerPreferences: { preferredDenomination: ['Catholic'] } },
    { religion: 'Christian', denomination: 'Baptist' }
  );

  assert.equal(result.categories.denomination.score, 25);
});
