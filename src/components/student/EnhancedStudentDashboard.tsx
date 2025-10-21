import { lazy } from 'react';
import WithEnhancedErrorHandling from '@/components/error/EnhancedErrorHandling';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMobileRTL } from '@/hooks/useMobileRTL';

const StudentDashboard = lazy(() => import('@/components/dashboard/StudentDashboard'));

const EnhancedStudentDashboard = () => {
  const isMobile = useIsMobile();
  const { getMobileNavClasses } = useMobileRTL();

  return (
    <div className={isMobile ? getMobileNavClasses() : undefined}>
      <WithEnhancedErrorHandling>
        <StudentDashboard />
      </WithEnhancedErrorHandling>
    </div>
  );
};

export default EnhancedStudentDashboard;
