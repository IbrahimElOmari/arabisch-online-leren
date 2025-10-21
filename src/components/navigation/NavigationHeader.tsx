import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { BookOpen } from 'lucide-react';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { PWAInstallButton } from '@/components/pwa/PWAInstallButton';
import { LanguageSelector } from './LanguageSelector';
import { useTranslation } from 'react-i18next';

export const NavigationHeader = React.memo(() => {
  const navigate = useNavigate();
  const { getFlexDirection, isRTL } = useRTLLayout();
  const { i18n } = useTranslation();
  
  // Sync RTL with language changes
  useEffect(() => {
    const savedLang = localStorage.getItem('language_preference');
    if (savedLang && savedLang !== i18n.language) {
      i18n.changeLanguage(savedLang);
    }
  }, [i18n]);
  
  return (
    <div className={`${getFlexDirection()} items-center gap-4`}>
      <SidebarTrigger className="sidebar-trigger" />
      <button 
        onClick={() => navigate('/')}
        className={`text-2xl font-bold text-foreground hover:text-primary transition-colors duration-200 ${getFlexDirection()} items-center gap-2`}
      >
        <BookOpen className="h-7 w-7 text-primary" />
        <span className={`hidden sm:block ${isRTL ? 'arabic-text font-amiri' : ''}`}>
          {isRTL ? 'تعلم العربية' : 'Leer Arabisch'}
        </span>
      </button>
      <div className="ms-auto flex items-center gap-2">
        <LanguageSelector />
        <div className="hidden sm:block">
          <PWAInstallButton />
        </div>
      </div>
    </div>
  );
});

NavigationHeader.displayName = 'NavigationHeader';
