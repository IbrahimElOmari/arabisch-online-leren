
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Users, UserCheck, UserX, Settings } from 'lucide-react';
import ClassManagementModal from '@/components/admin/ClassManagementModal';
import PendingUsersManagement from '@/components/admin/PendingUsersManagement';
import { useAuth } from '@/components/auth/AuthProviderQuery';

interface UserCounts {
  total: number;
  admin: number;
  leerkracht: number;
  leerling: number;
}

const AdminDashboard = () => {
  const { profile } = useAuth();
  const [showClassModal, setShowClassModal] = useState(false);

  const { data: userCounts, isLoading } = useQuery({
    queryKey: ['admin-user-counts'],
    queryFn: async (): Promise<UserCounts> => {
      console.log('Fetching user counts...');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('role');

      if (error) {
        console.error('Error fetching user counts:', error);
        throw error;
      }

      const counts = {
        total: data?.length || 0,
        admin: data?.filter(p => p.role === 'admin').length || 0,
        leerkracht: data?.filter(p => p.role === 'leerkracht').length || 0,
        leerling: data?.filter(p => p.role === 'leerling').length || 0,
      };

      console.log('User counts:', counts);
      return counts;
    },
    enabled: !!profile && profile.role === 'admin'
  });

  if (profile?.role !== 'admin') {
    return <div>Geen toegang - alleen voor beheerders</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button onClick={() => setShowClassModal(true)}>
          <Settings className="h-4 w-4 mr-2" />
          Klassen Beheren
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overzicht</TabsTrigger>
          <TabsTrigger value="users">Gebruikers</TabsTrigger>
          <TabsTrigger value="pending">Wachtende Gebruikers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Totaal Gebruikers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? '...' : userCounts?.total || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Beheerders</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? '...' : userCounts?.admin || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Leerkrachten</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? '...' : userCounts?.leerkracht || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Leerlingen</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? '...' : userCounts?.leerling || 0}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Gebruikers Beheer</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Gebruikers beheer functionaliteit komt binnenkort...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <PendingUsersManagement />
        </TabsContent>
      </Tabs>

      <ClassManagementModal 
        isOpen={showClassModal}
        onClose={() => setShowClassModal(false)}
      />
    </div>
  );
};

export default AdminDashboard;
