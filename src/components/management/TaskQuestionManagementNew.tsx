import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  FileText, 
  HelpCircle, 
  CheckCircle, 
  Clock, 
  Star,
  Upload,
  Play,
  Video,
  Mic,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Task {
  id: string;
  title: string;
  description: string;
  required_submission_type: 'text' | 'file';
  grading_scale: number;
  created_at: string;
  author?: {
    full_name: string;
  };
}

interface Question {
  id: string;
  vraag_tekst: string;
  vraag_type: string;
  created_at: string;
}

export const TaskQuestionManagementNew = () => {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [levels, setLevels] = useState<{ id: string; naam: string }[]>([]);

  // Task form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskType, setNewTaskType] = useState<'text' | 'file'>('text');
  const [newTaskGradingScale, setNewTaskGradingScale] = useState(10);

  // Question form state
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionType, setNewQuestionType] = useState('');

  useEffect(() => {
    if (profile?.id) {
      fetchLevels();
    }
  }, [profile?.id]);

  useEffect(() => {
    if (selectedLevel) {
      fetchTasks();
      fetchQuestions();
    }
  }, [selectedLevel]);

  const fetchLevels = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('niveaus')
        .select('id, naam')
        .order('niveau_nummer', { ascending: true });

      if (error) throw error;

      setLevels(data || []);
    } catch (error) {
      console.error('Error fetching levels:', error);
      toast.error('Fout bij het ophalen van niveaus');
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    if (!selectedLevel) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          description,
          required_submission_type,
          grading_scale,
          created_at,
          profiles!tasks_author_id_fkey(full_name)
        `)
        .eq('level_id', selectedLevel)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const tasksWithAuthor = (data || []).map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        required_submission_type: task.required_submission_type,
        grading_scale: task.grading_scale,
        created_at: task.created_at,
        author: { full_name: task.profiles?.full_name || 'Onbekend' }
      }));

      setTasks(tasksWithAuthor);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Fout bij het ophalen van opdrachten');
    }
  };

  const fetchQuestions = async () => {
    if (!selectedLevel) return;

    try {
      const { data, error } = await supabase
        .from('vragen')
        .select('id, vraag_tekst, vraag_type, created_at')
        .eq('niveau_id', selectedLevel)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setQuestions(data || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Fout bij het ophalen van vragen');
    }
  };

  const createTask = async () => {
    if (!selectedLevel) {
      toast.error('Selecteer een niveau');
      return;
    }

    if (!newTaskTitle.trim()) {
      toast.error('Vul de titel in');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.from('tasks').insert({
        level_id: selectedLevel,
        author_id: profile?.id,
        title: newTaskTitle,
        description: newTaskDescription,
        required_submission_type: newTaskType,
        grading_scale: newTaskGradingScale
      });

      if (error) throw error;

      toast.success('Opdracht aangemaakt');
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskType('text');
      setNewTaskGradingScale(10);
      fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Fout bij het aanmaken van opdracht');
    } finally {
      setLoading(false);
    }
  };

  const createQuestion = async () => {
    if (!selectedLevel) {
      toast.error('Selecteer een niveau');
      return;
    }

    if (!newQuestionText.trim()) {
      toast.error('Vul de vraag in');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.from('vragen').insert({
        niveau_id: selectedLevel,
        vraag_tekst: newQuestionText,
        vraag_type: newQuestionType
      });

      if (error) throw error;

      toast.success('Vraag aangemaakt');
      setNewQuestionText('');
      setNewQuestionType('');
      fetchQuestions();
    } catch (error) {
      console.error('Error creating question:', error);
      toast.error('Fout bij het aanmaken van vraag');
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!window.confirm('Weet je zeker dat je deze opdracht wilt verwijderen?')) {
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.from('tasks').delete().eq('id', taskId);

      if (error) throw error;

      toast.success('Opdracht verwijderd');
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Fout bij het verwijderen van opdracht');
    } finally {
      setLoading(false);
    }
  };

  const deleteQuestion = async (questionId: string) => {
    if (!window.confirm('Weet je zeker dat je deze vraag wilt verwijderen?')) {
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.from('vragen').delete().eq('id', questionId);

      if (error) throw error;

      toast.success('Vraag verwijderd');
      fetchQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('Fout bij het verwijderen van vraag');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Laden...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="main-content-card">
        <h2 className="text-2xl font-bold mb-6">Opdrachten en Vragen Beheren</h2>

        {/* Level Selection */}
        <div className="mb-4">
          <Select onValueChange={setSelectedLevel}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecteer niveau" />
            </SelectTrigger>
            <SelectContent>
              {levels.map((level) => (
                <SelectItem key={level.id} value={level.id}>
                  {level.naam}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedLevel ? (
          <Tabs defaultValue="tasks" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="tasks">Opdrachten</TabsTrigger>
              <TabsTrigger value="questions">Vragen</TabsTrigger>
            </TabsList>

            {/* Tasks Tab */}
            <TabsContent value="tasks" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Task List */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Opdrachten ({tasks.length})
                  </h3>
                  {tasks.map((task) => (
                    <Card key={task.id} className="floating-content mb-3">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base">{task.title}</CardTitle>
                            {task.description && (
                              <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              Max: {task.grading_scale} punten
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteTask(task.id)}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                  {tasks.length === 0 && (
                    <Card className="floating-content">
                      <CardContent className="text-center py-4">
                        <CheckCircle className="w-8 h-8 mx-auto text-green-500 mb-2" />
                        <p className="text-sm text-muted-foreground">Nog geen opdrachten!</p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Create Task Form */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Nieuwe Opdracht
                  </h3>
                  <Card className="floating-content">
                    <CardContent className="space-y-3">
                      <div>
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed" htmlFor="taskTitle">
                          Titel
                        </label>
                        <Input 
                          type="text" 
                          id="taskTitle" 
                          placeholder="Naam van de opdracht" 
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed" htmlFor="taskDescription">
                          Beschrijving
                        </label>
                        <Textarea
                          id="taskDescription"
                          placeholder="Beschrijving van de opdracht"
                          value={newTaskDescription}
                          onChange={(e) => setNewTaskDescription(e.target.value)}
                          rows={4}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed">
                          Type Inzending
                        </label>
                        <Select value={newTaskType} onValueChange={(value) => setNewTaskType(value as 'text' | 'file')}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecteer type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Tekst</SelectItem>
                            <SelectItem value="file">Bestand</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed" htmlFor="gradingScale">
                          Punten
                        </label>
                        <Input
                          type="number"
                          id="gradingScale"
                          placeholder="Aantal punten"
                          value={newTaskGradingScale}
                          onChange={(e) => setNewTaskGradingScale(Number(e.target.value))}
                        />
                      </div>
                      <Button className="w-full" onClick={createTask} disabled={loading}>
                        Maak Opdracht
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Questions Tab */}
            <TabsContent value="questions" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Question List */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <HelpCircle className="h-5 w-5" />
                    Vragen ({questions.length})
                  </h3>
                  {questions.map((question) => (
                    <Card key={question.id} className="floating-content mb-3">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base">{question.vraag_tekst}</CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">
                              Type: {question.vraag_type}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteQuestion(question.id)}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                  {questions.length === 0 && (
                    <Card className="floating-content">
                      <CardContent className="text-center py-4">
                        <CheckCircle className="w-8 h-8 mx-auto text-green-500 mb-2" />
                        <p className="text-sm text-muted-foreground">Nog geen vragen!</p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Create Question Form */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Nieuwe Vraag
                  </h3>
                  <Card className="floating-content">
                    <CardContent className="space-y-3">
                      <div>
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed" htmlFor="questionText">
                          Vraag
                        </label>
                        <Textarea
                          id="questionText"
                          placeholder="De vraag"
                          value={newQuestionText}
                          onChange={(e) => setNewQuestionText(e.target.value)}
                          rows={4}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed">
                          Type Vraag
                        </label>
                        <Input
                          type="text"
                          placeholder="Type vraag"
                          value={newQuestionType}
                          onChange={(e) => setNewQuestionType(e.target.value)}
                        />
                      </div>
                      <Button className="w-full" onClick={createQuestion} disabled={loading}>
                        Maak Vraag
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-8">Selecteer een niveau om opdrachten en vragen te beheren.</div>
        )}
      </div>
    </div>
  );
};
