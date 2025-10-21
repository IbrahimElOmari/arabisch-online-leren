import { describe, it, expect, beforeEach } from 'vitest';
import i18n from '@/lib/i18n';

describe('i18n Configuration', () => {
  beforeEach(() => {
    // Reset to default language
    i18n.changeLanguage('nl');
  });

  it('should have all three languages configured', () => {
    const languages = Object.keys(i18n.options.resources || {});
    expect(languages).toContain('nl');
    expect(languages).toContain('en');
    expect(languages).toContain('ar');
    expect(languages).toHaveLength(3);
  });

  it('should default to Dutch (nl)', () => {
    expect(i18n.language).toBe('nl');
  });

  it('should fallback to English', () => {
    expect(i18n.options.fallbackLng).toEqual('en');
  });

  it('should switch to English', async () => {
    await i18n.changeLanguage('en');
    expect(i18n.language).toBe('en');
  });

  it('should switch to Arabic', async () => {
    await i18n.changeLanguage('ar');
    expect(i18n.language).toBe('ar');
  });

  it('should translate common keys in all languages', () => {
    const testKey = 'nav.home';
    
    i18n.changeLanguage('nl');
    expect(i18n.t(testKey)).toBeTruthy();
    
    i18n.changeLanguage('en');
    expect(i18n.t(testKey)).toBeTruthy();
    expect(i18n.t(testKey)).not.toBe(testKey); // Should not return key itself
    
    i18n.changeLanguage('ar');
    expect(i18n.t(testKey)).toBeTruthy();
  });

  it('should have role translations', () => {
    i18n.changeLanguage('nl');
    expect(i18n.t('roles.admin')).toBeTruthy();
    expect(i18n.t('roles.teacher')).toBeTruthy();
    expect(i18n.t('roles.student')).toBeTruthy();

    i18n.changeLanguage('en');
    expect(i18n.t('roles.admin')).toBe('Administrator');
    expect(i18n.t('roles.teacher')).toBe('Teacher');
    expect(i18n.t('roles.student')).toBe('Student');
  });
});
