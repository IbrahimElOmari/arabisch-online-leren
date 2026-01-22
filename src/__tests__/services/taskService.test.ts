import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as taskService from '@/services/taskService';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
}));

describe('TaskService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchTasksByLevel', () => {
    it('should fetch published tasks for a specific level', async () => {
      const mockTasks = [
        { id: '1', title: 'Task 1', level_id: 'level-1', status: 'published' },
        { id: '2', title: 'Task 2', level_id: 'level-1', status: 'published' },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockTasks, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await taskService.fetchTasksByLevel('level-1');
      
      expect(supabase.from).toHaveBeenCalledWith('tasks');
      expect(mockQuery.eq).toHaveBeenCalledWith('level_id', 'level-1');
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'published');
      expect(result).toEqual(mockTasks);
    });

    it('should throw error when database query fails', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: new Error('Database error') }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await expect(taskService.fetchTasksByLevel('level-1')).rejects.toThrow();
    });
  });

  describe('fetchTaskById', () => {
    it('should fetch a single task with author and level info', async () => {
      const mockTask = {
        id: 'task-1',
        title: 'Test Task',
        profiles: { full_name: 'Teacher Name' },
        niveaus: { naam: 'Level 1', class_id: 'class-1' },
      };

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockTask, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await taskService.fetchTaskById('task-1');
      
      expect(result).toEqual(mockTask);
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'task-1');
    });

    it('should throw error when task not found', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await expect(taskService.fetchTaskById('non-existent')).rejects.toBeDefined();
    });
  });

  describe('createTask', () => {
    it('should create a new task', async () => {
      const taskData = {
        level_id: 'level-1',
        author_id: 'user-1',
        title: 'New Task',
        description: 'Task description',
        required_submission_type: 'text' as const,
        grading_scale: 100,
      };

      const mockCreatedTask = { id: 'new-task-id', ...taskData };

      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockCreatedTask, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await taskService.createTask(taskData);
      
      expect(supabase.from).toHaveBeenCalledWith('tasks');
      expect(result).toEqual(mockCreatedTask);
    });

    it('should throw error on creation failure', async () => {
      const taskData = {
        level_id: 'level-1',
        author_id: 'user-1',
        title: 'New Task',
        required_submission_type: 'text' as const,
        grading_scale: 100,
      };

      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: new Error('Insert failed') }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await expect(taskService.createTask(taskData)).rejects.toThrow();
    });
  });

  describe('updateTask', () => {
    it('should update task properties', async () => {
      const updates = { title: 'Updated Title', status: 'published' as const };
      const mockUpdatedTask = { id: 'task-1', ...updates };

      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockUpdatedTask, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await taskService.updateTask('task-1', updates);
      
      expect(mockQuery.update).toHaveBeenCalledWith(updates);
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'task-1');
      expect(result).toEqual(mockUpdatedTask);
    });
  });

  describe('deleteTask', () => {
    it('should delete a task', async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await taskService.deleteTask('task-1');
      
      expect(supabase.from).toHaveBeenCalledWith('tasks');
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'task-1');
    });

    it('should throw error on deletion failure', async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: new Error('Delete failed') }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await expect(taskService.deleteTask('task-1')).rejects.toThrow();
    });
  });

  describe('fetchTaskSubmissions', () => {
    it('should fetch submissions for a task', async () => {
      const mockSubmissions = [
        { id: 'sub-1', task_id: 'task-1', profiles: { full_name: 'Student 1' } },
        { id: 'sub-2', task_id: 'task-1', profiles: { full_name: 'Student 2' } },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockSubmissions, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await taskService.fetchTaskSubmissions('task-1');
      
      expect(supabase.from).toHaveBeenCalledWith('task_submissions');
      expect(result).toEqual(mockSubmissions);
    });
  });

  describe('createSubmission', () => {
    it('should create a new submission', async () => {
      const submissionData = {
        task_id: 'task-1',
        student_id: 'student-1',
        submission_content: 'My answer',
      };

      const mockSubmission = { id: 'sub-1', ...submissionData };

      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockSubmission, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await taskService.createSubmission(submissionData);
      
      expect(result).toEqual(mockSubmission);
    });
  });

  describe('gradeSubmission', () => {
    it('should update submission with grade and feedback', async () => {
      const gradeData = { grade: 85, feedback: 'Great work!' };
      const mockGradedSubmission = { id: 'sub-1', ...gradeData };

      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockGradedSubmission, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await taskService.gradeSubmission('sub-1', gradeData);
      
      expect(mockQuery.update).toHaveBeenCalledWith(gradeData);
      expect(result).toEqual(mockGradedSubmission);
    });
  });

  describe('fetchPendingSubmissions', () => {
    it('should fetch ungraded submissions for teacher', async () => {
      const mockPendingSubmissions = [
        { id: 'sub-1', grade: null, tasks: { title: 'Task 1' } },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockPendingSubmissions, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await taskService.fetchPendingSubmissions('teacher-1');
      
      expect(mockQuery.is).toHaveBeenCalledWith('grade', null);
      expect(result).toEqual(mockPendingSubmissions);
    });
  });
});
