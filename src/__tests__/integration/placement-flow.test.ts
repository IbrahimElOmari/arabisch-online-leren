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

describe('Placement Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should complete full placement test flow', async () => {
    const moduleId = 'module-1';
    const testId = 'test-1';
    
    // Step 1: Get placement test
    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: {
        test: {
          id: testId,
          module_id: moduleId,
          title: 'Placement Test',
          questions: [
            { question_text: 'Q1', question_type: 'multiple_choice', options: ['A', 'B'] },
            { question_text: 'Q2', question_type: 'multiple_choice', options: ['C', 'D'] }
          ]
        }
      },
      error: null
    });

    const test = await placementService.getPlacementTest(moduleId);
    expect(test).toBeDefined();
    expect(test?.questions).toHaveLength(2);

    // Step 2: Submit answers
    const answers = ['A', 'D'];
    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: {
        result: {
          id: 'result-1',
          score: 80,
          assigned_level_id: 'level-2'
        }
      },
      error: null
    });

    const result = await placementService.submitPlacementTest(testId, answers);
    expect(result.score).toBe(80);
    expect(result.assigned_level_id).toBe('level-2');

    // Step 3: Assign to class
    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: { success: true },
      error: null
    });

    await placementService.assignToClass(result.id, 'class-1');
    
    expect(supabase.functions.invoke).toHaveBeenCalledTimes(3);
  });

  it('should handle placement test errors gracefully', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: null,
      error: { message: 'Test not found' }
    });

    await expect(placementService.getPlacementTest('invalid-module')).rejects.toThrow();
  });
});
