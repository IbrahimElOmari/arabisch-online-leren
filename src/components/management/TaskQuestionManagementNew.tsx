import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface Question {
  id: string;
  niveau_id: string;
  vraag: string;
  audio_url?: string;
  correct_antwoord?: string;
  created_at: string;
}

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

const TaskQuestionManagementNew = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [levelId, setLevelId] = useState<string>('level-1');
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [newTaskDescription, setNewTaskDescription] = useState<string>('');
  const [newTaskType, setNewTaskType] = useState<'text' | 'file'>('text');
  const [newTaskGradingScale, setNewTaskGradingScale] = useState<number>(10);
  const [newQuestionText, setNewQuestionText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();
	const { toast } = useToast()

  useEffect(() => {
    if (levelId) {
      fetchTasks(levelId);
      fetchQuestions(levelId);
    }
  }, [levelId]);

  const fetchTasks = async (levelId: string) => {
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
        required_submission_type: task.required_submission_type || 'text' as 'text' | 'file',
        author: { full_name: task.profiles?.full_name || 'Onbekend' }
      })) || [];

      setTasks(tasksWithAuthor);
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchQuestions = async (levelId: string) => {
    try {
      const { data, error } = await supabase
        .from('vragen')
        .select('*')
        .eq('niveau_id', levelId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map database fields to interface
      const mappedQuestions = data?.map(item => ({
        id: item.id,
        niveau_id: item.niveau_id,
        vraag: item.vraag_tekst || '', // Map vraag_tekst to vraag
        audio_url: item.audio_url,
        correct_antwoord: typeof item.correct_antwoord === 'string' 
          ? item.correct_antwoord 
          : JSON.stringify(item.correct_antwoord) || '',
        created_at: item.created_at,
      })) || [];

      setQuestions(mappedQuestions);
    } catch (error: any) {
      console.error('Error fetching questions:', error);
    }
  };

  const createTask = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .insert([
          {
            level_id: levelId,
            author_id: profile?.id,
            title: newTaskTitle,
            description: newTaskDescription,
            required_submission_type: newTaskType,
            grading_scale: newTaskGradingScale,
          },
        ]);

      if (error) throw error;
			toast({
				title: "Taak succesvol aangemaakt",
				description: "De taak is succesvol aangemaakt en toegevoegd aan het niveau.",
			})
      fetchTasks(levelId);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskType('text');
      setNewTaskGradingScale(10);
    } catch (error: any) {
			toast({
				variant: "destructive",
				title: "Er ging iets fout",
				description: "Kon de taak niet aanmaken. Probeer het later opnieuw.",
			})
      console.error('Error creating task:', error);
    } finally {
      setLoading(false);
    }
  };

  const createQuestion = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('vragen')
        .insert([
          {
            niveau_id: levelId,
            vraag_tekst: newQuestionText, // Use correct database field name
            vraag_type: 'text', // Add required field
          },
        ]);

      if (error) throw error;
			toast({
				title: "Vraag succesvol aangemaakt",
				description: "De vraag is succesvol aangemaakt en toegevoegd aan het niveau.",
			})
      fetchQuestions(levelId);
      setNewQuestionText('');
    } catch (error: any) {
			toast({
				variant: "destructive",
				title: "Er ging iets fout",
				description: "Kon de vraag niet aanmaken. Probeer het later opnieuw.",
			})
      console.error('Error creating question:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskTypeChange = (value: string) => {
    setNewTaskType(value as 'text' | 'file');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Taken & Vragen Beheer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="level">Niveau Selecteren</Label>
              <Select value={levelId} onValueChange={setLevelId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer een niveau" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="level-1">Niveau 1</SelectItem>
                  <SelectItem value="level-2">Niveau 2</SelectItem>
                  <SelectItem value="level-3">Niveau 3</SelectItem>
                  <SelectItem value="level-4">Niveau 4</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="taskTitle">Nieuwe Taak Toevoegen</Label>
              <Input
                type="text"
                id="taskTitle"
                placeholder="Taak titel"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
              />
              <Textarea
                className="mt-2"
                placeholder="Taak beschrijving"
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
              />
              <div className="mt-2 flex items-center space-x-2">
                <Label htmlFor="taskType">Type:</Label>
                <Select value={newTaskType} onValueChange={handleTaskTypeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Tekst</SelectItem>
                    <SelectItem value="file">Bestand</SelectItem>
                  </SelectContent>
                </Select>
                <Label htmlFor="gradingScale">Schaal:</Label>
                <Input
                  type="number"
                  id="gradingScale"
                  className="w-20"
                  value={newTaskGradingScale.toString()}
                  onChange={(e) => setNewTaskGradingScale(Number(e.target.value))}
                />
              </div>
              <Button
                className="mt-2"
                onClick={createTask}
                disabled={loading}
              >
                {loading ? 'Laden...' : 'Taak Aanmaken'}
              </Button>
            </div>

            <div>
              <Label htmlFor="questionText">Nieuwe Vraag Toevoegen</Label>
              <Input
                type="text"
                id="questionText"
                placeholder="Vraag tekst"
                value={newQuestionText}
                onChange={(e) => setNewQuestionText(e.target.value)}
              />
              <Button
                className="mt-2"
                onClick={createQuestion}
                disabled={loading}
              >
                {loading ? 'Laden...' : 'Vraag Aanmaken'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Bestaande Taken</CardTitle>
          </CardHeader>
          <CardContent>
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-2 border rounded-md mb-2">
                <div>
                  <p className="font-medium">{task.title}</p>
                  <p className="text-sm text-muted-foreground">Type: {task.required_submission_type}, Schaal: {task.grading_scale}</p>
                </div>
                <div className="space-x-2">
                  <Button size="icon" variant="ghost">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bestaande Vragen</CardTitle>
          </CardHeader>
          <CardContent>
            {questions.map((question) => (
              <div key={question.id} className="flex items-center justify-between p-2 border rounded-md mb-2">
                <p className="font-medium">{question.vraag}</p>
                <div className="space-x-2">
                  <Button size="icon" variant="ghost">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TaskQuestionManagementNew;
