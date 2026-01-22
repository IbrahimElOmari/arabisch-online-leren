import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, RotateCcw, CheckCircle2, BookOpen, Trophy, Brain } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { spacedRepetitionService, qualityRatings, type SpacedRepetitionCard, type StudentStats } from '@/services/spacedRepetitionService';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/contexts/TranslationContext';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { toast } from 'sonner';

interface SpacedRepetitionPracticeProps {
  className?: string;
  onComplete?: (stats: { reviewed: number; accuracy: number }) => void;
}

export function SpacedRepetitionPractice({ className, onComplete }: SpacedRepetitionPracticeProps) {
  const { user } = useAuth();
  const { } = useTranslation();
  const { isRTL } = useRTLLayout();
  
  const [cards, setCards] = useState<SpacedRepetitionCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, correct: 0 });
  const [isComplete, setIsComplete] = useState(false);

  const currentCard = cards[currentIndex];

  // Fetch due cards and stats
  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const [dueCards, studentStats] = await Promise.all([
        spacedRepetitionService.getDueCards(user.id),
        spacedRepetitionService.getStudentStats(user.id),
      ]);
      
      setCards(dueCards);
      setStats(studentStats);
      setIsComplete(dueCards.length === 0);
    } catch (error) {
      console.error('Error fetching SRS data:', error);
      toast.error('Kon kaarten niet laden');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (isFlipped && e.key >= '0' && e.key <= '5') {
        e.preventDefault();
        handleRating(parseInt(e.key) as 0 | 1 | 2 | 3 | 4 | 5);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, currentIndex]);

  const handleRating = async (quality: 0 | 1 | 2 | 3 | 4 | 5) => {
    if (!currentCard) return;

    try {
      await spacedRepetitionService.recordReview({
        cardId: currentCard.id,
        quality,
      });

      // Update session stats
      setSessionStats((prev) => ({
        reviewed: prev.reviewed + 1,
        correct: quality >= 3 ? prev.correct + 1 : prev.correct,
      }));

      // Move to next card or complete
      if (currentIndex < cards.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setIsFlipped(false);
      } else {
        setIsComplete(true);
        const accuracy = sessionStats.reviewed > 0 
          ? Math.round(((sessionStats.correct + (quality >= 3 ? 1 : 0)) / (sessionStats.reviewed + 1)) * 100)
          : 0;
        onComplete?.({ reviewed: sessionStats.reviewed + 1, accuracy });
      }
    } catch (error) {
      console.error('Error recording review:', error);
      toast.error('Kon beoordeling niet opslaan');
    }
  };

  const handleRestart = () => {
    fetchData();
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionStats({ reviewed: 0, correct: 0 });
    setIsComplete(false);
  };

  if (isLoading) {
    return (
      <Card className={cn('w-full max-w-2xl mx-auto', className)}>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (isComplete) {
    const accuracy = sessionStats.reviewed > 0 
      ? Math.round((sessionStats.correct / sessionStats.reviewed) * 100)
      : 100;

    return (
      <Card className={cn('w-full max-w-2xl mx-auto', className)}>
        <CardContent className="py-12 text-center space-y-6">
          <div className="flex justify-center">
            <div className="rounded-full bg-success/20 p-4">
              <Trophy className="h-12 w-12 text-success" />
            </div>
          </div>
          
          <div>
            <h2 className={cn("text-2xl font-bold mb-2", isRTL && "arabic-text")}>
              {sessionStats.reviewed > 0 ? 'Geweldig gedaan!' : 'Geen kaarten te leren'}
            </h2>
            <p className={cn("text-muted-foreground", isRTL && "arabic-text")}>
              {sessionStats.reviewed > 0 
                ? `Je hebt ${sessionStats.reviewed} kaarten geleerd met ${accuracy}% nauwkeurigheid`
                : 'Kom later terug voor nieuwe kaarten'}
            </p>
          </div>

          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Totaal</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-success">{stats.mastered}</div>
                <div className="text-sm text-muted-foreground">Beheerst</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-warning">{stats.learning}</div>
                <div className="text-sm text-muted-foreground">Aan het leren</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">{stats.newCards}</div>
                <div className="text-sm text-muted-foreground">Nieuw</div>
              </div>
            </div>
          )}

          <Button onClick={handleRestart} className="mt-4">
            <RotateCcw className="h-4 w-4 me-2" />
            Opnieuw proberen
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('w-full max-w-2xl mx-auto', className)}>
      <CardHeader className="pb-2">
        <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
          <CardTitle className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
            <Brain className="h-5 w-5 text-primary" />
            <span className={isRTL ? 'arabic-text' : ''}>Spaced Repetition</span>
          </CardTitle>
          <Badge variant="outline">
            {currentIndex + 1} / {cards.length}
          </Badge>
        </div>
        <Progress 
          value={((currentIndex) / cards.length) * 100} 
          className="h-2 mt-2"
        />
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Flashcard */}
        <div
          className={cn(
            "relative min-h-[300px] cursor-pointer perspective-1000",
            "transition-transform duration-500 preserve-3d",
            isFlipped && "rotate-y-180"
          )}
          onClick={() => setIsFlipped(!isFlipped)}
          role="button"
          aria-label={isFlipped ? 'Toon vraag' : 'Toon antwoord'}
          tabIndex={0}
        >
          {/* Front (Arabic) */}
          <div
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center p-8",
              "bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border-2 border-primary/20",
              "backface-hidden transition-all",
              isFlipped && "opacity-0 pointer-events-none"
            )}
          >
            <span className="text-sm text-muted-foreground mb-4">Arabisch</span>
            <span className="text-5xl md:text-6xl font-arabic text-center leading-relaxed" dir="rtl">
              {currentCard?.arabic_word}
            </span>
            <span className="text-sm text-muted-foreground mt-8">
              Klik of druk op spatie om om te draaien
            </span>
          </div>

          {/* Back (Translation) */}
          <div
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center p-8",
              "bg-gradient-to-br from-success/10 to-success/5 rounded-xl border-2 border-success/20",
              "backface-hidden rotate-y-180 transition-all",
              !isFlipped && "opacity-0 pointer-events-none"
            )}
          >
            <span className="text-sm text-muted-foreground mb-4">Vertaling</span>
            <span className="text-3xl md:text-4xl font-bold text-center">
              {currentCard?.translation}
            </span>
            <span className="text-sm text-muted-foreground mt-8">
              Beoordeel je antwoord hieronder
            </span>
          </div>
        </div>

        {/* Rating buttons (only show when flipped) */}
        {isFlipped && (
          <div className="space-y-4">
            <p className={cn("text-center text-sm text-muted-foreground", isRTL && "arabic-text")}>
              Hoe goed herinnerde je het antwoord?
            </p>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {qualityRatings.map((rating) => (
                <Button
                  key={rating.value}
                  variant={rating.value >= 3 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleRating(rating.value as 0 | 1 | 2 | 3 | 4 | 5)}
                  className={cn(
                    "flex flex-col h-auto py-3",
                    rating.value >= 4 && "bg-success hover:bg-success/90",
                    rating.value === 3 && "bg-warning hover:bg-warning/90",
                    rating.value <= 2 && "border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  )}
                >
                  <span className="font-bold">{rating.value}</span>
                  <span className="text-xs">{rating.label}</span>
                </Button>
              ))}
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Tip: Gebruik toetsen 0-5 voor snelle beoordeling
            </p>
          </div>
        )}

        {/* Session progress */}
        {sessionStats.reviewed > 0 && (
          <div className={cn("flex justify-center gap-4 text-sm", isRTL && "flex-row-reverse")}>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span>{sessionStats.correct} correct</span>
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span>{sessionStats.reviewed} geleerd</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SpacedRepetitionPractice;
