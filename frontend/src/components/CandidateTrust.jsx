import React from 'react';
import { BadgeCheck, Church, Clock3 } from 'lucide-react';
import { formatFreshness } from '../utils/candidateFreshness';
import { useTranslation } from 'react-i18next';

const CandidateTrust = ({ candidate, showFreshness = false, showBadges = true, centered = false }) => {
  const { t } = useTranslation();
  const updatedAt = candidate.lastUpdated || candidate.updatedAt || candidate.createdAt;
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${centered ? 'justify-center' : ''}`}>
      {showBadges && candidate.brokerVerified && <span title={candidate.brokerVerificationNote || t('trust.verificationNote')} className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2 py-0.5 text-[11px] font-bold text-secondary"><BadgeCheck size={12} /> {t('trust.brokerVerified')}</span>}
      {showBadges && candidate.pastorVerified && <span title={t('trust.pastorReference')} className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-bold text-accent"><Church size={12} /> {t('trust.pastorVerified')}</span>}
      {showFreshness && <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-400"><Clock3 size={12} /> {formatFreshness(updatedAt, t)}</span>}
    </div>
  );
};

export default CandidateTrust;
