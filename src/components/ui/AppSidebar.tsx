import { Home, Calendar, MessageSquare, Eye, BookOpen, User, Shield, Folder, HardDrive } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { useTranslation } from '@/contexts/TranslationContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { UserDropdown } from './UserDropdown';

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  // Don't render sidebar on mobile at all
  if (isMobile) {
    return null;
  }

  const { state, setOpen } = useSidebar();

  const handleNavigation = (path: string) => {
    navigate(path);
    // Auto-collapse after navigation for better UX
    setOpen?.(false);
  };

  const isActive = (path: string) => location.pathname === path;

  const mainItems = [
    { title: t('nav.home', 'Home'), url: '/', icon: Home },
    { title: t('nav.calendar', 'Calendar'), url: '/calendar', icon: Calendar },
    { title: t('nav.vision', 'Vision'), url: '/visie', icon: Eye },
  ];

  const userItems = user ? [
    { title: t('nav.dashboard', 'Dashboard'), url: '/dashboard', icon: User },
    { title: t('nav.forum', 'Forum'), url: '/forum', icon: MessageSquare },
    { title: t('nav.profile', 'Profile'), url: '/profile', icon: User },
  ] : [];


  const adminItems = user && profile && ['admin', 'leerkracht'].includes(profile.role) ? [
    { title: t('nav.forum_moderation', 'Forum Moderation'), url: '/forum-moderation', icon: MessageSquare },
    { title: t('nav.security', 'Security'), url: '/security', icon: Shield },
    { title: t('nav.lesson_organization', 'Lesson Organization'), url: '/lesson-organization', icon: Folder },
    { title: t('nav.offline_content', 'Offline Content'), url: '/offline-content', icon: HardDrive },
  ] : [];

  return (
    <Sidebar 
      collapsible="icon"
      className="flex app-sidebar"
    >
      <SidebarContent>
        {/* Logo */}
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="flex items-center gap-2 px-2 py-4">
              <BookOpen className="h-6 w-6 text-primary" />
              {state !== 'collapsed' && (
                <span className="font-bold text-lg">Leer Arabisch</span>
              )}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>{t('nav.navigation', 'Navigation')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => handleNavigation(item.url)}
                    isActive={isActive(item.url)}
                    tooltip={state === 'collapsed' ? item.title : undefined}
                  >
                    <item.icon className="h-4 w-4 me-2" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User Navigation */}
        {userItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>{t('nav.platform', 'Platform')}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {userItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      onClick={() => handleNavigation(item.url)}
                      isActive={isActive(item.url)}
                      tooltip={state === 'collapsed' ? item.title : undefined}
                    >
                      <item.icon className="h-4 w-4 me-2" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}


        {/* Admin Navigation */}
        {adminItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>{t('nav.management', 'Management')}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      onClick={() => handleNavigation(item.url)}
                      isActive={isActive(item.url)}
                      tooltip={state === 'collapsed' ? item.title : undefined}
                    >
                      <item.icon className="h-4 w-4 me-2" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* User Profile in Footer */}
      <SidebarFooter>
        {user ? (
          <div className="p-2">
            <UserDropdown />
          </div>
        ) : (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => handleNavigation('/auth')}
              >
                <User className="h-4 w-4 me-2" />
                <span>{t('nav.login', 'Login')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
