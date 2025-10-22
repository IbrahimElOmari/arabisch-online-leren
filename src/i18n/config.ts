import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ICU from 'i18next-icu';
import nlTranslations from './locales/nl.json';
import enTranslations from './locales/en.json';
import arTranslations from './locales/ar.json';

// Single source of truth for i18n configuration
i18n
  .use(ICU) // ICU plugin for plurals and formatting
  .use(initReactI18next)
  .init({
    resources: {
      nl: { translation: nlTranslations },
      en: { translation: enTranslations },
      ar: { translation: arTranslations },
    },
    lng: typeof window !== 'undefined' 
      ? localStorage.getItem('language_preference') || 'nl'
      : 'nl',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes
    },
    react: {
      useSuspense: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
