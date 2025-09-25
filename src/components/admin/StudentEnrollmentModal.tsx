import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useStudentStore } from '@/hooks/useStudentStore';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Send, Users, CheckSquare, Square } from 'lucide-react';
import { ResponsiveForm, ResponsiveFormField } from '@/components/forms/ResponsiveForm';

interface StudentEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  className: string;
}

export const StudentEnrollmentModal = ({ isOpen, onClose, classId, className }: StudentEnrollmentModalProps) => {
  const { 
    students, 
    loading, 
    error, 
    fetchStudents, 
    assignStudent, 
    removeStudent,
    sendBulkNotification
  } = useStudentStore();
  
  const { toast } = useToast();
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [enrolledStudents, setEnrolledStudents] = useState<Set<string>>(new Set());
  const [showNotificationForm, setShowNotificationForm] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchStudents();
      fetchEnrolledStudents();
    }
  }, [isOpen, fetchStudents]);

  const fetchEnrolledStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('inschrijvingen')
        .select('student_id')
        .eq('class_id', classId)
        .eq('payment_status', 'paid');

      if (error) throw error;
      
      const enrolledIds = new Set<string>(data?.map(enrollment => enrollment.student_id) || []);
      setEnrolledStudents(enrolledIds);
    } catch (error: any) {
      console.error('Error fetching enrolled students:', error);
    }
  };

  const handleSelectStudent = (studentId: string, checked: boolean) => {
    const newSelected = new Set(selectedStudents);
    if (checked) {
      newSelected.add(studentId);
    } else {
      newSelected.delete(studentId);
    }
    setSelectedStudents(newSelected);
    setSelectAll(newSelected.size === students.length);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(new Set(students.map(s => s.id)));
    } else {
      setSelectedStudents(new Set());
    }
    setSelectAll(checked);
  };

  const handleAssignSelected = async () => {
    if (selectedStudents.size === 0) {
      toast({
        title: "Geen selectie",
        description: "Selecteer eerst studenten om toe te wijzen",
        variant: "destructive"
      });
      return;
    }

    let successCount = 0;
    for (const studentId of selectedStudents) {
      if (!enrolledStudents.has(studentId)) {
        const success = await assignStudent(studentId, classId);
        if (success) successCount++;
      }
    }

    if (successCount > 0) {
      toast({
        title: "Succes",
        description: `${successCount} student(en) toegewezen aan ${className}`
      });
      await fetchEnrolledStudents();
      setSelectedStudents(new Set());
      setSelectAll(false);
    }
  };

  const handleRemoveSelected = async () => {
    if (selectedStudents.size === 0) {
      toast({
        title: "Geen selectie",
        description: "Selecteer eerst studenten om te verwijderen",
        variant: "destructive"
      });
      return;
    }

    if (!confirm(`Weet je zeker dat je ${selectedStudents.size} student(en) wilt verwijderen uit ${className}?`)) {
      return;
    }

    let successCount = 0;
    for (const studentId of selectedStudents) {
      if (enrolledStudents.has(studentId)) {
        const success = await removeStudent(studentId, classId);
        if (success) successCount++;
      }
    }

    if (successCount > 0) {
      toast({
        title: "Succes",
        description: `${successCount} student(en) verwijderd uit ${className}`
      });
      await fetchEnrolledStudents();
      setSelectedStudents(new Set());
      setSelectAll(false);
    }
  };

  const handleSendEmail = () => {
    if (selectedStudents.size === 0) {
      toast({
        title: "Geen selectie",
        description: "Selecteer eerst studenten om een email te sturen",
        variant: "destructive"
      });
      return;
    }

    const selectedStudentData = students.filter(s => selectedStudents.has(s.id));
    const emails = selectedStudentData.map(s => s.email).filter(Boolean);
    
    if (emails.length === 0) {
      toast({
        title: "Geen emails",
        description: "Geselecteerde studenten hebben geen email adressen",
        variant: "destructive"
      });
      return;
    }

    const mailtoLink = `mailto:?bcc=${emails.join(',')}`;
    window.location.href = mailtoLink;
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedStudents.size === 0 || !notificationMessage.trim()) {
      toast({
        title: "Incomplete gegevens",
        description: "Selecteer studenten en voer een bericht in",
        variant: "destructive"
      });
      return;
    }

    const success = await sendBulkNotification(Array.from(selectedStudents), notificationMessage);
    
    if (success) {
      toast({
        title: "Succes",
        description: `Notificatie verstuurd naar ${selectedStudents.size} student(en)`
      });
      setNotificationMessage('');
      setShowNotificationForm(false);
      setSelectedStudents(new Set());
      setSelectAll(false);
    } else {
      toast({
        title: "Fout",
        description: error || "Kon notificatie niet versturen",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Studenten Beheren - {className}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Acties ({selectedStudents.size} geselecteerd)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={handleAssignSelected}
                  disabled={loading || selectedStudents.size === 0}
                  className="flex items-center gap-2"
                >
                  <CheckSquare className="h-4 w-4" />
                  Wijs toe aan deze klas
                </Button>
                
                <Button 
                  variant="destructive"
                  onClick={handleRemoveSelected}
                  disabled={loading || selectedStudents.size === 0}
                  className="flex items-center gap-2"
                >
                  <Square className="h-4 w-4" />
                  Verwijder uit deze klas
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={handleSendEmail}
                  disabled={selectedStudents.size === 0}
                  className="flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Stuur Email
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => setShowNotificationForm(!showNotificationForm)}
                  disabled={selectedStudents.size === 0}
                  className="flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  Stuur Notificatie
                </Button>
              </div>

              {showNotificationForm && (
                <ResponsiveForm layout="single" onSubmit={handleSendNotification} className="mt-4 p-4 border rounded-lg">
                  <ResponsiveFormField
                    label="Notificatie bericht"
                    name="notification-message"
                    type="textarea"
                    placeholder="Typ je bericht hier..."
                    required
                    value={notificationMessage}
                    onChange={setNotificationMessage}
                  />
                  <div className="flex gap-2 pt-4">
                    <Button type="submit" disabled={loading}>
                      Verstuur Notificatie
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setShowNotificationForm(false)}
                    >
                      Annuleren
                    </Button>
                  </div>
                </ResponsiveForm>
              )}
            </CardContent>
          </Card>

          {/* Students List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Alle Studenten</CardTitle>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label htmlFor="select-all">Selecteer allen</Label>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading && students.length === 0 ? (
                <div className="text-center py-8">Laden...</div>
              ) : students.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Geen studenten gevonden
                </div>
              ) : (
                <div className="space-y-2">
                  {students.map((student) => {
                    const isEnrolled = enrolledStudents.has(student.id);
                    const isSelected = selectedStudents.has(student.id);
                    
                    return (
                      <div 
                        key={student.id} 
                        className={`flex items-center justify-between p-3 border rounded-lg ${
                          isEnrolled ? 'bg-green-50 border-green-200' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSelectStudent(student.id, checked as boolean)}
                          />
                          <div>
                            <div className="font-medium">{student.full_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {student.email || 'Geen email'}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {isEnrolled && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              Ingeschreven
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(student.created_at).toLocaleDateString('nl-NL')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {error && (
            <div className="text-red-500 text-sm">
              Fout: {error}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};