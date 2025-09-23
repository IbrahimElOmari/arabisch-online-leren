import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

export interface Student {
  id: string;
  full_name: string;
  email?: string;
  role: string;
  created_at: string;
}

interface StudentState {
  students: Student[];
  loading: boolean;
  error: string | null;

  fetchStudents: () => Promise<void>;
  assignStudent: (studentId: string, classId: string) => Promise<boolean>;
  removeStudent: (studentId: string, classId: string) => Promise<boolean>;
  sendBulkNotification: (userIds: string[], message: string) => Promise<boolean>;
}

export const useStudentStore = create<StudentState>((set) => ({
  students: [],
  loading: false,
  error: null,

  async fetchStudents() {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'leerling')
        .order('full_name', { ascending: true });
      if (error) throw error;
      set({ students: data || [], loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  async assignStudent(studentId, classId) {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.functions.invoke('manage-enrollment', {
        body: { action: 'assign-student', studentId, classId },
      });
      if (error) throw error;
      set({ loading: false });
      return true;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      return false;
    }
  },

  async removeStudent(studentId, classId) {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.functions.invoke('manage-enrollment', {
        body: { action: 'remove-student', studentId, classId },
      });
      if (error) throw error;
      set({ loading: false });
      return true;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      return false;
    }
  },

  async sendBulkNotification(userIds, message) {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.functions.invoke('manage-enrollment', {
        body: { action: 'create-bulk-notification', userIds, message },
      });
      if (error) throw error;
      set({ loading: false });
      return true;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      return false;
    }
  },
}));