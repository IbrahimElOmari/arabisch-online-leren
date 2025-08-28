
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SecurityDashboard } from '@/components/security/SecurityDashboard';
import { GDPRCompliance } from '@/components/security/GDPRCompliance';
import { ContentModerationPanel } from '@/components/security/ContentModerationPanel';
import { Shield, FileText, MessageSquare, Users } from 'lucide-react';

const Security = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-lg">Laden...</div>
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to="/auth" replace />;
  }

  // Only admins and teachers can access security features
  if (!['admin', 'leerkracht'].includes(profile.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Beveiliging & Compliance
          </h1>
          <p className="text-muted-foreground">
            Beheer beveiliging, privacy en content moderatie
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <Tabs defaultValue="security" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security Dashboard
            </TabsTrigger>
            <TabsTrigger value="moderation" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Content Moderatie
            </TabsTrigger>
            <TabsTrigger value="gdpr" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              GDPR Compliance
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Gebruikersbeheer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="security" className="mt-6">
            <SecurityDashboard />
          </TabsContent>

          <TabsContent value="moderation" className="mt-6">
            <ContentModerationPanel />
          </TabsContent>

          <TabsContent value="gdpr" className="mt-6">
            <GDPRCompliance />
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <div className="text-center py-8 text-muted-foreground">
              Gebruikersbeheer functionaliteiten worden binnenkort toegevoegd
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Security;
