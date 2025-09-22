import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { moderationService } from '@/services/moderationService';
import { Search, UserCog, Shield, GraduationCap, User } from 'lucide-react';
import { APP_ROLES, AppRole } from '@/types/roles';

interface UserProfile {
  id: string;
  full_name: string;
  email?: string;
  role: AppRole;
  created_at: string;
  parent_email?: string;
  age?: number;
}

const roleIcons = {
  admin: Shield,
  leerkracht: GraduationCap,
  leerling: User,
};

const roleBadgeVariants = {
  admin: 'destructive',
  leerkracht: 'default',
  leerling: 'secondary',
} as const;

export default function UsersAdmin() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [changeRoleUserId, setChangeRoleUserId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<AppRole>('leerling');
  const [reason, setReason] = useState('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users', searchTerm, selectedRole],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.ilike('full_name', `%${searchTerm}%`);
      }

      if (selectedRole !== 'all') {
        query = query.eq('role', selectedRole as AppRole);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as UserProfile[];
    },
  });

  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, role, reason }: { userId: string; role: AppRole; reason?: string }) => {
      await moderationService.changeUserRole(userId, role, reason);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setChangeRoleUserId(null);
      setReason('');
      toast({
        title: 'Rol gewijzigd',
        description: 'De gebruikersrol is succesvol gewijzigd.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Fout',
        description: error.message || 'Er is een fout opgetreden bij het wijzigen van de rol.',
        variant: 'destructive',
      });
    },
  });

  const handleChangeRole = () => {
    if (!changeRoleUserId) return;
    
    changeRoleMutation.mutate({
      userId: changeRoleUserId,
      role: newRole,
      reason: reason || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Gebruikers laden...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Gebruikersbeheer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Zoek gebruikers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter op rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle rollen</SelectItem>
                <SelectItem value="admin">Beheerders</SelectItem>
                <SelectItem value="leerkracht">Leerkrachten</SelectItem>
                <SelectItem value="leerling">Leerlingen</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {users?.map((user) => {
              const RoleIcon = roleIcons[user.role];
              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <RoleIcon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{user.full_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {user.email || user.parent_email}
                        </div>
                      </div>
                    </div>
                    <Badge variant={roleBadgeVariants[user.role]}>
                      {user.role}
                    </Badge>
                  </div>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setChangeRoleUserId(user.id)}
                      >
                        Rol wijzigen
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Rol wijzigen voor {user.full_name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="role">Nieuwe rol</Label>
                            <Select value={newRole} onValueChange={(value: AppRole) => setNewRole(value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="leerling">Leerling</SelectItem>
                                <SelectItem value="leerkracht">Leerkracht</SelectItem>
                                <SelectItem value="admin">Beheerder</SelectItem>
                              </SelectContent>
                            </Select>
                        </div>
                        <div>
                          <Label htmlFor="reason">Reden (optioneel)</Label>
                          <Textarea
                            id="reason"
                            placeholder="Waarom wordt deze rol gewijzigd?"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            onClick={handleChangeRole}
                            disabled={changeRoleMutation.isPending}
                          >
                            {changeRoleMutation.isPending ? 'Wijzigen...' : 'Rol wijzigen'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              );
            })}
          </div>

          {users?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Geen gebruikers gevonden.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}