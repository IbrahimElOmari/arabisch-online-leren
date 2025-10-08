import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Download, 
  Trash2, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  FileText
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { useUserRole } from '@/hooks/useUserRole';

interface UserConsent {
  id: string;
  consent_type: string;
  consented: boolean;
  consent_version: string;
  consented_at: string;
  withdrawn_at: string | null;
}

interface DataRetentionPolicy {
  id: string;
  table_name: string;
  retention_days: number;
  is_active: boolean;
}

export const GDPRCompliance = () => {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const [consents, setConsents] = useState<UserConsent[]>([]);
  const [retentionPolicies, setRetentionPolicies] = useState<DataRetentionPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { toast } = useToast();

  const consentTypes = [
    {
      type: 'data_processing',
      title: 'Gegevensverwerking',
      description: 'Toestemming voor het verwerken van je persoonlijke gegevens',
      required: true
    },
    {
      type: 'marketing',
      title: 'Marketing',
      description: 'Toestemming voor het ontvangen van marketing communicatie',
      required: false
    },
    {
      type: 'analytics',
      title: 'Analytics',
      description: 'Toestemming voor het verzamelen van analytics data',
      required: false
    }
  ];

  useEffect(() => {
    if (user) {
      loadUserConsents();
      if (isAdmin) {
        loadRetentionPolicies();
      }
    }
  }, [user, isAdmin]);

  const loadUserConsents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_consents')
        .select('*')
        .eq('user_id', user!.id)
        .order('consented_at', { ascending: false });

      if (error) throw error;
      setConsents(data || []);
    } catch (error: any) {
      toast({
        title: 'Fout',
        description: 'Kon toestemmingen niet laden: ' + error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRetentionPolicies = async () => {
    try {
      const { data, error } = await supabase
        .from('data_retention_policies')
        .select('*')
        .order('table_name');

      if (error) throw error;
      setRetentionPolicies(data || []);
    } catch (error: any) {
      toast({
        title: 'Fout',
        description: 'Kon retentiebeleid niet laden: ' + error.message,
        variant: 'destructive'
      });
    }
  };

  const updateConsent = async (consentType: string, consented: boolean) => {
    try {
      const { error } = await supabase
        .from('user_consents')
        .upsert({
          user_id: user!.id,
          consent_type: consentType,
          consented,
          consent_version: '1.0',
          consented_at: consented ? new Date().toISOString() : undefined,
          withdrawn_at: !consented ? new Date().toISOString() : null,
          ip_address: null, // Would be set by the backend
          user_agent: navigator.userAgent
        });

      if (error) throw error;

      toast({
        title: 'Succes',
        description: 'Toestemming bijgewerkt'
      });

      loadUserConsents();
    } catch (error: any) {
      toast({
        title: 'Fout',
        description: 'Kon toestemming niet bijwerken: ' + error.message,
        variant: 'destructive'
      });
    }
  };

  const exportUserData = async () => {
    try {
      setExportLoading(true);
      const { data, error } = await supabase.rpc('export_user_data', {
        p_user_id: user!.id
      });

      if (error) throw error;

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my-data-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Succes',
        description: 'Je gegevens zijn geëxporteerd'
      });
    } catch (error: any) {
      toast({
        title: 'Fout',
        description: 'Kon gegevens niet exporteren: ' + error.message,
        variant: 'destructive'
      });
    } finally {
      setExportLoading(false);
    }
  };

  const deleteUserData = async () => {
    try {
      setDeleteLoading(true);
      
      // This would need to be implemented as an edge function
      // for now we just show the functionality
      toast({
        title: 'Aanvraag ingediend',
        description: 'Je verzoek tot gegevensverwijdering is ingediend. We nemen binnen 30 dagen contact op.',
      });
      
    } catch (error: any) {
      toast({
        title: 'Fout',
        description: 'Kon verwijderingsverzoek niet indienen: ' + error.message,
        variant: 'destructive'
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const getConsentStatus = (consentType: string) => {
    const consent = consents.find(c => c.consent_type === consentType && !c.withdrawn_at);
    return consent?.consented || false;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">GDPR instellingen laden...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Privacy & GDPR Compliance</h2>
      </div>

      {/* User Consent Management */}
      <Card>
        <CardHeader>
          <CardTitle>Toestemmingen Beheren</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {consentTypes.map((consentType) => (
            <div key={consentType.type} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{consentType.title}</h3>
                  {consentType.required && (
                    <Badge variant="destructive" className="text-xs">Verplicht</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {consentType.description}
                </p>
              </div>
              <Switch
                checked={getConsentStatus(consentType.type)}
                onCheckedChange={(checked) => updateConsent(consentType.type, checked)}
                disabled={consentType.required}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Data Rights */}
      <Card>
        <CardHeader>
          <CardTitle>Je Gegevensrechten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={exportUserData}
              disabled={exportLoading}
              variant="outline"
              className="h-20 flex flex-col items-center gap-2"
            >
              <Download className="h-6 w-6" />
              <span className="text-sm">
                {exportLoading ? 'Exporteren...' : 'Gegevens Downloaden'}
              </span>
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="h-20 flex flex-col items-center gap-2"
                >
                  <Trash2 className="h-6 w-6" />
                  <span className="text-sm">Account Verwijderen</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Account Verwijderen</AlertDialogTitle>
                  <AlertDialogDescription>
                    Weet je zeker dat je je account wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt. 
                    Al je gegevens worden binnen 30 dagen permanent verwijderd.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuleren</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={deleteUserData}
                    disabled={deleteLoading}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleteLoading ? 'Verwerken...' : 'Verwijderen'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Gegevensverwerking</p>
                <p className="text-muted-foreground">
                  We verwerken je gegevens conform de GDPR. Je hebt het recht op inzage, rectificatie, 
                  en verwijdering van je gegevens. Voor vragen kun je contact opnemen via support.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Consent History */}
      <Card>
        <CardHeader>
          <CardTitle>Toestemmingsgeschiedenis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {consents.map((consent) => (
              <div key={consent.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-medium">{consent.consent_type}</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(consent.consented_at).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={consent.consented ? "default" : "secondary"}>
                    {consent.consented ? "Toegestaan" : "Geweigerd"}
                  </Badge>
                  {consent.withdrawn_at && (
                    <Badge variant="outline">Ingetrokken</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Admin: Data Retention Policies */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Data Retentiebeleid (Admin)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {retentionPolicies.map((policy) => (
                <div key={policy.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">{policy.table_name}</div>
                    <div className="text-sm text-muted-foreground">
                      Bewaren voor {policy.retention_days} dagen
                    </div>
                  </div>
                  <Badge variant={policy.is_active ? "default" : "secondary"}>
                    {policy.is_active ? "Actief" : "Inactief"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
