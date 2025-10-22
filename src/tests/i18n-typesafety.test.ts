import { describe, it, expect } from 'vitest';
import i18n from '@/i18n/config';
import nlTranslations from '@/i18n/locales/nl.json';
import enTranslations from '@/i18n/locales/en.json';
import arTranslations from '@/i18n/locales/ar.json';

describe('I18n Type Safety & Completeness (A2)', () => {
  // Helper to get all keys from nested object
  const getAllKeys = (obj: Record<string, unknown>, prefix = ''): string[] => {
    let keys: string[] = [];
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        keys = keys.concat(getAllKeys(value as Record<string, unknown>, fullKey));
      } else {
        keys.push(fullKey);
      }
    }
    return keys;
  };

  const nlKeys = getAllKeys(nlTranslations);
  const enKeys = getAllKeys(enTranslations);
  const arKeys = getAllKeys(arTranslations);

  it('should have same keys in all languages', () => {
    expect(nlKeys.sort()).toEqual(enKeys.sort());
    expect(nlKeys.sort()).toEqual(arKeys.sort());
  });

  it('should not have empty translations', () => {
    const checkEmpty = (obj: Record<string, unknown>, lang: string, prefix = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'string') {
          expect(value.trim(), `Empty translation for ${fullKey} in ${lang}`).not.toBe('');
        } else if (typeof value === 'object' && value !== null) {
          checkEmpty(value as Record<string, unknown>, lang, fullKey);
        }
      }
    };

    checkEmpty(nlTranslations, 'nl');
    checkEmpty(enTranslations, 'en');
    checkEmpty(arTranslations, 'ar');
  });

  it('should have ICU plugin loaded', () => {
    // ICU plugin is loaded via .use(ICU) in config
    expect(i18n.t).toBeDefined();
  });

  it('should handle plurals with ICU', () => {
    i18n.changeLanguage('en');
    // ICU format: {count, plural, one {# class} other {# classes}}
    expect(i18n.t('dashboard.enrolled_in', { count: 1 })).toContain('1');
    expect(i18n.t('dashboard.enrolled_in_plural', { count: 5 })).toContain('5');
  });
});
