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
  const { state } = useSidebar();
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  // Don't render sidebar on mobile at all
  if (isMobile) {
    return null;
  }

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const isActive = (path: string) => location.pathname === path;

  const mainItems = [
    { title: t('nav.home'), url: '/', icon: Home },
    { title: t('nav.calendar'), url: '/calendar', icon: Calendar },
    { title: t('nav.vision'), url: '/visie', icon: Eye },
  ];

  const userItems = user ? [
    { title: t('nav.dashboard'), url: '/dashboard', icon: User },
    { title: t('nav.forum'), url: '/forum', icon: MessageSquare },
    { title: 'Profiel', url: '/profile', icon: User },
  ] : [];


  const adminItems = user && profile && ['admin', 'leerkracht'].includes(profile.role) ? [
    { title: t('nav.forum_moderation'), url: '/forum-moderation', icon: MessageSquare },
    { title: t('nav.security'), url: '/security', icon: Shield },
    { title: 'Les Organisatie', url: '/lesson-organization', icon: Folder },
    { title: 'Offline Content', url: '/offline-content', icon: HardDrive },
  ] : [];

  return (
    <Sidebar 
      collapsible="icon"
      className="flex"
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
          <SidebarGroupLabel>{t('nav.navigation')}</SidebarGroupLabel>
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
            <SidebarGroupLabel>{t('nav.platform')}</SidebarGroupLabel>
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
            <SidebarGroupLabel>{t('nav.management')}</SidebarGroupLabel>
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
                <span>{t('nav.login')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
