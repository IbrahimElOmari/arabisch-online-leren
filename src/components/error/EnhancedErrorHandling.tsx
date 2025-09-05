import React, { Suspense } from 'react';
import { EnhancedErrorBoundary } from '@/components/error/EnhancedErrorBoundary';
import DashboardSkeleton from '@/components/ui/LoadingSkeleton';

interface Props { children: React.ReactNode }

export const WithEnhancedErrorHandling = ({ children }: Props) => (
  <EnhancedErrorBoundary>
    <Suspense fallback={<DashboardSkeleton />}>{children}</Suspense>
  </EnhancedErrorBoundary>
);

export default WithEnhancedErrorHandling;
