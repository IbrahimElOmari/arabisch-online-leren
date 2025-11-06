// PR7 Skeleton: Audit Activity Viewer
// TODO: Implement pagination and filtering for audit logs

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export const AuditViewer = () => {
  // TODO: Fetch real audit logs from admin-activity-list edge function
  const mockActivities = [
    {
      id: '1',
      activity_type: 'user_role_change',
      admin_user_id: 'admin-1',
      target_entity_type: 'user',
      created_at: new Date().toISOString(),
      action_metadata: { old_role: 'student', new_role: 'teacher' },
    },
    {
      id: '2',
      activity_type: 'feature_flag_change',
      admin_user_id: 'admin-2',
      target_entity_type: 'feature_flag',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      action_metadata: { flag_key: 'new_forum_ui', action: 'enable' },
    },
    {
      id: '3',
      activity_type: 'content_moderation',
      admin_user_id: 'admin-1',
      target_entity_type: 'forum_post',
      created_at: new Date(Date.now() - 7200000).toISOString(),
      action_metadata: { reason: 'inappropriate content' },
    },
  ];

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'user_role_change':
        return 'default';
      case 'feature_flag_change':
        return 'secondary';
      case 'content_moderation':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Audit Log</h1>
        <p className="text-muted-foreground">View admin activity history</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Last 50 admin actions (placeholder data)</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {mockActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 border-b pb-4 last:border-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getActivityColor(activity.activity_type)}>
                        {activity.activity_type.replace(/_/g, ' ')}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(activity.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Admin {activity.admin_user_id}</span>
                      {' performed action on '}
                      <span className="font-medium">{activity.target_entity_type}</span>
                    </div>
                    <pre className="text-xs text-muted-foreground mt-1 bg-muted p-2 rounded">
                      {JSON.stringify(activity.action_metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
