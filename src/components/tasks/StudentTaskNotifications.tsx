import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { supabase } from '@/integrations/supabase/client';
import { TaskNotificationCard } from './TaskNotificationCard';
import { Bell, CheckCircle2 } from 'lucide-react';

interface TaskWithSubmission {
  id: string;
  title: string;
  description?: string;
  required_submission_type: 'text' | 'file';
  grading_scale: number;
  created_at: string;
  profiles?: {
    full_name: string;
  };
  niveaus?: {
    naam: string;
    klassen?: {
      name: string;
    };
  };
  has_submission?: boolean;
}

export const StudentTaskNotifications: React.FC = () => {
  const { profile } = useAuth();
  const [recentTasks, setRecentTasks] = useState<TaskWithSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.role === 'leerling') {
      fetchRecentTasks();
    }
  }, [profile]);

  const fetchRecentTasks = async () => {
    try {
      // Get student's enrolled classes
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('inschrijvingen')
        .select('class_id')
        .eq('student_id', profile?.id)
        .eq('payment_status', 'paid');

      if (enrollmentError) throw enrollmentError;

      const classIds = enrollments?.map(e => e.class_id) || [];
      if (classIds.length === 0) {
        setRecentTasks([]);
        setLoading(false);
        return;
      }

      // Get recent tasks from student's classes (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          description,
          required_submission_type,
          grading_scale,
          created_at,
          profiles!tasks_author_id_fkey(full_name),
          niveaus!tasks_level_id_fkey(
            naam,
            klassen!niveaus_class_id_fkey(name)
          )
        `)
        .in('niveaus.class_id', classIds)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;

      // Check which tasks the student has already submitted
      const taskIds = tasks?.map(t => t.id) || [];
      const { data: submissions } = await supabase
        .from('task_submissions')
        .select('task_id')
        .in('task_id', taskIds)
        .eq('student_id', profile?.id);

      const submittedTaskIds = new Set(submissions?.map(s => s.task_id) || []);

      const tasksWithSubmissionStatus = tasks?.map(task => ({
        ...task,
        has_submission: submittedTaskIds.has(task.id)
      })) || [];

      setRecentTasks(tasksWithSubmissionStatus);
    } catch (error) {
      console.error('Error fetching recent tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateToTask = (taskId: string) => {
    // Find the task and navigate to the appropriate level detail view
    const task = recentTasks.find(t => t.id === taskId);
    if (task) {
      // For now, we'll just refresh - in a full implementation you'd navigate to the specific task
      window.location.reload();
    }
  };

  if (profile?.role !== 'leerling') {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <div className="text-lg">Laden...</div>
        </CardContent>
      </Card>
    );
  }

  const unsubmittedTasks = recentTasks.filter(task => !task.has_submission);
  const submittedTasks = recentTasks.filter(task => task.has_submission);

  return (
    <div className="space-y-6">
      {/* New Tasks */}
      {unsubmittedTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Nieuwe Taken
              <Badge variant="destructive">{unsubmittedTasks.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {unsubmittedTasks.map((task) => (
              <TaskNotificationCard
                key={task.id}
                task={{
                  id: task.id,
                  title: task.title,
                  description: task.description,
                  required_submission_type: task.required_submission_type,
                  grading_scale: task.grading_scale,
                  created_at: task.created_at,
                  author: { full_name: task.profiles?.full_name || 'Onbekend' },
                  level_name: task.niveaus?.naam || 'Onbekend niveau',
                  class_name: task.niveaus?.klassen?.name || 'Onbekende klas'
                }}
                onNavigateToTask={handleNavigateToTask}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recently Submitted Tasks */}
      {submittedTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Recent Ingeleverd
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {submittedTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                <div>
                  <h4 className="font-medium">{task.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {task.niveaus?.klassen?.name} - {task.niveaus?.naam}
                  </p>
                </div>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Ingeleverd
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* No Tasks */}
      {recentTasks.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Geen nieuwe taken in de afgelopen week
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
