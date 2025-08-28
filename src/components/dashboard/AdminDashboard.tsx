import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, BookOpen, MessageSquare, Settings, Activity } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import PendingUsersManagement from '@/components/admin/PendingUsersManagement';
import { ClassManagementModal } from '@/components/admin/ClassManagementModal';
import TaskQuestionManagementNew from '@/components/management/TaskQuestionManagementNew';

const AdminDashboard = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  
  const stats = [
    { label: 'Totaal Gebruikers', value: '1,234', icon: Users },
    { label: 'Actieve Klassen', value: '56', icon: BookOpen },
    { label: 'Forum Posts', value: '892', icon: MessageSquare },
    { label: 'Systeemstatus', value: 'Online', icon: Activity, color: 'bg-green-500' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Badge variant="secondary">Administrator</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center p-6">
              <stat.icon className="h-8 w-8 text-muted-foreground mr-4" />
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          variant={activeTab === 'overview' ? 'default' : 'outline'}
          onClick={() => setActiveTab('overview')}
        >
          Overzicht
        </Button>
        <Button
          variant={activeTab === 'users' ? 'default' : 'outline'}
          onClick={() => setActiveTab('users')}
        >
          Gebruikers
        </Button>
        <Button
          variant={activeTab === 'classes' ? 'default' : 'outline'}
          onClick={() => setActiveTab('classes')}
        >
          Klassen
        </Button>
        <Button
          variant={activeTab === 'content' ? 'default' : 'outline'}
          onClick={() => setActiveTab('content')}
        >
          Inhoud
        </Button>
        <Button
          variant={activeTab === 'settings' ? 'default' : 'outline'}
          onClick={() => setActiveTab('settings')}
        >
          Instellingen
        </Button>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recente Activiteit</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Geen recente activiteit om weer te geven.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Systeemstatus</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Database</span>
                  <Badge variant="secondary" className="bg-green-500">Online</Badge>
                </div>
                <div className="flex justify-between">
                  <span>API</span>
                  <Badge variant="secondary" className="bg-green-500">Online</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'users' && <PendingUsersManagement />}
      {activeTab === 'classes' && <ClassManagementModal />}
      {activeTab === 'content' && <TaskQuestionManagementNew />}
      {activeTab === 'settings' && (
        <Card>
          <CardHeader>
            <CardTitle>Systeeminstellingen</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Systeeminstellingen worden hier weergegeven.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminDashboard;
