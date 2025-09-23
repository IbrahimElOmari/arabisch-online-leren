import React, { createContext, useContext, useState } from 'react';
import { I18nextProvider, useTranslation as useI18NextTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';

interface TranslationContextProps {
  language: 'nl' | 'ar';
  setLanguage: (lang: 'nl' | 'ar') => void;
  t: ReturnType<typeof useI18NextTranslation>['t'];
}

const TranslationContext = createContext<TranslationContextProps | undefined>(undefined);

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<'nl' | 'ar'>(i18n.language as 'nl' | 'ar');
  const { t } = useI18NextTranslation();

  const changeLanguage = (lang: 'nl' | 'ar') => {
    i18n.changeLanguage(lang);
    setLanguage(lang);
  };

  return (
    <TranslationContext.Provider value={{ language, setLanguage: changeLanguage, t }}>
      <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const ctx = useContext(TranslationContext);
  if (!ctx) throw new Error('useTranslation must be used within TranslationProvider');
  return ctx;
};