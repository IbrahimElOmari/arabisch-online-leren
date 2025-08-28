
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  BookOpen, 
  MessageCircle, 
  TrendingUp, 
  UserPlus,
  Settings,
  Shield
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import ClassManagementModal from '@/components/admin/ClassManagementModal';
import StudentEnrollmentModal from '@/components/admin/StudentEnrollmentModal';
import PendingUsersManagement from '@/components/admin/PendingUsersManagement';

const AdminDashboard = () => {
  const { profile } = useAuth();
  const [showClassModal, setShowClassModal] = useState(false);
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);

  // Quick stats (mock data for now)
  const stats = [
    { title: 'Totaal Leerlingen', value: '147', icon: Users, change: '+12%' },
    { title: 'Actieve Klassen', value: '8', icon: BookOpen, change: '+2' },
    { title: 'Forum Posts', value: '1.2k', icon: MessageCircle, change: '+15%' },
    { title: 'Voltooiingspercentage', value: '89%', icon: TrendingUp, change: '+3%' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Welkom terug, {profile?.full_name || 'Admin'}
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Administrator
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.change} van vorige maand
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Klas Beheer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Beheer klassen, niveaus en leerlingen
            </p>
            <div className="flex gap-2">
              <Button onClick={() => setShowClassModal(true)}>
                Klassen Beheren
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowEnrollmentModal(true)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Leerlingen Inschrijven
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gebruikers Beheer</CardTitle>
          </CardHeader>
          <CardContent>
            <PendingUsersManagement />
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <ClassManagementModal 
        isOpen={showClassModal}
        onClose={() => setShowClassModal(false)}
      />
      <StudentEnrollmentModal 
        isOpen={showEnrollmentModal}
        onClose={() => setShowEnrollmentModal(false)}
      />
    </div>
  );
};

export default AdminDashboard;
