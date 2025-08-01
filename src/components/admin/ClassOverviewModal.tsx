import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  Mail, 
  Send, 
  Users, 
  CheckSquare, 
  Square,
  MessageSquare,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Student {
  id: string;
  full_name: string;
  email: string;
  payment_status: string;
  created_at: string;
}

interface ClassOverviewModalProps {
  classId: string;
  className: string;
  trigger: React.ReactNode;
}

export const ClassOverviewModal = ({ classId, className, trigger }: ClassOverviewModalProps) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [showNotificationForm, setShowNotificationForm] = useState(false);
  const { toast } = useToast();

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('inschrijvingen')
        .select(`
          id,
          payment_status,
          created_at,
          profiles:student_id (
            id,
            full_name,
            email
          )
        `)
        .eq('class_id', classId);

      if (error) throw error;

      const formattedStudents = data?.map(enrollment => ({
        id: enrollment.profiles?.id || '',
        full_name: enrollment.profiles?.full_name || 'Onbekende naam',
        email: enrollment.profiles?.email || 'Geen email',
        payment_status: enrollment.payment_status,
        created_at: enrollment.created_at
      })) || [];

      setStudents(formattedStudents);
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

  useEffect(() => {
    fetchStudents();
  }, [classId]);

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedStudents(students.map(s => s.id));
    } else {
      setSelectedStudents([]);
    }
  };

  const handleSelectStudent = (studentId: string, checked: boolean) => {
    if (checked) {
      setSelectedStudents(prev => [...prev, studentId]);
    } else {
      setSelectedStudents(prev => prev.filter(id => id !== studentId));
      setSelectAll(false);
    }
  };

  const handleSendEmails = () => {
    if (selectedStudents.length === 0) {
      toast({
        title: "Geen selectie",
        description: "Selecteer eerst leerlingen om emails te versturen",
        variant: "destructive"
      });
      return;
    }

    const selectedStudentEmails = students
      .filter(s => selectedStudents.includes(s.id))
      .map(s => s.email)
      .filter(email => email !== 'Geen email');

    if (selectedStudentEmails.length === 0) {
      toast({
        title: "Geen emails",
        description: "Geen geldig email adres gevonden voor de geselecteerde leerlingen",
        variant: "destructive"
      });
      return;
    }

    // Open Gmail compose with selected emails
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${selectedStudentEmails.join(',')}&su=${encodeURIComponent(`Bericht van ${className}`)}&body=${encodeURIComponent('Beste leerling,\n\n\n\nMet vriendelijke groet,\nUw leerkracht')}`;
    window.open(gmailUrl, '_blank');
  };

  const handleSendNotification = async () => {
    if (selectedStudents.length === 0 || !notificationMessage.trim()) {
      toast({
        title: "Incomplete gegevens",
        description: "Selecteer leerlingen en vul een bericht in",
        variant: "destructive"
      });
      return;
    }

    try {
      const notifications = selectedStudents.map(studentId => ({
        user_id: studentId,
        message: `[${className}] ${notificationMessage}`
      }));

      const { error } = await supabase
        .from('user_notifications')
        .insert(notifications);

      if (error) throw error;

      toast({
        title: "Succes",
        description: `Melding verzonden naar ${selectedStudents.length} leerling(en)`
      });

      setNotificationMessage('');
      setShowNotificationForm(false);
      setSelectedStudents([]);
      setSelectAll(false);
    } catch (error) {
      console.error('Error sending notifications:', error);
      toast({
        title: "Fout",
        description: "Kon melding niet verzenden",
        variant: "destructive"
      });
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default" className="bg-green-600">Betaald</Badge>;
      case 'pending':
        return <Badge variant="secondary">In behandeling</Badge>;
      case 'failed':
        return <Badge variant="destructive">Mislukt</Badge>;
      default:
        return <Badge variant="outline">Onbekend</Badge>;
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Overzicht: {className}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleSendEmails}
              disabled={selectedStudents.length === 0}
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              E-mail Versturen ({selectedStudents.length})
              <ExternalLink className="h-3 w-3" />
            </Button>
            
            <Button
              onClick={() => setShowNotificationForm(!showNotificationForm)}
              disabled={selectedStudents.length === 0}
              variant="outline"
              className="flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Melding Sturen ({selectedStudents.length})
            </Button>
            
            <div className="flex items-center gap-2 ml-auto">
              <Checkbox
                id="select-all"
                checked={selectAll}
                onCheckedChange={handleSelectAll}
              />
              <label htmlFor="select-all" className="text-sm font-medium">
                Alles selecteren ({students.length})
              </label>
            </div>
          </div>

          {/* Notification Form */}
          {showNotificationForm && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Melding versturen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="Typ hier uw melding..."
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button onClick={handleSendNotification} className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Verzenden naar {selectedStudents.length} leerling(en)
                  </Button>
                  <Button variant="outline" onClick={() => setShowNotificationForm(false)}>
                    Annuleren
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Students List */}
          <Card>
            <CardHeader>
              <CardTitle>Leerlingen ({students.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Laden...</div>
              ) : students.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Geen leerlingen ingeschreven
                </div>
              ) : (
                <div className="space-y-3">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedStudents.includes(student.id)}
                          onCheckedChange={(checked) => 
                            handleSelectStudent(student.id, checked as boolean)
                          }
                        />
                        
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {student.full_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <h4 className="font-medium">{student.full_name}</h4>
                          <p className="text-sm text-muted-foreground">{student.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Ingeschreven: {new Date(student.created_at).toLocaleDateString('nl-NL')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {getPaymentStatusBadge(student.payment_status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{students.length}</div>
                  <div className="text-sm text-muted-foreground">Totaal leerlingen</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {students.filter(s => s.payment_status === 'paid').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Betaald</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {students.filter(s => s.payment_status === 'pending').length}
                  </div>
                  <div className="text-sm text-muted-foreground">In behandeling</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClassOverviewModal;