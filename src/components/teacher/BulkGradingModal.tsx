import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Users, Star, Clock } from 'lucide-react';

interface BulkSubmission {
  id: string;
  student_name: string;
  submission_preview: string;
  task_title: string;
  submitted_at: string;
  max_grade: number;
}

interface BulkGradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  levelId?: string;
}

export const BulkGradingModal = ({ isOpen, onClose, classId, levelId }: BulkGradingModalProps) => {
  const [submissions, setSubmissions] = useState<BulkSubmission[]>([]);
  const [selectedSubmissions, setSelectedSubmissions] = useState<Set<string>>(new Set());
  const [bulkGrade, setBulkGrade] = useState<string>('');
  const [bulkFeedback, setBulkFeedback] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUngraded();
    }
  }, [isOpen, classId, levelId]);

  const fetchUngraded = async () => {
    setFetching(true);
    try {
      let query = supabase
        .from('task_submissions')
        .select(`
          id,
          submission_content,
          submitted_at,
          profiles!task_submissions_student_id_fkey(full_name),
          tasks!inner(
            title,
            grading_scale,
            level_id,
            niveaus!inner(class_id)
          )
        `)
        .eq('tasks.niveaus.class_id', classId)
        .is('grade', null)
        .order('submitted_at', { ascending: true });

      if (levelId) {
        query = query.eq('tasks.level_id', levelId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const formattedSubmissions = data?.map(sub => ({
        id: sub.id,
        student_name: sub.profiles?.full_name || 'Onbekend',
        submission_preview: sub.submission_content?.substring(0, 100) + '...' || 'Bestand ingeleverd',
        task_title: sub.tasks?.title || 'Onbekende taak',
        submitted_at: sub.submitted_at,
        max_grade: sub.tasks?.grading_scale || 10
      })) || [];

      setSubmissions(formattedSubmissions);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error('Fout bij het ophalen van inzendingen');
    } finally {
      setFetching(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedSubmissions.size === submissions.length) {
      setSelectedSubmissions(new Set());
    } else {
      setSelectedSubmissions(new Set(submissions.map(s => s.id)));
    }
  };

  const handleSubmissionToggle = (submissionId: string) => {
    const newSelected = new Set(selectedSubmissions);
    if (newSelected.has(submissionId)) {
      newSelected.delete(submissionId);
    } else {
      newSelected.add(submissionId);
    }
    setSelectedSubmissions(newSelected);
  };

  const handleBulkGrade = async () => {
    if (selectedSubmissions.size === 0) {
      toast.error('Selecteer minimaal één inzending');
      return;
    }

    const grade = parseFloat(bulkGrade);
    if (isNaN(grade)) {
      toast.error('Voer een geldig cijfer in');
      return;
    }

    setLoading(true);
    try {
      // Update all selected submissions
      const { error } = await supabase
        .from('task_submissions')
        .update({
          grade: grade,
          feedback: bulkFeedback || null
        })
        .in('id', Array.from(selectedSubmissions));

      if (error) throw error;

      // Create notifications for all students
      const selectedSubmissionData = submissions.filter(s => selectedSubmissions.has(s.id));
      
      // Get student IDs for selected submissions
      const { data: submissionStudentData } = await supabase
        .from('task_submissions')
        .select('student_id, id')
        .in('id', Array.from(selectedSubmissions));

      if (submissionStudentData) {
        const notifications = selectedSubmissionData.map(submission => {
          const studentData = submissionStudentData.find(s => s.id === submission.id);
          return {
            user_id: studentData?.student_id,
            message: `Je taak "${submission.task_title}" is beoordeeld met cijfer ${grade}${bulkFeedback ? '. ' + bulkFeedback : '.'}`
          };
        }).filter(n => n.user_id); // Filter out notifications without user_id

        // Insert notifications
        if (notifications.length > 0) {
          await supabase.from('user_notifications').insert(notifications);
        }
      }

      toast.success(`${selectedSubmissions.size} inzendingen succesvol beoordeeld!`);
      
      // Reset form
      setSelectedSubmissions(new Set());
      setBulkGrade('');
      setBulkFeedback('');
      
      // Refresh data
      await fetchUngraded();
      
    } catch (error) {
      console.error('Error bulk grading:', error);
      toast.error('Fout bij het bulksgewijs beoordelen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulksgewijs Beoordelen
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
            <div>
              <Label htmlFor="bulk-grade">Cijfer</Label>
              <Input
                id="bulk-grade"
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={bulkGrade}
                onChange={(e) => setBulkGrade(e.target.value)}
                placeholder="Bijv. 7.5"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="bulk-feedback">Feedback (optioneel)</Label>
              <Textarea
                id="bulk-feedback"
                value={bulkFeedback}
                onChange={(e) => setBulkFeedback(e.target.value)}
                placeholder="Deze feedback wordt toegepast op alle geselecteerde inzendingen..."
                rows={2}
              />
            </div>
          </div>

          {/* Selection Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedSubmissions.size === submissions.length ? 'Deselecteer Alles' : 'Selecteer Alles'}
              </Button>
              <Badge variant="secondary">
                {selectedSubmissions.size} van {submissions.length} geselecteerd
              </Badge>
            </div>
            <Button
              onClick={handleBulkGrade}
              disabled={selectedSubmissions.size === 0 || !bulkGrade || loading}
            >
              <Star className="h-4 w-4 mr-2" />
              {loading ? 'Bezig...' : `Beoordeel ${selectedSubmissions.size} inzendingen`}
            </Button>
          </div>

          <Separator />

          {/* Submissions List */}
          <div className="flex-1 overflow-y-auto space-y-3">
            {fetching ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Inzendingen laden...</p>
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Geen onbeoordeelde inzendingen gevonden</p>
              </div>
            ) : (
              submissions.map((submission) => (
                <Card key={submission.id} className={`cursor-pointer transition-colors ${
                  selectedSubmissions.has(submission.id) ? 'ring-2 ring-primary' : ''
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedSubmissions.has(submission.id)}
                        onCheckedChange={() => handleSubmissionToggle(submission.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm truncate">{submission.task_title}</h4>
                          <Badge variant="outline">Max: {submission.max_grade}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{submission.student_name}</p>
                        <p className="text-xs text-muted-foreground truncate mb-2">
                          {submission.submission_preview}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Ingediend: {new Date(submission.submitted_at).toLocaleString('nl-NL')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};