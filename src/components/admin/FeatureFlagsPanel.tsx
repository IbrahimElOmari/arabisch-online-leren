import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Plus, Trash2 } from 'lucide-react';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { Skeleton } from '@/components/ui/skeleton';
import type { CreateFeatureFlagInput } from '@/types/admin';

export const FeatureFlagsPanel = () => {
  const { flags, isLoading, createFlag, updateFlag, deleteFlag, isCreating, isUpdating } = useFeatureFlags();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newFlag, setNewFlag] = useState<CreateFeatureFlagInput>({
    flag_key: '',
    flag_name: '',
    description: '',
    is_enabled: false,
    rollout_percentage: 0,
    target_roles: [],
  });

  const handleCreateFlag = () => {
    createFlag(newFlag);
    setIsDialogOpen(false);
    setNewFlag({
      flag_key: '',
      flag_name: '',
      description: '',
      is_enabled: false,
      rollout_percentage: 0,
      target_roles: [],
    });
  };

  const handleToggle = (id: string, currentState: boolean) => {
    updateFlag({ id, is_enabled: !currentState });
  };

  const handleRolloutChange = (id: string, value: number[]) => {
    updateFlag({ id, rollout_percentage: value[0] });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-12 w-full" />
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Feature Flags</h1>
          <p className="text-muted-foreground">Manage feature rollouts and A/B tests</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Flag
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Feature Flag</DialogTitle>
              <DialogDescription>
                Add a new feature flag to control feature rollouts
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="flag_key">Flag Key *</Label>
                <Input
                  id="flag_key"
                  placeholder="new_feature_enabled"
                  value={newFlag.flag_key}
                  onChange={(e) => setNewFlag({ ...newFlag, flag_key: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="flag_name">Display Name *</Label>
                <Input
                  id="flag_name"
                  placeholder="New Feature"
                  value={newFlag.flag_name}
                  onChange={(e) => setNewFlag({ ...newFlag, flag_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this feature flag controls..."
                  value={newFlag.description}
                  onChange={(e) => setNewFlag({ ...newFlag, description: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_enabled"
                  checked={newFlag.is_enabled}
                  onCheckedChange={(checked) => setNewFlag({ ...newFlag, is_enabled: checked })}
                />
                <Label htmlFor="is_enabled">Enable immediately</Label>
              </div>
              <div className="space-y-2">
                <Label>Rollout Percentage: {newFlag.rollout_percentage}%</Label>
                <Slider
                  value={[newFlag.rollout_percentage || 0]}
                  onValueChange={(value) => setNewFlag({ ...newFlag, rollout_percentage: value[0] })}
                  max={100}
                  step={5}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateFlag} 
                disabled={!newFlag.flag_key || !newFlag.flag_name || isCreating}
              >
                {isCreating ? 'Creating...' : 'Create Flag'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {flags.map((flag) => (
          <Card key={flag.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle>{flag.flag_name}</CardTitle>
                  <CardDescription>
                    Key: <code className="text-xs bg-muted px-1 py-0.5 rounded">{flag.flag_key}</code>
                    {flag.description && flag.description.length > 0 && <span className="ml-2">• {flag.description}</span>}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={flag.is_enabled} 
                    onCheckedChange={() => handleToggle(flag.id, flag.is_enabled)}
                    disabled={isUpdating}
                  />
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => deleteFlag(flag.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Rollout Progress</span>
                    <span className="text-sm text-muted-foreground">{flag.rollout_percentage}%</span>
                  </div>
                  <Slider
                    value={[flag.rollout_percentage]}
                    onValueChange={(value) => handleRolloutChange(flag.id, value)}
                    max={100}
                    step={5}
                    disabled={isUpdating}
                  />
                </div>
                {flag.target_roles && flag.target_roles.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Target roles: {flag.target_roles.join(', ')}
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  Updated: {new Date(flag.updated_at).toLocaleString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {flags.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-[300px]">
              <p className="text-muted-foreground mb-4">No feature flags yet</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create your first flag
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
