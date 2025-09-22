import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { FEATURE_FLAGS } from '@/config/featureFlags';
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
  const { profile, authReady, loading } = useAuth();
  const location = useLocation();

  // Auth loading
  if (loading || !authReady) {
    return <div className="flex items-center justify-center min-h-screen">Laden...</div>;
  }

  // Check permissions
  if (!profile || !['admin', 'leerkracht'].includes(profile.role)) {
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
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Beheer gebruikers, content en systeeminstellingen
          </p>
        </div>

        <Tabs value={currentTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 lg:grid-cols-8 w-full">
            {adminTabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-2 text-sm"
                onClick={() => window.history.pushState(null, '', `/admin/${tab.id}`)}
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="min-h-[600px]">
            <Outlet />
          </div>
        </Tabs>
      </div>
    </div>
  );
}