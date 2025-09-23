import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, UserPlus, Users, MessageSquare } from 'lucide-react';
import { ClassManagementModal } from './ClassManagementModal';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { useTranslation } from '@/contexts/TranslationContext';
import { ResponsiveForm, ResponsiveFormField } from '@/components/forms/ResponsiveForm';

interface AdminModalProps {
  trigger: React.ReactNode;
  type: 'create_class' | 'assign_teacher' | 'manage_users' | 'forum_moderation' | 'manage_classes';
}

interface Teacher {
  id: string;
  full_name: string;
  email: string;
}

interface User {
  id: string;
  full_name: string;
  role: string;
  email: string;
}

interface ClassData {
  id: string;
  name: string;
  teacher_id: string | null;
}

export function AdminModal({ trigger, type }: AdminModalProps) {
  const [open, setOpen] = useState(false);
  const { getFlexDirection, getTextAlign, isRTL } = useRTLLayout();
  const { t } = useTranslation();
  
  // Handle class management modal separately
  if (type === 'manage_classes') {
    return (
      <>
        <div onClick={() => setOpen(true)}>
          {trigger}
        </div>
        <ClassManagementModal isOpen={open} onClose={() => setOpen(false)} />
      </>
    );
  }
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    teacher_id: '',
    class_id: '',
    user_id: '',
    role: 'leerling'
  });

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, type]);

  const loadData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-manage-classes', {
        body: { 
          action: type === 'assign_teacher' ? 'get_teachers' : 'get_users'
        }
      });

      if (error) throw error;

      if (type === 'assign_teacher') {
        setTeachers(data || []);
        // Also load classes
        const { data: classData, error: classError } = await supabase
          .from('klassen')
          .select('id, name, teacher_id')
          .order('name');
        
        if (classError) throw classError;
        setClasses(classData || []);
      } else if (type === 'manage_users') {
        setUsers(data || []);
      }
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || 'Er is een fout opgetreden',
        variant: 'destructive'
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let action = '';
      let payload = {};

      switch (type) {
        case 'create_class':
          action = 'create_class';
          payload = {
            name: formData.name,
            description: formData.description,
            teacher_id: formData.teacher_id || null
          };
          break;
        case 'assign_teacher':
          action = 'assign_teacher';
          payload = {
            class_id: formData.class_id,
            teacher_id: formData.teacher_id
          };
          break;
        case 'manage_users':
          action = 'update_user_role';
          payload = {
            user_id: formData.user_id,
            role: formData.role
          };
          break;
        default:
          throw new Error('Unsupported action type');
      }

      const { data, error } = await supabase.functions.invoke('admin-manage-classes', {
        body: { action, ...payload }
      });

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: getSuccessMessage(type)
      });

      setOpen(false);
      setFormData({
        name: '',
        description: '',
        teacher_id: '',
        class_id: '',
        user_id: '',
        role: 'leerling'
      });

      // Reload page to show changes
      window.location.reload();

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
      case 'create_class': return 'Nieuwe klas succesvol aangemaakt';
      case 'assign_teacher': return 'Leerkracht succesvol toegewezen';
      case 'manage_users': return 'Gebruikersrol succesvol bijgewerkt';
      default: return 'Actie succesvol uitgevoerd';
    }
  };

  const getModalTitle = () => {
    switch (type) {
      case 'create_class': return 'Nieuwe Klas Maken';
      case 'assign_teacher': return 'Leerkracht Toewijzen';
      case 'manage_users': return 'Gebruikersbeheer';
      case 'forum_moderation': return 'Forum Moderatie';
      default: return 'Admin Actie';
    }
  };

  const renderFormContent = () => {
    switch (type) {
      case 'create_class':
        return (
          <ResponsiveForm layout="single" onSubmit={(e) => { e.preventDefault(); handleSubmit(e); }}>
            <ResponsiveFormField
              label="Klas Naam"
              name="name"
              type="text"
              placeholder="Bijv: Arabisch voor Beginners"
              required
              value={formData.name}
              onChange={(value) => handleInputChange('name', value)}
            />
            <ResponsiveFormField
              label="Beschrijving"
              name="description"
              type="textarea"
              placeholder="Korte beschrijving van de klas..."
              value={formData.description}
              onChange={(value) => handleInputChange('description', value)}
            />
            <div className="w-full">
              <label className={`text-sm font-medium mb-2 block ${isRTL ? 'arabic-text text-right' : 'text-left'}`}>
                Leerkracht (optioneel)
              </label>
              <Select value={formData.teacher_id} onValueChange={(value) => handleInputChange('teacher_id', value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecteer een leerkracht" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.full_name} ({teacher.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </ResponsiveForm>
        );

      case 'assign_teacher':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="class_id">Klas</Label>
              <Select value={formData.class_id} onValueChange={(value) => handleInputChange('class_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer een klas" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((klas) => (
                    <SelectItem key={klas.id} value={klas.id}>
                      {klas.name} {klas.teacher_id ? '(Heeft al een leerkracht)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="teacher_id">Leerkracht</Label>
              <Select value={formData.teacher_id} onValueChange={(value) => handleInputChange('teacher_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer een leerkracht" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.full_name} ({teacher.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'manage_users':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="user_id">Gebruiker</Label>
              <Select value={formData.user_id} onValueChange={(value) => handleInputChange('user_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer een gebruiker" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name} ({user.email}) - {user.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="role">Nieuwe Rol</Label>
              <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="leerling">Leerling</SelectItem>
                  <SelectItem value="leerkracht">Leerkracht</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'forum_moderation':
        return (
          <div className="space-y-4">
            <p className="text-center text-muted-foreground">
              Forum moderatie functionaliteiten zijn beschikbaar in het dashboard.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className={`${getTextAlign()} ${isRTL ? 'arabic-text' : ''}`}>{getModalTitle()}</DialogTitle>
        </DialogHeader>
        {type !== 'forum_moderation' ? (
          <form onSubmit={handleSubmit}>
            {renderFormContent()}
            <div className={`${getFlexDirection()} justify-end space-x-2 pt-4`}>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {t('form.cancel')}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? t('form.loading') : t('form.save')}
              </Button>
            </div>
          </form>
        ) : (
          <div className={`${getFlexDirection()} justify-end pt-4`}>
            <Button onClick={() => setOpen(false)}>{t('form.close')}</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}