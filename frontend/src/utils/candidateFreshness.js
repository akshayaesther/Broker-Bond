export const formatFreshness = (value, t) => {
  if (!value) return t('trust.updatePending');
  const updatedAt = new Date(value);
  if (Number.isNaN(updatedAt.getTime())) return t('trust.updatePending');
  const days = Math.max(0, Math.floor((Date.now() - updatedAt.getTime()) / 86400000));
  if (days === 0) return t('trust.updatedToday');
  if (days === 1) return t('trust.updatedYesterday');
  if (days < 7) return t('trust.updatedDays', { count: days });
  if (days < 14) return t('trust.updatedWeek');
  if (days < 30) return t('trust.updatedWeeks', { count: Math.floor(days / 7) });
  if (days < 60) return t('trust.updatedMonth');
  return t('trust.updatedMonths', { count: Math.floor(days / 30) });
};

export const isRecentlyUpdated = value => {
  if (!value) return false;
  const updatedAt = new Date(value).getTime();
  return !Number.isNaN(updatedAt) && Date.now() - updatedAt <= 30 * 86400000;
};
