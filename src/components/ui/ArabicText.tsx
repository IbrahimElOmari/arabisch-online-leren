import React from 'react';
import { cn } from '@/lib/utils';
import { Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ArabicTextProps {
  children: React.ReactNode;
  variant?: 'body' | 'heading' | 'display';
  withDiacritics?: boolean;
  withAudio?: boolean;
  audioUrl?: string;
  transcription?: string;
  translation?: string;
  className?: string;
}

export const ArabicText: React.FC<ArabicTextProps> = ({
  children,
  variant = 'body',
  withDiacritics = false,
  withAudio = false,
  audioUrl,
  transcription,
  translation,
  className,
}) => {
  const playAudio = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch(console.error);
    }
  };

  const baseClasses = cn(
    'font-arabic text-right',
    {
      'text-lg leading-relaxed': variant === 'body',
      'text-2xl font-semibold leading-relaxed': variant === 'heading',
      'text-4xl font-bold leading-relaxed': variant === 'display',
    },
    withDiacritics && 'arabic-diacritics',
    className
  );

  return (
    <div className="arabic-text-container">
      <div className={baseClasses} dir="rtl" lang="ar">
        {children}
        {withAudio && audioUrl && (
          <Button
            variant="ghost"
            size="sm"
            onClick={playAudio}
            className="ms-2 inline-flex items-center gap-1 text-primary hover:text-primary/80"
          >
            <Volume2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {transcription && (
        <div className="mt-1 text-sm text-muted-foreground italic">
          {transcription}
        </div>
      )}
      
      {translation && (
        <div className="mt-1 text-sm text-muted-foreground">
          <span className="font-medium">Vertaling:</span> {translation}
        </div>
      )}
    </div>
  );
};