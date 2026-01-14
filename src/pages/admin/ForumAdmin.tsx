import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Flag, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ForumAdmin() {
  const { data: posts, isLoading } = useQuery({
    queryKey: ['admin-forum-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('forum_posts')
        .select(`
          *,
          profiles:author_id (full_name),
          klassen:class_id (name)
        `)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const { data: reportedCount } = useQuery({
    queryKey: ['admin-reported-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('forum_posts')
        .select('*', { count: 'exact', head: true })
        .eq('is_gerapporteerd', true)
        .eq('is_verwijderd', false);
      if (error) throw error;
      return count || 0;
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
    <div className="space-y-6">
      {reportedCount && reportedCount > 0 && (
        <Card className="border-destructive">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Flag className="h-5 w-5 text-destructive" />
                <span className="font-medium">{reportedCount} gerapporteerde berichten</span>
              </div>
              <Link to="/forum-moderation">
                <Button variant="destructive" size="sm">
                  <Eye className="mr-2 h-4 w-4" />
                  Bekijk Moderatie
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Forum Beheer
          </CardTitle>
          <CardDescription>Overzicht van recente forum berichten</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titel</TableHead>
                <TableHead>Auteur</TableHead>
                <TableHead>Klas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Datum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts?.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium max-w-xs truncate">{post.titel}</TableCell>
                  <TableCell>{(post.profiles as any)?.full_name || 'Onbekend'}</TableCell>
                  <TableCell>{(post.klassen as any)?.name || '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {post.is_gerapporteerd && (
                        <Badge variant="destructive">Gerapporteerd</Badge>
                      )}
                      {post.is_verwijderd && (
                        <Badge variant="secondary">Verwijderd</Badge>
                      )}
                      {!post.is_gerapporteerd && !post.is_verwijderd && (
                        <Badge variant="default">Actief</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{new Date(post.created_at).toLocaleDateString('nl-NL')}</TableCell>
                </TableRow>
              ))}
              {posts?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Geen forum berichten gevonden
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
