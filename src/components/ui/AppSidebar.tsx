import { Home, Calendar, MessageSquare, Eye, BookOpen, User, Shield } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProviderQuery';
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

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const isActive = (path: string) => location.pathname === path;

  const mainItems = [
    { title: 'Home', url: '/', icon: Home },
    { title: 'Kalender', url: '/calendar', icon: Calendar },
    { title: 'Visie', url: '/visie', icon: Eye },
  ];

  const userItems = user ? [
    { title: 'Dashboard', url: '/dashboard', icon: User },
    { title: 'Forum', url: '/forum', icon: MessageSquare },
  ] : [];

  const adminItems = user && profile && ['admin', 'leerkracht'].includes(profile.role) ? [
    { title: 'Forum Moderatie', url: '/forum-moderation', icon: MessageSquare },
    { title: 'Beveiliging', url: '/security', icon: Shield },
  ] : [];

  return (
    <Sidebar collapsible="icon">
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
          <SidebarGroupLabel>Navigatie</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => handleNavigation(item.url)}
                    isActive={isActive(item.url)}
                    tooltip={state === 'collapsed' ? item.title : undefined}
                  >
                    <item.icon className="h-4 w-4" />
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
            <SidebarGroupLabel>Leerplatform</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {userItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      onClick={() => handleNavigation(item.url)}
                      isActive={isActive(item.url)}
                      tooltip={state === 'collapsed' ? item.title : undefined}
                    >
                      <item.icon className="h-4 w-4" />
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
            <SidebarGroupLabel>Beheer</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      onClick={() => handleNavigation(item.url)}
                      isActive={isActive(item.url)}
                      tooltip={state === 'collapsed' ? item.title : undefined}
                    >
                      <item.icon className="h-4 w-4" />
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
              <SidebarMenuButton onClick={() => handleNavigation('/auth')}>
                <User className="h-4 w-4" />
                <span>Inloggen</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
