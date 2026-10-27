const FAITH_FIELDS = [
  ['faithImportance', 'faith importance'],
  ['churchAttendance', 'church attendance'],
  ['prayerImportance', 'prayer priorities'],
  ['bibleStudyImportance', 'Bible study priorities'],
  ['weddingType', 'wedding expectations'],
  ['childrenFaithImportance', 'raising children in the faith']
];

const hasValue = value => value !== undefined && value !== null && value !== '';
const normalize = value => String(value || '').trim().toLowerCase();
const getPreference = (candidate, key) => candidate.partnerPreferences?.[key];
const getFaith = (candidate, key) => candidate.faithProfile?.[key];

function compareValues(first, second, matchingScore = 100, differentScore = 25) {
  if (!hasValue(first) || !hasValue(second)) return null;
  return normalize(first) === normalize(second) ? matchingScore : differentScore;
}

function averageScores(scores, fallback = null) {
  const activeScores = scores.filter(score => score !== null);
  return activeScores.length ? Math.round(activeScores.reduce((total, score) => total + score, 0) / activeScores.length) : fallback;
}

function scoreDenomination(first, second) {
  if (normalize(first.religion) !== 'christian' || normalize(second.religion) !== 'christian') return null;
  const firstDenomination = first.denomination;
  const secondDenomination = second.denomination;
  const firstPreference = getPreference(first, 'preferredDenomination');
  const secondPreference = getPreference(second, 'preferredDenomination');
  if (!hasValue(firstDenomination) && !hasValue(secondDenomination) && !hasValue(firstPreference) && !hasValue(secondPreference)) return null;

  const accepts = (preference, denomination) => {
    if (!hasValue(preference) || preference === 'Any Christian denomination') return true;
    if (preference === 'Same as mine') return normalize(firstDenomination) === normalize(secondDenomination);
    const selected = Array.isArray(preference) ? preference : [preference];
    return selected.some(item => normalize(item) === normalize(denomination));
  };

  const firstAcceptsSecond = accepts(firstPreference, secondDenomination);
  const secondAcceptsFirst = accepts(secondPreference, firstDenomination);
  if (firstAcceptsSecond && secondAcceptsFirst && normalize(firstDenomination) === normalize(secondDenomination)) return 100;
  if (firstAcceptsSecond && secondAcceptsFirst) return 80;
  return 25;
}

function scoreFaith(first, second) {
  if (normalize(first.religion) !== 'christian' || normalize(second.religion) !== 'christian') return null;
  const available = FAITH_FIELDS.filter(([key]) => hasValue(getFaith(first, key)) && hasValue(getFaith(second, key)));
  if (!available.length) return null;
  const matching = available.filter(([key]) => normalize(getFaith(first, key)) === normalize(getFaith(second, key))).length;
  return Math.round((matching / available.length) * 100);
}

function scoreMarriage(first, second) {
  const ageDifference = Math.abs((first.age || 0) - (second.age || 0));
  const ageScore = ageDifference <= 3 ? 100 : ageDifference <= 6 ? 60 : 20;
  return averageScores([
    ageScore,
    compareValues(getPreference(first, 'childrenPreference'), getPreference(second, 'childrenPreference')),
    compareValues(getPreference(first, 'relocationPreference'), getPreference(second, 'relocationPreference'))
  ], ageScore);
}

function scoreCompatibility(first, second) {
  const categories = {
    faith: { label: 'Faith compatibility', score: scoreFaith(first, second), weight: 1 },
    denomination: { label: 'Denomination compatibility', score: scoreDenomination(first, second), weight: 1 },
    marriage: { label: 'Marriage expectations compatibility', score: scoreMarriage(first, second), weight: 1 },
    family: { label: 'Family values compatibility', score: compareValues(getPreference(first, 'familyInvolvement'), getPreference(second, 'familyInvolvement')), weight: 1 },
    lifestyle: { label: 'Lifestyle compatibility', score: averageScores([
      compareValues(first.lifestyle?.dietaryPreference, second.lifestyle?.dietaryPreference),
      compareValues(first.lifestyle?.smoking, second.lifestyle?.smoking),
      compareValues(first.lifestyle?.drinking, second.lifestyle?.drinking)
    ]), weight: 1 },
    location: { label: 'Location', score: compareValues(first.city, second.city, 100, 20), weight: 1 },
    education: { label: 'Education', score: compareValues(first.education, second.education, 100, 40), weight: 1 },
    career: { label: 'Career', score: compareValues(first.incomeRange, second.incomeRange, 100, 40), weight: 1 }
  };

  const activeCategories = Object.values(categories).filter(category => category.score !== null);
  const score = activeCategories.length
    ? Math.round(activeCategories.reduce((total, category) => total + category.score * category.weight, 0) / activeCategories.reduce((total, category) => total + category.weight, 0))
    : 0;

  const ranked = Object.entries(categories)
    .filter(([, category]) => category.score !== null)
    .sort(([, firstCategory], [, secondCategory]) => secondCategory.score - firstCategory.score);
  const reasonLabels = {
    faith: 'similar faith priorities',
    denomination: 'same denomination',
    marriage: 'aligned marriage expectations',
    family: 'similar family values',
    lifestyle: 'similar lifestyle',
    location: 'same location',
    education: 'similar education',
    career: 'similar career expectations'
  };
  const strengths = ranked.filter(([, category]) => category.score >= 80).slice(0, 3).map(([key]) => reasonLabels[key]);
  const differences = ranked.filter(([, category]) => category.score < 60).slice(0, 2).map(([key]) => reasonLabels[key]);
  const explanation = [
    strengths.length ? `${strengths.join(', ')} align well` : 'The available profile details show a developing fit',
    differences.length ? `Notable differences: ${differences.join(' and ')}` : ''
  ].filter(Boolean).join('. ') + '.';

  return { score, categories, explanation, factors: strengths };
}

module.exports = { scoreCompatibility };
