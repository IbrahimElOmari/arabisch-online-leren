/**
 * NiveauQuestionsPage - Manage questions for a specific level
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import TaskQuestionManagementNew from '@/components/management/TaskQuestionManagementNew';

export default function NiveauQuestionsPage() {
  const { levelId } = useParams<{ levelId: string }>();
  const navigate = useNavigate();

  // Fetch level details with class info
  const { data: niveau, isLoading } = useQuery({
    queryKey: ['niveau-detail', levelId],
    queryFn: async () => {
      if (!levelId) return null;
      
      const { data, error } = await supabase
        .from('niveaus')
        .select(`
          id,
          naam,
          niveau_nummer,
          class_id,
          klassen:class_id (
            id,
            name
          )
        `)
        .eq('id', levelId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!levelId,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!niveau) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Niveau niet gevonden</p>
            <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Terug
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const klassNaam = (niveau.klassen as any)?.name || 'Onbekende klas';

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{niveau.naam}</h1>
          <p className="text-muted-foreground">
            Klas: {klassNaam} • Niveau {niveau.niveau_nummer}
          </p>
        </div>
      </div>

      {/* Task/Question Management */}
      <Card>
        <CardHeader>
          <CardTitle>Taken & Vragen Beheren</CardTitle>
          <CardDescription>
            Beheer alle taken en vragen voor dit niveau
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TaskQuestionManagementNew 
            classId={niveau.class_id} 
            preselectedLevelId={levelId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
