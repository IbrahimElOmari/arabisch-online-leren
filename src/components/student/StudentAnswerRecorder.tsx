import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { AudioVideoRecorder } from '@/components/media/AudioVideoRecorder';
import { FileText, Mic, Video, Upload } from 'lucide-react';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { toast } from 'sonner';

interface StudentAnswerRecorderProps {
  questionId: string;
  questionText: string;
  onSubmit: (answer: AnswerSubmission) => void;
  allowedTypes?: ('text' | 'audio' | 'video')[];
  maxTextLength?: number;
  maxRecordingDuration?: number;
}

interface AnswerSubmission {
  type: 'text' | 'audio' | 'video';
  content: string | Blob;
  metadata?: {
    duration?: number;
    fileSize?: number;
    mimeType?: string;
  };
}

export const StudentAnswerRecorder = ({
  questionText,
  onSubmit,
  allowedTypes = ['text', 'audio', 'video'],
  maxTextLength = 1000,
  maxRecordingDuration = 300
}: StudentAnswerRecorderProps) => {
  const { isRTL, getFlexDirection, getTextAlign } = useRTLLayout();
  
  const [activeTab, setActiveTab] = useState<string>(allowedTypes[0]);
  const [textAnswer, setTextAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);

  const handleTextSubmit = async () => {
    if (!textAnswer.trim()) {
      toast.error(isRTL ? 'يرجى كتابة إجابة' : 'Voer een antwoord in');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const submission: AnswerSubmission = {
        type: 'text',
        content: textAnswer,
        metadata: {
          fileSize: new Blob([textAnswer]).size
        }
      };
      
      await onSubmit(submission);
      setTextAnswer('');
      toast.success(isRTL ? 'تم إرسال الإجابة' : 'Antwoord verstuurd');
    } catch (error) {
      toast.error(isRTL ? 'فشل في إرسال الإجابة' : 'Fout bij versturen antwoord');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordingComplete = (blob: Blob) => {
    setRecordingBlob(blob);
    setHasRecording(true);
  };

  const handleRecordingSubmit = async () => {
    if (!recordingBlob) {
      toast.error(isRTL ? 'لا يوجد تسجيل للإرسال' : 'Geen opname om te versturen');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const submission: AnswerSubmission = {
        type: activeTab as 'audio' | 'video',
        content: recordingBlob,
        metadata: {
          fileSize: recordingBlob.size,
          mimeType: recordingBlob.type,
          duration: maxRecordingDuration // Approximation
        }
      };
      
      await onSubmit(submission);
      setRecordingBlob(null);
      setHasRecording(false);
      toast.success(isRTL ? 'تم إرسال التسجيل' : 'Opname verstuurd');
    } catch (error) {
      toast.error(isRTL ? 'فشل في إرسال التسجيل' : 'Fout bij versturen opname');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTabIcon = (type: string) => {
    switch (type) {
      case 'text': return <FileText className="h-4 w-4" />;
      case 'audio': return <Mic className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getTabLabel = (type: string) => {
    const labels = {
      text: isRTL ? 'نص' : 'Tekst',
      audio: isRTL ? 'صوت' : 'Audio', 
      video: isRTL ? 'فيديو' : 'Video'
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className={`${getTextAlign()} ${isRTL ? 'arabic-text' : ''}`}>
          {isRTL ? 'اختر طريقة الإجابة' : 'Kies antwoordmethode'}
        </CardTitle>
        <div className={`text-sm text-muted-foreground p-3 bg-muted rounded-lg ${getTextAlign()}`}>
          <p className={isRTL ? 'arabic-text' : ''}>{questionText}</p>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} dir={isRTL ? 'rtl' : 'ltr'}>
          <TabsList className={`grid w-full grid-cols-${allowedTypes.length}`}>
            {allowedTypes.map((type) => (
              <TabsTrigger 
                key={type} 
                value={type}
                className={`flex items-center gap-2 ${getFlexDirection()}`}
              >
                {getTabIcon(type)}
                <span className={isRTL ? 'arabic-text' : ''}>{getTabLabel(type)}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Text Answer */}
          {allowedTypes.includes('text') && (
            <TabsContent value="text" className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isRTL ? 'arabic-text' : ''}`}>
                  {isRTL ? 'اكتب إجابتك هنا' : 'Schrijf je antwoord hier'}
                </label>
                <Textarea
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  placeholder={isRTL ? 'اكتب إجابتك...' : 'Schrijf je antwoord...'}
                  className={`min-h-32 ${isRTL ? 'text-right' : 'text-left'}`}
                  maxLength={maxTextLength}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
                <div className={`text-xs text-muted-foreground mt-1 ${getTextAlign()}`}>
                  {textAnswer.length}/{maxTextLength} {isRTL ? 'حرف' : 'karakters'}
                </div>
              </div>
              
              <Button
                onClick={handleTextSubmit}
                disabled={!textAnswer.trim() || isSubmitting}
                className={`w-full flex items-center gap-2 ${getFlexDirection()}`}
              >
                <Upload className="h-4 w-4" />
                <span className={isRTL ? 'arabic-text' : ''}>
                  {isSubmitting 
                    ? (isRTL ? 'جاري الإرسال...' : 'Bezig met versturen...')
                    : (isRTL ? 'إرسال الإجابة' : 'Antwoord versturen')
                  }
                </span>
              </Button>
            </TabsContent>
          )}

          {/* Audio Answer */}
          {allowedTypes.includes('audio') && (
            <TabsContent value="audio" className="space-y-4">
              <AudioVideoRecorder
                mode="audio"
                onRecordingComplete={handleRecordingComplete}
                maxDuration={maxRecordingDuration}
              />
              
              {hasRecording && (
                <Button
                  onClick={handleRecordingSubmit}
                  disabled={isSubmitting}
                  className={`w-full flex items-center gap-2 ${getFlexDirection()}`}
                >
                  <Upload className="h-4 w-4" />
                  <span className={isRTL ? 'arabic-text' : ''}>
                    {isSubmitting 
                      ? (isRTL ? 'جاري الإرسال...' : 'Bezig met versturen...')
                      : (isRTL ? 'إرسال التسجيل الصوتي' : 'Audio opname versturen')
                    }
                  </span>
                </Button>
              )}
            </TabsContent>
          )}

          {/* Video Answer */}
          {allowedTypes.includes('video') && (
            <TabsContent value="video" className="space-y-4">
              <AudioVideoRecorder
                mode="video"
                onRecordingComplete={handleRecordingComplete}
                maxDuration={maxRecordingDuration}
              />
              
              {hasRecording && (
                <Button
                  onClick={handleRecordingSubmit}
                  disabled={isSubmitting}
                  className={`w-full flex items-center gap-2 ${getFlexDirection()}`}
                >
                  <Upload className="h-4 w-4" />
                  <span className={isRTL ? 'arabic-text' : ''}>
                    {isSubmitting 
                      ? (isRTL ? 'جاري الإرسال...' : 'Bezig met versturen...')
                      : (isRTL ? 'إرسال تسجيل الفيديو' : 'Video opname versturen')
                    }
                  </span>
                </Button>
              )}
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
};