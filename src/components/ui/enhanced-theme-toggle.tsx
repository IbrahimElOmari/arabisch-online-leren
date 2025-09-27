import React, { useState, useEffect } from 'react';
import { Moon, Sun, Monitor, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel 
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { useTranslation } from '@/contexts/TranslationContext';

type Theme = 'light' | 'dark' | 'system';

interface EnhancedThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const EnhancedThemeToggle = ({ 
  className, 
  size = 'md',
  showLabel = false 
}: EnhancedThemeToggleProps) => {
  const [theme, setTheme] = useState<Theme>('system');
  const [mounted, setMounted] = useState(false);
  const { isRTL, getTextAlign } = useRTLLayout();
  const { t } = useTranslation();

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme, mounted]);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-9 w-9', 
    lg: 'h-10 w-10'
  };

  const iconSize = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const getCurrentIcon = () => {
    if (!mounted) return <Monitor className={iconSize[size]} />;
    
    switch (theme) {
      case 'light': return <Sun className={iconSize[size]} />;
      case 'dark': return <Moon className={iconSize[size]} />;
      case 'system': return <Monitor className={iconSize[size]} />;
    }
  };

  const getThemeLabel = (themeType: Theme) => {
    switch (themeType) {
      case 'light': return t('theme.light', 'Licht');
      case 'dark': return t('theme.dark', 'Donker');
      case 'system': return t('theme.system', 'Systeem');
    }
  };

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="icon"
        className={cn(sizeClasses[size], className)}
        disabled
      >
        <Monitor className={iconSize[size]} />
      </Button>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className={cn(
              sizeClasses[size],
              "relative transition-all duration-300 hover:shadow-lg",
              "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              className
            )}
            aria-label={t('theme.toggle', 'Thema wijzigen')}
          >
            <div className="relative">
              {getCurrentIcon()}
              {/* Subtle indicator for active theme */}
              <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          align={isRTL ? "start" : "end"}
          className="w-48 bg-popover/95 backdrop-blur-sm border shadow-lg"
        >
          <DropdownMenuLabel className={cn("font-medium", isRTL ? 'arabic-text text-right' : 'text-left')}>
            {t('theme.select', 'Thema Selecteren')}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {(['light', 'dark', 'system'] as Theme[]).map((themeOption) => (
            <DropdownMenuItem
              key={themeOption}
              onClick={() => handleThemeChange(themeOption)}
              className={cn(
                "flex items-center gap-3 cursor-pointer transition-colors",
                "focus:bg-accent focus:text-accent-foreground",
                theme === themeOption && "bg-accent text-accent-foreground font-medium",
                isRTL && "flex-row-reverse"
              )}
            >
              <div className="flex items-center gap-2">
                {themeOption === 'light' && <Sun className="h-4 w-4" />}
                {themeOption === 'dark' && <Moon className="h-4 w-4" />}
                {themeOption === 'system' && <Monitor className="h-4 w-4" />}
              </div>
              <span className={isRTL ? 'arabic-text' : ''}>
                {getThemeLabel(themeOption)}
              </span>
              {theme === themeOption && (
                <div className="ms-auto w-2 h-2 bg-primary rounded-full" />
              )}
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem disabled className="text-xs text-muted-foreground justify-center">
            <Palette className="h-3 w-3 me-1" />
            <span className={isRTL ? 'arabic-text' : ''}>
              {t('theme.auto_detect', 'Automatisch detecteren')}
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {showLabel && (
        <span className={cn(
          "text-sm font-medium text-muted-foreground",
          isRTL ? 'arabic-text' : ''
        )}>
          {getThemeLabel(theme)}
        </span>
      )}
    </div>
  );
};

export default EnhancedThemeToggle;