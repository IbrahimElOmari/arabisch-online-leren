import { lazy } from 'react';
import WithEnhancedErrorHandling from '@/components/error/EnhancedErrorHandling';

const StudentDashboard = lazy(() => import('@/components/dashboard/StudentDashboard'));

/**
 * EnhancedStudentDashboard
 * FIX: Removed problematic getMobileNavClasses() wrapper that applied flex-direction: row-reverse
 * to the entire dashboard, causing content to be hidden in RTL mobile mode.
 */
const EnhancedStudentDashboard = () => {
  return (
    <div>
      <WithEnhancedErrorHandling>
        <StudentDashboard />
      </WithEnhancedErrorHandling>
    </div>
  );
};

export default EnhancedStudentDashboard;
