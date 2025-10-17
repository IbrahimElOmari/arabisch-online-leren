import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UserCheck, Mail, Phone, Calendar } from 'lucide-react';

interface PendingUser {
  id: string;
  full_name: string;
  email: string;
  parent_email?: string;
  phone_number?: string;
  created_at: string;
  role: string;
}

interface Class {
  id: string;
  name: string;
  niveaus: Array<{
    id: string;
    naam: string;
    niveau_nummer: number;
  }>;
}

const UserActivationPanel = () => {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [activationData, setActivationData] = useState<Record<string, { classId: string; niveauId: string }>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingUsers();
    fetchClasses();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      // Get all users first
      const { data: allUsers, error: allUsersError } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          parent_email,
          phone_number,
          created_at,
          role
        `);

      if (allUsersError) throw allUsersError;

      // Get users with active enrollments
      const { data: enrolledUsers, error: enrolledError } = await supabase
        .from('inschrijvingen')
        .select('student_id')
        .eq('payment_status', 'paid');

      if (enrolledError) throw enrolledError;

      // Filter out enrolled users
      const enrolledUserIds = new Set(enrolledUsers?.map(e => e.student_id) || []);
      const pendingUsers = allUsers?.filter(user => 
        !enrolledUserIds.has(user.id)
      ) || [];

      setPendingUsers(pendingUsers);
    } catch (error) {
      console.error('Error fetching pending users:', error);
      toast({
        title: "Fout",
        description: "Kon gebruikers niet laden",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('klassen')
        .select(`
          id,
          name,
          niveaus (
            id,
            naam,
            niveau_nummer
          )
        `)
        .order('name');

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const handleActivateUser = async (userId: string) => {
    const activation = activationData[userId];
    if (!activation?.classId || !activation?.niveauId) {
      toast({
        title: "Fout",
        description: "Selecteer eerst een klas en niveau",
        variant: "destructive"
      });
      return;
    }

    try {
      if (import.meta.env.DEV) {
        console.log('Activating user:', { userId, activation });
      }
      
      // Use manage-enrollment function for admin actions (proper admin flow)
      const { data, error } = await supabase.functions.invoke('manage-enrollment', {
        body: {
          action: 'assign-student',
          studentId: userId,
          classId: activation.classId
        }
      });

      if (import.meta.env.DEV) {
        console.log('Activation response:', { data, error });
      }

      if (error) {
        console.error('Supabase function error:', error);
        // Show more detailed error message
        throw new Error(error.message || error.toString());
      }

      toast({
        title: "Succes",
        description: "Gebruiker succesvol geactiveerd en ingeschreven"
      });

      // Refresh the list
      fetchPendingUsers();
      
      // Clear the activation data for this user
      setActivationData(prev => {
        const newData = { ...prev };
        delete newData[userId];
        return newData;
      });
    } catch (error: any) {
      console.error('Error activating user:', error);
      toast({
        title: "Fout",
        description: error.message || "Kon gebruiker niet activeren",
        variant: "destructive"
      });
    }
  };

  const updateActivationData = (userId: string, field: 'classId' | 'niveauId', value: string) => {
    setActivationData(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [field]: value
      }
    }));
  };

  const getSelectedClass = (userId: string) => {
    const classId = activationData[userId]?.classId;
    return classes.find(c => c.id === classId);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <div className="text-lg">Laden...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Gebruikers & Toewijzingen
            {pendingUsers.length > 0 && (
              <Badge variant="destructive" className="ms-2">
                {pendingUsers.length} wachtend
              </Badge>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {pendingUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Geen gebruikers wachtend op activering
          </div>
        ) : (
          <div className="space-y-4">
            {pendingUsers.map((user) => (
              <div key={user.id} className="border border-border rounded-lg p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{user.full_name}</h4>
                      <Badge variant="outline">Wachtend op Activering</Badge>
                    </div>
                    
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {user.email}
                      </div>
                      
                      {user.parent_email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Ouder: {user.parent_email}
                        </div>
                      )}
                      
                      {user.phone_number && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {user.phone_number}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Geregistreerd: {new Date(user.created_at).toLocaleDateString('nl-NL')}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Selecteer Klas</label>
                    <Select 
                      value={activationData[user.id]?.classId || ''} 
                      onValueChange={(value) => updateActivationData(user.id, 'classId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Kies een klas" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((klas) => (
                          <SelectItem key={klas.id} value={klas.id}>
                            {klas.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Selecteer Niveau</label>
                    <Select 
                      value={activationData[user.id]?.niveauId || ''} 
                      onValueChange={(value) => updateActivationData(user.id, 'niveauId', value)}
                      disabled={!activationData[user.id]?.classId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Kies een niveau" />
                      </SelectTrigger>
                      <SelectContent>
                        {getSelectedClass(user.id)?.niveaus.map((niveau) => (
                          <SelectItem key={niveau.id} value={niveau.id}>
                            {niveau.naam}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button 
                      onClick={() => handleActivateUser(user.id)}
                      disabled={!activationData[user.id]?.classId || !activationData[user.id]?.niveauId}
                      className="w-full"
                    >
                      Activeren & Inschrijven
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserActivationPanel;