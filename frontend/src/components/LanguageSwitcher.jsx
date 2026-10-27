import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = ({ dark = false }) => {
  const { i18n, t } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language;

  const changeLanguage = nextLanguage => {
    localStorage.setItem('language', nextLanguage);
    void i18n.changeLanguage(nextLanguage);
  };

  return (
    <div className={`inline-flex items-center gap-1 rounded-lg border p-1 text-xs font-semibold ${dark ? 'border-white/15 bg-white/5 text-white/70' : 'border-gray-200 bg-white text-gray-500'}`} aria-label={t('common.language')}>
      <button type="button" onClick={() => changeLanguage('en')} aria-pressed={language === 'en'} className={`rounded-md px-2 py-1 transition-colors ${language === 'en' ? (dark ? 'bg-white/15 text-white' : 'bg-primary/10 text-primary') : 'hover:text-charcoal'}`}>{t('common.english')}</button>
      <span aria-hidden="true" className={dark ? 'text-white/30' : 'text-gray-300'}>|</span>
      <button type="button" onClick={() => changeLanguage('ta')} aria-pressed={language === 'ta'} className={`rounded-md px-2 py-1 transition-colors ${language === 'ta' ? (dark ? 'bg-white/15 text-white' : 'bg-primary/10 text-primary') : 'hover:text-charcoal'}`}>{t('common.tamil')}</button>
    </div>
  );
};

export default LanguageSwitcher;
