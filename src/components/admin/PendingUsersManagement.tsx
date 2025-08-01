import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserPlus, Clock, CheckCircle, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

interface PendingUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
  parent_email?: string;
}

interface Class {
  id: string;
  name: string;
  description?: string;
}

export const PendingUsersManagement = () => {
  const { profile } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClasses, setSelectedClasses] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchPendingUsers();
      fetchClasses();
    }
  }, [profile?.role]);

  const fetchPendingUsers = async () => {
    try {
      // Fetch users who are not enrolled in any class or have pending enrollments
      const { data: allUsers, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'leerling');

      if (usersError) throw usersError;

      // Check which users have no enrollments or only pending enrollments
      const usersWithEnrollments = await Promise.all(
        (allUsers || []).map(async (user) => {
          const { data: enrollments, error: enrollError } = await supabase
            .from('inschrijvingen')
            .select('payment_status')
            .eq('student_id', user.id);

          if (enrollError) throw enrollError;

          const hasPaidEnrollment = enrollments?.some(e => e.payment_status === 'paid');
          
          return {
            ...user,
            isPending: !hasPaidEnrollment
          };
        })
      );

      const pending = usersWithEnrollments.filter(user => user.isPending);
      setPendingUsers(pending);
    } catch (error) {
      console.error('Error fetching pending users:', error);
      toast.error('Fout bij het ophalen van wachtende gebruikers');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('klassen')
        .select('id, name, description')
        .order('name');

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const assignUserToClass = async (userId: string) => {
    const classId = selectedClasses[userId];
    if (!classId) {
      toast.error('Selecteer eerst een klas');
      return;
    }

    try {
      // Create or update enrollment
      const { error: enrollError } = await supabase
        .from('inschrijvingen')
        .upsert({
          student_id: userId,
          class_id: classId,
          payment_status: 'paid'
        });

      if (enrollError) throw enrollError;

      // Create notification for user
      const user = pendingUsers.find(u => u.id === userId);
      const selectedClass = classes.find(c => c.id === classId);
      
      if (user && selectedClass) {
        await supabase
          .from('user_notifications')
          .insert({
            user_id: userId,
            message: `Je bent toegewezen aan de klas "${selectedClass.name}". Je kunt nu alle lesmaterialen en opdrachten bekijken.`
          });
      }

      toast.success('Gebruiker succesvol toegewezen aan klas!');
      fetchPendingUsers();
      
      // Clear selection
      setSelectedClasses(prev => ({ ...prev, [userId]: '' }));
    } catch (error) {
      console.error('Error assigning user to class:', error);
      toast.error('Fout bij het toewijzen van de gebruiker');
    }
  };

  if (profile?.role !== 'admin') {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">Alleen admins kunnen deze pagina bekijken</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return <div className="text-center py-8">Laden...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="main-content-card">
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-6 h-6" />
          <h2 className="text-2xl font-bold">Wachtende Gebruikers</h2>
          <Badge variant="secondary">{pendingUsers.length}</Badge>
        </div>
        
        {pendingUsers.length === 0 ? (
          <Card className="floating-content">
            <CardContent className="text-center py-8">
              <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Geen wachtende gebruikers</h3>
              <p className="text-muted-foreground">
                Alle geregistreerde leerlingen zijn toegewezen aan een klas.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingUsers.map((user) => (
              <Card key={user.id} className="floating-content">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{user.full_name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      {user.parent_email && (
                        <p className="text-xs text-muted-foreground">
                          Ouder email: {user.parent_email}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Geregistreerd {formatDistanceToNow(new Date(user.created_at), { 
                          addSuffix: true, 
                          locale: nl 
                        })}
                      </p>
                    </div>
                    <Badge variant="outline">
                      <Clock className="w-3 h-3 mr-1" />
                      Wachtend
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <label className="text-sm font-medium mb-2 block">
                        Selecteer klas:
                      </label>
                      <Select
                        value={selectedClasses[user.id] || ''}
                        onValueChange={(value) => setSelectedClasses(prev => ({
                          ...prev,
                          [user.id]: value
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Kies een klas..." />
                        </SelectTrigger>
                        <SelectContent>
                          {classes.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.name}
                              {cls.description && (
                                <span className="text-muted-foreground ml-2">
                                  - {cls.description}
                                </span>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      onClick={() => assignUserToClass(user.id)}
                      disabled={!selectedClasses[user.id]}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Toewijzen
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};