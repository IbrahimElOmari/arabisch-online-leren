
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle2, 
  Clock, 
  Radio,
  Star,
  MessageCircle,
  Volume2
} from 'lucide-react';

interface Question {
  id: string;
  niveau_id: string;
  vraag: string;
  audio_url?: string;
  correct_antwoord?: string;
  created_at: string;
  answer?: {
    id: string;
    antwoord: string;
    is_correct: boolean;
    punten: number;
    feedback: string;
    created_at: string;
  };
}

interface StudentQuestionCardProps {
  question: Question;
  onSubmit: (questionId: string, answer: string) => Promise<void>;
}

export const StudentQuestionCard = ({ question, onSubmit }: StudentQuestionCardProps) => {
  const [answerText, setAnswerText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!answerText.trim()) return;
    
    setSubmitting(true);
    try {
      await onSubmit(question.id, answerText);
      setAnswerText('');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = () => {
    if (!question.answer) {
      return <Badge variant="outline" className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        Nog niet beantwoord
      </Badge>;
    }
    
    if (question.answer.punten !== null && question.answer.punten !== undefined) {
      return <Badge 
        variant={question.answer.is_correct ? "default" : "destructive"} 
        className="flex items-center gap-1"
      >
        <Star className="h-3 w-3" />
        {question.answer.is_correct ? 'Correct' : 'Incorrect'} - {question.answer.punten} punten
      </Badge>;
    }
    
    return <Badge variant="secondary" className="flex items-center gap-1">
      <CheckCircle2 className="h-3 w-3" />
      Beantwoord
    </Badge>;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Radio className="h-5 w-5" />
              Vraag
            </CardTitle>
            <p className="text-sm mt-2">{question.vraag}</p>
            
            {question.audio_url && (
              <div className="mt-3">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  Luister naar audio
                </Button>
                <audio controls className="w-full mt-2">
                  <source src={question.audio_url} type="audio/mpeg" />
                  Je browser ondersteunt geen audio element.
                </audio>
              </div>
            )}
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {question.answer ? (
          <div className="space-y-3">
            <div className="bg-muted/50 p-3 rounded-lg">
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Jouw Antwoord
              </h4>
              <p className="text-sm">{question.answer.antwoord}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Beantwoord op: {new Date(question.answer.created_at).toLocaleString('nl-NL')}
              </p>
            </div>

            {question.answer.feedback && (
              <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Feedback van je leerkracht
                </h4>
                <p className="text-sm">{question.answer.feedback}</p>
              </div>
            )}

            {question.correct_antwoord && (
              <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
                <h4 className="font-medium text-sm mb-2">Correct Antwoord</h4>
                <p className="text-sm">{question.correct_antwoord}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Separator />
            <div className="space-y-3">
              <Textarea
                placeholder="Typ hier je antwoord..."
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                className="min-h-[100px]"
              />
              <Button 
                onClick={handleSubmit}
                disabled={!answerText.trim() || submitting}
                className="w-full"
              >
                <CheckCircle2 className="h-4 w-4 me-2" />
                {submitting ? 'Bezig met indienen...' : 'Antwoord Indienen'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
