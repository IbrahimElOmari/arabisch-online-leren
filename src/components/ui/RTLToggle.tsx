
import React from 'react';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';
import { useRTL } from '@/contexts/RTLContext';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { useTranslation } from '@/contexts/TranslationContext';

export const RTLToggle: React.FC = () => {
  const { isRTL, toggleRTL } = useRTL();
  const { getFlexDirection, getIconSpacing } = useRTLLayout();
  const { t } = useTranslation();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleRTL}
      className={`${getFlexDirection()} items-center gap-2 h-9 px-3 transition-all duration-200 hover:scale-105`}
      title={isRTL ? t('nav.switch_to_dutch', 'Switch to Dutch') : t('nav.switch_to_arabic', 'Switch to Arabic')}
    >
      <Languages className={`h-4 w-4 transition-transform duration-200 ${isRTL ? 'rotate-180' : ''}`} />
      <span className={`hidden sm:inline transition-all duration-200 font-medium ${isRTL ? 'arabic-text font-amiri' : 'font-inter'}`}>
        {isRTL ? 'NL' : 'عربي'}
      </span>
    </Button>
  );
};
