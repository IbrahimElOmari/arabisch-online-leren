import { useQuery } from '@tanstack/react-query';
import { moduleService } from '@/services/modules/moduleService';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, CreditCard, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { logger } from '@/utils/logger';

export const ModuleCatalog = () => {
  const navigate = useNavigate();
  const { data: modules, isLoading, error } = useQuery({
    queryKey: ['modules', 'active'],
    queryFn: () => moduleService.listActiveModules()
  });

  const formatPrice = (cents: number) => {
    return `€${(cents / 100).toFixed(2)}`;
  };

  const handleEnroll = (moduleId: string) => {
    logger.info('Module enrollment initiated', { moduleId });
    navigate(`/enroll/${moduleId}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-full" />
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mx-auto max-w-2xl my-8">
        <AlertDescription>
          Failed to load modules. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Test Mode:</strong> Payment system is in test mode. All payments are simulated.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Available Courses</h1>
        <p className="text-muted-foreground">
          Enroll in our Arabic language learning modules
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {modules?.map((module) => (
          <Card key={module.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {module.name}
                {module.is_active && (
                  <Badge variant="secondary">Active</Badge>
                )}
              </CardTitle>
              <CardDescription>
                {module.description || 'Learn Arabic with our comprehensive curriculum'}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="flex-1 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">
                      One-time payment: {formatPrice(module.price_one_time_cents)}
                    </p>
                  </div>
                </div>

                {module.installment_months && module.installment_months > 0 && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Or {module.installment_months} monthly payments of{' '}
                        {formatPrice(module.installment_monthly_cents || 0)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>

            <CardFooter>
              <Button 
                className="w-full" 
                onClick={() => handleEnroll(module.id)}
              >
                Enroll Now
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {modules?.length === 0 && (
        <Alert>
          <AlertDescription>
            No active modules available at the moment. Please check back later.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
