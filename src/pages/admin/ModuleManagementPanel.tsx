import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, Plus, Edit, Trash } from 'lucide-react';
import { logger } from '@/utils/logger';
import type { Module, ModuleClass, ModuleLevel } from '@/types/modules';

export default function ModuleManagementPanel() {
  const queryClient = useQueryClient();
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);

  // Fetch modules
  const { data: modules, isLoading: modulesLoading } = useQuery({
    queryKey: ['admin-modules'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('admin-modules', {
        method: 'GET',
      });
      if (error) throw error;
      return data.data as Module[];
    },
  });

  // Fetch classes for selected module
  const { data: classes } = useQuery({
    queryKey: ['admin-classes', selectedModule?.id],
    queryFn: async () => {
      if (!selectedModule) return [];
      const { data, error } = await supabase.functions.invoke('admin-classes', {
        method: 'GET',
        body: { module_id: selectedModule.id },
      });
      if (error) throw error;
      return data.data as ModuleClass[];
    },
    enabled: !!selectedModule,
  });

  // Fetch levels for selected module
  const { data: levels } = useQuery({
    queryKey: ['admin-levels', selectedModule?.id],
    queryFn: async () => {
      if (!selectedModule) return [];
      const { data, error } = await supabase.functions.invoke('admin-levels', {
        method: 'GET',
        body: { module_id: selectedModule.id },
      });
      if (error) throw error;
      return data.data as ModuleLevel[];
    },
    enabled: !!selectedModule,
  });

  // Create/Update module mutation
  const moduleMutation = useMutation({
    mutationFn: async (moduleData: Partial<Module> & { id?: string }) => {
      const method = moduleData.id ? 'PUT' : 'POST';
      const { data, error } = await supabase.functions.invoke('admin-modules', {
        method,
        body: moduleData,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-modules'] });
      setIsModuleDialogOpen(false);
      toast.success('Module saved successfully');
      logger.info('Module saved');
    },
    onError: (error) => {
      logger.error('Failed to save module', {}, error as Error);
      toast.error('Failed to save module');
    },
  });

  // Delete module mutation
  const deleteModuleMutation = useMutation({
    mutationFn: async (moduleId: string) => {
      const { error } = await supabase.functions.invoke('admin-modules', {
        method: 'DELETE',
        body: { id: moduleId },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-modules'] });
      toast.success('Module deleted');
    },
    onError: (error) => {
      logger.error('Failed to delete module', {}, error as Error);
      toast.error('Failed to delete module');
    },
  });

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100);
  };

  if (modulesLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Module Management</h1>
          <p className="text-muted-foreground">Manage courses, classes, and levels</p>
        </div>
        <Dialog open={isModuleDialogOpen} onOpenChange={setIsModuleDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Module
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <ModuleForm 
              onSubmit={(data) => moduleMutation.mutate(data)}
              isLoading={moduleMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="modules" className="w-full">
        <TabsList>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          {selectedModule && (
            <>
              <TabsTrigger value="classes">Classes</TabsTrigger>
              <TabsTrigger value="levels">Levels</TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="modules" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {modules?.map((module) => (
              <Card key={module.id} className={selectedModule?.id === module.id ? 'border-primary' : ''}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle>{module.name}</CardTitle>
                      <CardDescription className="line-clamp-2">{module.description}</CardDescription>
                    </div>
                    <Switch 
                      checked={module.is_active ?? false}
                      onCheckedChange={(checked) => 
                        moduleMutation.mutate({ ...module, is_active: checked })
                      }
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-semibold">One-time:</span> {formatCurrency(module.price_one_time_cents)}
                    </div>
                    {module.installment_months && module.installment_monthly_cents ? (
                      <div>
                        <span className="font-semibold">Installments:</span> {formatCurrency(module.installment_monthly_cents)}/mo × {module.installment_months}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedModule(module)}
                    >
                      Manage
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedModule(module);
                        setIsModuleDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => {
                        if (confirm('Delete this module?')) {
                          deleteModuleMutation.mutate(module.id);
                        }
                      }}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {selectedModule && (
          <>
            <TabsContent value="classes">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Classes for {selectedModule.name}</CardTitle>
                    <CardDescription>Manage class capacity and schedules</CardDescription>
                  </div>
                  <Button onClick={() => toast.info('Class management coming soon')}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Class
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {classes?.map((cls) => (
                      <div key={cls.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-semibold">{cls.class_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Capacity: {cls.current_enrollment || 0}/{cls.capacity}
                          </p>
                        </div>
                        <Switch checked={cls.is_active ?? true} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="levels">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Levels for {selectedModule.name}</CardTitle>
                    <CardDescription>Define progression levels</CardDescription>
                  </div>
                  <Button onClick={() => toast.info('Level management coming soon')}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Level
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {levels?.map((level) => (
                      <div key={level.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-semibold">{level.level_name}</h4>
                          <p className="text-sm text-muted-foreground">Code: {level.level_code}</p>
                        </div>
                        <span className="text-sm">Order: {level.sequence_order}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}

function ModuleForm({ 
  module, 
  onSubmit, 
  isLoading 
}: { 
  module?: Module; 
  onSubmit: (data: Partial<Module>) => void; 
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: module?.name || '',
    description: module?.description || '',
    price_one_time_cents: module?.price_one_time_cents || 0,
    installment_months: module?.installment_months || 0,
    installment_monthly_cents: module?.installment_monthly_cents || 0,
    is_active: module?.is_active ?? false,
  });

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      onSubmit({ ...formData, ...(module?.id && { id: module.id }) });
    }}>
      <DialogHeader>
        <DialogTitle>{module ? 'Edit Module' : 'Create Module'}</DialogTitle>
        <DialogDescription>Configure module pricing and details</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="name">Module Name*</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price">One-time Price (cents)*</Label>
          <Input
            id="price"
            type="number"
            min="0"
            value={formData.price_one_time_cents}
            onChange={(e) => setFormData({ ...formData, price_one_time_cents: parseInt(e.target.value) })}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="installments">Installment Months</Label>
            <Input
              id="installments"
              type="number"
              min="0"
              value={formData.installment_months}
              onChange={(e) => setFormData({ ...formData, installment_months: parseInt(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="monthly">Monthly Price (cents)</Label>
            <Input
              id="monthly"
              type="number"
              min="0"
              value={formData.installment_monthly_cents}
              onChange={(e) => setFormData({ ...formData, installment_monthly_cents: parseInt(e.target.value) })}
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          />
          <Label htmlFor="active">Active</Label>
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {module ? 'Update' : 'Create'}
        </Button>
      </DialogFooter>
    </form>
  );
}