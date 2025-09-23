import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import translationNL from '@/translations/nl.json';
import translationAR from '@/translations/ar.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      nl: { translation: translationNL },
      ar: { translation: translationAR },
    },
    lng: 'nl',
    fallbackLng: 'nl',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;