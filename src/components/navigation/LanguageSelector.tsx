import React from 'react';
import { useTranslation } from 'react-i18next';
import { useRTL } from '@/contexts/RTLContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

const languages = [
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
] as const;

export const LanguageSelector = React.memo(() => {
  const { i18n } = useTranslation();
  const { setRTL } = useRTL();

  const currentLang = languages.find(lang => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (langCode: string) => {
    // Save preference to localStorage
    localStorage.setItem('language_preference', langCode);
    
    // Change language in i18next
    i18n.changeLanguage(langCode);
    
    // Update RTL mode (only Arabic is RTL)
    setRTL(langCode === 'ar');
    
    // Update document lang attribute
    document.documentElement.lang = langCode;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="gap-2 text-foreground hover:text-primary"
          data-testid="language-selector"
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{currentLang.flag} {currentLang.label}</span>
          <span className="sm:hidden">{currentLang.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px]">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`cursor-pointer ${
              i18n.language === lang.code ? 'bg-accent' : ''
            }`}
          >
            <span className="mr-2">{lang.flag}</span>
            <span>{lang.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

LanguageSelector.displayName = 'LanguageSelector';
