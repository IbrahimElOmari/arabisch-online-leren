import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, RotateCcw, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { useRTLLayout } from '@/hooks/useRTLLayout';

interface AudioPlayerProps {
  src: string;
  label?: string;
  showSpeedControl?: boolean;
  showVolumeControl?: boolean;
  autoPlay?: boolean;
  loop?: boolean;
  className?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function AudioPlayer({
  src,
  label,
  showSpeedControl = true,
  showVolumeControl = true,
  autoPlay = false,
  loop = false,
  className,
  onPlay,
  onPause,
  onEnded,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { isRTL } = useRTLLayout();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(loop);
  const [isLoaded, setIsLoaded] = useState(false);

  // Sync audio element with state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => {
      setDuration(audio.duration);
      setIsLoaded(true);
    };
    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };
    const handlePlay = () => {
      setIsPlaying(true);
      onPlay?.();
    };
    const handlePause = () => {
      setIsPlaying(false);
      onPause?.();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleDurationChange);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleDurationChange);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [onPlay, onPause, onEnded]);

  // Update audio element when props change
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = isLooping;
    }
  }, [isLooping]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  }, [isPlaying]);

  const restart = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = 0;
    audio.play();
  }, []);

  const handleSeek = useCallback((value: number[]) => {
    const audio = audioRef.current;
    if (!audio || !isLoaded) return;

    audio.currentTime = value[0];
    setCurrentTime(value[0]);
  }, [isLoaded]);

  const handleVolumeChange = useCallback((value: number[]) => {
    setVolume(value[0]);
    if (value[0] > 0) {
      setIsMuted(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const toggleLoop = useCallback(() => {
    setIsLooping((prev) => !prev);
  }, []);

  const cycleSpeed = useCallback(() => {
    setPlaybackRate((prev) => {
      const currentIndex = PLAYBACK_SPEEDS.indexOf(prev);
      const nextIndex = (currentIndex + 1) % PLAYBACK_SPEEDS.length;
      return PLAYBACK_SPEEDS[nextIndex];
    });
  }, []);

  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn('flex flex-col gap-3 p-4 bg-muted rounded-lg', className)}>
      <audio ref={audioRef} src={src} autoPlay={autoPlay} preload="metadata" />

      {label && (
        <div className={cn("text-sm font-medium", isRTL && "text-right arabic-text")}>
          {label}
        </div>
      )}

      <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
        {/* Play/Pause */}
        <Button
          size="icon"
          variant="ghost"
          onClick={togglePlay}
          aria-label={isPlaying ? 'Pauzeren' : 'Afspelen'}
          className="h-10 w-10"
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5" />
          )}
        </Button>

        {/* Restart */}
        <Button
          size="icon"
          variant="ghost"
          onClick={restart}
          aria-label="Opnieuw afspelen"
          className="h-8 w-8"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>

        {/* Progress slider */}
        <div className="flex-1 flex items-center gap-2">
          <span className="text-xs text-muted-foreground min-w-[40px] text-right">
            {formatTime(currentTime)}
          </span>
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            disabled={!isLoaded}
            className="flex-1"
            aria-label="Voortgang"
          />
          <span className="text-xs text-muted-foreground min-w-[40px]">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      <div className={cn("flex items-center gap-2 justify-between", isRTL && "flex-row-reverse")}>
        <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
          {/* Loop toggle */}
          <Button
            size="icon"
            variant={isLooping ? 'default' : 'ghost'}
            onClick={toggleLoop}
            aria-label={isLooping ? 'Herhaling uitschakelen' : 'Herhaling inschakelen'}
            aria-pressed={isLooping}
            className="h-8 w-8"
          >
            <Repeat className={cn("h-4 w-4", isLooping && "text-primary-foreground")} />
          </Button>

          {/* Speed control */}
          {showSpeedControl && (
            <Button
              size="sm"
              variant="outline"
              onClick={cycleSpeed}
              className="min-w-[50px] text-xs"
              aria-label={`Afspeelsnelheid: ${playbackRate}x`}
            >
              {playbackRate}x
            </Button>
          )}
        </div>

        {/* Volume control */}
        {showVolumeControl && (
          <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
            <Button
              size="icon"
              variant="ghost"
              onClick={toggleMute}
              aria-label={isMuted ? 'Geluid aan' : 'Geluid uit'}
              className="h-8 w-8"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              max={1}
              step={0.05}
              onValueChange={handleVolumeChange}
              className="w-20"
              aria-label="Volume"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default AudioPlayer;
