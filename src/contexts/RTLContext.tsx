/**
 * RTL Context - Single Source of Truth
 * FIX 1: RTL is now derived directly from i18n.language
 * FIX 3: Removed transition: all on <html> to prevent layout flicker
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import i18n from '@/i18n/config';

// RTL languages list
const RTL_LANGUAGES = ['ar', 'ur', 'he', 'fa', 'ps', 'sd'];

interface RTLContextType {
  isRTL: boolean;
  toggleRTL: () => void;
  setRTL: (isRTL: boolean) => void;
  isLoading: boolean;
  currentLanguage: string;
}

const RTLContext = createContext<RTLContextType | undefined>(undefined);

export const useRTL = () => {
  const context = useContext(RTLContext);
  if (context === undefined) {
    throw new Error('useRTL must be used within an RTLProvider');
  }
  return context;
};

interface RTLProviderProps {
  children: React.ReactNode;
}

/**
 * Determines if a language is RTL
 */
const isRTLLanguage = (lang: string): boolean => {
  return RTL_LANGUAGES.includes(lang.split('-')[0].toLowerCase());
};

export const RTLProvider: React.FC<RTLProviderProps> = ({ children }) => {
  // FIX 1: Derive RTL state directly from current language
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'nl');
  const [isLoading, setIsLoading] = useState(false);

  // RTL is computed from language - single source of truth
  const isRTL = isRTLLanguage(currentLanguage);

  // Reset horizontal scroll position when direction changes
  const resetHorizontalScroll = useCallback(() => {
    if (typeof window !== 'undefined') {
      const currentTop = window.scrollY;
      window.scrollTo({ left: 0, top: currentTop, behavior: 'instant' });
      if (document.scrollingElement) {
        document.scrollingElement.scrollLeft = 0;
      }
    }
  }, []);

  // Apply direction to document element
  useEffect(() => {
    const html = document.documentElement;
    const newDir = isRTL ? 'rtl' : 'ltr';
    const newLang = currentLanguage;

    // FIX 3: NO transition on html element - prevents layout flicker
    // Only apply minimal opacity transition for smooth visual
    html.style.transition = 'opacity 0.15s ease';
    html.style.opacity = '0.98';

    // Apply attributes
    html.dir = newDir;
    html.lang = newLang;
    
    // Update classes
    html.classList.remove('rtl-mode', 'ltr-mode');
    html.classList.add(isRTL ? 'rtl-mode' : 'ltr-mode');

    // Reset scroll and restore opacity
    requestAnimationFrame(() => {
      resetHorizontalScroll();
      html.style.opacity = '1';
      
      // Clean up transition after change
      setTimeout(() => {
        html.style.transition = '';
      }, 150);
    });
  }, [isRTL, currentLanguage, resetHorizontalScroll]);

  // Listen to i18n language changes
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setCurrentLanguage(lng);
    };

    i18n.on('languageChanged', handleLanguageChange);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);

  // Toggle between RTL and LTR by switching language
  const toggleRTL = useCallback(() => {
    setIsLoading(true);
    const newLang = isRTL ? 'nl' : 'ar';
    
    i18n.changeLanguage(newLang).then(() => {
      localStorage.setItem('language_preference', newLang);
      setIsLoading(false);
    });
  }, [isRTL]);

  // Explicitly set RTL state (switches to appropriate language)
  const setRTL = useCallback((newIsRTL: boolean) => {
    if (newIsRTL !== isRTL) {
      setIsLoading(true);
      const newLang = newIsRTL ? 'ar' : 'nl';
      
      i18n.changeLanguage(newLang).then(() => {
        localStorage.setItem('language_preference', newLang);
        setIsLoading(false);
      });
    }
  }, [isRTL]);

  return (
    <RTLContext.Provider value={{ 
      isRTL, 
      toggleRTL, 
      setRTL, 
      isLoading,
      currentLanguage 
    }}>
      {children}
    </RTLContext.Provider>
  );
};
