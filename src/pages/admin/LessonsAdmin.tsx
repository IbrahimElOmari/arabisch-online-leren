import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Video, Calendar } from 'lucide-react';

export default function LessonsAdmin() {
  const { data: lessons, isLoading } = useQuery({
    queryKey: ['admin-lessons-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lessen')
        .select(`
          *,
          klassen:class_id (name)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          Lessen Beheer
        </CardTitle>
        <CardDescription>Overzicht van alle lessen in het systeem</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titel</TableHead>
              <TableHead>Klas</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Aangemaakt</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lessons?.map((lesson) => (
              <TableRow key={lesson.id}>
                <TableCell className="font-medium">{lesson.title}</TableCell>
                <TableCell>{(lesson.klassen as any)?.name || '-'}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {lesson.youtube_url ? (
                      <><Video className="h-4 w-4" /> Video</>
                    ) : lesson.live_lesson_datetime ? (
                      <><Calendar className="h-4 w-4" /> Live</>
                    ) : (
                      'Standaard'
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={lesson.status === 'published' ? 'default' : 'secondary'}>
                    {lesson.status || 'concept'}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(lesson.created_at).toLocaleDateString('nl-NL')}</TableCell>
              </TableRow>
            ))}
            {lessons?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Geen lessen gevonden
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
