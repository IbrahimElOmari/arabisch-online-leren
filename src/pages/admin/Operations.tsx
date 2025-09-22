import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { adminOpsService, BackupJob } from '@/services/adminOpsService';
import { Settings, Database, AlertTriangle, Download, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

const statusIcons = {
  queued: Clock,
  running: Clock,
  success: CheckCircle,
  failed: XCircle,
};

const statusColors = {
  queued: 'secondary',
  running: 'secondary',
  success: 'default',
  failed: 'destructive',
} as const;

export default function Operations() {
  const [backupNote, setBackupNote] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: adminOpsService.getSystemSettings,
  });

  // Update maintenance mode when settings change
  useEffect(() => {
    if (settings) {
      setMaintenanceMode(settings.maintenance_mode?.enabled === true);
    }
  }, [settings]);

  const { data: backupJobs, isLoading: backupsLoading } = useQuery({
    queryKey: ['backup-jobs'],
    queryFn: adminOpsService.getBackupJobs,
  });

  const maintenanceMutation = useMutation({
    mutationFn: adminOpsService.toggleMaintenance,
    onSuccess: (data) => {
      setMaintenanceMode(data.enabled);
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      toast({
        title: 'Onderhoudsmodus gewijzigd',
        description: `Onderhoudsmodus is nu ${data.enabled ? 'ingeschakeld' : 'uitgeschakeld'}.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Fout',
        description: error.message || 'Kon onderhoudsmodus niet wijzigen.',
        variant: 'destructive',
      });
    },
  });

  const backupMutation = useMutation({
    mutationFn: adminOpsService.createBackupJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backup-jobs'] });
      setBackupNote('');
      toast({
        title: 'Backup job aangemaakt',
        description: 'De backup job is toegevoegd aan de wachtrij.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Fout',
        description: error.message || 'Kon backup job niet aanmaken.',
        variant: 'destructive',
      });
    },
  });

  const handleMaintenanceToggle = () => {
    maintenanceMutation.mutate(!maintenanceMode);
  };

  const handleCreateBackup = () => {
    backupMutation.mutate(backupNote || undefined);
  };

  return (
    <div className="space-y-6">
      {/* Maintenance Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Onderhoudsmodus
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="maintenance-mode">Onderhoudsmodus inschakelen</Label>
              <p className="text-sm text-muted-foreground">
                Wanneer ingeschakeld, zien gebruikers een onderhoudsbanner
              </p>
            </div>
            <Switch
              id="maintenance-mode"
              checked={maintenanceMode}
              onCheckedChange={handleMaintenanceToggle}
              disabled={maintenanceMutation.isPending || settingsLoading}
            />
          </div>
          
          {maintenanceMode && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive font-medium">
                Onderhoudsmodus is actief - gebruikers zien een waarschuwingsbanner
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Backup Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Backup Beheer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="backup-note">Backup notitie (optioneel)</Label>
              <Input
                id="backup-note"
                placeholder="Bijv. Voor grote update v2.0..."
                value={backupNote}
                onChange={(e) => setBackupNote(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleCreateBackup}
              disabled={backupMutation.isPending}
              className="w-full sm:w-auto"
            >
              <Database className="h-4 w-4 mr-2" />
              {backupMutation.isPending ? 'Backup aanmaken...' : 'Nieuwe backup job'}
            </Button>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Recente backup jobs</h4>
            {backupsLoading ? (
              <div className="text-muted-foreground">Backup jobs laden...</div>
            ) : (
              <div className="space-y-3">
                {backupJobs?.slice(0, 5).map((job: BackupJob) => {
                  const StatusIcon = statusIcons[job.status];
                  return (
                    <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <StatusIcon className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {format(new Date(job.created_at), 'dd MMM yyyy HH:mm', { locale: nl })}
                          </div>
                          {job.note && (
                            <div className="text-sm text-muted-foreground">{job.note}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={statusColors[job.status]}>
                          {job.status}
                        </Badge>
                        {job.artifact_url && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={job.artifact_url} download>
                              <Download className="h-3 w-3" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {!backupJobs?.length && (
                  <div className="text-center py-6 text-muted-foreground">
                    Nog geen backup jobs aangemaakt.
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* GDPR Tools Info */}
      <Card>
        <CardHeader>
          <CardTitle>GDPR Tools</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Gebruikers kunnen hun eigen data exporteren en verwijderverzoeken indienen via hun accountpagina.
          </p>
          <Button variant="outline" asChild>
            <a href="/account/privacy">Ga naar Privacy Tools</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}