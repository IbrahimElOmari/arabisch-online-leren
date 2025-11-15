import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  fetchTeacherClasses, 
  fetchClassStudents, 
  createTeacherNote,
  fetchTeacherNotes,
  updateTeacherNote,
  deleteTeacherNote,
  awardManualXP
} from '../teacherService';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client');

describe('teacherService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchTeacherClasses', () => {
    it('should fetch classes for a teacher', async () => {
      const mockClasses = [
        { id: '1', name: 'Class A', teacher_id: 'teacher-1' },
        { id: '2', name: 'Class B', teacher_id: 'teacher-1' }
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockClasses, error: null })
          })
        })
      } as any);

      const result = await fetchTeacherClasses('teacher-1');
      
      expect(result).toEqual(mockClasses);
      expect(supabase.from).toHaveBeenCalledWith('klassen');
    });

    it('should throw error when fetch fails', async () => {
      const mockError = new Error('Database error');
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: null, error: mockError })
          })
        })
      } as any);

      await expect(fetchTeacherClasses('teacher-1')).rejects.toThrow('Database error');
    });
  });

  describe('fetchClassStudents', () => {
    it('should fetch students for a class', async () => {
      const mockStudents = [
        { id: '1', student_id: 'student-1', class_id: 'class-1', payment_status: 'paid' }
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockStudents, error: null })
            })
          })
        })
      } as any);

      const result = await fetchClassStudents('class-1');
      
      expect(result).toEqual(mockStudents);
      expect(supabase.from).toHaveBeenCalledWith('inschrijvingen');
    });
  });

  describe('Teacher Notes', () => {
    it('should create a teacher note', async () => {
      const mockNote = { id: '1', content: 'Test note', student_id: 'student-1' };
      
      vi.mocked(supabase.rpc).mockResolvedValue({ data: mockNote, error: null });

      const result = await createTeacherNote({
        studentId: 'student-1',
        content: 'Test note',
        isFlagged: false
      });

      expect(result).toEqual(mockNote);
      expect(supabase.rpc).toHaveBeenCalledWith('create_teacher_note', {
        p_student_id: 'student-1',
        p_content: 'Test note',
        p_is_flagged: false
      });
    });

    it('should fetch teacher notes', async () => {
      const mockNotes = [
        { id: '1', content: 'Note 1', student_id: 'student-1' },
        { id: '2', content: 'Note 2', student_id: 'student-1' }
      ];

      vi.mocked(supabase.rpc).mockResolvedValue({ data: mockNotes, error: null });

      const result = await fetchTeacherNotes('student-1');
      
      expect(result).toEqual(mockNotes);
      expect(supabase.rpc).toHaveBeenCalledWith('fetch_teacher_notes', {
        p_student_id: 'student-1'
      });
    });

    it('should update a teacher note', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({ data: {}, error: null });

      await updateTeacherNote('note-1', { content: 'Updated content' });

      expect(supabase.rpc).toHaveBeenCalledWith('update_teacher_note', {
        p_note_id: 'note-1',
        p_content: 'Updated content',
        p_is_flagged: undefined
      });
    });

    it('should delete a teacher note', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({ error: null });

      await deleteTeacherNote('note-1');

      expect(supabase.rpc).toHaveBeenCalledWith('delete_teacher_note', {
        p_note_id: 'note-1'
      });
    });
  });

  describe('awardManualXP', () => {
    it('should award XP to a student', async () => {
      const mockResult = { success: true };
      
      vi.mocked(supabase.functions.invoke).mockResolvedValue({ 
        data: mockResult, 
        error: null 
      });

      const result = await awardManualXP({
        studentId: 'student-1',
        amount: 100,
        reason: 'Great work',
        rewardType: 'points'
      });

      expect(result).toEqual(mockResult);
      expect(supabase.functions.invoke).toHaveBeenCalledWith('award-manual-xp', {
        body: {
          studentId: 'student-1',
          amount: 100,
          reason: 'Great work',
          rewardType: 'points'
        }
      });
    });

    it('should throw error when awarding fails', async () => {
      const mockError = new Error('Edge function error');
      
      vi.mocked(supabase.functions.invoke).mockResolvedValue({ 
        data: null, 
        error: mockError 
      });

      await expect(awardManualXP({
        studentId: 'student-1',
        amount: 100,
        reason: 'Test',
        rewardType: 'points'
      })).rejects.toThrow('Edge function error');
    });
  });
});
