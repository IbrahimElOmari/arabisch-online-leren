import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

interface Class {
  id: string;
  name: string;
  description?: string;
  teacher_id?: string;
  created_at: string;
  updated_at: string;
}

interface Level {
  id: string;
  class_id: string;
  naam: string;
  beschrijving?: string;
  niveau_nummer: number;
  is_actief: boolean;
  created_at: string;
  updated_at: string;
}

interface Student {
  id: string;
  full_name: string;
  email?: string;
  role: string;
  created_at: string;
}

interface AdminState {
  classes: Class[];
  levels: Level[];
  students: Student[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchClasses: () => Promise<void>;
  createClass: (name: string, description?: string, teacherId?: string) => Promise<boolean>;
  updateClass: (classId: string, updates: Partial<Class>) => Promise<boolean>;
  deleteClass: (classId: string) => Promise<boolean>;
  
  fetchLevels: (classId: string) => Promise<void>;
  createLevel: (classId: string, name: string, niveauNummer: number, beschrijving?: string) => Promise<boolean>;
  updateLevel: (levelId: string, updates: Partial<Level>) => Promise<boolean>;
  deleteLevel: (levelId: string) => Promise<boolean>;
  
  fetchStudents: () => Promise<void>;
  assignStudent: (studentId: string, classId: string) => Promise<boolean>;
  removeStudent: (studentId: string, classId: string) => Promise<boolean>;
  sendBulkNotification: (userIds: string[], message: string) => Promise<boolean>;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  classes: [],
  levels: [],
  students: [],
  loading: false,
  error: null,

  fetchClasses: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('klassen')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ classes: data || [], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createClass: async (name: string, description?: string, teacherId?: string) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.functions.invoke('manage-class', {
        body: { 
          action: 'create', 
          name, 
          description, 
          teacherId 
        }
      });

      if (error) throw error;
      
      // Refresh classes
      await get().fetchClasses();
      return true;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return false;
    }
  },

  updateClass: async (classId: string, updates: Partial<Class>) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.functions.invoke('manage-class', {
        body: { 
          action: 'update', 
          classId,
          newName: updates.name,
          description: updates.description,
          teacherId: updates.teacher_id
        }
      });

      if (error) throw error;
      
      // Refresh classes
      await get().fetchClasses();
      return true;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return false;
    }
  },

  deleteClass: async (classId: string) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.functions.invoke('manage-class', {
        body: { action: 'delete', classId }
      });

      if (error) throw error;
      
      // Refresh classes
      await get().fetchClasses();
      return true;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return false;
    }
  },

  fetchLevels: async (classId: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('niveaus')
        .select('*')
        .eq('class_id', classId)
        .order('niveau_nummer', { ascending: true });

      if (error) throw error;
      set({ levels: data || [], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createLevel: async (classId: string, name: string, niveauNummer: number, beschrijving?: string) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.functions.invoke('manage-level', {
        body: { 
          action: 'create', 
          classId, 
          name, 
          niveauNummer, 
          beschrijving 
        }
      });

      if (error) throw error;
      
      // Refresh levels
      await get().fetchLevels(classId);
      return true;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return false;
    }
  },

  updateLevel: async (levelId: string, updates: Partial<Level>) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.functions.invoke('manage-level', {
        body: { 
          action: 'update', 
          levelId,
          newName: updates.naam,
          beschrijving: updates.beschrijving,
          niveauNummer: updates.niveau_nummer,
          isActief: updates.is_actief
        }
      });

      if (error) throw error;
      
      // Find the class_id to refresh levels
      const level = get().levels.find(l => l.id === levelId);
      if (level) {
        await get().fetchLevels(level.class_id);
      }
      return true;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return false;
    }
  },

  deleteLevel: async (levelId: string) => {
    set({ loading: true, error: null });
    try {
      const level = get().levels.find(l => l.id === levelId);
      const classId = level?.class_id;

      const { error } = await supabase.functions.invoke('manage-level', {
        body: { action: 'delete', levelId }
      });

      if (error) throw error;
      
      // Refresh levels
      if (classId) {
        await get().fetchLevels(classId);
      }
      return true;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return false;
    }
  },

  fetchStudents: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'leerling')
        .order('full_name', { ascending: true });

      if (error) throw error;
      set({ students: data || [], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  assignStudent: async (studentId: string, classId: string) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.functions.invoke('manage-enrollment', {
        body: { action: 'assign-student', studentId, classId }
      });

      if (error) throw error;
      set({ loading: false });
      return true;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return false;
    }
  },

  removeStudent: async (studentId: string, classId: string) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.functions.invoke('manage-enrollment', {
        body: { action: 'remove-student', studentId, classId }
      });

      if (error) throw error;
      set({ loading: false });
      return true;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return false;
    }
  },

  sendBulkNotification: async (userIds: string[], message: string) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.functions.invoke('manage-enrollment', {
        body: { action: 'create-bulk-notification', userIds, message }
      });

      if (error) throw error;
      set({ loading: false });
      return true;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return false;
    }
  }
}));