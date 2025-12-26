import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { useTranslation } from '@/contexts/TranslationContext';
import { cn } from '@/lib/utils';

interface AccessibilitySettings {
  highContrast: boolean;
  reduceMotion: boolean;
  largeText: boolean;
  screenReaderMode: boolean;
  keyboardNavigation: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSetting: (key: keyof AccessibilitySettings, value: boolean) => void;
  resetSettings: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  reduceMotion: false,
  largeText: false,
  screenReaderMode: false,
  keyboardNavigation: false,
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export const AccessibilityProvider = ({ children }: AccessibilityProviderProps) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);
  const { isRTL } = useRTLLayout();

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('accessibility-settings');
    if (savedSettings) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) });
      } catch (error) {
        if (import.meta.env.DEV) console.warn('Failed to load accessibility settings:', error);
      }
    }

    // Detect system preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    
    if (prefersReducedMotion || prefersHighContrast) {
      setSettings(prev => ({
        ...prev,
        reduceMotion: prefersReducedMotion,
        highContrast: prefersHighContrast,
      }));
    }
  }, []);

  // Apply settings to document
  useEffect(() => {
    const root = document.documentElement;
    
    // High Contrast
    if (settings.highContrast) {
      root.classList.add('accessibility-high-contrast');
    } else {
      root.classList.remove('accessibility-high-contrast');
    }

    // Reduce Motion
    if (settings.reduceMotion) {
      root.classList.add('accessibility-reduce-motion');
    } else {
      root.classList.remove('accessibility-reduce-motion');
    }

    // Large Text
    if (settings.largeText) {
      root.classList.add('accessibility-large-text');
    } else {
      root.classList.remove('accessibility-large-text');
    }

    // Screen Reader Mode
    if (settings.screenReaderMode) {
      root.classList.add('accessibility-screen-reader');
    } else {
      root.classList.remove('accessibility-screen-reader');
    }

    // Keyboard Navigation
    if (settings.keyboardNavigation) {
      root.classList.add('accessibility-keyboard-nav');
    } else {
      root.classList.remove('accessibility-keyboard-nav');
    }

    // Save to localStorage
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));
  }, [settings]);

  // Listen for system preference changes
  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setSettings(prev => ({ ...prev, reduceMotion: e.matches }));
    };

    const handleContrastChange = (e: MediaQueryListEvent) => {
      setSettings(prev => ({ ...prev, highContrast: e.matches }));
    };

    motionQuery.addEventListener('change', handleMotionChange);
    contrastQuery.addEventListener('change', handleContrastChange);

    return () => {
      motionQuery.removeEventListener('change', handleMotionChange);
      contrastQuery.removeEventListener('change', handleContrastChange);
    };
  }, []);

  const updateSetting = (key: keyof AccessibilitySettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return (
    <AccessibilityContext.Provider value={{ settings, updateSetting, resetSettings }}>
      <div 
        className={cn(
          'min-h-screen',
          settings.highContrast && 'accessibility-enhanced-contrast',
          settings.largeText && 'accessibility-large-fonts',
          isRTL && 'rtl-accessible'
        )}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {children}
      </div>
    </AccessibilityContext.Provider>
  );
};

// Skip Link Component
export const SkipLink = ({ targetId = "main-content" }: { targetId?: string }) => {
  const { t } = useTranslation();
  const { isRTL } = useRTLLayout();
  
  return (
    <a
      href={`#${targetId}`}
      className={cn(
        'skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:z-50',
        'bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-lg',
        'transition-all duration-200 focus:animate-bounce-in',
        isRTL ? 'right-4' : 'left-4'
      )}
      onFocus={(e) => e.currentTarget.scrollIntoView({ behavior: 'smooth' })}
    >
      {t('accessibility.skip_to_content', 'Ga naar hoofdinhoud')}
    </a>
  );
};

// Focus Trap Component for Modal Accessibility
interface FocusTrapProps {
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}

export const FocusTrap = ({ children, active = true, className }: FocusTrapProps) => {
  const trapRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || !trapRef.current) return;

    const trap = trapRef.current;
    const focusableElements = trap.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        firstElement?.focus();
      }
    };

    document.addEventListener('keydown', handleTabKey);
    document.addEventListener('keydown', handleEscapeKey);

    // Auto focus first element
    firstElement?.focus();

    return () => {
      document.removeEventListener('keydown', handleTabKey);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [active]);

  return (
    <div ref={trapRef} className={cn('focus-trap', className)}>
      {children}
    </div>
  );
};

// Announcement Component for Screen Readers
interface AnnouncementProps {
  message: string;
  priority?: 'polite' | 'assertive';
  id?: string;
}

export const Announcement = ({ message, priority = 'polite', id }: AnnouncementProps) => {
  return (
    <div
      id={id}
      role={priority === 'assertive' ? 'alert' : 'status'}
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
};

export default AccessibilityProvider;