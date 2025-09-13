
import React, { createContext, useContext, useState, useEffect } from 'react';

interface RTLContextType {
  isRTL: boolean;
  toggleRTL: () => void;
  setRTL: (isRTL: boolean) => void;
  isLoading: boolean;
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

// Constants for localStorage
const RTL_STORAGE_KEY = 'leer-arabisch-rtl-preference';

export const RTLProvider: React.FC<RTLProviderProps> = ({ children }) => {
  const [isRTL, setIsRTLState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
// RTL styles are now bundled statically via index.css (@import './styles/rtl.css')


  // Load RTL preference from localStorage on mount
  useEffect(() => {
    const savedPreference = localStorage.getItem(RTL_STORAGE_KEY);
    if (savedPreference !== null) {
      setIsRTLState(savedPreference === 'true');
    }
    setIsLoading(false);
  }, []);

  // Persist RTL preference to localStorage
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(RTL_STORAGE_KEY, isRTL.toString());
    }
  }, [isRTL, isLoading]);

  const toggleRTL = () => {
    setIsLoading(true);
    // Small delay for smooth transition
    setTimeout(() => {
      const newRTLState = !isRTL;
      setIsRTLState(newRTLState);
      setIsLoading(false);
    }, 150);
  };

  const setRTL = (newIsRTL: boolean) => {
    if (newIsRTL !== isRTL) {
      setIsLoading(true);
      setTimeout(() => {
        setIsRTLState(newIsRTL);
        setIsLoading(false);
      }, 150);
    }
  };

  // Apply direction to document element with smooth transition
  useEffect(() => {
    const html = document.documentElement;
    
    // Add transition class for smooth direction change
    html.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    
    html.dir = isRTL ? 'rtl' : 'ltr';
    html.lang = isRTL ? 'ar' : 'nl';
    
    // Add/remove RTL class for additional styling
    if (isRTL) {
      html.classList.add('rtl-mode');
      html.classList.remove('ltr-mode');
    } else {
      html.classList.add('ltr-mode');
      html.classList.remove('rtl-mode');
    }

    // Clean up transition after change
    const timeoutId = setTimeout(() => {
      html.style.transition = '';
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [isRTL]);

  return (
    <RTLContext.Provider value={{ isRTL, toggleRTL, setRTL, isLoading }}>
      {children}
    </RTLContext.Provider>
  );
};
