
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, BookOpen, Calendar, MessageSquare, Shield } from 'lucide-react';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';
import { UserProfile } from '@/hooks/useUserProfileQuery';

interface NavigationMenuItemsProps {
  user: any;
  profile: UserProfile | null;
}

export const NavigationMenuItems = React.memo(({ user, profile }: NavigationMenuItemsProps) => {
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div className="hidden lg:flex items-center">
      <NavigationMenu>
        <NavigationMenuList className="flex items-center space-x-2">
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
  );
});

NavigationMenuItems.displayName = 'NavigationMenuItems';
