import { describe, it, expect, vi, beforeEach } from 'vitest';
import { placementService } from '@/services/placementService';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn()
    }
  }
}));

describe('placementService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPlacementTest', () => {
    it('should fetch placement test for module', async () => {
      const mockTest = {
        id: 'test-1',
        module_id: 'module-1',
        title: 'Placement Test',
        questions: []
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { test: mockTest },
        error: null
      });

      const result = await placementService.getPlacementTest('module-1');
      
      expect(result).toEqual(mockTest);
      expect(supabase.functions.invoke).toHaveBeenCalledWith('placement-test', {
        body: { module_id: 'module-1' }
      });
    });
  });

  describe('submitPlacementTest', () => {
    it('should submit test answers and return result', async () => {
      const testId = 'test-1';
      const answers = ['A', 'B', 'C'];
      const mockResult = {
        id: 'result-1',
        score: 75,
        assigned_level_id: 'level-2'
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { result: mockResult },
        error: null
      });

      const result = await placementService.submitPlacementTest('enrollment-1', testId, answers);
      
      expect(result).toEqual(mockResult);
      expect(supabase.functions.invoke).toHaveBeenCalledWith('placement-grade', {
        body: {
          placement_test_id: testId,
          answers
        }
      });
    });
  });

  describe('assignClass', () => {
    it('should assign student to class based on enrollment', async () => {
      const enrollmentId = 'enrollment-1';

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { success: true },
        error: null
      });

      await placementService.assignClass(enrollmentId);
      
      expect(supabase.functions.invoke).toHaveBeenCalledWith('placement-assign-class', {
        body: {
          enrollment_id: enrollmentId
        }
      });
    });
  });
});
