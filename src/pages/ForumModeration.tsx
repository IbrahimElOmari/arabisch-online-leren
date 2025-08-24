
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import ForumModerationQueue from '@/components/forum/ForumModerationQueue';

const ForumModeration = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  // Only admins and teachers can access this page
  if (!profile || (profile.role !== 'admin' && profile.role !== 'leerkracht')) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="text-center py-8">
            <h2 className="text-xl font-semibold mb-4">Geen toegang</h2>
            <p className="text-muted-foreground">
              Je hebt geen toegang tot deze pagina.
            </p>
            <Button onClick={() => navigate('/dashboard')} className="mt-4">
              Terug naar Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Terug naar Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6" />
              Forum Moderatie
            </h1>
            <p className="text-muted-foreground">
              Beheer gerapporteerde forum berichten
            </p>
          </div>
        </div>

        <ForumModerationQueue />
      </div>
    </div>
  );
};

export default ForumModeration;
