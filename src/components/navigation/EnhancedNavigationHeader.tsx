import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, Bell, User, LogOut, Settings, Home, BookOpen, MessageSquare, BarChart3, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { useTranslation } from '@/contexts/TranslationContext';
import EnhancedThemeToggle from '@/components/ui/enhanced-theme-toggle';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface SearchResult {
  id: string;
  type: 'class' | 'lesson' | 'forum' | 'user' | 'page';
  title: string;
  subtitle?: string;
  url: string;
  icon: React.ReactNode;
}

export const EnhancedNavigationHeader = () => {
  const { user, profile, signOut } = useAuth();
  const { isRTL, getFlexDirection } = useRTLLayout();
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Fetch unread notifications count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!user?.id) return;
      
      try {
        // For now, we'll simulate notifications count
        // TODO: Implement proper notifications table when available
        setUnreadCount(0);
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();
  }, [user?.id]);

  // Global search functionality
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    try {
      const results: SearchResult[] = [];

      // Add page navigation results based on query
      const pages = [
        { title: 'Dashboard', url: '/dashboard', icon: <Home className="h-4 w-4" /> },
        { title: 'Leerstof', url: '/leerstof', icon: <BookOpen className="h-4 w-4" /> },
        { title: 'Forum', url: '/forum', icon: <MessageSquare className="h-4 w-4" /> },
        { title: 'Analytics', url: '/analytics', icon: <BarChart3 className="h-4 w-4" /> },
        { title: 'Beveiliging', url: '/security', icon: <Shield className="h-4 w-4" /> },
      ].filter(page => page.title.toLowerCase().includes(query.toLowerCase()));

      pages.forEach(page => {
        results.push({
          id: page.url,
          type: 'page',
          title: page.title,
          url: page.url,
          icon: page.icon
        });
      });

      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleSearchSelect = (result: SearchResult) => {
    navigate(result.url);
    setIsSearchOpen(false);
    setSearchQuery('');
  };

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
      case 'admin': return 'Beheerder';
      case 'leerkracht': return 'Leerkracht';
      case 'leerling': return 'Leerling';
      default: return 'Gebruiker';
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
                Arabisch Leren
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
                placeholder={t('search.placeholder', 'Zoeken in lessen, forum, gebruikers...')}
                className={cn(
                  'w-full',
                  isRTL ? 'pr-10' : 'pl-10',
                  'focus-visible:ring-primary'
                )}
                onClick={() => setIsSearchOpen(true)}
                readOnly
              />
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

            {/* Theme Toggle */}
            <EnhancedThemeToggle size="sm" />

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-80">
                <div className="p-3 border-b">
                  <h4 className="font-medium">Meldingen</h4>
                  {unreadCount > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {unreadCount} ongelezen {unreadCount === 1 ? 'melding' : 'meldingen'}
                    </p>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {unreadCount === 0 ? (
                    <div className="p-6 text-center text-muted-foreground">
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Geen nieuwe meldingen</p>
                    </div>
                  ) : (
                    <div className="p-2">
                      <p className="text-sm text-muted-foreground p-2">
                        Meldingen worden binnenkort getoond
                      </p>
                    </div>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

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
                        {getRoleDisplayName(profile?.role)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Profiel
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>

                {profile?.role === 'admin' && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Beheer
                    </Link>
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  onClick={handleSignOut}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Uitloggen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Global Search Dialog */}
      <CommandDialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <CommandInput
          placeholder={t('search.placeholder', 'Zoeken in lessen, forum, gebruikers...')}
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          <CommandEmpty>
            {isSearching ? 'Zoeken...' : 'Geen resultaten gevonden.'}
          </CommandEmpty>
          
          {searchResults.length > 0 && (
            <>
              {/* Classes */}
              {searchResults.filter(r => r.type === 'class').length > 0 && (
                <CommandGroup heading="Klassen">
                  {searchResults
                    .filter(r => r.type === 'class')
                    .map(result => (
                      <CommandItem
                        key={result.id}
                        value={`class-${result.id}`}
                        onSelect={() => handleSearchSelect(result)}
                      >
                        {result.icon}
                        <div className="ml-2">
                          <div className="font-medium">{result.title}</div>
                          {result.subtitle && (
                            <div className="text-sm text-muted-foreground">{result.subtitle}</div>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                </CommandGroup>
              )}

              {/* Forum */}
              {searchResults.filter(r => r.type === 'forum').length > 0 && (
                <CommandGroup heading="Forum">
                  {searchResults
                    .filter(r => r.type === 'forum')
                    .map(result => (
                      <CommandItem
                        key={result.id}
                        value={`forum-${result.id}`}
                        onSelect={() => handleSearchSelect(result)}
                      >
                        {result.icon}
                        <div className="ml-2">
                          <div className="font-medium">{result.title}</div>
                          {result.subtitle && (
                            <div className="text-sm text-muted-foreground">{result.subtitle}</div>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                </CommandGroup>
              )}

              {/* Pages */}
              {searchResults.filter(r => r.type === 'page').length > 0 && (
                <CommandGroup heading="Pagina's">
                  {searchResults
                    .filter(r => r.type === 'page')
                    .map(result => (
                      <CommandItem
                        key={result.id}
                        value={`page-${result.id}`}
                        onSelect={() => handleSearchSelect(result)}
                      >
                        {result.icon}
                        <div className="ml-2">
                          <div className="font-medium">{result.title}</div>
                        </div>
                      </CommandItem>
                    ))}
                </CommandGroup>
              )}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
};

export default EnhancedNavigationHeader;