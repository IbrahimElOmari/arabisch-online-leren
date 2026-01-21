import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';

export type ConsentCategory = 'essential' | 'analytics' | 'marketing';

interface CookieConsentState {
  hasConsented: boolean;
  consentDate: string | null;
  categories: Record<ConsentCategory, boolean>;
  
  // Actions
  acceptAll: () => void;
  acceptEssentialOnly: () => void;
  updateCategory: (category: ConsentCategory, value: boolean) => void;
  saveConsent: () => Promise<void>;
  resetConsent: () => void;
  isAnalyticsEnabled: () => boolean;
  isMarketingEnabled: () => boolean;
}

export const useCookieConsent = create<CookieConsentState>()(
  persist(
    (set, get) => ({
      hasConsented: false,
      consentDate: null,
      categories: {
        essential: true, // Always on
        analytics: false,
        marketing: false,
      },

      acceptAll: () => {
        set({
          hasConsented: true,
          consentDate: new Date().toISOString(),
          categories: {
            essential: true,
            analytics: true,
            marketing: true,
          },
        });
        get().saveConsent();
      },

      acceptEssentialOnly: () => {
        set({
          hasConsented: true,
          consentDate: new Date().toISOString(),
          categories: {
            essential: true,
            analytics: false,
            marketing: false,
          },
        });
        get().saveConsent();
      },

      updateCategory: (category, value) => {
        if (category === 'essential') return; // Essential cannot be disabled
        set((state) => ({
          categories: {
            ...state.categories,
            [category]: value,
          },
        }));
      },

      saveConsent: async () => {
        const state = get();
        
        try {
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            // Save consent to database for logged-in users
            for (const [type, consented] of Object.entries(state.categories)) {
              await supabase.from('user_consents').upsert({
                user_id: user.id,
                consent_type: `cookie_${type}`,
                consented,
                consent_version: '1.0',
                consented_at: consented ? new Date().toISOString() : null,
                withdrawn_at: !consented ? new Date().toISOString() : null,
                user_agent: navigator.userAgent,
              }, {
                onConflict: 'user_id,consent_type'
              });
            }
          }
        } catch (error) {
          // Silently fail - consent is still saved in localStorage
          console.warn('Failed to save consent to database:', error);
        }
      },

      resetConsent: () => {
        set({
          hasConsented: false,
          consentDate: null,
          categories: {
            essential: true,
            analytics: false,
            marketing: false,
          },
        });
      },

      isAnalyticsEnabled: () => get().categories.analytics,
      isMarketingEnabled: () => get().categories.marketing,
    }),
    {
      name: 'cookie-consent',
    }
  )
);
