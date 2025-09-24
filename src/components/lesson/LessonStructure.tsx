import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronRight, 
  ChevronLeft, 
  BookOpen, 
  PlayCircle,
  CheckCircle,
  Target,
  Trophy,
  ArrowRight,
  Volume2
} from 'lucide-react';
import { useAgeTheme } from '@/contexts/AgeThemeContext';
import { cn } from '@/lib/utils';
import { ArabicText } from '@/components/ui/ArabicText';

interface LessonStep {
  id: string;
  type: 'intro' | 'explanation' | 'example' | 'practice' | 'summary';
  title: string;
  content: React.ReactNode;
  arabicContent?: string;
  audioUrl?: string;
  completed?: boolean;
}

interface LessonStructureProps {
  lessonTitle: string;
  lessonDescription?: string;
  steps: LessonStep[];
  onComplete?: () => void;
  onNext?: () => void;
}

export const LessonStructure: React.FC<LessonStructureProps> = ({
  lessonTitle,
  lessonDescription,
  steps,
  onComplete,
  onNext
}) => {
  const { themeAge } = useAgeTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [showCelebration, setShowCelebration] = useState(false);

  const progress = ((currentStep + 1) / steps.length) * 100;
  const isLastStep = currentStep === steps.length - 1;
  const isStepCompleted = completedSteps.has(currentStep);

  useEffect(() => {
    // Auto-mark certain step types as completed when viewed
    const currentStepType = steps[currentStep]?.type;
    if (['intro', 'explanation', 'example', 'summary'].includes(currentStepType)) {
      setTimeout(() => {
        setCompletedSteps(prev => new Set([...prev, currentStep]));
      }, 2000); // Mark as completed after 2 seconds of viewing
    }
  }, [currentStep, steps]);

  const handleNext = () => {
    if (isLastStep) {
      if (completedSteps.size === steps.length) {
        setShowCelebration(true);
        setTimeout(() => {
          onComplete?.();
        }, 2000);
      }
    } else {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleStepComplete = () => {
    setCompletedSteps(prev => new Set([...prev, currentStep]));
  };

  const getStepIcon = (type: string, completed: boolean) => {
    const iconClass = completed ? "text-success" : "text-muted-foreground";
    
    switch (type) {
      case 'intro':
        return <BookOpen className={cn("h-5 w-5", iconClass)} />;
      case 'explanation':
        return <Target className={cn("h-5 w-5", iconClass)} />;
      case 'example':
        return <PlayCircle className={cn("h-5 w-5", iconClass)} />;
      case 'practice':
        return <CheckCircle className={cn("h-5 w-5", iconClass)} />;
      case 'summary':
        return <Trophy className={cn("h-5 w-5", iconClass)} />;
      default:
        return <BookOpen className={cn("h-5 w-5", iconClass)} />;
    }
  };

  const getThemeClasses = () => {
    switch (themeAge) {
      case 'playful':
        return 'animate-fade-in';
      case 'professional':
        return 'subtle-hover';
      default:
        return '';
    }
  };

  const getCelebrationContent = () => {
    switch (themeAge) {
      case 'playful':
        return (
          <div className="text-center space-y-4 animate-bounce-in">
            <div className="text-6xl">🎉</div>
            <h2 className="text-2xl font-bold text-primary">Geweldig gedaan!</h2>
            <p className="text-lg">Je hebt deze les succesvol voltooid!</p>
          </div>
        );
      case 'professional':
        return (
          <div className="text-center space-y-4">
            <Trophy className="h-16 w-16 mx-auto text-success" />
            <h2 className="text-xl font-semibold">Les voltooid</h2>
            <p>Je hebt alle onderdelen van deze les succesvol afgerond.</p>
          </div>
        );
      default:
        return (
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 mx-auto text-success" />
            <h2 className="text-xl font-semibold">Les voltooid!</h2>
            <p>Goed werk! Je hebt deze les succesvol afgerond.</p>
          </div>
        );
    }
  };

  if (showCelebration) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8">
            {getCelebrationContent()}
            <div className="mt-6 space-y-3">
              <Button onClick={onNext} className="w-full" size="lg">
                Volgende Les
                <ArrowRight className="h-4 w-4 ms-2" />
              </Button>
              <Button variant="outline" onClick={() => setShowCelebration(false)} className="w-full">
                Les Opnieuw Bekijken
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen bg-background p-6", getThemeClasses())}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Lesson Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className={cn(
                  "mb-2",
                  themeAge === 'playful' ? 'text-2xl font-bold' : 'text-xl font-semibold'
                )}>
                  {lessonTitle}
                </CardTitle>
                {lessonDescription && (
                  <p className="text-muted-foreground">{lessonDescription}</p>
                )}
              </div>
              <Badge variant="outline">
                {currentStep + 1} / {steps.length}
              </Badge>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Voortgang</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardHeader>
        </Card>

        {/* Step Navigation */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between overflow-x-auto gap-2">
              {steps.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(index)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all min-w-fit",
                    index === currentStep 
                      ? "bg-primary text-primary-foreground" 
                      : completedSteps.has(index)
                      ? "bg-success/20 text-success"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {getStepIcon(step.type, completedSteps.has(index))}
                  <span className="hidden sm:inline">{step.title}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Current Step Content */}
        <Card className="min-h-[400px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              {getStepIcon(steps[currentStep].type, isStepCompleted)}
              {steps[currentStep].title}
              {isStepCompleted && (
                <Badge variant="secondary" className="bg-success/20 text-success">
                  Voltooid
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Arabic Content */}
            {steps[currentStep].arabicContent && (
              <ArabicText
                variant="display"
                withDiacritics={true}
                withAudio={true}
                audioUrl={steps[currentStep].audioUrl}
              >
                {steps[currentStep].arabicContent}
              </ArabicText>
            )}

            {/* Step Content */}
            <div className="prose prose-lg max-w-none">
              {steps[currentStep].content}
            </div>

            {/* Practice Step Interaction */}
            {steps[currentStep].type === 'practice' && !isStepCompleted && (
              <div className="border-t pt-6">
                <Button 
                  onClick={handleStepComplete}
                  className="w-full"
                  size="lg"
                >
                  Oefening Voltooid
                  <CheckCircle className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Controls */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Vorige
              </Button>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{completedSteps.size} van {steps.length} voltooid</span>
              </div>

              <Button
                onClick={handleNext}
                disabled={steps[currentStep].type === 'practice' && !isStepCompleted}
                className="flex items-center gap-2"
                size={isLastStep ? "lg" : "default"}
                variant={isLastStep ? "default" : "outline"}
              >
                {isLastStep ? (
                  <>
                    Les Voltooien
                    <Trophy className="h-4 w-4 ml-2" />
                  </>
                ) : (
                  <>
                    Volgende
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Lesson Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Volgende Stappen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <Button variant="outline" className="justify-start h-auto p-4">
                <div className="text-left">
                  <div className="font-medium">Volgende Les</div>
                  <div className="text-sm text-muted-foreground">
                    Ga verder met het volgende onderwerp
                  </div>
                </div>
              </Button>
              <Button variant="outline" className="justify-start h-auto p-4">
                <div className="text-left">
                  <div className="font-medium">Oefeningen</div>
                  <div className="text-sm text-muted-foreground">
                    Oefen wat je hebt geleerd
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};