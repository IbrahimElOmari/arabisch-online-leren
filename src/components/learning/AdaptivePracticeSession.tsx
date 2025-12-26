import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { adaptiveLearningService } from '@/services/adaptiveLearningService';
import { Brain, CheckCircle, XCircle, TrendingUp, Target, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { useTranslation } from '@/contexts/TranslationContext';

interface AdaptivePracticeSessionProps {
  moduleId: string;
  niveauId: string;
  onComplete?: () => void;
}

interface Question {
  id: string;
  difficulty: string;
  topic: string;
  question_text: string;
  question_type: string;
  options?: any;
}

export const AdaptivePracticeSession: React.FC<AdaptivePracticeSessionProps> = ({
  moduleId,
  niveauId,
  onComplete,
}) => {
  const { profile } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [weakAreas, setWeakAreas] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);

  useEffect(() => {
    initializeSession();
  }, [moduleId, niveauId]);

  const initializeSession = async () => {
    if (!profile?.id) return;

    setIsLoading(true);
    try {
      // Get difficulty recommendation
      const recommendation = await adaptiveLearningService.getNextDifficulty(
        profile.id,
        moduleId
      );

      setDifficulty(recommendation.recommended_difficulty);
      setWeakAreas(recommendation.weak_areas);

      // Fetch adaptive questions
      const adaptiveQuestions = await adaptiveLearningService.getAdaptiveQuestions(
        niveauId,
        recommendation.recommended_difficulty,
        recommendation.weak_areas,
        10
      );

      setQuestions(adaptiveQuestions);

      // Get recommendations
      const recs = await adaptiveLearningService.getRecommendations(
        profile.id,
        moduleId
      );
      setRecommendations(recs);

      toast({
        title: t('learning.adaptive_session_started', 'Adaptive Session Started'),
        description: recommendation.reasoning,
      });
    } catch (error: any) {
      if (import.meta.env.DEV) console.error('Failed to initialize adaptive session:', error);
      toast({
        title: t('common.error', 'Error'),
        description: error.message || 'Failed to load adaptive session',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    if (showResult) return;
    setSelectedAnswer(answer);
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer || !profile?.id) return;

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = Math.random() > 0.3; // Replace with actual validation

    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: isCorrect,
    }));

    setShowResult(true);

    if (isCorrect) {
      toast({
        title: t('common.correct', 'Correct!'),
        description: t('learning.good_job', 'Great work!'),
      });
    } else {
      toast({
        title: t('common.incorrect', 'Incorrect'),
        description: t('learning.try_again', 'Review the material and try again'),
        variant: 'destructive',
      });
    }
  };

  const handleNextQuestion = async () => {
    setShowResult(false);
    setSelectedAnswer(null);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Session complete
      await completeSession();
    }
  };

  const completeSession = async () => {
    if (!profile?.id) return;

    const questionsAttempted = Object.keys(answers).length;
    const questionsCorrect = Object.values(answers).filter(Boolean).length;

    try {
      await adaptiveLearningService.recordPracticeSession(
        profile.id,
        'solo',
        questionsAttempted,
        questionsCorrect,
        {
          difficulty,
          module_id: moduleId,
          niveau_id: niveauId,
          weak_areas: weakAreas,
        }
      );

      toast({
        title: t('learning.session_complete', 'Session Complete'),
        description: `${questionsCorrect}/${questionsAttempted} ${t('learning.correct_answers', 'correct answers')}`,
      });

      onComplete?.();
    } catch (error: any) {
      if (import.meta.env.DEV) console.error('Failed to complete session:', error);
      toast({
        title: t('common.error', 'Error'),
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            {t('learning.no_questions', 'No questions available for this session')}
          </p>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const correctCount = Object.values(answers).filter(Boolean).length;
  const totalAnswered = Object.keys(answers).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                {t('learning.adaptive_practice', 'Adaptive Practice')}
              </CardTitle>
              <CardDescription>
                {t('learning.difficulty', 'Difficulty')}: 
                <Badge variant="outline" className="ms-2">
                  {difficulty}
                </Badge>
              </CardDescription>
            </div>
            <div className="text-end">
              <div className="text-2xl font-bold">
                {currentQuestionIndex + 1}/{questions.length}
              </div>
              <div className="text-sm text-muted-foreground">
                {correctCount}/{totalAnswered} {t('common.correct', 'correct')}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Recommendations */}
      {recommendations.length > 0 && currentQuestionIndex === 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              {t('learning.recommendations', 'Recommendations')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recommendations.map((rec, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <TrendingUp className="h-4 w-4 text-primary mt-0.5" />
                <p className="text-sm">{rec}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Question Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {currentQuestion.question_text}
          </CardTitle>
          <CardDescription>
            {t('learning.topic', 'Topic')}: {currentQuestion.topic}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Options */}
          {currentQuestion.options && Array.isArray(currentQuestion.options) && (
            <div className="space-y-2">
              {currentQuestion.options.map((option: string, idx: number) => (
                <Button
                  key={idx}
                  variant={selectedAnswer === option ? 'default' : 'outline'}
                  className="w-full justify-start text-start"
                  onClick={() => handleAnswerSelect(option)}
                  disabled={showResult}
                >
                  {option}
                </Button>
              ))}
            </div>
          )}

          {/* Result */}
          {showResult && (
            <div className={`flex items-center gap-2 p-4 rounded-lg ${
              answers[currentQuestion.id] 
                ? 'bg-success/10 text-success' 
                : 'bg-destructive/10 text-destructive'
            }`}>
              {answers[currentQuestion.id] ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
              <span className="font-medium">
                {answers[currentQuestion.id] 
                  ? t('common.correct', 'Correct!') 
                  : t('common.incorrect', 'Incorrect')}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            {!showResult ? (
              <Button
                onClick={handleSubmitAnswer}
                disabled={!selectedAnswer}
                className="w-full"
              >
                {t('common.submit', 'Submit Answer')}
              </Button>
            ) : (
              <Button onClick={handleNextQuestion} className="w-full">
                {currentQuestionIndex < questions.length - 1
                  ? t('common.next', 'Next Question')
                  : t('common.finish', 'Finish Session')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
