
import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { useNotifications } from './useNotifications';

interface NotificationEvent {
  type: 'task_created' | 'task_submitted' | 'task_graded' | 'question_created' | 'question_answered' | 'question_graded';
  payload: any;
}

export const useTaskNotifications = () => {
  const { profile } = useAuth();
  const { createNotification } = useNotifications();

  const handleTaskCreated = useCallback(async (task: any) => {
    if (!task) return;
    
    // Notify all students enrolled in the class
    try {
      const { data: enrollments } = await supabase
        .from('inschrijvingen')
        .select('student_id, profiles!inschrijvingen_student_id_fkey(full_name)')
        .eq('class_id', task.niveaus?.class_id)
        .eq('payment_status', 'paid');

      if (enrollments) {
        for (const enrollment of enrollments) {
          await createNotification(
            enrollment.student_id,
            `Nieuwe taak beschikbaar: "${task.title}" in ${task.niveaus?.naam || 'je niveau'}`
          );
        }
      }
    } catch (error) {
      console.error('Error sending task creation notifications:', error);
    }
  }, [createNotification]);

  const handleQuestionCreated = useCallback(async (question: any) => {
    if (!question) return;
    
    // Notify all students enrolled in the class
    try {
      const { data: enrollments } = await supabase
        .from('inschrijvingen')
        .select('student_id, profiles!inschrijvingen_student_id_fkey(full_name)')
        .eq('class_id', question.niveaus?.class_id)
        .eq('payment_status', 'paid');

      if (enrollments) {
        for (const enrollment of enrollments) {
          await createNotification(
            enrollment.student_id,
            `Nieuwe vraag beschikbaar in ${question.niveaus?.naam || 'je niveau'}`
          );
        }
      }
    } catch (error) {
      console.error('Error sending question creation notifications:', error);
    }
  }, [createNotification]);

  const handleSubmissionCreated = useCallback(async (submission: any) => {
    if (!submission || !submission.tasks) return;
    
    // Notify teacher about new submission
    try {
      const { data: task } = await supabase
        .from('tasks')
        .select(`
          title,
          author_id,
          profiles!tasks_author_id_fkey(full_name)
        `)
        .eq('id', submission.task_id)
        .single();

      if (task && task.author_id) {
        const { data: student } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', submission.student_id)
          .single();

        await createNotification(
          task.author_id,
          `${student?.full_name || 'Een student'} heeft een taak ingeleverd: "${task.title}"`
        );
      }
    } catch (error) {
      console.error('Error sending submission notification:', error);
    }
  }, [createNotification]);

  const handleAnswerCreated = useCallback(async (answer: any) => {
    if (!answer || !answer.vragen) return;
    
    // Since vragen table doesn't have created_by, we'll find the teacher through the niveau/class relationship
    try {
      const { data: question } = await supabase
        .from('vragen')
        .select(`
          vraag_tekst,
          niveau_id,
          niveaus!vragen_niveau_id_fkey(
            naam,
            class_id,
            klassen!niveaus_class_id_fkey(
              name,
              teacher_id,
              profiles!klassen_teacher_id_fkey(full_name)
            )
          )
        `)
        .eq('id', answer.vraag_id)
        .single();

      if (question?.niveaus?.klassen?.teacher_id) {
        const { data: student } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', answer.student_id)
          .single();

        await createNotification(
          question.niveaus.klassen.teacher_id,
          `${student?.full_name || 'Een student'} heeft een vraag beantwoord in ${question.niveaus.naam}`
        );
      }
    } catch (error) {
      console.error('Error sending answer notification:', error);
    }
  }, [createNotification]);

  // Set up real-time subscriptions for automatic notifications
  useEffect(() => {
    if (!profile?.id) return;

    const channels = [];

    // Subscribe to task creations (for students)
    if (profile.role === 'leerling') {
      const taskChannel = supabase
        .channel('task-notifications')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'tasks'
        }, handleTaskCreated)
        .subscribe();
      
      channels.push(taskChannel);

      const questionChannel = supabase
        .channel('question-notifications')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'vragen'
        }, handleQuestionCreated)
        .subscribe();
      
      channels.push(questionChannel);
    }

    // Subscribe to submissions (for teachers)
    if (profile.role === 'leerkracht' || profile.role === 'admin') {
      const submissionChannel = supabase
        .channel('submission-notifications')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'task_submissions'
        }, handleSubmissionCreated)
        .subscribe();
      
      channels.push(submissionChannel);

      const answerChannel = supabase
        .channel('answer-notifications')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'antwoorden'
        }, handleAnswerCreated)
        .subscribe();
      
      channels.push(answerChannel);
    }

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [profile, handleTaskCreated, handleQuestionCreated, handleSubmissionCreated, handleAnswerCreated]);

  return {
    handleTaskCreated,
    handleQuestionCreated,
    handleSubmissionCreated,
    handleAnswerCreated
  };
};
