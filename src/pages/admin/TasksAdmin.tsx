import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ClipboardList } from 'lucide-react';

export default function TasksAdmin() {
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['admin-tasks-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vragen')
        .select(`
          *,
          niveaus:niveau_id (naam)
        `)
        .order('created_at', { ascending: false })
        .limit(100);
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
          <ClipboardList className="h-5 w-5" />
          Taken & Vragen Beheer
        </CardTitle>
        <CardDescription>Overzicht van alle vragen en taken in het systeem</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vraag</TableHead>
              <TableHead>Niveau</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Aangemaakt</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks?.map((task) => (
              <TableRow key={task.id}>
                <TableCell className="font-medium max-w-xs truncate">
                  {task.vraag_tekst}
                </TableCell>
                <TableCell>{(task.niveaus as any)?.naam || '-'}</TableCell>
                <TableCell>
                  <Badge variant="outline">{task.vraag_type || 'open'}</Badge>
                </TableCell>
                <TableCell>{new Date(task.created_at).toLocaleDateString('nl-NL')}</TableCell>
              </TableRow>
            ))}
            {tasks?.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Geen taken gevonden
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
