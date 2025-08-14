
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Settings, 
  SkipBack, 
  SkipForward,
  Subtitles,
  FileText,
  BookOpen
} from 'lucide-react';

interface VideoLesson {
  id: string;
  title: string;
  duration: number;
  videoUrl: string;
  subtitles?: {
    language: string;
    url: string;
  }[];
  transcript?: string;
  notes?: string[];
  completed?: boolean;
}

interface AdvancedVideoPlayerProps {
  lesson: VideoLesson;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
  showTranscript?: boolean;
  showNotes?: boolean;
}

export const AdvancedVideoPlayer = ({ 
  lesson, 
  onProgress, 
  onComplete,
  showTranscript = true,
  showNotes = true 
}: AdvancedVideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [activeTab, setActiveTab] = useState<'transcript' | 'notes'>('transcript');

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);
    
    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('ended', () => {
      setIsPlaying(false);
      onComplete?.();
    });

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
    };
  }, [onComplete]);

  useEffect(() => {
    onProgress?.(duration > 0 ? (currentTime / duration) * 100 : 0);
  }, [currentTime, duration, onProgress]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    if (!videoRef.current) return;
    const newTime = (value[0] / 100) * duration;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (value: number[]) => {
    if (!videoRef.current) return;
    const newVolume = value[0] / 100;
    videoRef.current.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMuted = !isMuted;
    videoRef.current.muted = newMuted;
    setIsMuted(newMuted);
  };

  const skip = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
  };

  const changePlaybackRate = (rate: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Video Player */}
      <div className="lg:col-span-2">
        <Card>
          <CardContent className="p-0">
            <div 
              className="relative bg-black rounded-t-lg overflow-hidden"
              onMouseEnter={() => setShowControls(true)}
              onMouseLeave={() => setShowControls(false)}
            >
              <video
                ref={videoRef}
                className="w-full aspect-video"
                src={lesson.videoUrl}
                poster="/placeholder.svg"
              >
                {lesson.subtitles?.map((subtitle) => (
                  <track
                    key={subtitle.language}
                    kind="subtitles"
                    src={subtitle.url}
                    srcLang={subtitle.language}
                    default={subtitle.language === 'nl'}
                  />
                ))}
              </video>

              {/* Video Controls Overlay */}
              {showControls && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  {/* Progress Bar */}
                  <div className="mb-4">
                    <Progress 
                      value={progressPercentage} 
                      className="h-1 cursor-pointer"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const percent = ((e.clientX - rect.left) / rect.width) * 100;
                        handleSeek([percent]);
                      }}
                    />
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => skip(-10)}
                        className="text-white hover:bg-white/20"
                      >
                        <SkipBack className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={togglePlay}
                        className="text-white hover:bg-white/20"
                      >
                        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => skip(10)}
                        className="text-white hover:bg-white/20"
                      >
                        <SkipForward className="h-4 w-4" />
                      </Button>

                      {/* Volume */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={toggleMute}
                          className="text-white hover:bg-white/20"
                        >
                          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                        </Button>
                      </div>

                      {/* Time */}
                      <span className="text-sm">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Playback Rate */}
                      <select 
                        value={playbackRate}
                        onChange={(e) => changePlaybackRate(Number(e.target.value))}
                        className="bg-white/20 text-white text-sm rounded px-2 py-1"
                      >
                        <option value={0.5}>0.5x</option>
                        <option value={0.75}>0.75x</option>
                        <option value={1}>1x</option>
                        <option value={1.25}>1.25x</option>
                        <option value={1.5}>1.5x</option>
                        <option value={2}>2x</option>
                      </select>

                      {/* Subtitles */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSubtitles(!showSubtitles)}
                        className="text-white hover:bg-white/20"
                      >
                        <Subtitles className="h-4 w-4" />
                      </Button>

                      {/* Settings */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white/20"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>

                      {/* Fullscreen */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => videoRef.current?.requestFullscreen()}
                        className="text-white hover:bg-white/20"
                      >
                        <Maximize className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Lesson Info */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{lesson.title}</h3>
                {lesson.completed && (
                  <Badge variant="secondary" className="text-green-600">
                    ✓ Voltooid
                  </Badge>
                )}
              </div>
              <Progress value={progressPercentage} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">
                {Math.round(progressPercentage)}% voltooid
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transcript & Notes */}
      <div className="space-y-4">
        {(showTranscript || showNotes) && (
          <Card>
            <CardContent className="p-0">
              {/* Tabs */}
              <div className="flex border-b">
                {showTranscript && (
                  <button
                    onClick={() => setActiveTab('transcript')}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'transcript'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <FileText className="h-4 w-4" />
                    Transcript
                  </button>
                )}
                {showNotes && (
                  <button
                    onClick={() => setActiveTab('notes')}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'notes'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <BookOpen className="h-4 w-4" />
                    Notities
                  </button>
                )}
              </div>

              {/* Content */}
              <div className="p-4 max-h-96 overflow-y-auto">
                {activeTab === 'transcript' && lesson.transcript && (
                  <div className="prose prose-sm max-w-none">
                    <p className="text-sm leading-relaxed">
                      {lesson.transcript}
                    </p>
                  </div>
                )}
                
                {activeTab === 'notes' && lesson.notes && (
                  <div className="space-y-3">
                    {lesson.notes.map((note, index) => (
                      <div key={index} className="p-3 bg-muted rounded-lg">
                        <p className="text-sm">{note}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
