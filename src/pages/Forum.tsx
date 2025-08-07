import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import ForumStructure from '@/components/forum/ForumStructure';

interface EnrolledClass {
  id: string;
  class_id: string;
  payment_status: string;
  klassen: {
    id: string;
    name: string;
    description: string;
  };
}

const Forum = () => {
  const { profile, user } = useAuth();
  const [enrolledClasses, setEnrolledClasses] = useState<EnrolledClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserClasses();
  }, [profile?.id]);

  const fetchUserClasses = async () => {
    try {
      if (profile?.role === 'admin') {
        // Admin can see all classes
        const { data, error } = await supabase
          .from('klassen')
          .select('id, name, description')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const formattedClasses = data?.map(klas => ({
          id: `admin-${klas.id}`,
          class_id: klas.id,
          payment_status: 'paid',
          klassen: {
            id: klas.id,
            name: klas.name,
            description: klas.description || ''
          }
        })) || [];
        
        setEnrolledClasses(formattedClasses);
        if (formattedClasses.length > 0) {
          setSelectedClass(formattedClasses[0].class_id);
        }
      } else if (profile?.role === 'leerkracht') {
        // Teacher can see assigned classes
        const { data, error } = await supabase
          .from('klassen')
          .select('id, name, description')
          .eq('teacher_id', profile.id);
        
        if (error) throw error;
        
        const formattedClasses = data?.map(klas => ({
          id: `teacher-${klas.id}`,
          class_id: klas.id,
          payment_status: 'paid',
          klassen: {
            id: klas.id,
            name: klas.name,
            description: klas.description || ''
          }
        })) || [];
        
        setEnrolledClasses(formattedClasses);
        if (formattedClasses.length > 0) {
          setSelectedClass(formattedClasses[0].class_id);
        }
      } else {
        // Students see enrolled classes
        const { data, error } = await supabase
          .from('inschrijvingen')
          .select(`
            id,
            class_id,
            payment_status,
            klassen:class_id (
              id,
              name,
              description
            )
          `)
          .eq('student_id', profile?.id)
          .eq('payment_status', 'paid');

        if (error) throw error;
        
        setEnrolledClasses(data || []);
        if (data && data.length > 0) {
          setSelectedClass(data[0].class_id);
        }
      }
    } catch (error) {
      console.error('Error fetching user classes:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-lg">Laden...</div>
      </div>
    );
  }

  if (enrolledClasses.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6">
          <Card className="main-content-card">
            <CardContent className="text-center py-12">
              <h2 className="text-xl font-semibold mb-4">Geen toegang tot forum</h2>
              <p className="text-muted-foreground">
                {profile?.role === 'leerling' 
                  ? 'Je bent nog niet ingeschreven voor een klas.' 
                  : 'Er zijn geen klassen beschikbaar.'
                }
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="main-content-card mb-6">
          <h1 className="text-2xl font-bold mb-4">Forum</h1>
          
          {enrolledClasses.length > 1 && (
            <div className="max-w-xs">
              <label className="text-sm font-medium mb-2 block">Selecteer klas:</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Kies een klas" />
                </SelectTrigger>
                <SelectContent>
                  {enrolledClasses.map((enrollment) => (
                    <SelectItem key={enrollment.id} value={enrollment.class_id}>
                      {enrollment.klassen.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="main-content-card">
          <ForumStructure classId={selectedClass || ''} />
        </div>
      </div>
    </div>
  );
};

export default Forum;