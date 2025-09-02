import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { CheckCircle, CreditCard, Users, Clock, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { useAccessibilityRTL } from '@/hooks/useAccessibilityRTL';
import { useTranslation } from '@/contexts/TranslationContext';

interface ClassDetails {
  id: string;
  name: string;
  description: string;
  teacher_id: string;
  created_at: string;
}

const EnrollmentConfirm = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
  const { getTextAlign, getFlexDirection, getIconSpacing } = useRTLLayout();
  const { getNavigationAttributes, getDialogAttributes } = useAccessibilityRTL();
  const { t } = useTranslation();

  // Fetch class details on component mount
  useState(() => {
    const fetchClassDetails = async () => {
      if (!classId) return;
      
      const { data, error } = await supabase
        .from('klassen')
        .select('*')
        .eq('id', classId)
        .single();

      if (error) {
        toast({
          title: "Fout",
          description: "Kon klasdetails niet laden.",
          variant: "destructive",
        });
        navigate('/dashboard');
        return;
      }

      setClassDetails(data);
    };

    fetchClassDetails();
  });

  const handleEnrollment = async () => {
    if (!classId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('mock-enroll', {
        body: { class_id: classId }
      });

      if (error) throw error;

      toast({
        title: "Inschrijving Succesvol!",
        description: `Je bent succesvol ingeschreven voor ${data.class_name}`,
      });

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Enrollment error:', error);
      toast({
        title: "Inschrijving Mislukt",
        description: error.message || "Er is een fout opgetreden bij het inschrijven.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!classDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-lg">Laden...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6" {...getNavigationAttributes()}>
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className={`text-2xl flex items-center gap-2 ${getTextAlign()}`}>
              <BookOpen className="h-6 w-6 text-primary" />
              {t('enrollment.confirmTitle') || 'Inschrijving Bevestigen'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Class Details */}
              <div className="space-y-4">
                <h3 className={`text-xl font-semibold ${getTextAlign()}`}>{classDetails.name}</h3>
                <p className={`text-muted-foreground ${getTextAlign()}`}>{classDetails.description}</p>
                
                <div className="space-y-3">
                  <div className={`flex items-center gap-2 ${getFlexDirection('row')}`}>
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-sm">{t('enrollment.levelsAvailable') || '4 Niveaus beschikbaar'}</span>
                  </div>
                  <div className={`flex items-center gap-2 ${getFlexDirection('row')}`}>
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-sm">{t('enrollment.flexibleSchedule') || 'Flexibele planning'}</span>
                  </div>
                  <div className={`flex items-center gap-2 ${getFlexDirection('row')}`}>
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm">{t('enrollment.accessMaterials') || 'Toegang tot alle lesmaterialen'}</span>
                  </div>
                </div>
              </div>

              {/* Mock Payment Section */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className={`font-medium mb-3 flex items-center gap-2 ${getTextAlign()}`}>
                  <CreditCard className="h-4 w-4" />
                  {t('enrollment.paymentDemo') || 'Betaling (Demo Mode)'}
                </h4>
                <div className={`space-y-2 text-sm text-muted-foreground mb-4 ${getTextAlign()}`}>
                  <p>• {t('enrollment.demoEnvironment') || 'Dit is een demo-omgeving'}</p>
                  <p>• {t('enrollment.noPayment') || 'Geen echte betaling vereist'}</p>
                  <p>• {t('enrollment.autoActivated') || 'Inschrijving wordt automatisch geactiveerd'}</p>
                  <p>• {t('enrollment.directAccess') || 'Toegang tot alle niveaus direct beschikbaar'}</p>
                </div>
                
                <div className="bg-background p-3 rounded border-2 border-dashed border-primary/20">
                  <div className={getTextAlign('center')}>
                    <div className="text-lg font-semibold text-primary">€0,00</div>
                    <div className="text-xs text-muted-foreground">{t('enrollment.demoPrice') || 'Demo Prijs'}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className={`mt-6 flex gap-3 ${getFlexDirection('row')}`}>
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard')}
                disabled={loading}
              >
                {t('common.cancel') || 'Annuleren'}
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={loading} className="flex-1">
                    {loading ? (t('enrollment.enrolling') || 'Bezig met inschrijven...') : (t('enrollment.confirmEnrollment') || 'Bevestig Inschrijving')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent {...getDialogAttributes('enrollment-confirm')}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('enrollment.confirmTitle') || 'Inschrijving Bevestigen'}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('enrollment.confirmMessage') || `Je staat op het punt om je in te schrijven voor "${classDetails.name}". Dit geeft je toegang tot alle 4 niveaus van deze klas.`}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('common.cancel') || 'Annuleren'}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleEnrollment}>
                      {t('common.confirm') || 'Bevestigen'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EnrollmentConfirm;