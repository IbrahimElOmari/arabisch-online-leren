import React, { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Menu, 
  Home, 
  BookOpen, 
  Trophy, 
  MessageSquare, 
  Calendar,
  User,
  Settings,
  LogOut,
  Bell
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { useAgeTheme } from '@/contexts/AgeThemeContext';
import { cn } from '@/lib/utils';
import { useUserRole } from '@/hooks/useUserRole';

interface NavigationItem {
  icon: React.ComponentType<any>;
  label: string;
  href: string;
  badge?: number;
  roles: string[];
}

export const MobileOptimizedNavigation: React.FC = () => {
  const { profile, signOut } = useAuth();
  const { role } = useUserRole();
  const { themeAge } = useAgeTheme();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navigationItems: NavigationItem[] = [
    {
      icon: Home,
      label: 'Dashboard',
      href: '/dashboard',
      roles: ['leerling', 'leerkracht', 'admin']
    },
    {
      icon: BookOpen,
      label: 'Lessen',
      href: '/leerstof',
      roles: ['leerling', 'leerkracht', 'admin']
    },
    {
      icon: Trophy,
      label: 'Taken',
      href: '/taken',
      badge: 3,
      roles: ['leerling', 'leerkracht', 'admin']
    },
    {
      icon: MessageSquare,
      label: 'Forum',
      href: '/forum',
      badge: 5,
      roles: ['leerling', 'leerkracht', 'admin']
    },
    {
      icon: Calendar,
      label: 'Kalender',
      href: '/calendar',
      roles: ['leerling', 'leerkracht', 'admin']
    },
    {
      icon: User,
      label: 'Profiel',
      href: '/profile',
      roles: ['leerling', 'leerkracht', 'admin']
    }
  ];

  const filteredItems = navigationItems.filter(item => 
    item.roles.includes(role || 'leerling')
  );

  const getThemeClasses = () => {
    switch (themeAge) {
      case 'playful':
        return 'bg-gradient-to-br from-primary/5 to-secondary/5';
      case 'professional':
        return 'bg-background border-r';
      default:
        return 'bg-muted/30';
    }
  };

  const getItemClasses = (href: string) => {
    const isActive = location.pathname === href;
    const baseClasses = "flex items-center justify-between p-4 rounded-lg transition-all";
    
    switch (themeAge) {
      case 'playful':
        return cn(
          baseClasses,
          isActive 
            ? "bg-primary text-primary-foreground shadow-lg scale-105" 
            : "hover:bg-primary/10 hover:scale-102"
        );
      case 'professional':
        return cn(
          baseClasses,
          isActive 
            ? "bg-primary/10 text-primary border-l-4 border-primary" 
            : "hover:bg-muted/50"
        );
      default:
        return cn(
          baseClasses,
          isActive 
            ? "bg-primary text-primary-foreground" 
            : "hover:bg-muted/50"
        );
    }
  };

  const handleNavigation = () => {
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="md:hidden fixed top-4 left-4 z-50 bg-background/80 backdrop-blur-sm border"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      
      <SheetContent 
        side="left" 
        className={cn("w-80 p-0 overflow-hidden", getThemeClasses())}
      >
        {/* Header */}
        <div className="p-6 border-b bg-background/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Arabic Learning</h2>
              <p className="text-sm text-muted-foreground">
                Welkom, {profile?.full_name || 'Gebruiker'}!
              </p>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Meldingen</span>
            </div>
            <Badge variant="secondary" className="h-6 w-6 p-0 flex items-center justify-center">
              3
            </Badge>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 p-4 space-y-2 overflow-y-auto">
          {filteredItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={handleNavigation}
                className="block"
              >
                <div className={getItemClasses(item.href)}>
                  <div className="flex items-center gap-3">
                    <IconComponent className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {item.badge && item.badge > 0 && (
                    <Badge 
                      variant="secondary" 
                      className="h-6 w-6 p-0 flex items-center justify-center text-xs"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        <Separator />

        {/* Footer Actions */}
        <div className="p-4 space-y-2 bg-background/50">
          <Link to="/settings" onClick={handleNavigation}>
            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <Settings className="h-5 w-5" />
              <span className="font-medium">Instellingen</span>
            </div>
          </Link>
          
          <button
            onClick={() => {
              signOut();
              handleNavigation();
            }}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Uitloggen</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};