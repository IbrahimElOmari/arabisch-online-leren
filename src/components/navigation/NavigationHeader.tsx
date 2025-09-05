
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { BookOpen } from 'lucide-react';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { useTranslation } from '@/contexts/TranslationContext';
import { PWAInstallButton } from '@/components/pwa/PWAInstallButton';

export const NavigationHeader = React.memo(() => {
  const navigate = useNavigate();
  const { getFlexDirection, getIconSpacing, isRTL } = useRTLLayout();
  const { t } = useTranslation();

  return (
    <div className={`${getFlexDirection()} items-center gap-4`}>
      <SidebarTrigger />
      <button 
        onClick={() => navigate('/')}
        className={`text-2xl font-bold text-foreground hover:text-primary transition-colors duration-200 ${getFlexDirection()} items-center gap-2`}
      >
        <BookOpen className="h-7 w-7 text-primary" />
        <span className={`hidden sm:block ${isRTL ? 'arabic-text font-amiri' : ''}`}>
          {isRTL ? 'تعلم العربية' : 'Leer Arabisch'}
        </span>
      </button>
      <div className="ml-auto">
        <PWAInstallButton />
      </div>
    </div>
  );
});

NavigationHeader.displayName = 'NavigationHeader';
