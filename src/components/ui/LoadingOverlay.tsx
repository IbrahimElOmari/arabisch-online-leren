/**
 * Loading overlay component for RTL/language switching
 */

import React from 'react';
import { Loader2, Languages } from 'lucide-react';
import { useRTL } from '@/contexts/RTLContext';
import { useTranslation } from '@/contexts/TranslationContext';

interface LoadingOverlayProps {
  show: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  show, 
  message 
}) => {
  const { isRTL } = useRTL();
  const { t } = useTranslation();
  
  if (!show) return null;

  const defaultMessage = t('status.switching_language', 'Switching language...');

  return (
    <div 
      className={`
        fixed inset-0 bg-background/80 backdrop-blur-sm z-50 
        flex items-center justify-center
        transition-all duration-300 ease-in-out
        ${show ? 'opacity-100' : 'opacity-0 pointer-events-none'}
      `}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div 
        className={`
          bg-card border border-border rounded-lg p-6 shadow-lg
          flex flex-col items-center gap-4 max-w-sm mx-4
          transform transition-all duration-300 ease-in-out
          ${show ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}
        `}
      >
        {/* Animated icon */}
        <div className="relative">
          <Languages 
            className={`
              h-8 w-8 text-primary
              transition-transform duration-700 ease-in-out
              ${isRTL ? 'rotate-180' : 'rotate-0'}
            `} 
          />
          <Loader2 
            className="
              h-12 w-12 text-muted-foreground absolute -top-2 -left-2
              animate-spin opacity-30
            " 
          />
        </div>

        {/* Loading message */}
        <div className="text-center">
          <p 
            className={`
              text-sm font-medium text-foreground mb-1
              ${isRTL ? 'arabic-text font-amiri' : 'font-inter'}
            `}
          >
            {message || defaultMessage}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('status.please_wait', 'Please wait...')}
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex gap-1">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className={`
                w-2 h-2 rounded-full bg-primary
                animate-pulse
              `}
              style={{
                animationDelay: `${index * 0.2}s`,
                animationDuration: '1s'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};