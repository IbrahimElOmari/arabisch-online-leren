import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Zap, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Play,
  BarChart3
} from 'lucide-react';

interface AutoGradableQuestion {
  id: string;
  vraag_tekst: string;
  correct_antwoord: any;
  niveau_naam: string;
  answersCount: number;
  ungradedCount: number;
}

interface AutoGradingSystemProps {
  classId: string;
  levelId?: string;
}

export const AutoGradingSystem = ({ classId, levelId }: AutoGradingSystemProps) => {
  const [questions, setQuestions] = useState<AutoGradableQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ total: number; graded: number; errors: number } | null>(null);

  useEffect(() => {
    fetchAutoGradableQuestions();
  }, [classId, levelId]);

  const fetchAutoGradableQuestions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('vragen')
        .select(`
          id,
          vraag_tekst,
          correct_antwoord,
          niveaus!inner(
            naam,
            class_id
          )
        `)
        .eq('niveaus.class_id', classId)
        .not('correct_antwoord', 'is', null);

      if (levelId) {
        query = query.eq('niveau_id', levelId);
      }

      const { data: questionsData, error: questionsError } = await query;
      if (questionsError) throw questionsError;

      // Get answer counts for each question
      const questionsWithCounts = await Promise.all(
        (questionsData || []).map(async (question) => {
          const { count: totalAnswers } = await supabase
            .from('antwoorden')
            .select('*', { count: 'exact', head: true })
            .eq('vraag_id', question.id);

          const { count: ungradedAnswers } = await supabase
            .from('antwoorden')
            .select('*', { count: 'exact', head: true })
            .eq('vraag_id', question.id)
            .is('is_correct', null);

          return {
            id: question.id,
            vraag_tekst: question.vraag_tekst,
            correct_antwoord: question.correct_antwoord,
            niveau_naam: question.niveaus.naam,
            answersCount: totalAnswers || 0,
            ungradedCount: ungradedAnswers || 0
          };
        })
      );

      // Filter out questions with no ungraded answers
      const questionsWithUngraded = questionsWithCounts.filter(q => q.ungradedCount > 0);
      setQuestions(questionsWithUngraded);

    } catch (error) {
      console.error('Error fetching auto-gradable questions:', error);
      toast.error('Fout bij het ophalen van vragen');
    } finally {
      setLoading(false);
    }
  };

  const normalizeAnswer = (answer: any): string => {
    if (typeof answer === 'string') {
      return answer.toLowerCase().trim();
    }
    if (typeof answer === 'number') {
      return answer.toString();
    }
    if (typeof answer === 'boolean') {
      return answer.toString();
    }
    if (Array.isArray(answer)) {
      return answer.map(a => normalizeAnswer(a)).join(',');
    }
    return JSON.stringify(answer).toLowerCase();
  };

  const autoGradeQuestion = async (questionId: string): Promise<{ graded: number; errors: number }> => {
    try {
      // Get the correct answer
      const { data: questionData, error: questionError } = await supabase
        .from('vragen')
        .select('correct_antwoord')
        .eq('id', questionId)
        .single();

      if (questionError) throw questionError;

      const correctAnswer = normalizeAnswer(questionData.correct_antwoord);

      // Get ungraded answers for this question
      const { data: answers, error: answersError } = await supabase
        .from('antwoorden')
        .select('id, antwoord, student_id')
        .eq('vraag_id', questionId)
        .is('is_correct', null);

      if (answersError) throw answersError;

      let gradedCount = 0;
      let errorCount = 0;

      // Grade each answer
      for (const answer of answers || []) {
        try {
          const studentAnswer = normalizeAnswer(answer.antwoord);
          const isCorrect = studentAnswer === correctAnswer;
          const points = isCorrect ? 1 : 0;

          const { error: updateError } = await supabase
            .from('antwoorden')
            .update({
              is_correct: isCorrect,
              punten: points,
              feedback: 'Automatisch beoordeeld'
            })
            .eq('id', answer.id);

          if (updateError) throw updateError;

          // Create notification for student
          await supabase
            .from('user_notifications')
            .insert({
              user_id: answer.student_id,
              message: `Je antwoord is automatisch beoordeeld als ${isCorrect ? 'juist' : 'onjuist'} (${points} punt)`
            });

          gradedCount++;
        } catch (error) {
          console.error(`Error grading answer ${answer.id}:`, error);
          errorCount++;
        }
      }

      return { graded: gradedCount, errors: errorCount };
    } catch (error) {
      console.error(`Error auto-grading question ${questionId}:`, error);
      return { graded: 0, errors: 1 };
    }
  };

  const handleAutoGradeAll = async () => {
    if (questions.length === 0) {
      toast.error('Geen vragen beschikbaar voor automatische beoordeling');
      return;
    }

    setProcessing(true);
    setProgress(0);
    setResults(null);

    let totalGraded = 0;
    let totalErrors = 0;

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const { graded, errors } = await autoGradeQuestion(question.id);
      
      totalGraded += graded;
      totalErrors += errors;
      
      setProgress(((i + 1) / questions.length) * 100);
    }

    setResults({
      total: questions.reduce((acc, q) => acc + q.ungradedCount, 0),
      graded: totalGraded,
      errors: totalErrors
    });

    setProcessing(false);
    
    if (totalErrors === 0) {
      toast.success(`${totalGraded} antwoorden succesvol automatisch beoordeeld!`);
    } else {
      toast.warning(`${totalGraded} antwoorden beoordeeld, ${totalErrors} fouten opgetreden`);
    }

    // Refresh data
    await fetchAutoGradableQuestions();
  };

  const handleAutoGradeSingle = async (questionId: string) => {
    setProcessing(true);
    const { graded, errors } = await autoGradeQuestion(questionId);
    setProcessing(false);

    if (errors === 0) {
      toast.success(`${graded} antwoorden automatisch beoordeeld!`);
    } else {
      toast.error(`Fout bij automatische beoordeling`);
    }

    await fetchAutoGradableQuestions();
  };

  const getTotalUngradedCount = () => {
    return questions.reduce((acc, q) => acc + q.ungradedCount, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Automatische Beoordeling
          </h3>
          <p className="text-sm text-muted-foreground">
            Automatisch beoordelen van meerkeuzevragen en exacte antwoorden
          </p>
        </div>
        
        {questions.length > 0 && (
          <Button
            onClick={handleAutoGradeAll}
            disabled={processing}
            className="bg-yellow-600 hover:bg-yellow-700"
          >
            <Play className="h-4 w-4 mr-2" />
            {processing ? 'Bezig...' : `Beoordeel Alles (${getTotalUngradedCount()})`}
          </Button>
        )}
      </div>

      {processing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Voortgang automatische beoordeling</span>
                <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {results && (
        <Alert>
          <BarChart3 className="h-4 w-4" />
          <AlertDescription>
            <strong>Resultaten:</strong> {results.graded} van {results.total} antwoorden succesvol beoordeeld.
            {results.errors > 0 && ` ${results.errors} fouten opgetreden.`}
          </AlertDescription>
        </Alert>
      )}

      {questions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <h4 className="font-medium mb-2">Geen automatische beoordeling beschikbaar</h4>
            <p className="text-sm text-muted-foreground">
              Alle automatisch beoordeelbare vragen zijn al beoordeeld, of er zijn geen vragen 
              met correcte antwoorden gedefinieerd.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {questions.map((question) => (
            <Card key={question.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{question.vraag_tekst}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">{question.niveau_naam}</Badge>
                      <Badge variant="secondary">
                        {question.ungradedCount} te beoordelen van {question.answersCount} totaal
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAutoGradeSingle(question.id)}
                    disabled={processing}
                  >
                    <Zap className="h-4 w-4 mr-1" />
                    Beoordeel
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  <span className="text-muted-foreground">Correct antwoord: </span>
                  <code className="bg-muted px-2 py-1 rounded text-xs">
                    {JSON.stringify(question.correct_antwoord)}
                  </code>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Let op:</strong> Automatische beoordeling werkt het beste voor meerkeuzevragen en 
          exacte antwoorden. Controleer altijd de resultaten en pas handmatig aan waar nodig.
        </AlertDescription>
      </Alert>
    </div>
  );
};