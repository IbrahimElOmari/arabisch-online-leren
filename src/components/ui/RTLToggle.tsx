
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Languages, Loader2 } from 'lucide-react';
import { useRTL } from '@/contexts/RTLContext';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { useTranslation } from '@/contexts/TranslationContext';

export const RTLToggle: React.FC = () => {
  const { isRTL, toggleRTL, isLoading } = useRTL();
  const { getFlexDirection } = useRTLLayout();
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);

  const handleToggle = () => {
    if (!isLoading) {
      toggleRTL();
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      disabled={isLoading}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        ${getFlexDirection()} items-center gap-2 h-9 px-3 
        transition-all duration-300 ease-in-out
        hover:scale-105 hover:bg-primary/10 hover:text-primary
        ${isLoading ? 'cursor-wait opacity-75' : 'cursor-pointer'}
        ${isHovered && !isLoading ? 'shadow-lg' : ''}
        relative overflow-hidden
      `}
      title={
        isLoading 
          ? t('nav.switching_language', 'Switching language...') 
          : isRTL 
            ? t('nav.switch_to_dutch', 'Switch to Dutch') 
            : t('nav.switch_to_arabic', 'Switch to Arabic')
      }
    >
      {/* Loading indicator */}
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Languages 
          className={`
            h-4 w-4 transition-all duration-300 ease-in-out
            ${isRTL ? 'rotate-180' : 'rotate-0'}
            ${isHovered ? 'scale-110' : 'scale-100'}
          `} 
        />
      )}
      
      {/* Text with smooth transition */}
      <span 
        className={`
          hidden sm:inline transition-all duration-300 ease-in-out font-medium
          ${isRTL ? 'arabic-text font-amiri text-base' : 'font-inter text-sm'}
          ${isLoading ? 'opacity-50' : 'opacity-100'}
          transform ${isHovered && !isLoading ? 'translateY(-1px)' : 'translateY(0)'}
        `}
      >
        {isLoading ? '...' : isRTL ? 'NL' : 'عربي'}
      </span>

      {/* Subtle background animation */}
      <div 
        className={`
          absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/10 
          transition-opacity duration-300 ease-in-out -z-10
          ${isHovered && !isLoading ? 'opacity-100' : 'opacity-0'}
        `}
      />
    </Button>
  );
};
