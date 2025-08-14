
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { EnhancedErrorBoundary } from '@/components/error/EnhancedErrorBoundary';
import { AccessibilityWrapper } from '@/components/accessibility/AccessibilityWrapper';
import AnalyticsTracker from '@/components/analytics/AnalyticsTracker';

// Pages
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import Dashboard from '@/pages/Dashboard';
import CourseDetail from '@/pages/CourseDetail';
import ResetPassword from '@/pages/ResetPassword';
import Forum from '@/pages/Forum';
import ForumModeration from '@/pages/ForumModeration';
import EnrollConfirm from '@/pages/EnrollConfirm';
import Calendar from '@/pages/Calendar';
import Analytics from '@/pages/Analytics';
import Security from '@/pages/Security';
import Visie from '@/pages/Visie';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import TermsOfService from '@/pages/TermsOfService';
import NotFound from '@/pages/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <EnhancedErrorBoundary>
      <ThemeProvider defaultTheme="system" storageKey="ui-theme">
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <AccessibilityWrapper>
              <Router>
                <AnalyticsTracker />
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/visie" element={<Visie />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<TermsOfService />} />
                  
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/course/:id" element={
                    <ProtectedRoute>
                      <CourseDetail />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/forum" element={
                    <ProtectedRoute>
                      <Forum />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/forum-moderation" element={
                    <ProtectedRoute>
                      <ForumModeration />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/enroll-confirm" element={
                    <ProtectedRoute>
                      <EnrollConfirm />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/calendar" element={
                    <ProtectedRoute>
                      <Calendar />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/analytics" element={
                    <ProtectedRoute>
                      <Analytics />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/security" element={
                    <ProtectedRoute>
                      <Security />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Router>
            </AccessibilityWrapper>
            <Toaster />
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </EnhancedErrorBoundary>
  );
}

export default App;
