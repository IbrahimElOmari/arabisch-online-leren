import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

interface Task {
  id: string;
  level_id: string;
  author_id: string;
  title: string;
  description?: string;
  required_submission_type: 'text' | 'file';
  grading_scale: number;
  created_at: string;
  author?: {
    full_name: string;
  };
}

interface TaskSubmission {
  id: string;
  task_id: string;
  student_id: string;
  submission_content?: string;
  submission_file_path?: string;
  grade?: number;
  feedback?: string;
  submitted_at: string;
  student?: {
    full_name: string;
  };
}

interface TaskState {
  tasks: Task[];
  submissions: TaskSubmission[];
  loading: boolean;
  error: string | null;
  
  fetchTasks: (levelId: string) => Promise<void>;
  createTask: (levelId: string, title: string, description: string, type: 'text' | 'file', gradingScale: number) => Promise<boolean>;
  submitTask: (taskId: string, content?: string, filePath?: string) => Promise<boolean>;
  fetchSubmissions: (taskId: string) => Promise<void>;
  gradeSubmission: (submissionId: string, grade: number, feedback?: string) => Promise<boolean>;
  getSignedUploadUrl: (fileName: string) => Promise<{ signedUrl: string; path: string } | null>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  submissions: [],
  loading: false,
  error: null,

  fetchTasks: async (levelId: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          profiles!tasks_author_id_fkey(full_name)
        `)
        .eq('level_id', levelId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const tasksWithAuthor = data?.map(task => ({
        ...task,
        author: { full_name: task.profiles?.full_name || 'Onbekend' }
      })) || [];

      set({ tasks: tasksWithAuthor, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createTask: async (levelId: string, title: string, description: string, type: 'text' | 'file', gradingScale: number) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.functions.invoke('manage-task', {
        body: { 
          action: 'create-task', 
          levelId, 
          title, 
          description,
          requiredSubmissionType: type,
          gradingScale
        }
      });

      if (error) throw error;
      
      await get().fetchTasks(levelId);
      return true;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return false;
    }
  },

  submitTask: async (taskId: string, content?: string, filePath?: string) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.functions.invoke('manage-task', {
        body: { 
          action: 'submit-task', 
          taskId,
          submissionContent: content,
          submissionFilePath: filePath
        }
      });

      if (error) throw error;
      set({ loading: false });
      return true;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return false;
    }
  },

  fetchSubmissions: async (taskId: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('task_submissions')
        .select(`
          *,
          profiles!task_submissions_student_id_fkey(full_name)
        `)
        .eq('task_id', taskId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      
      const submissionsWithStudent = data?.map(submission => ({
        ...submission,
        student: { full_name: submission.profiles?.full_name || 'Onbekend' }
      })) || [];

      set({ submissions: submissionsWithStudent, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  gradeSubmission: async (submissionId: string, grade: number, feedback?: string) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.functions.invoke('manage-task', {
        body: { 
          action: 'grade-submission', 
          submissionId,
          grade,
          feedback
        }
      });

      if (error) throw error;
      
      // Refresh submissions for current task
      const submission = get().submissions.find(s => s.id === submissionId);
      if (submission) {
        await get().fetchSubmissions(submission.task_id);
      }
      return true;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return false;
    }
  },

  getSignedUploadUrl: async (fileName: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.functions.invoke('manage-task', {
        body: { action: 'get-signed-url', fileName }
      });

      if (error) throw error;
      
      set({ loading: false });
      return { signedUrl: data.signedUrl, path: data.path };
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return null;
    }
  }
}));