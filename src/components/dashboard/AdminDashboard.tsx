import React, { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  BookOpen, 
  MessageSquare, 
  Settings,
  UserPlus,
  GraduationCap,
  Shield,
  TrendingUp
} from 'lucide-react';
import { ClassManagementModal } from '@/components/admin/ClassManagementModal';
import { StudentEnrollmentModal } from '@/components/admin/StudentEnrollmentModal';

const AdminDashboard = () => {
  const { profile } = useAuth();
  const [showClassModal, setShowClassModal] = useState(false);
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);

  if (!profile || profile.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">Toegang geweigerd</h2>
          <p className="text-muted-foreground">Je hebt geen toegang tot het admin dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welkom terug, {profile.full_name}
          </p>
        </div>
        <Badge variant="secondary" className="px-3 py-1">
          Administrator
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totaal Gebruikers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">
              +20% vanaf vorige maand
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actieve Klassen</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              3 nieuwe deze week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Forum Posts</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">
              +12 vandaag
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Groeipercentage</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12.5%</div>
            <p className="text-xs text-muted-foreground">
              Deze maand
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overzicht</TabsTrigger>
          <TabsTrigger value="users">Gebruikers</TabsTrigger>
          <TabsTrigger value="classes">Klassen</TabsTrigger>
          <TabsTrigger value="content">Inhoud</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Snelle Acties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  onClick={() => setShowClassModal(true)}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  Nieuwe Klas Aanmaken
                </Button>
                <Button 
                  onClick={() => setShowEnrollmentModal(true)}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Studenten Inschrijven
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  Systeem Instellingen
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recente Activiteit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>• Nieuwe gebruiker geregistreerd: Ahmed M.</p>
                  <p>• Klas "Arabisch Basis" bijgewerkt</p>
                  <p>• Forum post gemodereerd</p>
                  <p>• Systeem backup voltooid</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Gebruikersbeheer</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Gebruikersbeheer functionaliteit komt binnenkort...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes">
          <Card>
            <CardHeader>
              <CardTitle>Klasbeheer</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Klasbeheer functionaliteit komt binnenkort...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>Content Beheer</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Content beheer functionaliteit komt binnenkort...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
