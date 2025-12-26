import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar as CalendarIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { toast } from '@/hooks/use-toast';
import { format, parseISO, isWithinInterval } from 'date-fns';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { useTranslation } from '@/contexts/TranslationContext';
import { ResponsiveForm, ResponsiveFormField } from '@/components/forms/ResponsiveForm';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  event_type: string;
  class_id?: string | null;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
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
  const { isRTL } = useRTLLayout();
  const { t } = useTranslation();

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
  if (!user?.id) return;
  
  let query = supabase.from('calendar_events').select('*').order('start_date');

  if (userRole === 'leerkracht') {
    const { data: teacherClasses } = await supabase
      .from('klassen')
      .select('id')
      .eq('teacher_id', user.id);
    const ids = (teacherClasses || []).map(c => c.id);
    if (ids.length > 0) query = query.in('class_id', ids).or('class_id.is.null');
  } else if (userRole === 'leerling') {
    const { data: enrollments } = await supabase
      .from('inschrijvingen')
      .select('class_id')
      .eq('student_id', user.id)
      .eq('payment_status', 'paid');
    const ids = (enrollments || []).map(e => e.class_id);
    if (ids.length > 0) query = query.in('class_id', ids).or('class_id.is.null');
  }

  const { data, error } = await query;
  if (error) {
    if (import.meta.env.DEV) console.error('Error fetching events:', error);
    return;
  }
  setEvents((data || []).map(event => ({
    id: event.id,
    title: event.title,
    description: event.description ?? undefined,
    start_date: event.start_date,
    end_date: event.end_date,
    event_type: event.event_type,
    class_id: event.class_id ?? undefined,
    created_by: event.created_by ?? undefined,
    created_at: event.created_at,
    updated_at: event.updated_at
  })));
};

const fetchClasses = async () => {
  if (!user?.id) return;
  
  if (userRole === 'leerkracht') {
    const { data, error } = await supabase
      .from('klassen')
      .select('id, name')
      .eq('teacher_id', user.id);
    if (!error && data) setClasses(data);
  } else if (userRole === 'admin') {
    const { data, error } = await supabase
      .from('klassen')
      .select('id, name');
    if (!error && data) setClasses(data);
  } else if (userRole === 'leerling') {
    const { data: enrollments } = await supabase
      .from('inschrijvingen')
      .select('class_id')
      .eq('student_id', user.id)
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

  const canAddEvents = userRole === 'admin' || userRole === 'leerkracht';

  return (
    <div className="@container min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto p-4 sm:p-6">
        <div className={`flex flex-col @md:flex-row @md:items-center @md:justify-between gap-4 mb-6`}>
          <h1 className={`text-xl @md:text-2xl font-bold ${isRTL ? 'arabic-text font-amiri' : ''}`}>{t('calendar.title')}</h1>
          {canAddEvents && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full @md:w-auto">
                  <Plus className="w-4 h-4 me-2" />
                  <span className={isRTL ? 'arabic-text' : ''}>{t('calendar.addEvent')}</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="w-full max-w-md @md:max-w-lg">
                <DialogHeader>
                  <DialogTitle className={isRTL ? 'arabic-text' : ''}>{t('calendar.addNewEvent')}</DialogTitle>
                </DialogHeader>
                <ResponsiveForm layout="single" onSubmit={(e) => {
                  e.preventDefault();
                  handleAddEvent();
                }}>
                  <ResponsiveFormField
                    label={`${t('calendar.title')} *`}
                    name="title"
                    type="text"
                    required
                    value={newEvent.title}
                    onChange={(value) => setNewEvent({...newEvent, title: value})}
                    className={isRTL ? 'arabic-text' : ''}
                  />
                  <ResponsiveFormField
                    label={t('calendar.description')}
                    name="description"
                    type="textarea"
                    value={newEvent.description}
                    onChange={(value) => setNewEvent({...newEvent, description: value})}
                    className={isRTL ? 'arabic-text' : ''}
                  />
                  <div className="w-full">
                    <label className={`text-sm font-medium mb-2 block ${isRTL ? 'arabic-text text-right' : 'text-left'}`}>
                      {`${t('calendar.startDate')} *`}
                    </label>
                    <Input
                      type="date"
                      value={newEvent.start_date}
                      onChange={(e) => setNewEvent({...newEvent, start_date: e.target.value})}
                      dir="ltr"
                      className="w-full"
                      required
                    />
                  </div>
                  <div className="w-full">
                    <label className={`text-sm font-medium mb-2 block ${isRTL ? 'arabic-text text-right' : 'text-left'}`}>
                      {`${t('calendar.endDate')} *`}
                    </label>
                    <Input
                      type="date"
                      value={newEvent.end_date}
                      onChange={(e) => setNewEvent({...newEvent, end_date: e.target.value})}
                      dir="ltr"
                      className="w-full"
                      required
                    />
                  </div>
                  {classes.length > 0 && (
                    <div className="w-full">
                      <label className={`text-sm font-medium mb-2 block ${isRTL ? 'arabic-text text-right' : 'text-left'}`}>
                        {t('calendar.classOptional')}
                      </label>
                      <Select 
                        value={newEvent.class_id} 
                        onValueChange={(value) => setNewEvent({...newEvent, class_id: value})}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t('calendar.selectClass')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">{t('calendar.allClasses')}</SelectItem>
                          {classes.map((klas) => (
                            <SelectItem key={klas.id} value={klas.id}>
                              {klas.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <Button type="submit" className="w-full">
                    <span className={isRTL ? 'arabic-text' : ''}>{t('calendar.add')}</span>
                  </Button>
                </ResponsiveForm>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="grid grid-cols-1 @lg:grid-cols-3 gap-4 @md:gap-6">
          <Card className="@lg:col-span-2 @container">
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${isRTL ? 'arabic-text' : ''}`}>
                <CalendarIcon className="w-5 h-5" />
                {t('calendar.calendar')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border w-full"
                modifiers={{
                  event: isEventDate
                }}
                modifiersClassNames={{
                  event: "bg-primary text-primary-foreground"
                }}
              />
            </CardContent>
          </Card>

          <Card className="@container">
            <CardHeader>
              <CardTitle className="text-base @md:text-lg">
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
                          <h4 className="font-medium text-sm @md:text-base">{event.title}</h4>
                          <Badge variant={event.event_type === 'vacation' ? 'secondary' : 'default'}>
                            {event.event_type === 'vacation' ? 'Vakantie' : 'Evenement'}
                          </Badge>
                        </div>
                        {event.description && (
                          <p className="text-xs @md:text-sm text-muted-foreground">{event.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {format(parseISO(event.start_date), 'dd/MM/yyyy')} - {format(parseISO(event.end_date), 'dd/MM/yyyy')}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Geen evenementen voor deze datum</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
