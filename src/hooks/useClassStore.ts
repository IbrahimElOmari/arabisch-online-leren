import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

export interface Class {
  id: string;
  name: string;
  description?: string;
  teacher_id?: string;
  created_at: string;
  updated_at: string;
}

interface ClassState {
  classes: Class[];
  loading: boolean;
  error: string | null;

  fetchClasses: () => Promise<void>;
  createClass: (name: string, description?: string, teacherId?: string) => Promise<boolean>;
  updateClass: (classId: string, updates: Partial<Class>) => Promise<boolean>;
  deleteClass: (classId: string) => Promise<boolean>;
}

export const useClassStore = create<ClassState>((set, get) => ({
  classes: [],
  loading: false,
  error: null,

  async fetchClasses() {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('klassen')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      set({ classes: data || [], loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  async createClass(name, description, teacherId) {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.functions.invoke('manage-class', {
        body: { action: 'create', name, description, teacherId },
      });
      if (error) throw error;
      await get().fetchClasses();
      return true;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      return false;
    }
  },

  async updateClass(classId, updates) {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.functions.invoke('manage-class', {
        body: {
          action: 'update',
          classId,
          newName: updates.name,
          description: updates.description,
          teacherId: updates.teacher_id,
        },
      });
      if (error) throw error;
      await get().fetchClasses();
      return true;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      return false;
    }
  },

  async deleteClass(classId) {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.functions.invoke('manage-class', {
        body: { action: 'delete', classId },
      });
      if (error) throw error;
      await get().fetchClasses();
      return true;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      return false;
    }
  },
}));