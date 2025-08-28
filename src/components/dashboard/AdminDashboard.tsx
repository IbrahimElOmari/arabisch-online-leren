import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, Settings, BarChart3 } from 'lucide-react';
import { ClassManagementModal } from '@/components/admin/ClassManagementModal';
import AdminSeeder from '@/components/admin/AdminSeeder';
import UserActivationPanel from '@/components/admin/UserActivationPanel';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UserCounts {
  total: number;
  admin: number;
  leerkracht: number;
  leerling: number;
}

const AdminDashboard = () => {
  const [openClassModal, setOpenClassModal] = useState(false);
  const { signOut } = useAuth();

  const { data: userCounts, isLoading, isError } = useQuery<UserCounts>(
    ['userCounts'],
    async () => {
      const { data, error } = await supabase.functions.invoke('get-user-counts');
      if (error) {
        console.error('Failed to fetch user counts:', error);
        throw new Error('Failed to fetch user counts');
      }
      return data;
    }
  );

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button variant="destructive" onClick={() => signOut()}>
          Uitloggen
        </Button>
      </div>

      <Tabs defaultvalue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Gebruikers
          </TabsTrigger>
          <TabsTrigger value="classes">
            <UserPlus className="h-4 w-4 mr-2" />
            Klassen
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Instellingen
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gebruikersoverzicht
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p>Loading user counts...</p>
              ) : isError ? (
                <p className="text-red-500">Failed to load user counts.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Totaal</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{userCounts?.total}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Admins</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{userCounts?.admin}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Leerkrachten</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{userCounts?.leerkracht}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Leerlingen</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{userCounts?.leerling}</div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>

          <UserActivationPanel />
        </TabsContent>
        <TabsContent value="classes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Klassenbeheer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setOpenClassModal(true)}>
                Beheer Klassen
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Database Initialisatie
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AdminSeeder />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Analytics (placeholder)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>Analytics content will go here.</p>
              </CardContent>
            </Card>
          </TabsContent>
      </Tabs>

      <ClassManagementModal open={openClassModal} setOpen={setOpenClassModal} />
    </div>
  );
};

export default AdminDashboard;
