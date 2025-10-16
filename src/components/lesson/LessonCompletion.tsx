import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  Star, 
  CheckCircle, 
  ArrowRight, 
  Gift,
  Sparkles,
  Award
} from 'lucide-react';
import { useAgeTheme } from '@/contexts/AgeThemeContext';
import { cn } from '@/lib/utils';

interface LessonCompletionProps {
  lessonTitle: string;
  pointsEarned: number;
  badgesEarned?: string[];
  accuracy?: number;
  timeSpent?: number;
  onNext?: () => void;
  onReview?: () => void;
  onBackToDashboard?: () => void;
}

export const LessonCompletion: React.FC<LessonCompletionProps> = ({
  lessonTitle,
  pointsEarned,
  badgesEarned = [],
  accuracy = 0,
  timeSpent = 0,
  onNext,
  onReview,
  onBackToDashboard
}) => {
  const { themeAge } = useAgeTheme();
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    // Show celebration animation
    setShowCelebration(true);
    
    // Play completion sound if available
    if (themeAge === 'playful') {
      // Could integrate actual sound files here
      if (import.meta.env.DEV) {
        console.log('🎵 Playing completion sound!');
      }
    }
  }, [themeAge]);

  const getThemeContent = () => {
    switch (themeAge) {
      case 'playful':
        return {
          emoji: '🎉',
          title: 'Fantastisch gedaan!',
          subtitle: 'Je bent een echte Arabisch superster! ⭐',
          buttonText: '🚀 Volgende Avontuur',
        };
      case 'professional':
        return {
          icon: <Trophy className="h-16 w-16 text-success" />,
          title: 'Les Succesvol Voltooid',
          subtitle: 'Uitstekende prestatie. Je leervoortgang is bijgewerkt.',
          buttonText: 'Volgende Les',
        };
      default:
        return {
          icon: <CheckCircle className="h-16 w-16 text-success" />,
          title: 'Les Voltooid!',
          subtitle: 'Goed gedaan! Je hebt weer belangrijke stappen gezet.',
          buttonText: 'Ga Verder',
        };
    }
  };

  const themeContent = getThemeContent();

  const getCardClasses = () => {
    const baseClasses = "w-full max-w-2xl mx-auto";
    
    switch (themeAge) {
      case 'playful':
        return cn(baseClasses, "border-4 border-primary animate-bounce-in celebration-effect");
      case 'professional':
        return cn(baseClasses, "border subtle-hover");
      default:
        return cn(baseClasses, "border-2 border-success/50");
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className={getCardClasses()}>
        <CardContent className="p-8 text-center space-y-6">
          {/* Main Icon/Emoji */}
          <div className={cn(
            "flex justify-center",
            showCelebration && themeAge === 'playful' && "animate-bounce-in"
          )}>
            {themeAge === 'playful' ? (
              <div className="text-8xl">{themeContent.emoji}</div>
            ) : (
              themeContent.icon
            )}
          </div>

          {/* Title and Subtitle */}
          <div className="space-y-2">
            <h1 className={cn(
              "font-bold text-primary",
              themeAge === 'playful' ? 'text-4xl' : 'text-2xl'
            )}>
              {themeContent.title}
            </h1>
            <p className={cn(
              "text-muted-foreground",
              themeAge === 'playful' ? 'text-lg font-medium' : 'text-base'
            )}>
              {themeContent.subtitle}
            </p>
            <p className="text-lg font-semibold">
              {lessonTitle}
            </p>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={cn(
              "p-4 rounded-lg border",
              themeAge === 'playful' ? 'bg-primary/10 border-primary/20' : 'bg-muted/50'
            )}>
              <div className={cn(
                "font-bold text-primary",
                themeAge === 'playful' ? 'text-3xl' : 'text-2xl'
              )}>
                {pointsEarned}
              </div>
              <div className="text-sm text-muted-foreground">
                {themeAge === 'playful' ? '⭐ Punten Verdiend' : 'Punten Verdiend'}
              </div>
            </div>

            <div className={cn(
              "p-4 rounded-lg border",
              themeAge === 'playful' ? 'bg-success/10 border-success/20' : 'bg-muted/50'
            )}>
              <div className={cn(
                "font-bold text-success",
                themeAge === 'playful' ? 'text-3xl' : 'text-2xl'
              )}>
                {accuracy}%
              </div>
              <div className="text-sm text-muted-foreground">
                {themeAge === 'playful' ? '🎯 Nauwkeurigheid' : 'Nauwkeurigheid'}
              </div>
            </div>

            <div className={cn(
              "p-4 rounded-lg border",
              themeAge === 'playful' ? 'bg-blue-500/10 border-blue-500/20' : 'bg-muted/50'
            )}>
              <div className={cn(
                "font-bold text-blue-500",
                themeAge === 'playful' ? 'text-3xl' : 'text-2xl'
              )}>
                {formatTime(timeSpent)}
              </div>
              <div className="text-sm text-muted-foreground">
                {themeAge === 'playful' ? '⏱️ Tijd Besteed' : 'Tijd Besteed'}
              </div>
            </div>
          </div>

          {/* Badges Earned */}
          {badgesEarned.length > 0 && (
            <div className="space-y-3">
              <h3 className={cn(
                "font-semibold flex items-center justify-center gap-2",
                themeAge === 'playful' ? 'text-xl' : 'text-lg'
              )}>
                {themeAge === 'playful' ? '🏆' : <Award className="h-5 w-5" />}
                Nieuwe Badges Verdiend!
              </h3>
              <div className="flex flex-wrap justify-center gap-2">
                {badgesEarned.map((badge, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary"
                    className={cn(
                      "gap-2 py-2 px-4",
                      themeAge === 'playful' && "bg-yellow-500/20 text-yellow-700 border-yellow-500/30 animate-bounce-in"
                    )}
                  >
                    {themeAge === 'playful' ? '🌟' : <Star className="h-4 w-4" />}
                    {badge}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Motivational Message */}
          <div className={cn(
            "p-4 rounded-lg",
            themeAge === 'playful' ? 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20' :
            themeAge === 'professional' ? 'bg-muted/30 border border-border' :
            'bg-primary/5 border border-primary/20'
          )}>
            <p className={cn(
              "font-medium",
              themeAge === 'playful' ? 'text-lg' : 'text-base'
            )}>
              {themeAge === 'playful' 
                ? "Je wordt steeds beter in Arabisch! Blijf zo doorgaan, superster! 🌟"
                : themeAge === 'professional'
                ? "Uw consistente inzet leidt tot meetbare vooruitgang in de Arabische taal."
                : "Je maakt geweldige vooruitgang! Elke les brengt je dichter bij je doel."
              }
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid gap-3">
            {onNext && (
              <Button 
                onClick={onNext}
                size="lg"
                className={cn(
                  "w-full group",
                  themeAge === 'playful' && "text-lg font-bold py-6"
                )}
              >
                {themeContent.buttonText}
                <ArrowRight className="h-4 w-4 ms-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {onReview && (
                <Button variant="outline" onClick={onReview}>
                  Les Herzien
                </Button>
              )}
              
              {onBackToDashboard && (
                <Button variant="outline" onClick={onBackToDashboard}>
                  Terug naar Dashboard
                </Button>
              )}
            </div>
          </div>

          {/* Next Lesson Preview */}
          <div className={cn(
            "p-4 rounded-lg border bg-muted/20",
            themeAge === 'playful' && "border-2 border-dashed border-primary/30"
          )}>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              {themeAge === 'playful' ? (
                <>
                  <Gift className="h-5 w-5" />
                  <span className="font-medium">Volgende les wacht op je! 🎁</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  <span>Volgende les beschikbaar</span>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};