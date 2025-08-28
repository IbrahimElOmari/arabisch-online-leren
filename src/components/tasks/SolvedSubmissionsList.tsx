import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface SolvedSubmission {
  id: string;
  task_id: string;
  submission_content?: string | null;
  submission_file_path?: string | null;
  grade?: number | null;
  feedback?: string | null;
  submitted_at: string;
  tasks?: {
    id: string;
    title: string;
  } | null;
}

export const SolvedSubmissionsList: React.FC = () => {
  const { profile } = useAuth();
  const [items, setItems] = useState<SolvedSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('task_submissions')
          .select(`
            id, task_id, submission_content, submission_file_path, grade, feedback, submitted_at,
            tasks:task_id ( id, title )
          `)
          .eq('student_id', profile?.id)
          .order('submitted_at', { ascending: false });

        if (error) throw error;

        const filtered = (data || []).filter(
          (s) => s.grade !== null || (s.feedback !== null && s.feedback !== '')
        );

        setItems(filtered as any);
      } catch (e) {
        console.error('Failed to load solved submissions:', e);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    if (profile?.id) load();
  }, [profile?.id]);

  if (loading) {
    return <div className="py-6 text-sm text-muted-foreground">Laden...</div>;
  }

  if (items.length === 0) {
    return <div className="py-6 text-sm text-muted-foreground">Nog geen verbeterde inzendingen.</div>;
  }

  return (
    <div className="space-y-3">
      {items.map((s) => (
        <Card key={s.id} className="border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {s.tasks?.title || 'Taak'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              {s.grade !== null && s.grade !== undefined ? (
                <Badge variant="secondary">Cijfer: {s.grade}</Badge>
              ) : (
                <Badge variant="outline">Nog niet becijferd</Badge>
              )}
              <span className="text-xs text-muted-foreground">
                Ingediend op {new Date(s.submitted_at).toLocaleDateString('nl-NL')}
              </span>
            </div>

            {s.feedback ? (
              <div className="text-sm">
                <span className="font-medium">Feedback:</span> {s.feedback}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Geen feedback geplaatst.</div>
            )}

            {s.submission_content && (
              <div className="text-sm">
                <span className="font-medium">Jouw antwoord:</span> {s.submission_content}
              </div>
            )}

            {s.submission_file_path && (
              <div>
                <Button variant="outline" size="sm" asChild>
                  <a href={s.submission_file_path} target="_blank" rel="noreferrer">
                    Bekijk ingestuurd bestand
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
