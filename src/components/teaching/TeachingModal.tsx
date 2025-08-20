import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Video, FileQuestion, Calendar, Upload, Plus, UserCheck, ClipboardList } from 'lucide-react';
import { AttendanceModal } from './AttendanceModal';
import { PerformanceModal } from './PerformanceModal';

interface TeachingModalProps {
  selectedClass?: string;
  selectedLevel?: string;
  trigger?: React.ReactNode;
  type?: 'youtube' | 'questions' | 'schedule' | 'upload' | 'task' | 'attendance' | 'performance';
  niveauId?: string;
  // Support both API patterns for backwards compatibility
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function TeachingModal({ 
  selectedClass, 
  selectedLevel, 
  trigger, 
  type = 'youtube', 
  niveauId,
  open: propOpen,
  onOpenChange: propOnOpenChange,
  isOpen,
  onClose
}: TeachingModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [performanceOpen, setPerformanceOpen] = useState(false);
  const { toast } = useToast();

  // Determine which open/close pattern to use
  const isControlled = propOpen !== undefined || isOpen !== undefined;
  const open = isControlled ? (propOpen ?? isOpen ?? false) : internalOpen;
  const setOpen = isControlled 
    ? (newOpen: boolean) => {
        propOnOpenChange?.(newOpen);
        if (!newOpen) onClose?.();
      }
    : setInternalOpen;

  // For attendance and performance types, render the special modals
  if (type === 'attendance') {
    return (
      <>
        <div onClick={() => setAttendanceOpen(true)}>
          {trigger}
        </div>
        <AttendanceModal
          open={attendanceOpen}
          onOpenChange={setAttendanceOpen}
          classId={selectedClass || ''}
          className="Geselecteerde Klas"
          levelId={niveauId}
        />
      </>
    );
  }

  if (type === 'performance') {
    return (
      <>
        <div onClick={() => setPerformanceOpen(true)}>
          {trigger}
        </div>
        <PerformanceModal
          open={performanceOpen}
          onOpenChange={setPerformanceOpen}
          classId={selectedClass || ''}
          className="Geselecteerde Klas"
          levelId={niveauId}
        />
      </>
    );
  }

  const [formData, setFormData] = useState({
    title: '',
    url: '',
    description: '',
    vraag_tekst: '',
    vraag_type: 'enkelvoudig',
    opties: ['', '', '', ''] as string[],
    correct_antwoord: '',
    live_lesson_datetime: '',
    live_lesson_url: '',
    preparation_deadline: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field: string, index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field as keyof typeof prev] as string[]).map((item: string, i: number) => 
        i === index ? value : item
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let endpoint = '';
      let payload = {};

      switch (type) {
        case 'youtube':
          endpoint = 'create-lesson-content';
          payload = {
            niveau_id: niveauId,
            content_type: 'video',
            title: formData.title,
            url: formData.url,
            description: formData.description
          };
          break;
        case 'questions':
          endpoint = 'create-questions';
          
          // Handle audio/video upload for questions
          let audioUrl = null;
          let videoUrl = null;
          
          if (formData.vraag_type === 'audio' || formData.vraag_type === 'video') {
            const fileInput = document.getElementById('media_file') as HTMLInputElement;
            const file = fileInput?.files?.[0];
            
            if (file) {
              const formDataUpload = new FormData();
              formDataUpload.append('file', file);
              formDataUpload.append('fileName', file.name);
              formDataUpload.append('bucket', 'media');
              
              const { data: uploadData, error: uploadError } = await supabase.functions.invoke('upload-media', {
                body: formDataUpload
              });
              
              if (uploadError) throw uploadError;
              
              if (formData.vraag_type === 'audio') {
                audioUrl = uploadData.url;
              } else {
                videoUrl = uploadData.url;
              }
            }
          }
          
          payload = {
            niveau_id: niveauId,
            vraag_tekst: formData.vraag_tekst,
            vraag_type: formData.vraag_type,
            opties: formData.vraag_type === 'open' || formData.vraag_type === 'audio' || formData.vraag_type === 'video' ? null : formData.opties.filter(opt => opt.trim() !== ''),
            correct_antwoord: formData.vraag_type === 'open' || formData.vraag_type === 'audio' || formData.vraag_type === 'video' ? [formData.correct_antwoord] : [formData.correct_antwoord],
            audio_url: audioUrl,
            video_url: videoUrl
          };
          break;
        case 'schedule':
          endpoint = 'schedule-lesson';
          payload = {
            class_id: selectedClass,
            title: formData.title,
            live_lesson_datetime: formData.live_lesson_datetime,
            live_lesson_url: formData.live_lesson_url,
            preparation_deadline: formData.preparation_deadline
          };
          break;
        case 'upload':
          endpoint = 'create-lesson-content';
          payload = {
            niveau_id: niveauId,
            content_type: 'upload',
            title: formData.title,
            description: formData.description
          };
          break;
        case 'task':
          endpoint = 'manage-task';
          payload = {
            action: 'create-task',
            level_id: niveauId,
            title: formData.title,
            description: formData.description,
            grading_scale: 10,
            required_submission_type: 'text'
          };
          break;
        default:
          throw new Error('Unsupported action type');
      }

      const { data, error } = await supabase.functions.invoke(endpoint, {
        body: payload
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'Succes!',
        description: getSuccessMessage(type)
      });

      setOpen(false);
      setFormData({
        title: '',
        url: '',
        description: '',
        vraag_tekst: '',
        vraag_type: 'enkelvoudig',
        opties: ['', '', '', ''] as string[],
        correct_antwoord: '',
        live_lesson_datetime: '',
        live_lesson_url: '',
        preparation_deadline: ''
      });

    } catch (error: any) {
      toast({
        title: 'Fout',
        description: error.message || 'Er is een fout opgetreden',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getSuccessMessage = (type: string) => {
    switch (type) {
      case 'youtube': return 'YouTube video succesvol toegevoegd';
      case 'questions': return 'Vraag succesvol aangemaakt';
      case 'schedule': return 'Live les succesvol gepland';
      case 'upload': return 'Opname succesvol geüpload';
      case 'task': return 'Taak succesvol aangemaakt';
      default: return 'Actie succesvol uitgevoerd';
    }
  };

  const getModalTitle = () => {
    switch (type) {
      case 'youtube': return 'YouTube Video Toevoegen';
      case 'questions': return 'Vraag Opstellen';
      case 'schedule': return 'Live Les Plannen';
      case 'upload': return 'Opname Uploaden';
      case 'task': return 'Nieuwe Taak';
      default: return 'Actie Uitvoeren';
    }
  };

  const renderFormContent = () => {
    switch (type) {
      case 'youtube':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Video Titel</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Bijv: Introductie tot Arabische letters"
                required
              />
            </div>
            <div>
              <Label htmlFor="url">YouTube URL</Label>
              <Input
                id="url"
                value={formData.url}
                onChange={(e) => handleInputChange('url', e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Beschrijving</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Korte beschrijving van de video..."
              />
            </div>
          </div>
        );

      case 'questions':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="vraag_tekst">Vraag</Label>
              <Textarea
                id="vraag_tekst"
                value={formData.vraag_tekst}
                onChange={(e) => handleInputChange('vraag_tekst', e.target.value)}
                placeholder="Stel je vraag hier..."
                required
              />
            </div>
            <div>
              <Label htmlFor="vraag_type">Type Vraag</Label>
              <Select value={formData.vraag_type} onValueChange={(value) => handleInputChange('vraag_type', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="enkelvoudig">Enkelvoudig (1 antwoord)</SelectItem>
                  <SelectItem value="meervoudig">Meervoudig (meerdere antwoorden)</SelectItem>
                  <SelectItem value="open">Open vraag</SelectItem>
                  <SelectItem value="audio">Audio vraag</SelectItem>
                  <SelectItem value="video">Video vraag</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {(formData.vraag_type === 'audio' || formData.vraag_type === 'video') && (
              <div>
                <Label htmlFor="media_file">Upload {formData.vraag_type === 'audio' ? 'Audio' : 'Video'} Bestand</Label>
                <Input
                  id="media_file"
                  type="file"
                  accept={formData.vraag_type === 'audio' ? 'audio/*' : 'video/*'}
                  className="cursor-pointer"
                />
              </div>
            )}
            
            {formData.vraag_type !== 'open' && formData.vraag_type !== 'audio' && formData.vraag_type !== 'video' && (
              <div>
                <Label>Antwoordopties</Label>
                {formData.opties.map((optie, index) => (
                  <Input
                    key={index}
                    value={optie}
                    onChange={(e) => handleArrayChange('opties', index, e.target.value)}
                    placeholder={`Optie ${index + 1}`}
                    className="mt-2"
                  />
                ))}
              </div>
            )}
            
            <div>
              <Label htmlFor="correct_antwoord">Correct Antwoord</Label>
              {formData.vraag_type === 'open' || formData.vraag_type === 'audio' || formData.vraag_type === 'video' ? (
                <Textarea
                  id="correct_antwoord"
                  value={formData.correct_antwoord}
                  onChange={(e) => handleInputChange('correct_antwoord', e.target.value)}
                  placeholder={
                    formData.vraag_type === 'open' 
                      ? "Het correcte antwoord..." 
                      : "Beschrijf het verwachte antwoord..."
                  }
                />
              ) : (
                <Select value={formData.correct_antwoord} onValueChange={(value) => handleInputChange('correct_antwoord', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer het correcte antwoord" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.opties.filter(opt => opt.trim() !== '').map((optie, index) => (
                      <SelectItem key={index} value={optie}>{optie}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        );

      case 'schedule':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="lesson_title">Les Titel</Label>
              <Input
                id="lesson_title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Bijv: Conversatie oefening"
                required
              />
            </div>
            <div>
              <Label htmlFor="datetime">Datum & Tijd</Label>
              <Input
                id="datetime"
                type="datetime-local"
                value={formData.live_lesson_datetime}
                onChange={(e) => handleInputChange('live_lesson_datetime', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="lesson_url">Meeting URL</Label>
              <Input
                id="lesson_url"
                value={formData.live_lesson_url}
                onChange={(e) => handleInputChange('live_lesson_url', e.target.value)}
                placeholder="https://meet.google.com/..."
                required
              />
            </div>
            <div>
              <Label htmlFor="deadline">Voorbereiding Deadline</Label>
              <Input
                id="deadline"
                type="datetime-local"
                value={formData.preparation_deadline}
                onChange={(e) => handleInputChange('preparation_deadline', e.target.value)}
              />
            </div>
          </div>
        );

      case 'upload':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="upload_title">Opname Titel</Label>
              <Input
                id="upload_title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Bijv: Les opname 15 maart"
                required
              />
            </div>
            <div>
              <Label htmlFor="upload_description">Beschrijving</Label>
              <Textarea
                id="upload_description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Korte beschrijving van de opname..."
              />
            </div>
            <div>
              <Label htmlFor="file">Upload Bestand</Label>
              <Input
                id="file"
                type="file"
                accept="video/*,audio/*"
                className="cursor-pointer"
              />
            </div>
          </div>
        );

      case 'task':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Titel</Label>
              <Input 
                id="task-title" 
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Voer taak titel in" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-description">Beschrijving</Label>
              <Textarea 
                id="task-description" 
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Voer taak beschrijving in" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-link">Link (optioneel)</Label>
              <Input id="task-link" placeholder="http://..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-youtube">YouTube Link (optioneel)</Label>
              <Input id="task-youtube" placeholder="https://youtube.com/..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-media">Audio/Video Upload (optioneel)</Label>
              <Input id="task-media" type="file" accept="audio/*,video/*" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-type">Type Inlevering</Label>
              <Select defaultValue="text">
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Tekst</SelectItem>
                  <SelectItem value="file">Bestand</SelectItem>
                  <SelectItem value="audio">Audio Opname</SelectItem>
                  <SelectItem value="video">Video Opname</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="grading-scale">Beoordelingsschaal</Label>
              <Input id="grading-scale" type="number" defaultValue="10" placeholder="Maximale punten" />
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <p className="text-center text-muted-foreground">
              Deze functie wordt binnenkort geïmplementeerd.
            </p>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      <DialogContent 
        className="sm:max-w-[500px]"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle>{getModalTitle()}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          {renderFormContent()}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuleren
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Bezig...' : 'Opslaan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
