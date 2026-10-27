import React from 'react';
import { Mars, Venus, UsersRound } from 'lucide-react';
import maleAvatar from '../assets/male-avatar.svg.svg';
import femaleAvatar from '../assets/female-avatar.svg..svg';
import { useTranslation } from 'react-i18next';

const GENDER_STYLES = {
  Male: { color: '#2563EB', bg: 'bg-blue-50', Icon: Mars },
  Female: { color: '#DB2777', bg: 'bg-pink-50', Icon: Venus },
  Other: { color: '#7C3AED', bg: 'bg-violet-50', Icon: UsersRound },
};

const AVATAR_IMAGES = {
  Male: maleAvatar,
  Female: femaleAvatar,
  Other: femaleAvatar,
};

const GenderAvatar = ({ name = '', gender = 'Other', size = 'md' }) => {
  const { t } = useTranslation();
  const style = GENDER_STYLES[gender] || GENDER_STYLES.Other;
  const Icon = style.Icon;
  const sizeClass = size === 'sm' ? 'w-7 h-7 text-xs' : size === 'lg' ? 'w-11 h-11 text-sm' : size === 'photo' ? 'h-36 w-36 text-lg' : 'w-10 h-10 text-sm';
  const avatarImage = AVATAR_IMAGES[gender] || AVATAR_IMAGES.Other;

  return (
    <div className="relative flex-shrink-0" title={gender}>
      <div className={`${sizeClass} overflow-hidden rounded-xl bg-gray-100 shadow-sm`}>
        <img src={avatarImage} alt={`${name || t('common.unknown')} ${t('common.candidateAvatar')}`} className="h-full w-full object-cover" loading="lazy" />
      </div>
      <span className={`absolute -right-1 -bottom-1 w-4 h-4 rounded-full ${style.bg} flex items-center justify-center border-2 border-white`} aria-label={gender}>
        <Icon size={10} style={{ color: style.color }} strokeWidth={3} />
      </span>
    </div>
  );
};

export default GenderAvatar;
