import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Student {
  id: string;
  full_name: string;
  payment_status: string;
}

interface AttendanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  className: string;
  levelId?: string;
}

export function AttendanceModal({ open, onOpenChange, classId, className, levelId }: AttendanceModalProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent'>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && classId) {
      fetchStudents();
    }
  }, [open, classId]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('inschrijvingen')
        .select(`
          profiles:student_id (
            id,
            full_name
          )
        `)
        .eq('class_id', classId)
        .eq('payment_status', 'paid');

      if (error) throw error;

      const studentList = data?.map(enrollment => ({
        id: enrollment.profiles?.id || '',
        full_name: enrollment.profiles?.full_name || 'Onbekende naam',
        payment_status: 'paid'
      })) || [];

      setStudents(studentList);
      
      // Initialize attendance as 'present' for all students
      const initialAttendance: Record<string, 'present' | 'absent'> = {};
      studentList.forEach(student => {
        initialAttendance[student.id] = 'present';
      });
      setAttendance(initialAttendance);
      
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: "Fout",
        description: "Kon leerlingen niet laden",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceChange = (studentId: string, status: 'present' | 'absent') => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Create a lesson first if needed, then save attendance
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessen')
        .insert({
          class_id: classId,
          title: `Aanwezigheid registratie - ${new Date().toLocaleDateString('nl-NL')}`
        })
        .select()
        .single();

      if (lessonError) throw lessonError;

      // Save attendance records
      const attendanceRecords = Object.entries(attendance).map(([studentId, status]) => ({
        student_id: studentId,
        lesson_id: lessonData.id,
        status: status === 'present' ? 'aanwezig' : 'afwezig'
      }));

      const { error: attendanceError } = await supabase
        .from('aanwezigheid')
        .insert(attendanceRecords);

      if (attendanceError) throw attendanceError;

      toast({
        title: "Succes",
        description: "Aanwezigheid succesvol geregistreerd"
      });

      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving attendance:', error);
      toast({
        title: "Fout",
        description: error.message || "Kon aanwezigheid niet opslaan",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Aanwezigheid Registreren - {className}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">Laden...</div>
          ) : students.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Geen betaalde leerlingen gevonden voor deze klas
            </div>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Leerlingen ({students.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {students.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-medium">
                          {student.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-medium">{student.full_name}</h4>
                          <Badge variant="default" className="text-xs">Betaald</Badge>
                        </div>
                      </div>
                      
                      <RadioGroup
                        value={attendance[student.id] || 'present'}
                        onValueChange={(value) => handleAttendanceChange(student.id, value as 'present' | 'absent')}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="present" id={`${student.id}-present`} />
                          <Label htmlFor={`${student.id}-present`} className="text-green-600">Aanwezig</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="absent" id={`${student.id}-absent`} />
                          <Label htmlFor={`${student.id}-absent`} className="text-red-600">Afwezig</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  Aanwezig: {Object.values(attendance).filter(status => status === 'present').length} / {students.length}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Annuleren
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? 'Bezig...' : 'Opslaan'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}