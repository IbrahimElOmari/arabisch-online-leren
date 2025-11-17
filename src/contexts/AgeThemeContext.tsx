import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProviderQuery';

/**
 * PR11: Simplified age-based theming system
 * - 'playful': For users under 16 (children and young teens)
 * - 'professional': For users 16+ (older teens, adults, teachers, parents)
 */
export type ThemeAge = 'playful' | 'professional';

interface ThemeContextType {
  themeAge: ThemeAge;
  setThemeAge: (theme: ThemeAge) => void;
  updateThemePreference: (preference: 'auto' | ThemeAge) => Promise<void>;
  isLoading: boolean;
  isUpdating: boolean;
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
  const { profile } = useAuth();
  const [themeAge, setThemeAge] = useState<ThemeAge>('professional');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (profile) {
      /**
       * PR11: Simplified theme detection logic
       * - Under 16: Playful theme (engaging, colorful, fun for children)
       * - 16+: Professional theme (clean, serious, suitable for teens/adults)
       * - Teachers/Admins: Always professional (regardless of age)
       * - Parents: Professional (based on role or age)
       */
      const autoDetectTheme = (age: number | null, role?: string): ThemeAge => {
        // Teachers, admins, and parents always get professional theme
        if (role && ['leerkracht', 'admin', 'ouder'].includes(role)) {
          return 'professional';
        }
        
        // Age-based detection for students
        if (!age) return 'professional'; // default for unknown age
        return age < 16 ? 'playful' : 'professional';
      };

      let detectedTheme: ThemeAge;
      
      // Check if user has manually set a theme preference
      if (profile.theme_preference && profile.theme_preference !== 'auto') {
        // Map old 'clean' preference to 'professional' for backwards compatibility
        const pref = profile.theme_preference === 'clean' ? 'professional' : profile.theme_preference;
        detectedTheme = pref as ThemeAge;
      } else {
        // Auto-detect based on age and role
        detectedTheme = autoDetectTheme(profile.age || null, profile.role);
      }

      setThemeAge(detectedTheme);
      setIsLoading(false);
    }
  }, [profile]);

  // Apply theme classes to document body
  useEffect(() => {
    const body = document.body;
    // Remove all possible theme classes (including legacy 'clean')
    body.classList.remove('theme-playful', 'theme-clean', 'theme-professional');
    // Add current theme class
    body.classList.add(`theme-${themeAge}`);
  }, [themeAge]);

  /**
   * Update user's theme preference in database
   * @param preference - 'auto' for age-based, or specific theme
   */
  const updateThemePreference = async (preference: 'auto' | ThemeAge) => {
    if (!profile?.id) return;
    
    setIsUpdating(true);
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { error } = await supabase
        .from('profiles')
        .update({ theme_preference: preference })
        .eq('id', profile.id);

      if (error) throw error;

      // If auto, recalculate theme; otherwise use selected theme
      if (preference === 'auto') {
        const role = profile.role;
        const age = profile.age;
        if (role && ['leerkracht', 'admin', 'ouder'].includes(role)) {
          setThemeAge('professional');
        } else {
          setThemeAge(age && age < 16 ? 'playful' : 'professional');
        }
      } else {
        setThemeAge(preference);
      }
    } catch (error) {
      console.error('Failed to update theme preference:', error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  const value = {
    themeAge,
    setThemeAge,
    updateThemePreference,
    isLoading,
    isUpdating,
  };

  return (
    <AgeThemeContext.Provider value={value}>
      {children}
    </AgeThemeContext.Provider>
  );
};