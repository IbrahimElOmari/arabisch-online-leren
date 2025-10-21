import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

export interface Level {
  id: string;
  class_id: string;
  naam: string;
  beschrijving: string | null;
  niveau_nummer: number;
  is_actief: boolean | null;
  created_at: string;
  updated_at: string;
}

interface LevelState {
  levels: Level[];
  loading: boolean;
  error: string | null;

  fetchLevels: (classId: string) => Promise<void>;
  createLevel: (classId: string, name: string, niveauNummer: number, beschrijving?: string) => Promise<boolean>;
  updateLevel: (classId: string, levelId: string, updates: Partial<Level>) => Promise<boolean>;
  deleteLevel: (classId: string, levelId: string) => Promise<boolean>;
}

export const useLevelStore = create<LevelState>((set, get) => ({
  levels: [],
  loading: false,
  error: null,

  async fetchLevels(classId) {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('niveaus')
        .select('*')
        .eq('class_id', classId)
        .order('niveau_nummer', { ascending: true });
      if (error) throw error;
      set({ levels: data || [], loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  async createLevel(classId, name, niveauNummer, beschrijving) {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.functions.invoke('manage-level', {
        body: { action: 'create', classId, name, niveauNummer, beschrijving },
      });
      if (error) throw error;
      await get().fetchLevels(classId);
      return true;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      return false;
    }
  },

  /**
   * Update a level. Geef altijd de `classId` mee zodat `fetchLevels(classId)` kan worden aangeroepen,
   * ongeacht of het niveau momenteel in de store aanwezig is. Zo wordt de bug verholpen waarbij
   * een update niets doet als `levels` leeg is.
   */
  async updateLevel(classId, levelId, updates) {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.functions.invoke('manage-level', {
        body: {
          action: 'update',
          levelId,
          newName: updates.naam,
          beschrijving: updates.beschrijving,
          niveauNummer: updates.niveau_nummer,
          isActief: updates.is_actief,
        },
      });
      if (error) throw error;
      // Na een update altijd opnieuw laden
      await get().fetchLevels(classId);
      return true;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      return false;
    }
  },

  async deleteLevel(classId, levelId) {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.functions.invoke('manage-level', {
        body: { action: 'delete', levelId },
      });
      if (error) throw error;
      await get().fetchLevels(classId);
      return true;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      return false;
    }
  },
}));