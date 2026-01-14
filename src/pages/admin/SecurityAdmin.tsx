import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, Ban, FileWarning } from 'lucide-react';

export default function SecurityAdmin() {
  const { data: rateLimits, isLoading: rateLimitsLoading } = useQuery({
    queryKey: ['admin-rate-limits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auth_rate_limits')
        .select('*')
        .order('last_attempt', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const { data: bans, isLoading: bansLoading } = useQuery({
    queryKey: ['admin-bans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ban_history')
        .select('*, profiles:user_id (full_name)')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const { data: moderationActions, isLoading: moderationLoading } = useQuery({
    queryKey: ['admin-moderation'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_moderation')
        .select('*, profiles:user_id (full_name), moderator:moderator_id (full_name)')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const isLoading = rateLimitsLoading || bansLoading || moderationLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actieve Bans</CardTitle>
            <Ban className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bans?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rate Limit Events</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rateLimits?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moderatie Acties</CardTitle>
            <FileWarning className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{moderationActions?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Active Bans */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5" />
            Actieve Bans
          </CardTitle>
          <CardDescription>Gebruikers die momenteel gebanned zijn</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Gebruiker</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Reden</TableHead>
                <TableHead>Tot</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bans?.map((ban) => (
                <TableRow key={ban.id}>
                  <TableCell>{(ban.profiles as any)?.full_name || 'Onbekend'}</TableCell>
                  <TableCell>
                    <Badge variant={ban.ban_type === 'permanent' ? 'destructive' : 'secondary'}>
                      {ban.ban_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{ban.reason}</TableCell>
                  <TableCell>
                    {ban.banned_until 
                      ? new Date(ban.banned_until).toLocaleDateString('nl-NL')
                      : 'Permanent'}
                  </TableCell>
                </TableRow>
              ))}
              {bans?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Geen actieve bans
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Rate Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Rate Limit Events
          </CardTitle>
          <CardDescription>Recente rate limit triggers</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Identifier</TableHead>
                <TableHead>Actie</TableHead>
                <TableHead>Pogingen</TableHead>
                <TableHead>Laatste Poging</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rateLimits?.map((limit) => (
                <TableRow key={limit.id}>
                  <TableCell className="font-mono text-sm">{limit.identifier}</TableCell>
                  <TableCell>{limit.action_type}</TableCell>
                  <TableCell>{limit.attempt_count}</TableCell>
                  <TableCell>
                    {limit.last_attempt 
                      ? new Date(limit.last_attempt).toLocaleString('nl-NL')
                      : '-'}
                  </TableCell>
                </TableRow>
              ))}
              {rateLimits?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Geen rate limit events
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
