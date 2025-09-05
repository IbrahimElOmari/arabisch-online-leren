import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mic, MicOff, Volume2, VolumeX, Play, Square } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VoiceSession {
  id: string;
  text: string;
  pronunciation: 'excellent' | 'good' | 'needs_improvement';
  timestamp: Date;
}

export const VoiceAssistant: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sessions, setSessions] = useState<VoiceSession[]>([]);
  const [currentText, setCurrentText] = useState('مرحباً بك في مساعد النطق');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start(1000);
      setIsRecording(true);
      
      toast({
        title: "تسجيل بدأ - Recording Started",
        description: "قل الكلمات الآن - Speak the words now",
      });
    } catch (error) {
      console.error('Recording error:', error);
      toast({
        title: "خطأ في التسجيل - Recording Error", 
        description: "لا يمكن الوصول إلى الميكروفون - Cannot access microphone",
        variant: "destructive",
      });
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const processAudio = async (audioBlob: Blob) => {
    try {
      // Convert blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      const { data, error } = await supabase.functions.invoke('voice-recognition', {
        body: {
          audio: base64Audio,
          language: 'ar'
        }
      });

      if (error) throw error;

      const newSession: VoiceSession = {
        id: Date.now().toString(),
        text: data.text || 'لم يتم التعرف على النص',
        pronunciation: data.pronunciation || 'needs_improvement',
        timestamp: new Date()
      };

      setSessions(prev => [newSession, ...prev]);
      
      toast({
        title: "تم التحليل - Analysis Complete",
        description: `النطق: ${getPronunciationText(newSession.pronunciation)}`,
      });
    } catch (error) {
      console.error('Audio processing error:', error);
      toast({
        title: "خطأ في المعالجة - Processing Error",
        description: "لم أتمكن من تحليل الصوت - Could not analyze audio",
        variant: "destructive",
      });
    }
  };

  const speakText = async (text: string) => {
    if (isPlaying) return;
    
    setIsPlaying(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: {
          text: text,
          language: 'ar',
          voice: 'alloy'
        }
      });

      if (error) throw error;

      // Play the generated audio
      const audioData = `data:audio/mp3;base64,${data.audioContent}`;
      const audio = new Audio(audioData);
      
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => {
        setIsPlaying(false);
        toast({
          title: "خطأ في التشغيل - Playback Error",
          description: "لم أتمكن من تشغيل الصوت - Could not play audio",
          variant: "destructive",
        });
      };
      
      await audio.play();
    } catch (error) {
      console.error('Text-to-speech error:', error);
      setIsPlaying(false);
      toast({
        title: "خطأ في التحويل - Conversion Error",
        description: "لم أتمكن من إنشاء الصوت - Could not generate audio",
        variant: "destructive",
      });
    }
  };

  const getPronunciationText = (level: string) => {
    switch (level) {
      case 'excellent': return 'ممتاز - Excellent';
      case 'good': return 'جيد - Good';
      default: return 'يحتاج تحسين - Needs Improvement';
    }
  };

  const getPronunciationColor = (level: string) => {
    switch (level) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-yellow-500';
      default: return 'bg-red-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Practice Text */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-6 w-6 text-primary" />
            نص التدريب - Practice Text
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="text-2xl font-arabic p-4 bg-muted rounded-lg">
              {currentText}
            </div>
            <Button 
              onClick={() => speakText(currentText)}
              disabled={isPlaying}
              variant="outline"
              className="gap-2"
            >
              {isPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              {isPlaying ? 'جاري التشغيل...' : 'استمع للنطق الصحيح'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recording Controls */}
      <Card>
        <CardHeader>
          <CardTitle>تسجيل النطق - Record Pronunciation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              size="lg"
              className={`gap-2 ${isRecording ? 'bg-red-500 hover:bg-red-600' : ''}`}
            >
              {isRecording ? (
                <>
                  <Square className="w-5 h-5" />
                  إيقاف التسجيل
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5" />
                  ابدأ التسجيل
                </>
              )}
            </Button>
            
            {isRecording && (
              <div className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-muted-foreground">جاري التسجيل...</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sessions History */}
      <Card>
        <CardHeader>
          <CardTitle>تاريخ النطق - Pronunciation History</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {sessions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  لا توجد جلسات تسجيل بعد - No recording sessions yet
                </p>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    className="p-4 border rounded-lg space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <Badge className={getPronunciationColor(session.pronunciation)}>
                        {getPronunciationText(session.pronunciation)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {session.timestamp.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-lg font-arabic">
                      {session.text}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => speakText(session.text)}
                      className="gap-2"
                    >
                      <Play className="w-3 h-3" />
                      إعادة تشغيل
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};