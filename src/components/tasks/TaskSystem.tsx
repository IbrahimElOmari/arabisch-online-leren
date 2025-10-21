import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResponsiveForm, ResponsiveFormField } from '@/components/forms/ResponsiveForm';
import { useTaskStore } from '@/hooks/useTaskStore';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { useToast } from '@/hooks/use-toast';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { Upload, FileText, Star, CheckCircle, AlertCircle } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';

interface TaskSystemProps {
  levelId: string;
  levelName: string;
}

export const TaskSystem = ({ levelId, levelName }: TaskSystemProps) => {
  const { user } = useAuth();
  const { isAdmin, isTeacher } = useUserRole();
  const { 
    tasks, 
    submissions, 
    loading, 
    error,
    fetchTasks,
    createTask,
    submitTask,
    fetchSubmissions,
    gradeSubmission,
    getSignedUploadUrl
  } = useTaskStore();
  
  const { toast } = useToast();
  const { getFlexDirection, getTextAlign } = useRTLLayout();
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    type: 'text' as 'text' | 'file',
    gradingScale: 10
  });
  
  const [submissionForm, setSubmissionForm] = useState({
    content: '',
    file: null as File | null
  });
  
  const [gradingForm, setGradingForm] = useState({
    submissionId: '',
    grade: 0,
    feedback: ''
  });

  const isTeacherOrAdmin = isAdmin || isTeacher;

  useEffect(() => {
    if (levelId) {
      fetchTasks(levelId);
    }
  }, [levelId, fetchTasks]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!taskForm.title.trim()) {
      toast({
        title: "Fout",
        description: "Titel is verplicht",
        variant: "destructive"
      });
      return;
    }

    const success = await createTask(
      levelId,
      taskForm.title,
      taskForm.description,
      taskForm.type,
      taskForm.gradingScale
    );

    if (success) {
      toast({
        title: "Succes",
        description: "Taak aangemaakt"
      });
      setTaskForm({ title: '', description: '', type: 'text', gradingScale: 10 });
      setShowCreateForm(false);
    } else {
      toast({
        title: "Fout",
        description: error || "Kon taak niet aanmaken",
        variant: "destructive"
      });
    }
  };

  const handleSubmitTask = async (taskId: string, e: React.FormEvent) => {
    e.preventDefault();
    
    let filePath = null;
    
    if (submissionForm.file) {
      // Upload file first
      const signedData = await getSignedUploadUrl(submissionForm.file.name);
      if (!signedData) {
        toast({
          title: "Fout",
          description: "Kon upload URL niet krijgen",
          variant: "destructive"
        });
        return;
      }

      // Upload file to signed URL
      const uploadResponse = await fetch(signedData.signedUrl, {
        method: 'PUT',
        body: submissionForm.file,
        headers: {
          'Content-Type': submissionForm.file.type,
        },
      });

      if (!uploadResponse.ok) {
        toast({
          title: "Fout",
          description: "Kon bestand niet uploaden",
          variant: "destructive"
        });
        return;
      }

      filePath = signedData.path;
    }

    const success = await submitTask(
      taskId,
      submissionForm.content || undefined,
      filePath || undefined
    );

    if (success) {
      toast({
        title: "Succes",
        description: "Taak ingeleverd"
      });
      setSubmissionForm({ content: '', file: null });
      // Refresh tasks to update submission status
      await fetchTasks(levelId);
    } else {
      toast({
        title: "Fout",
        description: error || "Kon taak niet inleveren",
        variant: "destructive"
      });
    }
  };

  const handleViewSubmissions = async (taskId: string) => {
    setSelectedTask(taskId);
    await fetchSubmissions(taskId);
  };

  const handleGradeSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = await gradeSubmission(
      gradingForm.submissionId,
      gradingForm.grade,
      gradingForm.feedback || undefined
    );

    if (success) {
      toast({
        title: "Succes",
        description: "Beoordeling opgeslagen"
      });
      setGradingForm({ submissionId: '', grade: 0, feedback: '' });
      // Refresh submissions
      if (selectedTask) {
        await fetchSubmissions(selectedTask);
      }
    } else {
      toast({
        title: "Fout",
        description: error || "Kon beoordeling niet opslaan",
        variant: "destructive"
      });
    }
  };

  const getUserSubmission = (taskId: string) => {
    return submissions.find(s => s.task_id === taskId && s.student_id === user?.id);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className={`flex justify-between items-center ${getFlexDirection()}`}>
        <h2 className={`text-2xl font-bold ${getTextAlign()}`}>Taken - {levelName}</h2>
        {isTeacherOrAdmin && (
          <Button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Nieuwe Taak
          </Button>
        )}
      </div>

      {/* Create Task Form */}
      {showCreateForm && isTeacherOrAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Nieuwe Taak Aanmaken</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveForm layout="single" onSubmit={handleCreateTask}>
              <ResponsiveFormField
                label="Titel *"
                name="task-title"
                type="text"
                value={taskForm.title}
                onChange={(value) => setTaskForm(prev => ({ ...prev, title: value }))}
                placeholder="Taak titel..."
                required
              />
              
              <ResponsiveFormField
                label="Beschrijving"
                name="task-description"
                type="textarea"
                value={taskForm.description}
                onChange={(value) => setTaskForm(prev => ({ ...prev, description: value }))}
                placeholder="Taak beschrijving..."
              />

              <div className={`grid grid-cols-2 gap-4 ${getFlexDirection()}`}>
                <div>
                  <Label>Inlevertype</Label>
                  <Select 
                    value={taskForm.type} 
                    onValueChange={(value: 'text' | 'file') => setTaskForm(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Tekst</SelectItem>
                      <SelectItem value="file">Bestand</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Beoordelingsschaal</Label>
                  <Select 
                    value={taskForm.gradingScale.toString()} 
                    onValueChange={(value) => setTaskForm(prev => ({ ...prev, gradingScale: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">1-10</SelectItem>
                      <SelectItem value="20">1-20</SelectItem>
                      <SelectItem value="100">1-100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className={`flex gap-2 ${getFlexDirection()}`}>
                <Button type="submit" disabled={loading}>
                  Taak Aanmaken
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Annuleren
                </Button>
              </div>
            </ResponsiveForm>
          </CardContent>
        </Card>
      )}

      {/* Tasks List */}
      <div className="grid gap-4">
        {loading && tasks.length === 0 ? (
          <div className="text-center py-8">Laden...</div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nog geen taken beschikbaar
          </div>
        ) : (
          tasks.map((task) => {
            const userSubmission = getUserSubmission(task.id);
            const hasSubmitted = !!userSubmission;
            
            return (
              <Card key={task.id} className="animate-fade-in">
                <CardHeader>
                  <div className={`flex justify-between items-start ${getFlexDirection()}`}>
                    <div>
                      <CardTitle className={`flex items-center gap-2 ${getFlexDirection()}`}>
                        {task.required_submission_type === 'file' ? (
                          <Upload className="h-5 w-5" />
                        ) : (
                          <FileText className="h-5 w-5" />
                        )}
                        {task.title}
                      </CardTitle>
                      <p className={`text-sm text-muted-foreground mt-1 ${getTextAlign()}`}>
                        Door {task.author?.full_name} • {new Date(task.created_at).toLocaleDateString('nl-NL')}
                      </p>
                    </div>
                    <div className={`flex items-center gap-2 ${getFlexDirection()}`}>
                      <Badge variant="outline">
                        {task.required_submission_type === 'file' ? 'Bestand' : 'Tekst'}
                      </Badge>
                      <Badge variant="secondary">
                        Max: {task.grading_scale}
                      </Badge>
                      {hasSubmitted && (
                        <Badge className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Ingeleverd
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {task.description && (
                    <p className="whitespace-pre-wrap">{task.description}</p>
                  )}

                  {/* Student Submission Form */}
                  {!isTeacherOrAdmin && !hasSubmitted && (
                    <ResponsiveForm layout="single" onSubmit={(e) => handleSubmitTask(task.id, e)} className="space-y-3 border-t pt-4">
                      <h4 className="font-semibold">Jouw Inlevering</h4>
                      
                      {task.required_submission_type === 'text' ? (
                        <ResponsiveFormField
                          label="Antwoord"
                          name="submission-content"
                          type="textarea"
                          value={submissionForm.content}
                          onChange={(value) => setSubmissionForm(prev => ({ ...prev, content: value }))}
                          placeholder="Schrijf je antwoord hier..."
                          required
                        />
                      ) : (
                        <div>
                          <Label>Bestand uploaden</Label>
                          <Input
                            type="file"
                            onChange={(e) => setSubmissionForm(prev => ({ 
                              ...prev, 
                              file: e.target.files?.[0] || null 
                            }))}
                            required
                          />
                          {submissionForm.file && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {submissionForm.file.name} ({formatFileSize(submissionForm.file.size)})
                            </p>
                          )}
                        </div>
                      )}

                      <Button type="submit" disabled={loading}>
                        Inleveren
                      </Button>
                    </ResponsiveForm>
                  )}

                  {/* Student Submission Status */}
                  {!isTeacherOrAdmin && hasSubmitted && userSubmission && (
                    <div className="border-t pt-4 space-y-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Ingeleverd
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Ingeleverd op: {new Date(userSubmission.submitted_at).toLocaleDateString('nl-NL')}
                      </p>
                      {userSubmission.grade !== null && (
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="font-semibold">
                            Cijfer: {userSubmission.grade}/{task.grading_scale}
                          </span>
                        </div>
                      )}
                      {userSubmission.feedback && (
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm font-medium">Feedback:</p>
                          <p className="text-sm whitespace-pre-wrap">{userSubmission.feedback}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Teacher Actions */}
                  {isTeacherOrAdmin && (
                    <div className="border-t pt-4">
                      <Button
                        variant="outline"
                        onClick={() => handleViewSubmissions(task.id)}
                        className="flex items-center gap-2"
                      >
                        <AlertCircle className="h-4 w-4" />
                        Bekijk Inleveringen
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Submissions View Modal would go here */}
      {selectedTask && isTeacherOrAdmin && submissions.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Inleveringen Beoordelen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {submissions.map((submission) => (
                <div key={submission.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">{submission.student?.full_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Ingeleverd: {new Date(submission.submitted_at).toLocaleDateString('nl-NL')}
                      </p>
                    </div>
                    {submission.grade !== null && (
                      <Badge className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        {submission.grade}
                      </Badge>
                    )}
                  </div>

                  {submission.submission_content && (
                    <div className="mb-3">
                      <p className="text-sm font-medium">Antwoord:</p>
                      <p className="text-sm whitespace-pre-wrap bg-muted p-2 rounded">
                        {submission.submission_content}
                      </p>
                    </div>
                  )}

                  {submission.submission_file_path && (
                    <div className="mb-3">
                      <p className="text-sm font-medium">Bestand:</p>
                      <p className="text-sm text-blue-600 underline cursor-pointer">
                        {submission.submission_file_path.split('/').pop()}
                      </p>
                    </div>
                  )}

                  {/* Grading Form */}
                  <ResponsiveForm 
                    layout="single"
                    onSubmit={(e) => {
                      setGradingForm(prev => ({ ...prev, submissionId: submission.id }));
                      handleGradeSubmission(e);
                    }}
                    className="grid grid-cols-3 gap-2 mt-3"
                  >
                    <Input
                      type="number"
                      placeholder="Cijfer"
                      min="0"
                      max={tasks.find(t => t.id === selectedTask)?.grading_scale || 10}
                      value={gradingForm.submissionId === submission.id ? gradingForm.grade : submission.grade || ''}
                      onChange={(e) => setGradingForm(prev => ({ 
                        ...prev, 
                        submissionId: submission.id,
                        grade: parseInt(e.target.value) || 0 
                      }))}
                    />
                    <Input
                      placeholder="Feedback"
                      value={gradingForm.submissionId === submission.id ? gradingForm.feedback : submission.feedback || ''}
                      onChange={(e) => setGradingForm(prev => ({ 
                        ...prev, 
                        submissionId: submission.id,
                        feedback: e.target.value 
                      }))}
                    />
                    <Button type="submit" size="sm" disabled={loading}>
                      Beoordeel
                    </Button>
                  </ResponsiveForm>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="text-red-500 text-sm">
          Fout: {error}
        </div>
      )}
    </div>
  );
};
