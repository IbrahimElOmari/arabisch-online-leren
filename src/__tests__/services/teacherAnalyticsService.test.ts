import { describe, it, expect, vi, beforeEach } from 'vitest';
import { teacherAnalyticsService } from '@/services/teacherAnalyticsService';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(),
    })),
  },
}));

describe('TeacherAnalyticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getClassAnalytics', () => {
    it('should return class analytics summary', async () => {
      // Mock enrollments query
      const enrollmentsMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ 
          data: [{ student_id: 'student-1' }, { student_id: 'student-2' }], 
          error: null 
        }),
      };

      // Mock sessions query
      const sessionsMock = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValue({ 
          data: [{ student_id: 'student-1' }], 
          error: null 
        }),
      };

      // Mock answers query
      const answersMock = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        not: vi.fn().mockResolvedValue({ 
          data: [
            { punten: 80, is_correct: true },
            { punten: 70, is_correct: true },
            { punten: 60, is_correct: false },
          ], 
          error: null 
        }),
      };

      // Mock time sessions
      const timeSessionsMock = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        not: vi.fn().mockResolvedValue({ 
          data: [
            { started_at: '2024-01-01T10:00:00Z', ended_at: '2024-01-01T11:00:00Z' },
          ], 
          error: null 
        }),
      };

      vi.mocked(supabase.from)
        .mockReturnValueOnce(enrollmentsMock as any)
        .mockReturnValueOnce(sessionsMock as any)
        .mockReturnValueOnce(answersMock as any)
        .mockReturnValueOnce(timeSessionsMock as any);

      const result = await teacherAnalyticsService.getClassAnalytics('class-1');
      
      expect(result.totalStudents).toBe(2);
      expect(result.activeStudents).toBe(1);
      expect(result.averageProgress).toBe(65); // Mock value
      expect(typeof result.averageGrade).toBe('number');
      expect(typeof result.completionRate).toBe('number');
    });

    it('should handle empty class', async () => {
      const emptyMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(emptyMock as any);

      const result = await teacherAnalyticsService.getClassAnalytics('empty-class');
      
      expect(result.totalStudents).toBe(0);
    });
  });

  describe('getStudentPerformance', () => {
    it('should return performance data for all enrolled students', async () => {
      const enrollmentsMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ 
          data: [
            { student_id: 'student-1', profiles: { id: 'student-1', email: 'student1@test.com' } },
          ], 
          error: null 
        }),
      };

      const answersMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ 
          data: [{ punten: 85, is_correct: true }], 
          error: null 
        }),
      };

      const sessionsMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        not: vi.fn().mockResolvedValue({ 
          data: [
            { started_at: '2024-01-01T10:00:00Z', ended_at: '2024-01-01T10:30:00Z' },
          ], 
          error: null 
        }),
      };

      const lastActivityMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ 
          data: { started_at: '2024-01-15T10:00:00Z' }, 
          error: null 
        }),
      };

      const analyticsMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ 
          data: { weak_areas: ['grammar'], strong_areas: ['vocabulary'] }, 
          error: null 
        }),
      };

      const lessonsMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ 
          data: [{ id: 'lesson-1' }], 
          error: null 
        }),
      };

      const attendanceMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ 
          data: [{ status: 'present' }], 
          error: null 
        }),
      };

      vi.mocked(supabase.from)
        .mockReturnValueOnce(enrollmentsMock as any)
        .mockReturnValueOnce(answersMock as any)
        .mockReturnValueOnce(sessionsMock as any)
        .mockReturnValueOnce(lastActivityMock as any)
        .mockReturnValueOnce(analyticsMock as any)
        .mockReturnValueOnce(lessonsMock as any)
        .mockReturnValueOnce(attendanceMock as any);

      const result = await teacherAnalyticsService.getStudentPerformance('class-1');
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('student-1');
      expect(result[0].struggling_areas).toContain('grammar');
      expect(result[0].strengths).toContain('vocabulary');
    });
  });

  describe('getPerformanceHeatmap', () => {
    it('should generate heatmap data from answers', async () => {
      const enrollmentsMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ 
          data: [{ student_id: 'student-1' }], 
          error: null 
        }),
      };

      const answersMock = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ 
          data: [
            { is_correct: true, vraag: { vraag_type: 'multiple_choice' } },
            { is_correct: true, vraag: { vraag_type: 'multiple_choice' } },
            { is_correct: false, vraag: { vraag_type: 'multiple_choice' } },
          ], 
          error: null 
        }),
      };

      vi.mocked(supabase.from)
        .mockReturnValueOnce(enrollmentsMock as any)
        .mockReturnValueOnce(answersMock as any);

      const result = await teacherAnalyticsService.getPerformanceHeatmap('class-1');
      
      expect(result).toBeInstanceOf(Array);
      result.forEach(item => {
        expect(item).toHaveProperty('topic');
        expect(item).toHaveProperty('difficulty');
        expect(item).toHaveProperty('success_rate');
        expect(item).toHaveProperty('attempt_count');
      });
    });
  });

  describe('getActivityTrends', () => {
    it('should return daily activity trends', async () => {
      const enrollmentsMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ 
          data: [{ student_id: 'student-1' }], 
          error: null 
        }),
      };

      const sessionsMock = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ 
          data: [
            { 
              student_id: 'student-1', 
              started_at: '2024-01-15T10:00:00Z',
              questions_attempted: 10,
              questions_correct: 8,
            },
          ], 
          error: null 
        }),
      };

      vi.mocked(supabase.from)
        .mockReturnValueOnce(enrollmentsMock as any)
        .mockReturnValueOnce(sessionsMock as any);

      const result = await teacherAnalyticsService.getActivityTrends('class-1', 30);
      
      expect(result).toBeInstanceOf(Array);
      result.forEach(item => {
        expect(item).toHaveProperty('date');
        expect(item).toHaveProperty('active_students');
        expect(item).toHaveProperty('questions_answered');
        expect(item).toHaveProperty('average_accuracy');
      });
    });
  });

  describe('exportAnalytics', () => {
    it('should return CSV blob', async () => {
      // Mock getStudentPerformance internally
      const enrollmentsMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(enrollmentsMock as any);

      const result = await teacherAnalyticsService.exportAnalytics('class-1');
      
      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('text/csv;charset=utf-8;');
    });
  });
});
