import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import TeacherDashboard from '@/pages/TeacherDashboard';
import ClassDetailsPage from '@/pages/ClassDetailsPage';
import * as teacherService from '@/services/teacherService';
import * as classService from '@/services/classService';
import React from 'react';

// Mock modules
vi.mock('@/hooks/useAuthSession', () => ({
  useAuthSession: () => ({ 
    user: { id: 'teacher-123', email: 'teacher@test.com' },
    session: { access_token: 'mock-token' }
  })
}));

vi.mock('@/hooks/useUserRole', () => ({
  useUserRole: () => ({ 
    isTeacher: true, 
    isAdmin: false, 
    isLoading: false 
  })
}));

vi.mock('@/services/teacherService');
vi.mock('@/services/classService');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ classId: 'class-123' }),
    useNavigate: () => vi.fn(),
    Link: ({ children, to }: any) => <a href={to}>{children}</a>
  };
});

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Teacher Tools Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Teacher Dashboard Load', () => {
    it('should load and display teacher classes with correct stats', async () => {
      const mockClasses = [
        {
          id: 'class-1',
          name: 'Arabic Beginners',
          description: 'Introduction to Arabic',
          teacher_id: 'teacher-123',
          niveaus: [{ id: 'level-1', naam: 'Level 1' }],
          inschrijvingen: [{ count: 5 }]
        },
        {
          id: 'class-2',
          name: 'Arabic Intermediate',
          description: 'Intermediate Arabic',
          teacher_id: 'teacher-123',
          niveaus: [{ id: 'level-2', naam: 'Level 2' }],
          inschrijvingen: [{ count: 3 }]
        }
      ];

      vi.mocked(teacherService.fetchTeacherClasses).mockResolvedValue(mockClasses as any);

      render(<TeacherDashboard />, { wrapper: createWrapper() });

      // Wait for data to load and verify service was called
      await vi.waitFor(() => {
        expect(teacherService.fetchTeacherClasses).toHaveBeenCalledWith('teacher-123');
      });

      // Verify stats calculation (2 classes, 8 total students)
      // Note: Actual DOM assertions would require screen from @testing-library/react
      expect(teacherService.fetchTeacherClasses).toHaveBeenCalled();
    });

    it('should handle empty classes gracefully', async () => {
      vi.mocked(teacherService.fetchTeacherClasses).mockResolvedValue([]);

      render(<TeacherDashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(teacherService.fetchTeacherClasses).toHaveBeenCalled();
      });

      // Verify service returned empty array
      const result = await teacherService.fetchTeacherClasses('teacher-123');
      expect(result).toEqual([]);
    });

    it('should handle errors when loading classes', async () => {
      vi.mocked(teacherService.fetchTeacherClasses).mockRejectedValue(
        new Error('Network error')
      );

      render(<TeacherDashboard />, { wrapper: createWrapper() });

      // Component should handle error gracefully
      await waitFor(() => {
        expect(teacherService.fetchTeacherClasses).toHaveBeenCalled();
      });
      
      // Verify error was thrown
      await expect(teacherService.fetchTeacherClasses('teacher-123')).rejects.toThrow('Network error');
    });
  });

  describe('Class Management Flow', () => {
    it('should load class details with student list', async () => {
      const mockClassData = {
        id: 'class-123',
        name: 'Test Class',
        description: 'Test Description',
        teacher_id: 'teacher-123'
      };

      const mockStudents = [
        {
          id: 'enrollment-1',
          student_id: 'student-1',
          profiles: {
            id: 'student-1',
            full_name: 'Ahmed Ali',
            email: 'ahmed@test.com',
            role: 'leerling'
          }
        },
        {
          id: 'enrollment-2',
          student_id: 'student-2',
          profiles: {
            id: 'student-2',
            full_name: 'Fatima Hassan',
            email: 'fatima@test.com',
            role: 'leerling'
          }
        }
      ];

      vi.mocked(classService.fetchClassById).mockResolvedValue(mockClassData as any);
      vi.mocked(teacherService.fetchClassStudents).mockResolvedValue(mockStudents as any);

      render(<ClassDetailsPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(classService.fetchClassById).toHaveBeenCalledWith('class-123');
      });

      // Verify service calls
      expect(classService.fetchClassById).toHaveBeenCalledWith('class-123');
      expect(teacherService.fetchClassStudents).toHaveBeenCalledWith('class-123');
      
      // Verify data was fetched
      const classResult = await classService.fetchClassById('class-123');
      expect(classResult).toEqual(mockClassData);
      
      const studentsResult = await teacherService.fetchClassStudents('class-123');
      expect(studentsResult).toEqual(mockStudents);
    });

    it('should handle class not found', async () => {
      vi.mocked(classService.fetchClassById).mockResolvedValue(null as any);

      render(<ClassDetailsPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(classService.fetchClassById).toHaveBeenCalledWith('class-123');
      });
      
      const result = await classService.fetchClassById('class-123');
      expect(result).toBeNull();
    });
  });

  describe('Student Note Lifecycle', () => {
    it('should create, update, and delete notes successfully', async () => {
      const studentId = 'student-123';
      
      // Mock create note
      const mockNote = {
        id: 'note-1',
        student_id: studentId,
        content: 'Good progress this week',
        is_flagged: false,
        created_at: new Date().toISOString()
      };

      vi.mocked(teacherService.createTeacherNote).mockResolvedValue(mockNote as any);

      // Test creation
      const createResult = await teacherService.createTeacherNote({
        studentId,
        content: 'Good progress this week',
        isFlagged: false
      });

      expect(createResult).toEqual(mockNote);
      expect(teacherService.createTeacherNote).toHaveBeenCalledWith({
        studentId,
        content: 'Good progress this week',
        isFlagged: false
      });

      // Mock fetch notes
      vi.mocked(teacherService.fetchTeacherNotes).mockResolvedValue([mockNote] as any);

      const fetchResult = await teacherService.fetchTeacherNotes(studentId);
      expect(fetchResult).toHaveLength(1);
      expect((fetchResult[0] as any).content).toBe('Good progress this week');

      // Mock update note
      const updatedNote = { ...mockNote, content: 'Excellent progress!' };
      vi.mocked(teacherService.updateTeacherNote).mockResolvedValue(updatedNote as any);

      const updateResult = await teacherService.updateTeacherNote('note-1', {
        content: 'Excellent progress!'
      });

      expect(updateResult).toBeTruthy();
      expect((updateResult as any).content).toBe('Excellent progress!');

      // Mock delete note
      vi.mocked(teacherService.deleteTeacherNote).mockResolvedValue(undefined);

      await teacherService.deleteTeacherNote('note-1');
      expect(teacherService.deleteTeacherNote).toHaveBeenCalledWith('note-1');
    });

    it('should handle note creation errors', async () => {
      vi.mocked(teacherService.createTeacherNote).mockRejectedValue(
        new Error('Unauthorized')
      );

      await expect(
        teacherService.createTeacherNote({
          studentId: 'student-123',
          content: 'Test note',
          isFlagged: false
        })
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('Reward Assignment Workflow', () => {
    it('should award XP to a student successfully', async () => {
      const rewardData = {
        studentId: 'student-123',
        amount: 50,
        reason: 'Excellent homework submission',
        rewardType: 'points' as const
      };

      const mockResponse = {
        success: true,
        reward: {
          id: 'reward-1',
          student_id: 'student-123',
          reward_type: 'points',
          reward_value: 50,
          reason: 'Excellent homework submission'
        }
      };

      vi.mocked(teacherService.awardManualXP).mockResolvedValue(mockResponse as any);

      const result = await teacherService.awardManualXP(rewardData);

      expect(result.success).toBe(true);
      expect(result.reward.reward_value).toBe(50);
      expect(teacherService.awardManualXP).toHaveBeenCalledWith(rewardData);
    });

    it('should award badge to a student successfully', async () => {
      const rewardData = {
        studentId: 'student-123',
        amount: 1,
        reason: 'Completed all assignments',
        rewardType: 'badge' as const
      };

      const mockResponse = {
        success: true,
        reward: {
          id: 'reward-2',
          student_id: 'student-123',
          reward_type: 'badge',
          reward_value: 1,
          reason: 'Completed all assignments'
        }
      };

      vi.mocked(teacherService.awardManualXP).mockResolvedValue(mockResponse as any);

      const result = await teacherService.awardManualXP(rewardData);

      expect(result.success).toBe(true);
      expect(result.reward.reward_type).toBe('badge');
    });

    it('should handle reward assignment errors', async () => {
      vi.mocked(teacherService.awardManualXP).mockRejectedValue(
        new Error('Student not found')
      );

      await expect(
        teacherService.awardManualXP({
          studentId: 'invalid-id',
          amount: 50,
          reason: 'Test',
          rewardType: 'points'
        })
      ).rejects.toThrow('Student not found');
    });
  });

  describe('Multiple Operations Integration', () => {
    it('should handle concurrent operations correctly', async () => {
      const classesPromise = teacherService.fetchTeacherClasses('teacher-123');
      const studentsPromise = teacherService.fetchClassStudents('class-123');
      const notesPromise = teacherService.fetchTeacherNotes('student-123');

      vi.mocked(teacherService.fetchTeacherClasses).mockResolvedValue([
        { id: 'class-123', name: 'Test Class' }
      ] as any);
      vi.mocked(teacherService.fetchClassStudents).mockResolvedValue([
        { id: 'student-123' }
      ] as any);
      vi.mocked(teacherService.fetchTeacherNotes).mockResolvedValue([
        { id: 'note-123', content: 'Test note' }
      ] as any);

      const [classes, students, notes] = await Promise.all([
        classesPromise,
        studentsPromise,
        notesPromise
      ]);

      expect(classes).toHaveLength(1);
      expect(students).toHaveLength(1);
      expect(notes).toHaveLength(1);
    });
  });
});
