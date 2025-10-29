import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { PlacementTest, PlacementResult, ModuleLevel } from '@/types/modules';

export const placementService = {
  async getPlacementTest(moduleId: string): Promise<PlacementTest | null> {
    try {
      const { data, error } = await supabase
        .from('placement_tests')
        .select('*')
        .eq('module_id', moduleId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      logger.error('Failed to fetch placement test', { moduleId }, error as Error);
      throw error;
    }
  },

  async submitPlacementTest(
    studentId: string,
    testId: string,
    answers: any[]
  ): Promise<PlacementResult> {
    try {
      // Calculate score
      const test = await this.getTestById(testId);
      if (!test) throw new Error('Test not found');

      const score = this.calculateScore(test.questions, answers);

      // Create result
      const result: Omit<PlacementResult, 'id' | 'completed_at'> = {
        student_id: studentId,
        placement_test_id: testId,
        score,
        assigned_level_id: null,
        answers
      };

      const { data, error } = await supabase
        .from('placement_results')
        .insert(result)
        .select()
        .single();

      if (error) throw error;
      logger.info('Placement test submitted', { studentId, testId, score });
      return data;
    } catch (error) {
      logger.error('Failed to submit placement test', { studentId, testId }, error as Error);
      throw error;
    }
  },

  async assignLevelBasedOnScore(
    resultId: string,
    score: number,
    levelRanges: Record<string, any>,
    moduleLevels: ModuleLevel[]
  ): Promise<string> {
    try {
      // Find appropriate level based on score
      let assignedLevelId: string | null = null;

      for (const [levelCode, range] of Object.entries(levelRanges)) {
        const { min, max } = range as { min: number; max: number };
        if (score >= min && score <= max) {
          const level = moduleLevels.find(l => l.level_code === levelCode);
          if (level) {
            assignedLevelId = level.id;
            break;
          }
        }
      }

      if (!assignedLevelId) {
        // Default to first level if no match
        assignedLevelId = moduleLevels[0]?.id || null;
      }

      // Update result
      const { error } = await supabase
        .from('placement_results')
        .update({ assigned_level_id: assignedLevelId })
        .eq('id', resultId);

      if (error) throw error;
      
      logger.info('Level assigned', { resultId, assignedLevelId, score });
      return assignedLevelId!;
    } catch (error) {
      logger.error('Failed to assign level', { resultId }, error as Error);
      throw error;
    }
  },

  async getTestById(id: string): Promise<PlacementTest | null> {
    const { data, error } = await supabase
      .from('placement_tests')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  calculateScore(questions: any[], answers: any[]): number {
    let correct = 0;
    questions.forEach((q, index) => {
      const answer = answers[index];
      if (this.isCorrectAnswer(q, answer)) {
        correct++;
      }
    });
    return Math.round((correct / questions.length) * 100);
  },

  isCorrectAnswer(question: any, answer: any): boolean {
    // Simple comparison for now
    return JSON.stringify(question.correct_answer) === JSON.stringify(answer);
  }
};
