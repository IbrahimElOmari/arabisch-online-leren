import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useRTLLayout } from '@/hooks/useRTLLayout';

interface Question {
  id: string;
  vraag_tekst: string;
  vraag_type: 'open' | 'multiple_choice';
  opties?: string[];
}

interface AnswerMap {
  [vraagId: string]: {
    id: string;
    antwoord: string;
    is_correct: boolean | null;
    punten: number | null;
    feedback?: string | null;
  } | undefined;
}

export const LevelQuestions = ({ levelId }: { levelId: string }) => {
  const { profile } = useAuth();
  const { t } = useTranslation();
  const { isRTL } = useRTLLayout();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [openAnswers, setOpenAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data: qs, error: qErr } = await supabase
          .from('vragen')
          .select('id, vraag_tekst, vraag_type, opties')
          .eq('niveau_id', levelId)
          .order('created_at', { ascending: false });
        if (qErr) throw qErr;
        setQuestions((qs as any) || []);

        if (qs && qs.length > 0 && profile?.id) {
          const ids = (qs as any[]).map(q => q.id);
          const { data: ans, error: aErr } = await supabase
            .from('antwoorden')
            .select('id, vraag_id, antwoord, is_correct, punten, feedback')
            .in('vraag_id', ids)
            .eq('student_id', profile.id);
          if (aErr) throw aErr;
          const map: AnswerMap = {};
          (ans || []).forEach(a => {
            map[a.vraag_id] = {
              id: a.id,
              antwoord: typeof a.antwoord === 'string' ? a.antwoord : String(a.antwoord),
              is_correct: a.is_correct ?? null,
              punten: a.punten ?? null,
              feedback: a.feedback ?? null,
            } as any;
          });
          setAnswers(map);
        } else {
          setAnswers({});
        }
      } catch (e) {
        console.error(e);
        toast.error(t('common.error'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [levelId, profile?.id, t]);

  const submitAnswer = async (question: Question, answerValue: string) => {
    try {
      if (!profile?.id) throw new Error(t('auth.notLoggedIn'));
      const { error } = await supabase.from('antwoorden').insert({
        vraag_id: question.id,
        student_id: profile.id,
        antwoord: answerValue,
      });
      if (error) throw error;
      toast.success(t('levelDetail.answerSubmitted'));
      // Refresh answers map
      setAnswers(prev => ({
        ...prev,
        [question.id]: { id: 'tmp', antwoord: answerValue, is_correct: null, punten: null },
      }));
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || t('levelDetail.submitError'));
    }
  };

  if (loading) return <div className={`text-sm ${isRTL ? 'text-right' : 'text-left'}`}>{t('common.loading')}</div>;

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {questions.length === 0 && (
        <Card>
          <CardContent className={`py-6 text-sm text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>
            {t('levelDetail.noQuestions')}
          </CardContent>
        </Card>
      )}
      {questions.map((q) => {
        const my = answers[q.id];
        return (
          <Card key={q.id}>
            <CardHeader>
              <CardTitle className={`text-base ${isRTL ? 'text-right' : 'text-left'}`}>{q.vraag_tekst}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {q.vraag_type === 'multiple_choice' && Array.isArray(q.opties) ? (
                <div className="grid gap-2">
                  {q.opties.map((opt, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      className={`justify-start ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}
                      disabled={!!my}
                      onClick={() => submitAnswer(q, String(opt))}
                    >
                      {opt}
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  <Textarea
                    placeholder={t('levelDetail.typeAnswer')}
                    value={openAnswers[q.id] || ''}
                    onChange={(e) => setOpenAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                    disabled={!!my}
                    dir={isRTL ? 'rtl' : 'ltr'}
                    className={isRTL ? 'text-right' : 'text-left'}
                  />
                  {!my && (
                    <Button
                      onClick={() => {
                        const v = (openAnswers[q.id] || '').trim();
                        if (v) submitAnswer(q, v);
                      }}
                    >
                      {t('common.submit')}
                    </Button>
                  )}
                </div>
              )}

              {my && (
                <div className={`border-t pt-3 text-sm space-y-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                  <div><strong>{t('levelDetail.yourAnswer')}:</strong> {my.antwoord}</div>
                  {my.punten !== null && (
                    <div><strong>{t('levelDetail.score')}:</strong> {my.punten}</div>
                  )}
                  {my.feedback && (
                    <div><strong>{t('levelDetail.feedback')}:</strong> {my.feedback}</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};