import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { adminOpsService, AuditLog } from '@/services/adminOpsService';
import { FileText, User, Clock, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useState } from 'react';

const entityTypeColors = {
  profile: 'default',
  lesson: 'secondary',
  task: 'outline',
  forum_thread: 'default',
  forum_post: 'secondary',
  class: 'outline',
  system_settings: 'destructive',
  backup_jobs: 'default',
} as const;

const actionColors = {
  user_role_changed: 'destructive',
  lesson_published: 'success',
  lesson_archived: 'secondary',
  task_published: 'success',
  task_archived: 'secondary',
  thread_pinned: 'default',
  thread_archived: 'secondary',
  post_deleted: 'destructive',
  maintenance_mode_toggle: 'destructive',
  backup_job_created: 'default',
  gdpr_data_export: 'outline',
  gdpr_deletion_request: 'destructive',
} as any;

export default function AuditLogs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedEntity, setSelectedEntity] = useState<string>('all');

  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const result = await adminOpsService.getAuditLogs(200, 0);
      return result.data;
    },
  });

  // Filter logs based on search and filters
  const filteredLogs = auditLogs?.filter((log: AuditLog) => {
    const matchesSearch = !searchTerm || 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = selectedAction === 'all' || log.action === selectedAction;
    const matchesEntity = selectedEntity === 'all' || log.entity_type === selectedEntity;
    
    return matchesSearch && matchesAction && matchesEntity;
  }) || [];

  // Get unique actions and entities for filter dropdowns
  const uniqueActions = Array.from(new Set(auditLogs?.map(log => log.action) || []));
  const uniqueEntities = Array.from(new Set(auditLogs?.map(log => log.entity_type) || []));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Audit logs laden...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Audit Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Zoek in audit logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={selectedAction} onValueChange={setSelectedAction}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter op actie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle acties</SelectItem>
                {uniqueActions.map(action => (
                  <SelectItem key={action} value={action}>{action}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedEntity} onValueChange={setSelectedEntity}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter op entiteit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle entiteiten</SelectItem>
                {uniqueEntities.map(entity => (
                  <SelectItem key={entity} value={entity}>{entity}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {filteredLogs.map((log: AuditLog) => (
              <div key={log.id} className="border rounded-lg p-4 hover:bg-muted/50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <Badge variant={actionColors[log.action] || 'default'}>
                      {log.action}
                    </Badge>
                    <Badge variant={entityTypeColors[log.entity_type as keyof typeof entityTypeColors] || 'outline'}>
                      {log.entity_type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {format(new Date(log.created_at), 'dd MMM yyyy HH:mm', { locale: nl })}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {log.profiles?.full_name || 'Systeem'}
                  </span>
                  {log.profiles?.role && (
                    <Badge variant="outline" className="text-xs">
                      {log.profiles.role}
                    </Badge>
                  )}
                </div>

                {Object.keys(log.meta || {}).length > 0 && (
                  <div className="mt-2 p-2 bg-muted/30 rounded text-xs">
                    <strong>Details:</strong>
                    <pre className="mt-1 whitespace-pre-wrap">
                      {JSON.stringify(log.meta, null, 2)}
                    </pre>
                  </div>
                )}

                {log.entity_id && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Entity ID: <code className="bg-muted px-1 rounded">{log.entity_id}</code>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredLogs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || selectedAction !== 'all' || selectedEntity !== 'all' 
                ? 'Geen audit logs gevonden met de huidige filters.' 
                : 'Nog geen audit logs beschikbaar.'
              }
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}