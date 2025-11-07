import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { placementService } from '@/services/placementService';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { PlacementTest, PlacementQuestion } from '@/types/placement';

const PlacementTestPage = () => {
  const { t } = useTranslation();
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [test, setTest] = useState<PlacementTest | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    loadTest();
  }, [moduleId]);

  const loadTest = async () => {
    if (!moduleId) return;
    
    try {
      setLoading(true);
      const testData = await placementService.getPlacementTest(moduleId);
      if (testData) {
        setTest(testData);
      } else {
        toast({
          title: t('error', 'Error'),
          description: t('placement.noTest', 'No placement test available'),
          variant: 'destructive'
        });
        navigate(-1);
      }
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

  const handleAnswer = (questionIndex: number, answer: any) => {
    setAnswers(prev => ({ ...prev, [questionIndex]: answer }));
  };

  const handleNext = () => {
    if (!test) return;
    if (currentQuestion < test.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!test) return;

    const answersArray = test.questions.map((_q: any, idx: number) => answers[idx] || null);
    
    try {
      setSubmitting(true);
      await placementService.submitPlacementTest('enrollment-id', test.id, answersArray);
      setCompleted(true);
      toast({
        title: t('success', 'Success'),
        description: t('placement.submitted', 'Test submitted successfully')
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
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (completed) {
    return (
      <div className="container max-w-2xl mx-auto py-8">
        <Card>
          <CardHeader className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <CardTitle>{t('placement.completed', 'Test Completed')}</CardTitle>
            <CardDescription>
              {t('placement.completedDesc', 'Your results are being processed. You will be assigned to an appropriate class soon.')}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate('/')}>{t('placement.backHome', 'Back to Home')}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!test) return null;

  const question = test.questions[currentQuestion] as PlacementQuestion;
  const progress = ((currentQuestion + 1) / test.questions.length) * 100;
  const isLastQuestion = currentQuestion === test.questions.length - 1;
  const canSubmit = Object.keys(answers).length === test.questions.length;

  return (
    <div className="container max-w-3xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>{test.test_name}</CardTitle>
          <CardDescription>
            {t('placement.question', 'Question')} {currentQuestion + 1} {t('placement.of', 'of')} {test.questions.length}
          </CardDescription>
          <Progress value={progress} className="mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">{question.question_text}</h3>
            
            {question.question_type === 'multiple_choice' && (
              <RadioGroup
                value={answers[currentQuestion]}
                onValueChange={(value) => handleAnswer(currentQuestion, value)}
              >
                {question.options?.map((option: string, idx: number) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`option-${idx}`} />
                    <Label htmlFor={`option-${idx}`}>{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {question.question_type === 'fill_blank' && (
              <textarea
                className="w-full min-h-[100px] p-3 border rounded-md"
                value={answers[currentQuestion] || ''}
                onChange={(e) => handleAnswer(currentQuestion, e.target.value)}
                placeholder={t('placement.yourAnswer', 'Your answer...')}
              />
            )}
          </div>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
            >
              {t('placement.previous', 'Previous')}
            </Button>

            {isLastQuestion ? (
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
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
