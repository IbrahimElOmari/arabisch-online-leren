import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, BookOpen, MessageSquare, Calendar, User, Menu, X, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { useRTLAnimations } from '@/hooks/useRTLAnimations';
import { useMobileRTL } from '@/hooks/useMobileRTL';
import { useTranslation } from '@/contexts/TranslationContext';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Enhanced Bottom Navigation with Touch Optimizations
export const EnhancedMobileBottomNav = () => {
  const location = useLocation();
  const { profile } = useAuth();
  const { isRTL } = useRTLLayout();
  const { getBounceInClasses, getPulseGlowClasses } = useRTLAnimations();
  const { isMobile, getTouchClasses, getMobileAnimationDelay } = useMobileRTL();
  const { t } = useTranslation();

  if (!isMobile) return null;

  const navItems = [
    { 
      icon: Home, 
      label: t('nav.home', 'Home'), 
      path: '/', 
      color: 'text-primary',
      activeColor: 'bg-primary/10 text-primary'
    },
    { 
      icon: BookOpen, 
      label: t('nav.taken', 'Taken'), 
      path: '/taken', 
      color: 'text-muted-foreground',
      activeColor: 'bg-accent text-accent-foreground'
    },
    { 
      icon: MessageSquare, 
      label: t('nav.forum', 'Forum'), 
      path: '/forum', 
      color: 'text-muted-foreground',
      activeColor: 'bg-accent text-accent-foreground',
      badge: 3 // Example notification count
    },
    { 
      icon: Calendar, 
      label: t('nav.calendar', 'Calendar'), 
      path: '/calendar', 
      color: 'text-muted-foreground',
      activeColor: 'bg-accent text-accent-foreground'
    },
    { 
      icon: User, 
      label: t('nav.dashboard', 'Dashboard'), 
      path: '/dashboard', 
      color: 'text-muted-foreground',
      activeColor: 'bg-accent text-accent-foreground'
    }
  ];

  return (
    <nav 
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border",
        "safe-area-pb-4 mobile-bottom-nav", // Respect safe areas and mobile nav class
        getTouchClasses(),
        isRTL && "mobile-nav-rtl"
      )}
      
    >
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.path || 
                          (item.path === '/' && location.pathname === '/dashboard' && item.label === 'Dashboard');
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-xl min-w-[60px] min-h-[52px]",
                "transition-all duration-300 active:scale-95", // Touch feedback
                "hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50",
                isActive ? item.activeColor : "text-muted-foreground hover:text-foreground",
                isActive && getBounceInClasses()
              )}
              style={getMobileAnimationDelay(index)}
            >
              <div className="relative">
                <Icon className={cn(
                  "h-5 w-5 transition-transform duration-200",
                  isActive && "scale-110"
                )} />
                
                 {item.badge && (
                  <Badge 
                    variant="destructive" 
                    className={cn(
                      "absolute -top-2 h-4 w-4 p-0 text-xs flex items-center justify-center",
                      "animate-pulse mobile-badge",
                      isRTL ? "-left-2 right-auto" : "-right-2 left-auto"
                    )}
                  >
                    {item.badge}
                  </Badge>
                )}
              </div>
              
              <span className={cn(
                "text-xs font-medium mt-1 transition-colors duration-200",
                isActive && "font-semibold"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

// Enhanced Mobile Sidebar Menu
export const EnhancedMobileSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, profile } = useAuth();
  const { isRTL } = useRTLLayout();
  const { getSlideInAnimation, getSlideOutAnimation } = useRTLAnimations();
  const { getMobileModalClasses } = useMobileRTL();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const menuSections = [
    {
      title: t('nav.main', 'Main'),
      items: [
        { icon: Home, label: t('nav.home', 'Home'), path: '/' },
        { icon: BookOpen, label: t('nav.leerstof', 'Leerstof'), path: '/leerstof' },
        { icon: Calendar, label: t('nav.calendar', 'Calendar'), path: '/calendar' },
      ]
    },
    {
      title: t('nav.learning', 'Learning'),
      items: [
        { icon: MessageSquare, label: t('nav.forum', 'Forum'), path: '/forum' },
        { icon: BookOpen, label: t('nav.taken', 'Taken'), path: '/taken' },
      ]
    }
  ];

  if (profile?.role === 'admin') {
    menuSections.push({
      title: t('nav.admin', 'Admin'),
      items: [
        { icon: User, label: t('nav.admin', 'Admin'), path: '/admin' },
        { icon: MessageSquare, label: t('nav.security', 'Security'), path: '/security' },
      ]
    });
  }

  const handleNavigation = (path: string) => {
    setIsOpen(false);
    if (location.pathname !== path) {
      navigate(path);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className={cn(
            "md:hidden h-9 w-9 transition-transform duration-200 active:scale-95",
            "hover:bg-muted focus:ring-2 focus:ring-primary/50"
          )}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">{t('nav.menu', 'Menu')}</span>
        </Button>
      </SheetTrigger>
      
      <SheetContent 
        side={isRTL ? "right" : "left"}
        className="fixed z-50 w-[85vw] max-w-sm p-0 mobile-sheet"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-3">
              {profile && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={''} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {profile.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
              )}
              <div>
                <h2 className="font-semibold text-sm">
                  {profile?.full_name || user?.email || t('nav.guest', 'Guest')}
                </h2>
                {profile?.role && (
                  <p className="text-xs text-muted-foreground capitalize">
                    {profile.role}
                  </p>
                )}
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation Menu */}
          <div className="flex-1 overflow-y-auto p-4">
            <nav className="space-y-6">
              {menuSections.map((section, sectionIndex) => (
                <div key={section.title}>
                  <h3 className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {section.title}
                  </h3>
                  
                  <div className="space-y-1">
                    {section.items.map((item, itemIndex) => {
                      const isActive = location.pathname === item.path;
                      const Icon = item.icon;
                      
                      return (
                        <button
                          key={item.path}
                          onClick={() => handleNavigation(item.path)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                            "hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/50",
                            "active:scale-98", // Touch feedback
                            isActive 
                              ? "bg-primary text-primary-foreground" 
                              : "text-foreground hover:text-foreground"
                          )}
                          style={{
                            animationDelay: `${(sectionIndex * 100) + (itemIndex * 50)}ms`
                          }}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="flex-1 text-left font-medium">
                            {item.label}
                          </span>
                          <ChevronRight 
                            className={cn(
                              "h-4 w-4 transition-transform duration-200",
                              isRTL && "rotate-180"
                            )} 
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>

          {/* Footer */}
          <div className="p-4 border-t bg-muted/30">
            <p className="text-xs text-muted-foreground text-center">
              {t('app.version', 'Arabic Learning Platform v1.0')}
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};