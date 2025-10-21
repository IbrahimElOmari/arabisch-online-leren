import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { FEATURE_FLAGS } from '@/config/featureFlags';
import { useUserRole } from '@/hooks/useUserRole';
import {
  Users,
  BookOpen,
  GraduationCap,
  MessageSquare,
  ClipboardList,
  FileText,
  Settings,
  Shield
} from 'lucide-react';

const adminTabs = [
  { id: 'users', label: 'Gebruikers', icon: Users },
  { id: 'classes', label: 'Klassen', icon: BookOpen },
  { id: 'lessons', label: 'Lessen', icon: GraduationCap },
  { id: 'tasks', label: 'Taken', icon: ClipboardList },
  { id: 'forum', label: 'Forum', icon: MessageSquare },
  { id: 'audit', label: 'Audit Log', icon: FileText },
  { id: 'operations', label: 'Bewerkingen', icon: Settings },
  { id: 'security', label: 'Beveiliging', icon: Shield },
];

export default function AdminLayout() {
  const { authReady, loading } = useAuth();
  const { isAdmin, isTeacher, isLoading: roleLoading } = useUserRole();
  const location = useLocation();

  // Auth loading
  if (loading || !authReady || roleLoading) {
    return <div className="flex items-center justify-center min-h-screen">Laden...</div>;
  }

  // Check permissions using RBAC
  if (!isAdmin && !isTeacher) {
    return <Navigate to="/dashboard" replace />;
  }

  // Check feature flag
  if (!FEATURE_FLAGS.admin) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-8 text-center">
            <h2 className="text-xl font-semibold mb-4">Admin functionaliteit uitgeschakeld</h2>
            <p className="text-muted-foreground">
              De admin functionaliteit is momenteel uitgeschakeld. Neem contact op met een systeembeheerder.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get current tab from URL or default to users
  const currentPath = location.pathname.split('/').pop();
  const currentTab = adminTabs.find(tab => tab.id === currentPath)?.id || 'users';

  return (
    <div className="min-h-screen bg-background">
      <div className="@container container mx-auto p-4 sm:p-6">
        <div className="mb-6 @md:mb-8">
          <h1 className="text-2xl @md:text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-sm @md:text-base text-muted-foreground mt-1">
            Beheer gebruikers, content en systeeminstellingen
          </p>
        </div>

        <Tabs value={currentTab} className="space-y-4 @md:space-y-6">
          <div className="overflow-x-auto">
            <TabsList className="grid grid-cols-4 @lg:grid-cols-8 w-full min-w-max">
              {adminTabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex items-center gap-1 @md:gap-2 text-xs @md:text-sm whitespace-nowrap px-2 @md:px-4"
                  onClick={() => window.history.pushState(null, '', `/admin/${tab.id}`)}
                >
                  <tab.icon className="h-3 w-3 @md:h-4 @md:w-4" />
                  <span className="hidden @sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="min-h-[400px] @md:min-h-[600px]">
            <Outlet />
          </div>
        </Tabs>
      </div>
    </div>
  );
}