import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTranslation } from 'react-i18next';
import { QuestionRenderer } from '@/components/placement/QuestionRenderer';
import { placementService } from '@/services/modules/placementService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface Question {
  id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'drag_drop' | 'fill_blank' | 'audio' | 'voice' | 'sequence';
  options?: string[];
  pairs?: any[];
  items?: string[];
  audio_url?: string;
}

interface PlacementTest {
  id: string;
  test_name: string;
  questions: Question[];
}

const PlacementTestPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const enrollmentId = searchParams.get('enrollment_id');
  
  const [test, setTest] = useState<PlacementTest | null>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    loadTest();
  }, [enrollmentId]);

  const loadTest = async () => {
    if (!enrollmentId) {
      toast({
        title: t('error', 'Error'),
        description: t('placement.noEnrollment', 'No enrollment ID provided'),
        variant: 'destructive'
      });
      navigate('/modules');
      return;
    }

    try {
      setLoading(true);
      
      // Get enrollment to find module_id
      const { data: enrollment, error: enrollError } = await supabase
        .from('enrollments')
        .select('module_id, status')
        .eq('id', enrollmentId)
        .single();

      if (enrollError || !enrollment) {
        throw new Error('Enrollment not found');
      }

      if (enrollment.status !== 'pending_placement') {
        toast({
          title: t('placement.wrongStatus', 'Wrong Status'),
          description: t('placement.wrongStatusDesc', 'This enrollment is not pending placement test'),
          variant: 'destructive'
        });
        navigate('/dashboard');
        return;
      }

      // Get active placement test for module
      const testData = await placementService.getPlacementTest(enrollment.module_id);
      
      if (!testData) {
        throw new Error('No active placement test found for this module');
      }

      setTest(testData);
      setAnswers(new Array(testData.questions.length).fill(null));
    } catch (error) {
      console.error('Failed to load test:', error);
      toast({
        title: t('error', 'Error'),
        description: t('placement.loadFailed', 'Failed to load placement test'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionIndex: number, answer: any) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = answer;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < (test?.questions.length || 0) - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    if (!test || !enrollmentId) return;

    // Check all answers are provided
    const unanswered = answers.findIndex(a => a === null || a === undefined || a === '');
    if (unanswered !== -1) {
      toast({
        title: t('placement.incomplete', 'Incomplete Test'),
        description: t('placement.incompleteDesc', `Please answer question ${unanswered + 1}`),
        variant: 'destructive'
      });
      setCurrentQuestion(unanswered);
      return;
    }

    try {
      setSubmitting(true);

      // Call placement-grade edge function
      const { data, error } = await supabase.functions.invoke('placement-grade', {
        body: {
          enrollment_id: enrollmentId,
          placement_test_id: test.id,
          answers
        }
      });

      if (error) throw error;

      setResult(data);
      
      // Automatically trigger class assignment
      const { error: assignError } = await supabase.functions.invoke('placement-assign-class', {
        body: { enrollment_id: enrollmentId }
      });

      if (assignError) {
        console.error('Class assignment error:', assignError);
        // Don't throw - let user see result and try assignment manually
      }

      toast({
        title: t('placement.success', 'Test Completed'),
        description: t('placement.successDesc', 'Your placement test has been graded'),
      });

    } catch (error) {
      console.error('Failed to submit test:', error);
      toast({
        title: t('error', 'Error'),
        description: t('placement.submitFailed', 'Failed to submit test'),
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!test) {
    return (
      <div className="container mx-auto py-12">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t('placement.notFound', 'Placement test not found')}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (result) {
    return (
      <div className="container mx-auto py-12">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-primary" />
              {t('placement.completed', 'Test Completed')}
            </CardTitle>
            <CardDescription>
              {t('placement.completedDesc', 'Your placement test results')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-6 bg-secondary rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-2">
                {t('placement.yourScore', 'Your Score')}
              </p>
              <p className="text-4xl font-bold text-primary">{result.score}%</p>
            </div>
            
            <Alert>
              <AlertDescription>
                {result.status === 'active' ? (
                  <p>{t('placement.assigned', 'You have been assigned to a class!')}</p>
                ) : (
                  <p>{t('placement.waiting', 'No available classes. You have been added to the waiting list.')}</p>
                )}
              </AlertDescription>
            </Alert>

            <Button onClick={() => navigate('/dashboard')} className="w-full">
              {t('placement.gotoDashboard', 'Go to Dashboard')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const question = test.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / test.questions.length) * 100;

  return (
    <div className="container mx-auto py-12">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <CardTitle>{test.test_name}</CardTitle>
            <span className="text-sm text-muted-foreground">
              {currentQuestion + 1} / {test.questions.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <QuestionRenderer
            question={question}
            answer={answers[currentQuestion]}
            onChange={(answer) => handleAnswerChange(currentQuestion, answer)}
          />

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
            >
              {t('placement.previous', 'Previous')}
            </Button>
            
            {currentQuestion === test.questions.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('placement.submitting', 'Submitting...')}
                  </>
                ) : (
                  t('placement.submit', 'Submit Test')
                )}
              </Button>
            ) : (
              <Button onClick={handleNext}>
                {t('placement.next', 'Next')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlacementTestPage;
