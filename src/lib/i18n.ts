import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import translationNL from '@/translations/nl.json';
import translationAR from '@/translations/ar.json';
import translationEN from '@/translations/en.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      nl: { translation: translationNL },
      ar: { translation: translationAR },
      en: { translation: translationEN },
    },
    lng: 'nl',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;