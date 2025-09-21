import React, { lazy } from 'react';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

// Analytics components - heavy charts and data processing
export const AnalyticsDashboard = lazy(() => 
  import('@/components/analytics/AnalyticsDashboard')
);

export const TeacherAnalytics = lazy(() => 
  import('@/components/teacher/TeacherAnalytics')
);

export const GradingAnalytics = lazy(() => 
  import('@/components/teacher/GradingAnalytics')
);

// Forum components - rich text editor and multimedia
export const ForumMain = lazy(() => 
  import('@/components/forum/ForumMain')
);

export const CreateThreadForm = lazy(() => 
  import('@/components/forum/CreateThreadForm')
);

// Media components - video player and recording
export const AdvancedVideoPlayer = lazy(() => 
  import('@/components/learning/AdvancedVideoPlayer').then(module => ({
    default: module.AdvancedVideoPlayer
  }))
);

export const AudioVideoRecorder = lazy(() => 
  import('@/components/media/AudioVideoRecorder').then(module => ({
    default: module.AudioVideoRecorder
  }))
);

// Course management - complex forms and drag-drop
export const LessonOrganizer = lazy(() => 
  import('@/components/lesson-organization/LessonOrganizer').then(module => ({
    default: module.LessonOrganizer
  }))
);

export const TaskQuestionManagement = lazy(() => 
  import('@/components/management/TaskQuestionManagement').then(module => ({
    default: module.TaskQuestionManagement
  }))
);

// RTL and accessibility testing components
export const RTLTestSuite = lazy(() => 
  import('@/components/rtl/RTLTestSuite').then(module => ({
    default: module.RTLTestSuite
  }))
);

// Fallback loading component with proper accessibility
export const LazyComponentWrapper = ({ 
  children, 
  fallback = <LoadingSkeleton />,
  ariaLabel = "Loading component"
}: { 
  children: React.ReactNode;
  fallback?: React.ReactNode;
  ariaLabel?: string;
}) => (
  <div aria-live="polite" aria-label={ariaLabel} role="region">
    <React.Suspense fallback={fallback}>
      {children}
    </React.Suspense>
  </div>
);