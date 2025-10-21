import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, LogOut, Settings, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { useTranslation } from '@/contexts/TranslationContext';
import { useUserRole } from '@/hooks/useUserRole';
import EnhancedThemeToggle from '@/components/ui/enhanced-theme-toggle';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { LanguageSelector } from '@/components/navigation/LanguageSelector';
import { cn } from '@/lib/utils';

export const EnhancedNavigationHeader = () => {
  const { user, profile, signOut } = useAuth();
  const { isAdmin, role } = useUserRole();
  const { isRTL } = useRTLLayout();
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K for search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const getRoleDisplayName = (role?: string) => {
    switch (role) {
      case 'admin': return t('roles.admin');
      case 'leerkracht': return t('roles.teacher');
      case 'leerling': return t('roles.student');
      default: return t('roles.unknown');
    }
  };

  return (
    <>
      <header className={cn(
        'sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        'shadow-sm'
      )}>
        <div className="container flex h-16 items-center px-4">
          {/* Logo & Brand */}
          <div className={cn('flex items-center gap-4', isRTL && 'flex-row-reverse')}>
            <Link 
              to="/dashboard"
              className={cn(
                'flex items-center gap-2 font-bold text-lg hover:opacity-80 transition-opacity',
                isRTL && 'flex-row-reverse'
              )}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">ع</span>
              </div>
              <span className={cn('hidden sm:block', isRTL && 'arabic-text')}>
                {isRTL ? 'تعلم العربية' : 'Arabisch Leren'}
              </span>
            </Link>
          </div>

          {/* Search - Desktop */}
          <div className="flex-1 max-w-md mx-4 hidden md:block">
            <div className="relative">
              <Search className={cn(
                'absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground',
                isRTL ? 'right-3' : 'left-3'
              )} />
              <Input
                placeholder={t('search.placeholder', 'Zoeken... (Cmd+K)')}
                className={cn(
                  'w-full cursor-pointer',
                  isRTL ? 'pe-10' : 'ps-10',
                  'focus-visible:ring-primary'
                )}
                onClick={() => setIsSearchOpen(true)}
                readOnly
              />
              <kbd className={cn(
                'absolute top-1/2 -translate-y-1/2 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded',
                isRTL ? 'left-2' : 'right-2'
              )}>
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Actions */}
          <div className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
            {/* Mobile Search */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsSearchOpen(true)}
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Language Selector */}
            <LanguageSelector />

            {/* Theme Toggle */}
            <EnhancedThemeToggle size="sm" />

            {/* Notifications */}
            <NotificationBell className="relative" />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-56">
                <div className="p-2 border-b">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {profile?.full_name || user?.email?.split('@')[0] || 'Gebruiker'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getRoleDisplayName(role || undefined)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <DropdownMenuItem asChild>
                  <Link to="/profile" className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                    <User className="h-4 w-4" />
                    <span className={isRTL ? 'arabic-text' : ''}>{t('user.profile')}</span>
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                    <Home className="h-4 w-4" />
                    <span className={isRTL ? 'arabic-text' : ''}>{t('nav.home_dashboard')}</span>
                  </Link>
                </DropdownMenuItem>

                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                      <Settings className="h-4 w-4" />
                      <span className={isRTL ? 'arabic-text' : ''}>{t('nav.admin')}</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  onClick={handleSignOut}
                  className={cn("text-destructive focus:text-destructive flex items-center gap-2", isRTL && "flex-row-reverse")}
                >
                  <LogOut className="h-4 w-4" />
                  <span className={isRTL ? 'arabic-text' : ''}>{t('user.logout')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Global Search Dialog */}
      <GlobalSearch 
        isOpen={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        onNavigate={(url) => {
          navigate(url);
          setIsSearchOpen(false);
        }}
      />
    </>
  );
};

export default EnhancedNavigationHeader;