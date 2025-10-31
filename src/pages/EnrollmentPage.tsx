import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { moduleService } from '@/services/modules/moduleService';
import { enrollmentService } from '@/services/modules/enrollmentService';
import { supabase } from '@/integrations/supabase/client';
import { EnrollmentForm } from '@/components/modules/EnrollmentForm';
import { useAuthSession } from '@/hooks/useAuthSession';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import type { EnrollmentFormData } from '@/types/modules';
import { logger } from '@/utils/logger';

const EnrollmentPage = () => {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthSession();

  const { data: module, isLoading } = useQuery({
    queryKey: ['module', moduleId],
    queryFn: () => moduleService.getModuleById(moduleId!),
    enabled: !!moduleId
  });

  const handleSubmit = async (formData: EnrollmentFormData) => {
    if (!user || !moduleId || !module) {
      throw new Error('Missing required data');
    }

    try {
      // Create student profile
      await enrollmentService.createStudentProfile(user.id, formData);

      // Create enrollment
      const enrollment = await enrollmentService.createEnrollment(
        user.id,
        moduleId,
        formData.paymentType
      );

      // Calculate payment amount
      const amountCents = formData.paymentType === 'one_time'
        ? module.price_one_time_cents
        : (module.installment_monthly_cents || 0);

      logger.info('Enrollment created, calling checkout', {
        enrollmentId: enrollment.id,
        paymentType: formData.paymentType,
        amountCents
      });

      // Call edge function for stub checkout
      const { data, error } = await supabase.functions.invoke('payment-checkout-test', {
        body: {
          enrollment_id: enrollment.id,
          module_id: moduleId,
          payment_type: formData.paymentType
        }
      });

      if (error) {
        throw error;
      }

      if (!data?.url) {
        throw new Error('No checkout URL received');
      }

      logger.info('Redirecting to payment', { url: data.url });

      // Redirect to stub payment page
      navigate(data.url);
    } catch (error) {
      logger.error('Enrollment failed', { moduleId }, error as Error);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!module) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertDescription>Module not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertDescription>Please log in to enroll</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <EnrollmentForm module={module} onSubmit={handleSubmit} />
    </div>
  );
};

export default EnrollmentPage;
