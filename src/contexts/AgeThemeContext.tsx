import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProviderQuery';

export type ThemeAge = 'playful' | 'clean' | 'professional';

interface ThemeContextType {
  themeAge: ThemeAge;
  setThemeAge: (theme: ThemeAge) => void;
  isLoading: boolean;
}

const AgeThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useAgeTheme = () => {
  const context = useContext(AgeThemeContext);
  if (context === undefined) {
    throw new Error('useAgeTheme must be used within an AgeThemeProvider');
  }
  return context;
};

interface AgeThemeProviderProps {
  children: React.ReactNode;
}

export const AgeThemeProvider: React.FC<AgeThemeProviderProps> = ({ children }) => {
  const { profile, user } = useAuth();
  const [themeAge, setThemeAge] = useState<ThemeAge>('clean');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      // Auto-detect theme based on age if theme_preference is 'auto'
      const autoDetectTheme = (age: number | null): ThemeAge => {
        if (!age) return 'clean'; // default for unknown age
        if (age < 16) return 'playful';
        if (age >= 16 && age <= 21) return 'clean';
        return 'professional'; // 21+
      };

      let detectedTheme: ThemeAge;
      
      if (profile.theme_preference && profile.theme_preference !== 'auto') {
        detectedTheme = profile.theme_preference as ThemeAge;
      } else {
        detectedTheme = autoDetectTheme(profile.age || null);
      }

      setThemeAge(detectedTheme);
      setIsLoading(false);
    }
  }, [profile]);

  // Apply theme classes to document body
  useEffect(() => {
    const body = document.body;
    // Remove existing theme classes
    body.classList.remove('theme-playful', 'theme-clean', 'theme-professional');
    // Add current theme class
    body.classList.add(`theme-${themeAge}`);
  }, [themeAge]);

  const value = {
    themeAge,
    setThemeAge,
    isLoading,
  };

  return (
    <AgeThemeContext.Provider value={value}>
      {children}
    </AgeThemeContext.Provider>
  );
};