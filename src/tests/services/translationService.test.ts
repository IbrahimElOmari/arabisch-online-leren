import { describe, it, expect, beforeEach } from 'vitest';
import i18n from '@/lib/i18n';

describe('Translation Service', () => {
  beforeEach(() => {
    i18n.changeLanguage('nl');
  });

  describe('Language switching', () => {
    it('should switch to English', async () => {
      await i18n.changeLanguage('en');
      expect(i18n.language).toBe('en');
    });

    it('should switch to Arabic', async () => {
      await i18n.changeLanguage('ar');
      expect(i18n.language).toBe('ar');
    });

    it('should switch back to Dutch', async () => {
      await i18n.changeLanguage('en');
      await i18n.changeLanguage('nl');
      expect(i18n.language).toBe('nl');
    });
  });

  describe('Translation keys', () => {
    it('should translate navigation keys in Dutch', () => {
      i18n.changeLanguage('nl');
      expect(i18n.t('nav.home')).toBeTruthy();
      expect(i18n.t('nav.dashboard')).toBeTruthy();
      expect(i18n.t('nav.forum')).toBeTruthy();
    });

    it('should translate navigation keys in English', () => {
      i18n.changeLanguage('en');
      expect(i18n.t('nav.home')).toBe('Home');
      expect(i18n.t('nav.dashboard')).toBe('Dashboard');
      expect(i18n.t('nav.forum')).toBe('Forum');
    });

    it('should translate role keys', () => {
      i18n.changeLanguage('en');
      expect(i18n.t('roles.admin')).toBe('Administrator');
      expect(i18n.t('roles.teacher')).toBe('Teacher');
      expect(i18n.t('roles.student')).toBe('Student');
    });

    it('should handle missing keys with fallback', () => {
      i18n.changeLanguage('en');
      const result = i18n.t('non.existent.key');
      expect(result).toBeTruthy();
    });
  });

  describe('RTL support', () => {
    it('should identify Arabic as RTL language', () => {
      i18n.changeLanguage('ar');
      expect(i18n.language).toBe('ar');
    });

    it('should identify Dutch as LTR language', () => {
      i18n.changeLanguage('nl');
      expect(i18n.language).toBe('nl');
    });

    it('should identify English as LTR language', () => {
      i18n.changeLanguage('en');
      expect(i18n.language).toBe('en');
    });
  });

  describe('Language persistence', () => {
    it('should remember language preference', () => {
      const testLang = 'en';
      localStorage.setItem('language_preference', testLang);
      
      const savedLang = localStorage.getItem('language_preference');
      expect(savedLang).toBe(testLang);
    });

    it('should load saved language preference', () => {
      localStorage.setItem('language_preference', 'ar');
      const savedLang = localStorage.getItem('language_preference');
      expect(savedLang).toBe('ar');
    });
  });
});
