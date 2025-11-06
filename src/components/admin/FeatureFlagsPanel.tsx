// PR7 Skeleton: Feature Flags Management Panel
// TODO: Implement CRUD operations for feature flags

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Plus } from 'lucide-react';

export const FeatureFlagsPanel = () => {
  // TODO: Fetch real feature flags from admin-feature-flags edge function
  const mockFlags = [
    { id: '1', flag_key: 'new_forum_ui', flag_name: 'New Forum UI', is_enabled: true, rollout_percentage: 50 },
    { id: '2', flag_key: 'ai_grading', flag_name: 'AI-Powered Grading', is_enabled: false, rollout_percentage: 0 },
    { id: '3', flag_key: 'advanced_analytics', flag_name: 'Advanced Analytics', is_enabled: true, rollout_percentage: 100 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Feature Flags</h1>
          <p className="text-muted-foreground">Manage feature rollouts and A/B tests</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Flag
        </Button>
      </div>

      <div className="grid gap-4">
        {mockFlags.map((flag) => (
          <Card key={flag.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{flag.flag_name}</CardTitle>
                  <CardDescription>Key: {flag.flag_key}</CardDescription>
                </div>
                <Switch checked={flag.is_enabled} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="text-sm text-muted-foreground">Rollout</div>
                  <div className="text-2xl font-bold">{flag.rollout_percentage}%</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Edit</Button>
                  <Button variant="outline" size="sm">Delete</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {mockFlags.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-[300px]">
            <p className="text-muted-foreground mb-4">No feature flags yet</p>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create your first flag
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
