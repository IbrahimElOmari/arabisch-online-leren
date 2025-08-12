import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar as CalendarIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from '@/hooks/use-toast';
import { format, parseISO, isWithinInterval } from 'date-fns';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  event_type: string;
  class_id?: string;
}

interface Klas {
  id: string;
  name: string;
}

const CalendarPage = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [classes, setClasses] = useState<Klas[]>([]);
  const [userRole, setUserRole] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    class_id: ''
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchEvents();
    fetchUserRole();
    fetchClasses();
  }, [user]);

const fetchUserRole = async () => {
  if (!user) return;
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (!error && data) {
    setUserRole(data.role);
  }
};

const fetchEvents = async () => {
  let query = supabase.from('calendar_events').select('*').order('start_date');

  if (userRole === 'leerkracht' || userRole === 'teacher') {
    const { data: teacherClasses } = await supabase
      .from('klassen')
      .select('id')
      .eq('teacher_id', user?.id);
    const ids = (teacherClasses || []).map(c => c.id);
    if (ids.length > 0) query = query.in('class_id', ids).or('class_id.is.null');
  } else if (userRole === 'leerling' || userRole === 'student') {
    const { data: enrollments } = await supabase
      .from('inschrijvingen')
      .select('class_id')
      .eq('student_id', user?.id)
      .eq('payment_status', 'paid');
    const ids = (enrollments || []).map(e => e.class_id);
    if (ids.length > 0) query = query.in('class_id', ids).or('class_id.is.null');
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching events:', error);
    return;
  }
  setEvents(data || []);
};

const fetchClasses = async () => {
  if (userRole === 'leerkracht' || userRole === 'teacher') {
    const { data, error } = await supabase
      .from('klassen')
      .select('id, name')
      .eq('teacher_id', user?.id);
    if (!error && data) setClasses(data);
  } else if (userRole === 'admin') {
    const { data, error } = await supabase
      .from('klassen')
      .select('id, name');
    if (!error && data) setClasses(data);
  } else if (userRole === 'leerling' || userRole === 'student') {
    const { data: enrollments } = await supabase
      .from('inschrijvingen')
      .select('class_id')
      .eq('student_id', user?.id)
      .eq('payment_status', 'paid');
    const ids = (enrollments || []).map(e => e.class_id);
    if (ids.length > 0) {
      const { data } = await supabase.from('klassen').select('id, name').in('id', ids);
      setClasses(data || []);
    }
  }
};

  const handleAddEvent = async () => {
    if (!newEvent.title || !newEvent.start_date || !newEvent.end_date) {
      toast({
        title: "Fout",
        description: "Vul alle verplichte velden in",
        variant: "destructive"
      });
      return;
    }

    const { error } = await supabase
      .from('calendar_events')
      .insert({
        title: newEvent.title,
        description: newEvent.description,
        start_date: newEvent.start_date,
        end_date: newEvent.end_date,
        class_id: newEvent.class_id || null,
        created_by: user?.id,
        event_type: 'custom'
      });

    if (error) {
      toast({
        title: "Fout",
        description: "Kon evenement niet toevoegen",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Succes",
      description: "Evenement toegevoegd"
    });

    setNewEvent({
      title: '',
      description: '',
      start_date: '',
      end_date: '',
      class_id: ''
    });
    setIsDialogOpen(false);
    fetchEvents();
  };

  const isEventDate = (date: Date) => {
    return events.some(event => {
      const startDate = parseISO(event.start_date);
      const endDate = parseISO(event.end_date);
      return isWithinInterval(date, { start: startDate, end: endDate });
    });
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const startDate = parseISO(event.start_date);
      const endDate = parseISO(event.end_date);
      return isWithinInterval(date, { start: startDate, end: endDate });
    });
  };

  const canAddEvents = userRole === 'admin' || userRole === 'leerkracht' || userRole === 'teacher';

  return (
    <div className="container mx-auto p-6 bg-background min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Schoolkalender 2024-2025</h1>
        {canAddEvents && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Evenement toevoegen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nieuw evenement toevoegen</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Titel *</Label>
                  <Input
                    id="title"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Beschrijving</Label>
                  <Textarea
                    id="description"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="start_date">Startdatum *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={newEvent.start_date}
                    onChange={(e) => setNewEvent({...newEvent, start_date: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">Einddatum *</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={newEvent.end_date}
                    onChange={(e) => setNewEvent({...newEvent, end_date: e.target.value})}
                  />
                </div>
                {classes.length > 0 && (
                  <div>
                    <Label htmlFor="class">Klas (optioneel)</Label>
                    <Select 
                      value={newEvent.class_id} 
                      onValueChange={(value) => setNewEvent({...newEvent, class_id: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecteer een klas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Alle klassen</SelectItem>
                        {classes.map((klas) => (
                          <SelectItem key={klas.id} value={klas.id}>
                            {klas.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button onClick={handleAddEvent} className="w-full">
                  Toevoegen
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Kalender
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
              modifiers={{
                event: isEventDate
              }}
              modifiersClassNames={{
                event: "bg-primary text-primary-foreground"
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {selectedDate ? format(selectedDate, 'dd MMMM yyyy') : 'Selecteer een datum'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDate && (
              <div className="space-y-3">
                {getEventsForDate(selectedDate).length > 0 ? (
                  getEventsForDate(selectedDate).map((event) => (
                    <div key={event.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{event.title}</h4>
                        <Badge variant={event.event_type === 'vacation' ? 'secondary' : 'default'}>
                          {event.event_type === 'vacation' ? 'Vakantie' : 'Evenement'}
                        </Badge>
                      </div>
                      {event.description && (
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(parseISO(event.start_date), 'dd/MM/yyyy')} - {format(parseISO(event.end_date), 'dd/MM/yyyy')}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">Geen evenementen voor deze datum</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CalendarPage;
