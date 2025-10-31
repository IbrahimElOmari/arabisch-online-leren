import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { moduleService } from '@/services/modules/moduleService';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, Clock, Euro } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ModuleCatalogPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: modules, isLoading, error } = useQuery({
    queryKey: ['modules', 'active'],
    queryFn: () => moduleService.listActiveModules()
  });

  const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertDescription>
            {t('modules.catalog.error', 'Failed to load modules. Please try again.')}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!modules || modules.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertDescription>
            {t('modules.catalog.empty', 'No modules available at the moment.')}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">
          {t('modules.catalog.title', 'Available Modules')}
        </h1>
        <p className="text-muted-foreground text-lg">
          {t('modules.catalog.subtitle', 'Choose a module to start your learning journey')}
        </p>
      </div>

      {/* Test Mode Warning */}
      <Alert>
        <AlertDescription className="flex items-center gap-2">
          <Badge variant="secondary">TEST MODE</Badge>
          {t('modules.catalog.testMode', 'Payments are in test mode. No real charges will be made.')}
        </AlertDescription>
      </Alert>

      {/* Module Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => (
          <Card key={module.id} className="flex flex-col hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{module.name}</span>
                <CheckCircle2 className="h-5 w-5 text-success" />
              </CardTitle>
              {module.description && (
                <CardDescription>{module.description}</CardDescription>
              )}
            </CardHeader>

            <CardContent className="flex-1 space-y-4">
              {/* One-time Payment */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Euro className="h-4 w-4" />
                  {t('modules.catalog.oneTime', 'One-time Payment')}
                </div>
                <div className="text-2xl font-bold">
                  €{formatPrice(module.price_one_time_cents)}
                </div>
              </div>

              {/* Installment Option */}
              {module.installment_months && module.installment_monthly_cents && module.installment_monthly_cents > 0 && (
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Clock className="h-4 w-4" />
                    {t('modules.catalog.installment', 'Installment Plan')}
                  </div>
                  <div className="text-xl font-semibold">
                    €{formatPrice(module.installment_monthly_cents)}/
                    {t('modules.catalog.month', 'month')}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t('modules.catalog.installmentMonths', {
                      defaultValue: '{{months}} months',
                      months: module.installment_months
                    })}
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter>
              <Button 
                className="w-full" 
                onClick={() => navigate(`/enroll/module/${module.id}`)}
              >
                {t('modules.catalog.enroll', 'Enroll Now')}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ModuleCatalogPage;
