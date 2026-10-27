import React from 'react';
import { useTranslation } from 'react-i18next';

const PageLoader = ({ rows = 4 }) => {
  const { t } = useTranslation();
  return <div className="space-y-4 animate-pulse" aria-busy="true" aria-label={t('common.loading')}>
    {Array.from({ length: rows }, (_, index) => (
      <div key={index} className="h-16 rounded-xl bg-gray-200/70" />
    ))}
  </div>;
};

export default PageLoader;
