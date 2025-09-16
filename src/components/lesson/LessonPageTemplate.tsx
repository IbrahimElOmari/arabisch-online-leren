import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  BookOpen,
  Play,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Star,
  Volume2,
  Eye,
  Lightbulb,
  Target,
  Award,
  Trophy
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAgeTheme } from '@/contexts/AgeThemeContext';
import { ArabicText } from '@/components/ui/ArabicText';

type LessonSection = 'intro' | 'uitleg' | 'voorbeelden' | 'oefeningen' | 'samenvatting';

interface LessonStep {
  id: string;
  section: LessonSection;
  title: string;
  content: string;
  arabicText?: string;
  audioUrl?: string;
  videoUrl?: string;
  completed: boolean;
}

interface LessonPageTemplateProps {
  lessonTitle: string;
  niveauName: string;
  currentPoints?: number;
  totalPoints?: number;
  steps: LessonStep[];
  onStepComplete: (stepId: string) => void;
  onLessonComplete: () => void;
  className?: string;
}

export const LessonPageTemplate = ({
  lessonTitle,
  niveauName,
  currentPoints = 0,
  totalPoints = 1000,
  steps,
  onStepComplete,
  onLessonComplete,
  className
}: LessonPageTemplateProps) => {
  const { themeAge } = useAgeTheme();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const currentStep = steps[currentStepIndex];
  const completedCount = completedSteps.size;
  const progressPercentage = (completedCount / steps.length) * 100;

  useEffect(() => {
    // Initialize completed steps
    const initialCompleted = new Set(steps.filter(s => s.completed).map(s => s.id));
    setCompletedSteps(initialCompleted);
  }, [steps]);

  const handleStepComplete = (stepId: string) => {
    const newCompleted = new Set(completedSteps);
    newCompleted.add(stepId);
    setCompletedSteps(newCompleted);
    onStepComplete(stepId);

    // Check if all steps completed
    if (newCompleted.size === steps.length) {
      setTimeout(() => onLessonComplete(), 500);
    }
  };

  const getSectionIcon = (section: LessonSection) => {
    switch (section) {
      case 'intro': return BookOpen;
      case 'uitleg': return Lightbulb;
      case 'voorbeelden': return Eye;
      case 'oefeningen': return Target;
      case 'samenvatting': return Award;
      default: return BookOpen;
    }
  };

  const getSectionColor = (section: LessonSection) => {
    switch (section) {
      case 'intro': return 'text-blue-500';
      case 'uitleg': return 'text-green-500';
      case 'voorbeelden': return 'text-purple-500';
      case 'oefeningen': return 'text-orange-500';
      case 'samenvatting': return 'text-amber-500';
      default: return 'text-primary';
    }
  };

  const getThemeClasses = () => {
    switch (themeAge) {
      case 'playful':
        return 'space-y-6';
      case 'professional':
        return 'space-y-4';
      default:
        return 'space-y-6';
    }
  };

  return (
    <div className={cn("max-w-4xl mx-auto p-6", getThemeClasses(), className)}>
      {/* Header */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">{lessonTitle}</CardTitle>
              <p className="text-muted-foreground mt-1">{niveauName}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                <Star className="h-5 w-5" />
                {currentPoints}/{totalPoints}
              </div>
              <div className="text-sm text-muted-foreground">Punten</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Les Voortgang</span>
              <span>{completedCount}/{steps.length} stappen voltooid</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Step Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
              disabled={currentStepIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Vorige
            </Button>
            
            <div className="flex items-center gap-2">
              {steps.map((step, index) => {
                const IconComponent = getSectionIcon(step.section);
                const isCompleted = completedSteps.has(step.id);
                const isCurrent = index === currentStepIndex;
                
                return (
                  <button
                    key={step.id}
                    onClick={() => setCurrentStepIndex(index)}
                    className={cn(
                      "p-2 rounded-full transition-all duration-200",
                      isCurrent && "ring-2 ring-primary ring-offset-2",
                      isCompleted && "bg-success text-success-foreground",
                      !isCompleted && !isCurrent && "bg-muted hover:bg-muted/80",
                      !isCompleted && isCurrent && "bg-primary/10"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <IconComponent className={cn("h-4 w-4", getSectionColor(step.section))} />
                    )}
                  </button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentStepIndex(Math.min(steps.length - 1, currentStepIndex + 1))}
              disabled={currentStepIndex === steps.length - 1}
            >
              Volgende
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Step Content */}
      {currentStep && (
        <Card className="min-h-[400px]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {React.createElement(getSectionIcon(currentStep.section), {
                  className: cn("h-6 w-6", getSectionColor(currentStep.section))
                })}
                <div>
                  <CardTitle>{currentStep.title}</CardTitle>
                  <Badge variant="outline" className="mt-1 capitalize">
                    {currentStep.section}
                  </Badge>
                </div>
              </div>
              {completedSteps.has(currentStep.id) && (
                <Badge className="bg-success text-success-foreground">
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Voltooid
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Video Content */}
            {currentStep.videoUrl && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  Video Les
                </h4>
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">Video wordt hier geladen</p>
                </div>
              </div>
            )}

            {/* Main Content */}
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div dangerouslySetInnerHTML={{ __html: currentStep.content }} />
            </div>

            {/* Arabic Text with Audio */}
            {currentStep.arabicText && (
              <div className="space-y-3">
                <Separator />
                <h4 className="font-medium flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  Arabische Tekst
                </h4>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <ArabicText
                    variant="heading"
                    className="text-xl leading-relaxed"
                  >
                    {currentStep.arabicText}
                  </ArabicText>
                  {currentStep.audioUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full"
                    >
                      <Volume2 className="h-4 w-4 mr-2" />
                      Luister naar Uitspraak
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Completion Button */}
            {!completedSteps.has(currentStep.id) && (
              <div className="pt-4 border-t">
                <Button
                  onClick={() => handleStepComplete(currentStep.id)}
                  className="w-full"
                  size="lg"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Stap Voltooien
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Summary when all completed */}
      {completedCount === steps.length && (
        <Card className="border-success/50 bg-success/10">
          <CardContent className="text-center p-6">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-success" />
            <h3 className="text-xl font-bold text-success mb-2">
              🎉 Les Voltooid!
            </h3>
            <p className="text-success/80">
              Geweldig werk! Je hebt alle stappen van deze les afgerond.
            </p>
            <Button 
              onClick={onLessonComplete}
              className="mt-4"
              size="lg"
            >
              Verder naar Volgende Les
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};