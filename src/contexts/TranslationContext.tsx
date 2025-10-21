import React, { createContext, useContext, useState, useEffect } from 'react';
import { I18nextProvider, useTranslation as useI18NextTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';

interface TranslationContextProps {
  language: 'nl' | 'en' | 'ar';
  setLanguage: (lang: 'nl' | 'en' | 'ar') => void;
  t: ReturnType<typeof useI18NextTranslation>['t'];
}

const TranslationContext = createContext<TranslationContextProps | undefined>(undefined);

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize from localStorage or default to 'nl'
  const savedLang = localStorage.getItem('language_preference') as 'nl' | 'en' | 'ar' | null;
  const initialLang = savedLang || i18n.language as 'nl' | 'en' | 'ar';
  
  const [language, setLanguage] = useState<'nl' | 'en' | 'ar'>(initialLang);
  const { t } = useI18NextTranslation();

  // Load saved language on mount
  useEffect(() => {
    if (savedLang && savedLang !== i18n.language) {
      i18n.changeLanguage(savedLang);
    }
  }, []);

  const changeLanguage = (lang: 'nl' | 'en' | 'ar') => {
    localStorage.setItem('language_preference', lang);
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