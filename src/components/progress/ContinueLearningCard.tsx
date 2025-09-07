import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, PlayCircle } from 'lucide-react';
import { StudentProgress } from '@/hooks/useStudentProgress';

interface ContinueLearningCardProps {
  currentProgress?: StudentProgress;
  onContinue: (niveauId: string) => void;
}

export const ContinueLearningCard: React.FC<ContinueLearningCardProps> = ({ 
  currentProgress, 
  onContinue 
}) => {
  if (!currentProgress || currentProgress.is_completed) {
    return (
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
        <CardContent className="p-6 text-center">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h3 className="text-lg font-semibold mb-2">Alle levels voltooid! 🎉</h3>
          <p className="text-muted-foreground">
            Geweldig werk! Je hebt alle beschikbare levels voltooid. 
            Blijf oefenen om je Arabisch te perfectioneren.
          </p>
        </CardContent>
      </Card>
    );
  }

  const progressPercentage = Math.min((currentProgress.total_points / 1000) * 100, 100);
  const pointsRemaining = Math.max(1000 - currentProgress.total_points, 0);

  return (
    <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlayCircle className="h-5 w-5 text-primary" />
          Ga verder waar je gebleven was
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="font-medium text-lg">
            {currentProgress.niveau?.naam || `Level ${currentProgress.niveau?.niveau_nummer}`}
          </h4>
          
          <div className="flex items-center justify-between text-sm">
            <span>Voortgang: {Math.round(progressPercentage)}%</span>
            <span className="text-muted-foreground">
              {currentProgress.total_points} / 1000 punten
            </span>
          </div>
          
          <div className="w-full bg-secondary rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {currentProgress.niveau?.beschrijving && (
          <p className="text-sm text-muted-foreground">
            {currentProgress.niveau.beschrijving}
          </p>
        )}

        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="p-3 bg-background rounded-lg">
            <div className="text-lg font-semibold text-primary">
              {currentProgress.completed_tasks}
            </div>
            <div className="text-xs text-muted-foreground">Taken</div>
          </div>
          <div className="p-3 bg-background rounded-lg">
            <div className="text-lg font-semibold text-primary">
              {currentProgress.completed_questions}
            </div>
            <div className="text-xs text-muted-foreground">Vragen</div>
          </div>
        </div>

        {pointsRemaining > 0 && (
          <div className="p-3 bg-secondary/50 rounded-lg text-center">
            <p className="text-sm font-medium">
              Nog {pointsRemaining} punten om dit level te voltooien!
            </p>
          </div>
        )}

        <Button 
          onClick={() => onContinue(currentProgress.niveau_id)}
          className="w-full group"
          size="lg"
        >
          Doorgaan met leren
          <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </CardContent>
    </Card>
  );
};