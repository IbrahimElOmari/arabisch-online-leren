import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Mic, Square, Play, Pause, RotateCcw, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { useTranslation } from '@/contexts/TranslationContext';
import { toast } from 'sonner';
import { AudioPlayer } from './AudioPlayer';

interface PronunciationRecorderProps {
  arabicWord: string;
  referenceAudioSrc?: string;
  expectedPronunciation?: string;
  onRecordingComplete?: (blob: Blob) => void;
  maxDuration?: number; // in seconds
  className?: string;
}

type RecordingState = 'idle' | 'recording' | 'recorded' | 'playing';

export function PronunciationRecorder({
  arabicWord,
  referenceAudioSrc,
  expectedPronunciation,
  onRecordingComplete,
  maxDuration = 10,
  className,
}: PronunciationRecorderProps) {
  const { isRTL } = useRTLLayout();
  const { } = useTranslation();
  
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const recordedAudioRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup audio URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [audioUrl]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4',
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        setAudioBlob(blob);
        
        // Create URL for playback
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        // Notify parent
        onRecordingComplete?.(blob);
        
        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setRecordingState('recording');
      setRecordingTime(0);

      // Start timer
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= maxDuration) {
            stopRecording();
            return prev;
          }
          return prev + 0.1;
        });
      }, 100);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Geen toegang tot microfoon. Controleer je browserinstellingen.');
    }
  }, [maxDuration, onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.stop();
      setRecordingState('recorded');
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [recordingState]);

  const playRecording = useCallback(() => {
    if (!audioUrl) return;

    if (recordedAudioRef.current) {
      recordedAudioRef.current.pause();
      recordedAudioRef.current = null;
    }

    const audio = new Audio(audioUrl);
    recordedAudioRef.current = audio;
    
    audio.onended = () => {
      setIsPlayingRecording(false);
    };
    
    audio.play();
    setIsPlayingRecording(true);
  }, [audioUrl]);

  const stopPlayback = useCallback(() => {
    if (recordedAudioRef.current) {
      recordedAudioRef.current.pause();
      recordedAudioRef.current.currentTime = 0;
      setIsPlayingRecording(false);
    }
  }, []);

  const resetRecording = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingState('idle');
    setRecordingTime(0);
    setIsPlayingRecording(false);
    audioChunksRef.current = [];
  }, [audioUrl]);

  const downloadRecording = useCallback(() => {
    if (!audioBlob || !audioUrl) return;

    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `pronunciation-${arabicWord}-${Date.now()}.webm`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [audioBlob, audioUrl, arabicWord]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
          <Mic className="h-5 w-5 text-primary" />
          <span className={isRTL ? 'arabic-text' : ''}>Uitspraakoefening</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Word to pronounce */}
        <div className="text-center p-6 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground mb-2">Spreek dit woord uit:</p>
          <p className="text-4xl font-arabic" dir="rtl">
            {arabicWord}
          </p>
          {expectedPronunciation && (
            <p className="text-sm text-muted-foreground mt-2">
              Uitspraak: {expectedPronunciation}
            </p>
          )}
        </div>

        {/* Reference audio */}
        {referenceAudioSrc && (
          <div className="space-y-2">
            <p className={cn("text-sm font-medium", isRTL && "text-right arabic-text")}>
              Luister naar de juiste uitspraak:
            </p>
            <AudioPlayer
              src={referenceAudioSrc}
              showSpeedControl={true}
              showVolumeControl={true}
            />
          </div>
        )}

        {/* Recording controls */}
        <div className="space-y-4">
          {/* Timer/Progress */}
          {recordingState === 'recording' && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-destructive font-medium flex items-center gap-1">
                  <span className="animate-pulse">●</span> Opnemen...
                </span>
                <span>{formatTime(recordingTime)} / {formatTime(maxDuration)}</span>
              </div>
              <Progress value={(recordingTime / maxDuration) * 100} className="h-2" />
            </div>
          )}

          {/* Control buttons */}
          <div className={cn("flex justify-center gap-4", isRTL && "flex-row-reverse")}>
            {recordingState === 'idle' && (
              <Button
                size="lg"
                onClick={startRecording}
                className="bg-destructive hover:bg-destructive/90"
              >
                <Mic className="h-5 w-5 me-2" />
                Start opname
              </Button>
            )}

            {recordingState === 'recording' && (
              <Button
                size="lg"
                variant="outline"
                onClick={stopRecording}
              >
                <Square className="h-5 w-5 me-2" />
                Stop opname
              </Button>
            )}

            {recordingState === 'recorded' && (
              <>
                <Button
                  size="lg"
                  variant={isPlayingRecording ? 'secondary' : 'default'}
                  onClick={isPlayingRecording ? stopPlayback : playRecording}
                >
                  {isPlayingRecording ? (
                    <>
                      <Pause className="h-5 w-5 me-2" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5 me-2" />
                      Luister terug
                    </>
                  )}
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={resetRecording}
                >
                  <RotateCcw className="h-5 w-5 me-2" />
                  Opnieuw
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={downloadRecording}
                >
                  <Download className="h-5 w-5 me-2" />
                  Download
                </Button>
              </>
            )}
          </div>

          {/* Instructions */}
          {recordingState === 'idle' && (
            <p className={cn("text-center text-sm text-muted-foreground", isRTL && "arabic-text")}>
              Klik op de knop en spreek het woord duidelijk uit.
              De opname stopt automatisch na {maxDuration} seconden.
            </p>
          )}

          {recordingState === 'recorded' && (
            <p className={cn("text-center text-sm text-muted-foreground", isRTL && "arabic-text")}>
              Luister je opname terug en vergelijk met het origineel.
              Niet tevreden? Probeer opnieuw!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default PronunciationRecorder;
