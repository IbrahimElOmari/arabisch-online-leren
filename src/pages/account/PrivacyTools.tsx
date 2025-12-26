import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { gdprService } from '@/services/gdprService';
import { FEATURE_FLAGS } from '@/config/featureFlags';
import { Download, Trash2, Shield, AlertTriangle, FileText } from 'lucide-react';
import { useRTLLayout } from '@/hooks/useRTLLayout';

export default function PrivacyTools() {
  const [deleteReason, setDeleteReason] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { isRTL, getFlexDirection, getIconSpacing } = useRTLLayout();
  
  const { toast } = useToast();

  const exportMutation = useMutation({
    mutationFn: gdprService.downloadUserDataAsFile,
    onSuccess: () => {
      toast({
        title: 'Data geëxporteerd',
        description: 'Je gegevens zijn gedownload als JSON bestand.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Export mislukt',
        description: error.message || 'Er is een fout opgetreden bij het exporteren van je gegevens.',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: gdprService.requestAccountDeletion,
    onSuccess: (data) => {
      setConfirmDelete(false);
      setDeleteReason('');
      toast({
        title: 'Verwijderverzoek ingediend',
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Verzoek mislukt',
        description: error.message || 'Er is een fout opgetreden bij het indienen van je verwijderverzoek.',
        variant: 'destructive',
      });
    },
  });

  const handleExport = () => {
    exportMutation.mutate();
  };

  const handleDeleteRequest = () => {
    deleteMutation.mutate(deleteReason || undefined);
  };

  if (!FEATURE_FLAGS.gdprTools) {
    return (
      <div className="w-full max-w-full min-w-0 min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="container mx-auto p-4 md:p-6">
          <Card className="w-full max-w-full min-w-0">
            <CardContent className="py-8 text-center">
              <h2 className={`text-lg md:text-xl font-semibold mb-4 ${isRTL ? 'arabic-text font-amiri' : ''}`}>
                Privacy tools uitgeschakeld
              </h2>
              <p className={`text-muted-foreground ${isRTL ? 'arabic-text' : ''}`}>
                De privacy tools zijn momenteel uitgeschakeld. Neem contact op met een beheerder.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full min-w-0 min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto p-4 md:p-6">
        <div className="mb-6 md:mb-8">
          <h1 className={`text-2xl md:text-3xl font-bold flex items-center gap-2 ${isRTL ? 'arabic-text font-amiri' : ''} ${getFlexDirection()}`}>
            <Shield className="h-6 md:h-8 w-6 md:w-8" />
            Privacy & GDPR Tools
          </h1>
          <p className={`text-muted-foreground mt-2 ${isRTL ? 'arabic-text' : ''}`}>
            Beheer je privacy en gegevens volgens de GDPR wetgeving
          </p>
        </div>

        <div className="grid gap-4 md:gap-6 max-w-4xl w-full">
          {/* Data Export */}
          <Card className="w-full max-w-full min-w-0">
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${getFlexDirection()} ${isRTL ? 'arabic-text font-amiri' : ''}`}>
                <Download className="h-5 w-5" />
                Gegevens exporteren
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className={`text-muted-foreground ${isRTL ? 'arabic-text' : ''}`}>
                Download al je gegevens in een JSON bestand. Dit omvat je profiel, 
                berichten, inschrijvingen en andere activiteiten.
              </p>
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className={`flex items-start gap-3 ${getFlexDirection()}`}>
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className={`font-medium text-blue-900 dark:text-blue-100 mb-1 ${isRTL ? 'arabic-text' : ''}`}>
                      Wat wordt geëxporteerd:
                    </p>
                    <ul className={`text-blue-800 dark:text-blue-200 space-y-1 ${isRTL ? 'arabic-text' : ''}`}>
                      <li>• Profielgegevens en instellingen</li>
                      <li>• Inschrijvingen voor klassen</li>
                      <li>• Forum berichten en threads</li>
                      <li>• Taken en inzendingen</li>
                      <li>• Directe berichten</li>
                    </ul>
                  </div>
                </div>
              </div>
              <Button 
                onClick={handleExport}
                disabled={exportMutation.isPending}
                className="w-full sm:w-auto"
              >
                <Download className={`h-4 w-4 ${getIconSpacing('2')}`} />
                <span className={isRTL ? 'arabic-text' : ''}>
                  {exportMutation.isPending ? 'Exporteren...' : 'Exporteer mijn gegevens'}
                </span>
              </Button>
            </CardContent>
          </Card>

          {/* Account Deletion */}
          <Card className="w-full max-w-full min-w-0 border-destructive/20">
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 text-destructive ${getFlexDirection()} ${isRTL ? 'arabic-text font-amiri' : ''}`}>
                <Trash2 className="h-5 w-5" />
                Account verwijderen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className={isRTL ? 'arabic-text' : ''}>
                  <strong>Waarschuwing:</strong> Het verwijderen van je account is permanent en kan niet ongedaan worden gemaakt. 
                  Al je gegevens worden definitief verwijderd.
                </AlertDescription>
              </Alert>

              <p className={`text-muted-foreground ${isRTL ? 'arabic-text' : ''}`}>
                Als je je account wilt verwijderen, kun je hieronder een verwijderverzoek indienen. 
                Een beheerder zal dit verzoek beoordelen en verwerken.
              </p>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="w-full sm:w-auto">
                    <Trash2 className={`h-4 w-4 ${getIconSpacing('2')}`} />
                    <span className={isRTL ? 'arabic-text' : ''}>Verwijderverzoek indienen</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-full max-w-full min-w-0">
                  <DialogHeader>
                    <DialogTitle className={`text-destructive ${isRTL ? 'arabic-text font-amiri' : ''}`}>
                      Account verwijderen
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className={isRTL ? 'arabic-text' : ''}>
                        Dit is een <strong>definitieve actie</strong>. Je account en alle bijbehorende gegevens worden permanent verwijderd.
                      </AlertDescription>
                    </Alert>

                    <div>
                      <Label htmlFor="delete-reason" className={isRTL ? 'arabic-text' : ''}>
                        Reden voor verwijdering (optioneel)
                      </Label>
                      <Textarea
                        id="delete-reason"
                        placeholder="Waarom wil je je account verwijderen?"
                        value={deleteReason}
                        onChange={(e) => setDeleteReason(e.target.value)}
                        className={isRTL ? 'arabic-text' : ''}
                        dir={isRTL ? 'rtl' : 'ltr'}
                      />
                    </div>

                    <div className={`flex items-center gap-2 ${getFlexDirection()}`}>
                      <input
                        type="checkbox"
                        id="confirm-delete"
                        checked={confirmDelete}
                        onChange={(e) => setConfirmDelete(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="confirm-delete" className={`text-sm ${isRTL ? 'arabic-text' : ''}`}>
                        Ik begrijp dat dit permanent is en kan niet ongedaan worden gemaakt
                      </Label>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        onClick={handleDeleteRequest}
                        disabled={!confirmDelete || deleteMutation.isPending}
                      >
                        <span className={isRTL ? 'arabic-text' : ''}>
                          {deleteMutation.isPending ? 'Verzoek indienen...' : 'Verwijderverzoek indienen'}
                        </span>
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Privacy Info */}
          <Card className="w-full max-w-full min-w-0">
            <CardHeader>
              <CardTitle className={isRTL ? 'arabic-text font-amiri' : ''}>Privacy informatie</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose prose-sm max-w-none">
                <h4 className={isRTL ? 'arabic-text font-amiri' : ''}>Je rechten onder de GDPR:</h4>
                <ul className={`space-y-2 ${isRTL ? 'arabic-text' : ''}`}>
                  <li><strong>Recht op inzage:</strong> Je kunt je gegevens exporteren om te zien welke informatie we hebben</li>
                  <li><strong>Recht op verwijdering:</strong> Je kunt verzoeken om je account en gegevens te verwijderen</li>
                  <li><strong>Recht op rectificatie:</strong> Je kunt je profielgegevens wijzigen in je account instellingen</li>
                  <li><strong>Recht op beperking:</strong> Je kunt contact opnemen om bepaalde verwerkingen te beperken</li>
                </ul>
                
                <p className={`text-sm text-muted-foreground ${isRTL ? 'arabic-text' : ''}`}>
                  Voor vragen over privacy en gegevensbescherming kun je contact opnemen via de contactpagina.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}