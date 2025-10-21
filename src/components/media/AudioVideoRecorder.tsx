import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, Video, Square, Play, Pause, Download, Trash2 } from 'lucide-react';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { toast } from 'sonner';

interface AudioVideoRecorderProps {
  mode: 'audio' | 'video';
  onRecordingComplete?: (blob: Blob, type: string) => void;
  maxDuration?: number; // in seconds
  className?: string;
}

export const AudioVideoRecorder = ({ 
  mode, 
  onRecordingComplete, 
  maxDuration = 300, // 5 minutes default
  className = ""
}: AudioVideoRecorderProps) => {
  const { isRTL, getFlexDirection, getTextAlign } = useRTLLayout();
  
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string>('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const constraints = {
    audio: true,
    video: mode === 'video' ? { width: 640, height: 480 } : false
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl);
      }
    };
  }, [stream, recordedUrl]);

  const startRecording = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      if (mode === 'video' && videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }

      const mediaRecorder = new MediaRecorder(mediaStream, {
        mimeType: mode === 'video' ? 'video/webm' : 'audio/webm'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { 
          type: mode === 'video' ? 'video/webm' : 'audio/webm' 
        });
        setRecordedBlob(blob);
        
        const url = URL.createObjectURL(blob);
        setRecordedUrl(url);
        
        onRecordingComplete?.(blob, mode === 'video' ? 'video/webm' : 'audio/webm');
        
        // Stop preview stream
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
        }
      };

      mediaRecorder.start(100); // Record in 100ms chunks
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return newTime;
        });
      }, 1000);

      toast.success(isRTL ? 'بدأ التسجيل' : 'Opname gestart');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error(isRTL ? 'خطأ في بدء التسجيل' : 'Fout bij starten opname');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
        // Resume timer
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => {
            const newTime = prev + 1;
            if (newTime >= maxDuration) {
              stopRecording();
              return maxDuration;
            }
            return newTime;
          });
        }, 1000);
      } else {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
        // Pause timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      toast.success(isRTL ? 'تم التسجيل' : 'Opname voltooid');
    }
  };

  const deleteRecording = () => {
    setRecordedBlob(null);
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
      setRecordedUrl('');
    }
    setRecordingTime(0);
  };

  const downloadRecording = () => {
    if (recordedBlob) {
      const url = URL.createObjectURL(recordedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recording-${Date.now()}.${mode === 'video' ? 'webm' : 'webm'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${getFlexDirection()} ${getTextAlign()}`}>
          {mode === 'video' ? <Video className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          <span className={isRTL ? 'arabic-text' : ''}>
            {mode === 'video' 
              ? (isRTL ? 'تسجيل فيديو' : 'Video Opname')
              : (isRTL ? 'تسجيل صوتي' : 'Audio Opname')
            }
          </span>
          {isRecording && (
            <Badge variant="destructive" className="animate-pulse">
              {isRTL ? 'جاري التسجيل' : 'Opname'}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Preview Area */}
        {mode === 'video' && (stream || recordedUrl) && (
          <div className="relative bg-black rounded-lg overflow-hidden">
            {stream && !recordedUrl && (
              <video
                ref={videoRef}
                className="w-full h-64 object-cover"
                muted
                playsInline
              />
            )}
            {recordedUrl && (
              <video
                className="w-full h-64 object-cover"
                src={recordedUrl}
                controls
              />
            )}
          </div>
        )}

        {/* Audio Preview */}
        {mode === 'audio' && recordedUrl && (
          <div className="flex items-center justify-center p-8 bg-muted rounded-lg">
            <audio
              ref={audioRef}
              src={recordedUrl}
              controls
              className="w-full"
            />
          </div>
        )}

        {/* Timer */}
        <div className={`text-center ${getTextAlign()}`}>
          <div className="text-2xl font-mono font-bold">
            {formatTime(recordingTime)}
          </div>
          <div className="text-sm text-muted-foreground">
            {isRTL ? `الحد الأقصى: ${formatTime(maxDuration)}` : `Max: ${formatTime(maxDuration)}`}
          </div>
        </div>

        {/* Controls */}
        <div className={`flex items-center justify-center gap-2 ${getFlexDirection()}`}>
          {!isRecording && !recordedBlob && (
            <Button onClick={startRecording} className={`flex items-center gap-2 ${getFlexDirection()}`}>
              {mode === 'video' ? <Video className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              <span className={isRTL ? 'arabic-text' : ''}>
                {isRTL ? 'ابدأ التسجيل' : 'Start Opname'}
              </span>
            </Button>
          )}

          {isRecording && (
            <>
              <Button 
                onClick={pauseRecording}
                variant="outline"
                className={`flex items-center gap-2 ${getFlexDirection()}`}
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                <span className={isRTL ? 'arabic-text' : ''}>
                  {isPaused 
                    ? (isRTL ? 'متابعة' : 'Hervatten')
                    : (isRTL ? 'إيقاف مؤقت' : 'Pauzeren')
                  }
                </span>
              </Button>
              
              <Button 
                onClick={stopRecording}
                variant="destructive"
                className={`flex items-center gap-2 ${getFlexDirection()}`}
              >
                <Square className="h-4 w-4" />
                <span className={isRTL ? 'arabic-text' : ''}>
                  {isRTL ? 'إيقاف' : 'Stop'}
                </span>
              </Button>
            </>
          )}

          {recordedBlob && (
            <>
              <Button 
                onClick={downloadRecording}
                variant="outline"
                className={`flex items-center gap-2 ${getFlexDirection()}`}
              >
                <Download className="h-4 w-4" />
                <span className={isRTL ? 'arabic-text' : ''}>
                  {isRTL ? 'تحميل' : 'Download'}
                </span>
              </Button>
              
              <Button 
                onClick={deleteRecording}
                variant="destructive"
                size="sm"
                className={`flex items-center gap-2 ${getFlexDirection()}`}
              >
                <Trash2 className="h-4 w-4" />
                <span className={isRTL ? 'arabic-text' : ''}>
                  {isRTL ? 'حذف' : 'Verwijderen'}
                </span>
              </Button>
            </>
          )}
        </div>

        {/* Recording Status */}
        {isRecording && (
          <div className={`text-center text-sm text-muted-foreground ${getTextAlign()}`}>
            <div className={isRTL ? 'arabic-text' : ''}>
              {isPaused 
                ? (isRTL ? 'التسجيل متوقف مؤقتاً' : 'Opname gepauzeerd')
                : (isRTL ? 'جاري التسجيل...' : 'Bezig met opnemen...')
              }
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};