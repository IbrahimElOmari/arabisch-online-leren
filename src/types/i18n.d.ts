// Type-safe i18n keys (A2)
import 'react-i18next';
import type nlTranslations from '@/i18n/locales/nl.json';

declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: typeof nlTranslations;
    };
  }
}
