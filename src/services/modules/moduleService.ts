import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { Module, ModuleClass, ModuleLevel } from '@/types/modules';

export const moduleService = {
  async listActiveModules(): Promise<Module[]> {
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Failed to fetch active modules', {}, error as Error);
      throw error;
    }
  },

  async getModuleById(id: string): Promise<Module | null> {
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to fetch module', { id }, error as Error);
      throw error;
    }
  },

  async getModuleClasses(moduleId: string): Promise<ModuleClass[]> {
    try {
      const { data, error } = await supabase
        .from('module_classes')
        .select('*')
        .eq('module_id', moduleId)
        .eq('is_active', true)
        .order('class_name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Failed to fetch module classes', { moduleId }, error as Error);
      throw error;
    }
  },

  async getModuleLevels(moduleId: string): Promise<ModuleLevel[]> {
    try {
      const { data, error } = await supabase
        .from('module_levels')
        .select('*')
        .eq('module_id', moduleId)
        .order('sequence_order');

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Failed to fetch module levels', { moduleId }, error as Error);
      throw error;
    }
  },

  // Admin functions
  async createModule(module: Omit<Module, 'id' | 'created_at' | 'updated_at'>): Promise<Module> {
    try {
      const { data, error } = await supabase
        .from('modules')
        .insert(module)
        .select()
        .single();

      if (error) throw error;
      logger.info('Module created', { moduleId: data.id });
      return data;
    } catch (error) {
      logger.error('Failed to create module', {}, error as Error);
      throw error;
    }
  },

  async updateModule(id: string, updates: Partial<Module>): Promise<Module> {
    try {
      const { data, error } = await supabase
        .from('modules')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      logger.info('Module updated', { moduleId: id });
      return data;
    } catch (error) {
      logger.error('Failed to update module', { id }, error as Error);
      throw error;
    }
  },

  async createModuleClass(moduleClass: Omit<ModuleClass, 'id' | 'created_at' | 'current_enrollment'>): Promise<ModuleClass> {
    try {
      const { data, error } = await supabase
        .from('module_classes')
        .insert(moduleClass)
        .select()
        .single();

      if (error) throw error;
      logger.info('Module class created', { classId: data.id });
      return data;
    } catch (error) {
      logger.error('Failed to create module class', {}, error as Error);
      throw error;
    }
  },

  async createModuleLevel(moduleLevel: Omit<ModuleLevel, 'id' | 'created_at'>): Promise<ModuleLevel> {
    try {
      const { data, error } = await supabase
        .from('module_levels')
        .insert(moduleLevel)
        .select()
        .single();

      if (error) throw error;
      logger.info('Module level created', { levelId: data.id });
      return data;
    } catch (error) {
      logger.error('Failed to create module level', {}, error as Error);
      throw error;
    }
  }
};
