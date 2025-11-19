import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adaptiveLearningService } from '@/services/adaptiveLearningService';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    functions: {
      invoke: vi.fn(),
    },
  },
}));

describe('adaptiveLearningService - PR13/F2', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getNextDifficulty', () => {
    it('recommends hard difficulty for high performers', async () => {
      // Mock high performance analytics
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            accuracy_rate: 0.92,
            weak_areas: [],
            strong_areas: ['grammar', 'vocabulary'],
          },
          error: null,
        }),
      } as any);

      // Mock practice sessions
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      } as any);

      const result = await adaptiveLearningService.getNextDifficulty(
        'student-1',
        'module-1'
      );

      expect(result.recommended_difficulty).toBe('hard');
      expect(result.confidence_score).toBeGreaterThan(0.8);
      expect(result.reasoning).toContain('High accuracy');
    });

    it('recommends easy difficulty for struggling students', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            accuracy_rate: 0.55,
            weak_areas: ['grammar', 'pronunciation'],
            strong_areas: [],
          },
          error: null,
        }),
      } as any);

      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      } as any);

      const result = await adaptiveLearningService.getNextDifficulty(
        'student-2',
        'module-1'
      );

      expect(result.recommended_difficulty).toBe('easy');
      expect(result.weak_areas).toHaveLength(2);
      expect(result.reasoning).toContain('foundational');
    });

    it('recommends medium difficulty for average students', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            accuracy_rate: 0.75,
            weak_areas: ['writing'],
            strong_areas: ['listening'],
          },
          error: null,
        }),
      } as any);

      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      } as any);

      const result = await adaptiveLearningService.getNextDifficulty(
        'student-3',
        'module-1'
      );

      expect(result.recommended_difficulty).toBe('medium');
      expect(result.confidence_score).toBeGreaterThan(0.7);
    });
  });

  describe('recordPracticeSession', () => {
    it('creates practice session and updates analytics', async () => {
      const mockSession = {
        id: 'session-1',
        student_id: 'student-1',
        questions_attempted: 10,
        questions_correct: 8,
      };

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockSession,
          error: null,
        }),
      } as any);

      // Mock analytics update
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      } as any);

      vi.mocked(supabase.from).mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      } as any);

      const result = await adaptiveLearningService.recordPracticeSession(
        'student-1',
        'solo',
        10,
        8,
        { test: true }
      );

      expect(result.student_id).toBe('student-1');
      expect(result.questions_correct).toBe(8);
    });
  });

  describe('analyzePerformanceAreas', () => {
    it('identifies weak and strong areas', async () => {
      const mockAnswers = [
        { is_correct: true, vraag: { topic: 'Grammar' } },
        { is_correct: true, vraag: { topic: 'Grammar' } },
        { is_correct: true, vraag: { topic: 'Grammar' } },
        { is_correct: false, vraag: { topic: 'Pronunciation' } },
        { is_correct: false, vraag: { topic: 'Pronunciation' } },
        { is_correct: false, vraag: { topic: 'Pronunciation' } },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: mockAnswers,
          error: null,
        }),
      } as any);

      vi.mocked(supabase.from).mockReturnValueOnce({
        upsert: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      } as any);

      const result = await adaptiveLearningService.analyzePerformanceAreas(
        'student-1',
        'module-1'
      );

      expect(result.strong_areas).toContain('Grammar');
      expect(result.weak_areas).toContain('Pronunciation');
    });
  });

  describe('getRecommendations', () => {
    it('provides recommendations based on analytics', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            weak_areas: ['Grammar', 'Writing'],
            accuracy_rate: 0.65,
          },
          error: null,
        }),
      } as any);

      const recommendations = await adaptiveLearningService.getRecommendations(
        'student-1',
        'module-1'
      );

      expect(recommendations).toContain('Focus on improving: Grammar');
      expect(recommendations).toContain('Focus on improving: Writing');
      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('provides starter recommendation for new students', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      } as any);

      const recommendations = await adaptiveLearningService.getRecommendations(
        'new-student',
        'module-1'
      );

      expect(recommendations).toContain('Start practicing to build your learning profile');
    });
  });
});
