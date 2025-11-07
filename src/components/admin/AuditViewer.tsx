import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { useAdminActivity } from '@/hooks/useAdminActivity';
import { Skeleton } from '@/components/ui/skeleton';
import type { AdminActivityFilters } from '@/types/admin';

export const AuditViewer = () => {
  const [filters, setFilters] = useState<AdminActivityFilters>({
    limit: 50,
    offset: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, error } = useAdminActivity(filters);

  const getActivityColor = (type: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (type) {
      case 'user_role_change':
        return 'default';
      case 'feature_flag_change':
        return 'secondary';
      case 'content_moderation':
      case 'security_action':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const handleFilterChange = (key: keyof AdminActivityFilters, value: string) => {
    setFilters((prev: AdminActivityFilters) => ({
      ...prev,
      [key]: value || undefined,
      offset: 0, // Reset pagination
    }));
  };

  const filteredActivities = data?.activities.filter(activity => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      activity.activity_type.toLowerCase().includes(searchLower) ||
      activity.target_entity_type.toLowerCase().includes(searchLower) ||
      JSON.stringify(activity.action_metadata).toLowerCase().includes(searchLower)
    );
  }) || [];

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Audit Log</CardTitle>
            <CardDescription>{(error as Error).message}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Audit Log</h1>
        <p className="text-muted-foreground">View admin activity history</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Activity Type</label>
              <Select
                value={filters.activity_type || 'all'}
                onValueChange={(value) => handleFilterChange('activity_type', value === 'all' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="user_role_change">Role Changes</SelectItem>
                  <SelectItem value="feature_flag_change">Feature Flags</SelectItem>
                  <SelectItem value="content_moderation">Content Moderation</SelectItem>
                  <SelectItem value="system_config_change">System Config</SelectItem>
                  <SelectItem value="security_action">Security Actions</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Admin User ID</label>
              <Input
                placeholder="Filter by admin ID..."
                value={filters.admin_user_id || ''}
                onChange={(e) => handleFilterChange('admin_user_id', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Showing {filteredActivities.length} of {data?.total || 0} activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {filteredActivities.length === 0 ? (
                  <div className="flex items-center justify-center h-40 text-muted-foreground">
                    No activities found matching your filters
                  </div>
                ) : (
                  filteredActivities.map((activity) => (
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
                        <div className="text-sm mb-2">
                          <span className="font-medium">Admin {activity.admin_user_id.substring(0, 8)}</span>
                          {' performed action on '}
                          <span className="font-medium">{activity.target_entity_type}</span>
                          {activity.target_entity_id && (
                            <span className="text-muted-foreground">
                              {' '}• ID: {activity.target_entity_id.substring(0, 8)}
                            </span>
                          )}
                        </div>
                        <details className="text-xs">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            Show metadata
                          </summary>
                          <pre className="mt-2 bg-muted p-2 rounded overflow-auto max-h-40">
                            {JSON.stringify(activity.action_metadata, null, 2)}
                          </pre>
                        </details>
                        {activity.ip_address && (
                          <div className="text-xs text-muted-foreground mt-1">
                            IP: {activity.ip_address}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {data && data.total > filters.limit! && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setFilters((prev: AdminActivityFilters) => ({ ...prev, offset: Math.max(0, (prev.offset || 0) - (prev.limit || 50)) }))}
            disabled={!filters.offset}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={() => setFilters((prev: AdminActivityFilters) => ({ ...prev, offset: (prev.offset || 0) + (prev.limit || 50) }))}
            disabled={(filters.offset || 0) + (filters.limit || 50) >= data.total}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};
