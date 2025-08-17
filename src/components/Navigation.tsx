
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { SearchCommand } from '@/components/ui/search-command';
import { UserDropdown } from '@/components/ui/UserDropdown';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Shield, Home, Calendar, MessageSquare, Eye, BookOpen, LogIn } from 'lucide-react';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';

const Navigation = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <nav className="bg-card/95 backdrop-blur-sm border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Mobile Sidebar Trigger + Logo */}
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <button 
              onClick={() => navigate('/')}
              className="text-2xl font-bold text-foreground hover:text-primary transition-colors duration-200 flex items-center gap-2"
            >
              <BookOpen className="h-7 w-7 text-primary" />
              <span className="hidden sm:block">Leer Arabisch</span>
            </button>
          </div>

          {/* Desktop Navigation - Hidden on mobile when sidebar is available */}
          <div className="hidden lg:flex items-center">
            <NavigationMenu>
              <NavigationMenuList className="flex items-center space-x-2">
                {/* Home */}
                <NavigationMenuItem>
                  <NavigationMenuLink
                    className={cn(
                      "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
                    )}
                    onClick={() => handleNavigation('/')}
                  >
                    <Home className="mr-2 h-4 w-4" />
                    Home
                  </NavigationMenuLink>
                </NavigationMenuItem>

                {/* Learning Platform - alleen voor ingelogde gebruikers */}
                {user && (
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Leerplatform
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="grid gap-3 p-6 w-[400px] bg-popover">
                        <div className="row-span-3">
                          <NavigationMenuLink asChild>
                            <button
                              className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md hover:bg-accent transition-colors text-left"
                              onClick={() => handleNavigation('/dashboard')}
                            >
                              <div className="mb-2 mt-4 text-lg font-medium">
                                Dashboard
                              </div>
                              <p className="text-sm leading-tight text-muted-foreground">
                                Toegang tot je persoonlijke leeromgeving en voortgang.
                              </p>
                            </button>
                          </NavigationMenuLink>
                        </div>
                        <div className="grid gap-2">
                          <NavigationMenuLink asChild>
                            <button
                              className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground text-left w-full"
                              onClick={() => handleNavigation('/calendar')}
                            >
                              <Calendar className="h-4 w-4 mb-1" />
                              <div className="text-sm font-medium leading-none">Kalender</div>
                              <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                Bekijk geplande lessen en activiteiten.
                              </p>
                            </button>
                          </NavigationMenuLink>
                          <NavigationMenuLink asChild>
                            <button
                              className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground text-left w-full"
                              onClick={() => handleNavigation('/forum')}
                            >
                              <MessageSquare className="h-4 w-4 mb-1" />
                              <div className="text-sm font-medium leading-none">Forum</div>
                              <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                Deel ervaringen met andere leerlingen.
                              </p>
                            </button>
                          </NavigationMenuLink>
                        </div>
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                )}

                {/* Admin/Teacher Menu - alleen voor admin en leerkrachten */}
                {user && profile && ['admin', 'leerkracht'].includes(profile.role) && (
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Beheer
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="grid gap-3 p-6 w-[350px] bg-popover">
                        <NavigationMenuLink asChild>
                          <button
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground text-left w-full"
                            onClick={() => handleNavigation('/forum-moderation')}
                          >
                            <MessageSquare className="h-4 w-4 mb-1" />
                            <div className="text-sm font-medium leading-none">Forum Moderatie</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Beheer forum posts en berichten.
                            </p>
                          </button>
                        </NavigationMenuLink>
                        <NavigationMenuLink asChild>
                          <button
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground text-left w-full"
                            onClick={() => handleNavigation('/security')}
                          >
                            <Shield className="h-4 w-4 mb-1" />
                            <div className="text-sm font-medium leading-none">Beveiliging</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Beveiligingsinstellingen en monitoring.
                            </p>
                          </button>
                        </NavigationMenuLink>
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                )}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            <SearchCommand />
            
            {user ? (
              <>
                <NotificationBell />
                {/* UserDropdown is now always visible, not hidden on smaller screens */}
                <UserDropdown />
              </>
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-9 px-3"
                  onClick={() => navigate('/auth')}
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Inloggen
                </Button>
                <Button 
                  size="sm"
                  className="h-9 px-4"
                  onClick={() => navigate('/auth')}
                >
                  Registreren
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
