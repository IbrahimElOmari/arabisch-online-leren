import { supabase } from '@/integrations/supabase/client';
import type { PlacementTest, PlacementResult } from '@/types/placement';

export const placementService = {
  async getPlacementTest(moduleId: string): Promise<PlacementTest | null> {
    const { data, error } = await supabase
      .from('placement_tests')
      .select('*')
      .eq('module_id', moduleId)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  },

  async submitPlacementTest(
    enrollmentId: string,
    testId: string,
    answers: any[]
  ): Promise<PlacementResult> {
    const { data, error } = await supabase.functions.invoke('placement-grade', {
      body: {
        enrollment_id: enrollmentId,
        placement_test_id: testId,
        answers
      }
    });

    if (error) {
      throw new Error(error.message || 'Failed to submit placement test');
    }

    return data.result;
  },

  async assignClass(enrollmentId: string): Promise<any> {
    const { data, error } = await supabase.functions.invoke('placement-assign-class', {
      body: { enrollment_id: enrollmentId }
    });

    if (error) {
      throw new Error(error.message || 'Failed to assign class');
    }

    return data;
  },

  async getPlacementResult(testId: string): Promise<PlacementResult | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('placement_results')
      .select('*')
      .eq('student_id', user.id)
      .eq('placement_test_id', testId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getWaitingListStatus(enrollmentId: string): Promise<any> {
    const { data, error } = await supabase
      .from('waiting_list')
      .select('*')
      .eq('enrollment_id', enrollmentId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }
};