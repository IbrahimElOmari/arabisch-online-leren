import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Eye, 
  Type, 
  Contrast, 
  Focus,
  Keyboard,
  Volume2,
  VolumeX
} from 'lucide-react';

interface AccessibilityState {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReaderMode: boolean;
  keyboardNavigation: boolean;
  soundEnabled: boolean;
}

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accessibilityState, setAccessibilityState] = useState<AccessibilityState>({
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    screenReaderMode: false,
    keyboardNavigation: false,
    soundEnabled: true,
  });

  useEffect(() => {
    // Load accessibility preferences from localStorage
    const savedPrefs = localStorage.getItem('accessibility-preferences');
    if (savedPrefs) {
      try {
        const prefs = JSON.parse(savedPrefs);
        setAccessibilityState(prefs);
        applyAccessibilitySettings(prefs);
      } catch (error) {
        console.warn('Failed to load accessibility preferences:', error);
      }
    }

    // Detect system preferences
    detectSystemPreferences();
  }, []);

  const detectSystemPreferences = () => {
    // Detect prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Detect high contrast
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    
    if (prefersReducedMotion || prefersHighContrast) {
      setAccessibilityState(prev => ({
        ...prev,
        reducedMotion: prefersReducedMotion,
        highContrast: prefersHighContrast,
      }));
    }
  };

  const applyAccessibilitySettings = (settings: AccessibilityState) => {
    const root = document.documentElement;
    
    // High contrast mode
    if (settings.highContrast) {
      root.classList.add('high-contrast');
      root.style.setProperty('--accessibility-contrast', '1.5');
    } else {
      root.classList.remove('high-contrast');
      root.style.removeProperty('--accessibility-contrast');
    }
    
    // Large text mode
    if (settings.largeText) {
      root.classList.add('large-text');
      root.style.setProperty('--accessibility-text-scale', '1.25');
    } else {
      root.classList.remove('large-text');
      root.style.removeProperty('--accessibility-text-scale');
    }
    
    // Reduced motion
    if (settings.reducedMotion) {
      root.classList.add('reduced-motion');
      root.style.setProperty('--accessibility-motion', '0');
    } else {
      root.classList.remove('reduced-motion');
      root.style.removeProperty('--accessibility-motion');
    }
    
    // Screen reader mode
    if (settings.screenReaderMode) {
      root.classList.add('screen-reader-mode');
    } else {
      root.classList.remove('screen-reader-mode');
    }
  };

  const updateAccessibilitySetting = (key: keyof AccessibilityState, value: boolean) => {
    const newState = { ...accessibilityState, [key]: value };
    setAccessibilityState(newState);
    applyAccessibilitySettings(newState);
    
    // Save to localStorage
    localStorage.setItem('accessibility-preferences', JSON.stringify(newState));
  };

  return (
    <div className="accessibility-provider">
      {children}
      {/* Accessibility panel (can be toggled) */}
      <AccessibilityPanel 
        state={accessibilityState}
        onUpdate={updateAccessibilitySetting}
      />
    </div>
  );
};

interface AccessibilityPanelProps {
  state: AccessibilityState;
  onUpdate: (key: keyof AccessibilityState, value: boolean) => void;
}

const AccessibilityPanel: React.FC<AccessibilityPanelProps> = ({ state, onUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Accessibility toggle button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 rounded-full p-3"
        variant="outline"
        size="icon"
        aria-label="Toggle accessibility options"
        title="Toegankelijkheid opties"
      >
        <Eye className="h-5 w-5" />
      </Button>

      {/* Accessibility panel */}
      {isOpen && (
        <div 
          className="fixed bottom-16 right-4 z-50 bg-background border rounded-lg shadow-lg p-4 w-80"
          role="dialog"
          aria-labelledby="accessibility-panel-title"
          aria-describedby="accessibility-panel-description"
        >
          <div className="space-y-4">
            <div>
              <h2 id="accessibility-panel-title" className="text-lg font-semibold">
                Toegankelijkheid
              </h2>
              <p id="accessibility-panel-description" className="text-sm text-muted-foreground">
                Pas de interface aan voor betere toegankelijkheid
              </p>
            </div>

            <div className="space-y-3">
              <AccessibilityToggle
                icon={<Contrast className="h-4 w-4" />}
                label="Hoog contrast"
                description="Verhoogt contrast voor betere leesbaarheid"
                checked={state.highContrast}
                onChange={(checked) => onUpdate('highContrast', checked)}
              />

              <AccessibilityToggle
                icon={<Type className="h-4 w-4" />}
                label="Grote tekst"
                description="Vergroot tekstgrootte"
                checked={state.largeText}
                onChange={(checked) => onUpdate('largeText', checked)}
              />

              <AccessibilityToggle
                icon={<Focus className="h-4 w-4" />}
                label="Verminderde animaties"
                description="Vermindert bewegende elementen"
                checked={state.reducedMotion}
                onChange={(checked) => onUpdate('reducedMotion', checked)}
              />

              <AccessibilityToggle
                icon={<Keyboard className="h-4 w-4" />}
                label="Toetsenbord navigatie"
                description="Verbeterde toetsenbord ondersteuning"
                checked={state.keyboardNavigation}
                onChange={(checked) => onUpdate('keyboardNavigation', checked)}
              />

              <AccessibilityToggle
                icon={state.soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                label="Geluid feedback"
                description="Audio feedback bij interacties"
                checked={state.soundEnabled}
                onChange={(checked) => onUpdate('soundEnabled', checked)}
              />
            </div>

            <div className="flex justify-between items-center pt-2 border-t">
              <Badge variant="secondary" className="text-xs">
                WCAG 2.1 AA
              </Badge>
              <Button
                onClick={() => setIsOpen(false)}
                variant="outline"
                size="sm"
              >
                Sluiten
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

interface AccessibilityToggleProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const AccessibilityToggle: React.FC<AccessibilityToggleProps> = ({
  icon,
  label,
  description,
  checked,
  onChange,
}) => {
  return (
    <div className="flex items-start space-x-3">
      <Button
        onClick={() => onChange(!checked)}
        variant={checked ? "default" : "outline"}
        size="sm"
        className="mt-0.5"
        aria-pressed={checked}
        aria-describedby={`${label.toLowerCase().replace(/\s+/g, '-')}-description`}
      >
        {icon}
      </Button>
      <div className="flex-1 min-w-0">
        <label 
          className="text-sm font-medium cursor-pointer"
          onClick={() => onChange(!checked)}
        >
          {label}
        </label>
        <p 
          id={`${label.toLowerCase().replace(/\s+/g, '-')}-description`}
          className="text-xs text-muted-foreground"
        >
          {description}
        </p>
      </div>
    </div>
  );
};

// ARIA live region for announcements
export const LiveRegion: React.FC<{ message?: string }> = ({ message }) => {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      role="status"
      className="sr-only"
    >
      {message}
    </div>
  );
};

// Skip link component
export const SkipLink: React.FC = () => {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded"
    >
      Spring naar hoofdinhoud
    </a>
  );
};

export default AccessibilityProvider;