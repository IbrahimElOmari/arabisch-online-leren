import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { TranslationProvider } from '@/contexts/TranslationContext';
import { AgeThemeProvider } from '@/contexts/AgeThemeContext';
import { AuthProviderQuery } from '@/components/auth/AuthProviderQuery';
import { AppGate } from '@/components/auth/AppGate';
import { AppLayout } from '@/components/layout/AppLayout';

// Lazy load RTLProvider to avoid static/dynamic import conflicts
const EnhancedRTLProvider = lazy(() => import('@/components/rtl/RTLProvider').then(m => ({ default: m.EnhancedRTLProvider })));

import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import Dashboard from '@/pages/Dashboard';
import Admin from '@/pages/Admin';
import Forum from '@/pages/Forum';
import Taken from '@/pages/Taken';
import Analytics from '@/pages/Analytics';
import Security from '@/pages/Security';
import Leerstof from '@/pages/Leerstof';
import Visie from '@/pages/Visie';
import Calendar from '@/pages/Calendar';
import CourseDetail from '@/pages/CourseDetail';
import EnrollConfirm from '@/pages/EnrollConfirm';
import ResetPassword from '@/pages/ResetPassword';
import ForumModeration from '@/pages/ForumModeration';
import LessonOrganizationPage from '@/pages/LessonOrganization';
import OfflineContentPage from '@/pages/OfflineContent';
import Pricing from '@/pages/Pricing';
import Billing from '@/pages/Billing';
import BillingComingSoon from '@/pages/BillingComingSoon';
import Profile from '@/pages/Profile';
import NotFound from '@/pages/NotFound';
// Import admin routes
import AdminLayout from '@/pages/admin/AdminLayout';
import UsersAdmin from '@/pages/admin/UsersAdmin';
import Operations from '@/pages/admin/Operations';
import AuditLogs from '@/pages/admin/AuditLogs';
import PrivacyTools from '@/pages/account/PrivacyTools';
// Import legal pages
import PrivacyPolicy from '@/pages/Legal/PrivacyPolicy';
import TermsOfService from '@/pages/Legal/TermsOfService';
import { ENV_CONFIG } from '@/config/environment';
import Maintenance from '@/pages/Maintenance';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  // Check for missing environment variables and show maintenance page
  if (ENV_CONFIG.hasMissingEnvVars()) {
    return <Maintenance />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
          <EnhancedRTLProvider>
            <TranslationProvider>
            <AuthProviderQuery>
              <AgeThemeProvider>
            <Router>
              <div className="min-h-screen bg-background">
                <Routes>
                  {/* Routes without layout (auth pages, etc.) */}
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<TermsOfService />} />
                  
                  {/* Routes with layout (main app) */}
                  <Route path="/" element={<AppLayout />}>
                    <Route index element={<Index />} />
                    <Route path="dashboard" element={<AppGate><Dashboard /></AppGate>} />
                    <Route path="admin" element={<AppGate><AdminLayout /></AppGate>}>
                      <Route path="users" element={<UsersAdmin />} />
                      <Route path="operations" element={<Operations />} />
                      <Route path="audit" element={<AuditLogs />} />
                      <Route index element={<UsersAdmin />} />
                    </Route>
                    <Route path="account/privacy" element={<AppGate><PrivacyTools /></AppGate>} />
                    <Route path="lesson-organization" element={<AppGate><LessonOrganizationPage /></AppGate>} />
                    <Route path="offline-content" element={<AppGate><OfflineContentPage /></AppGate>} />
                    <Route path="forum" element={<AppGate><Forum /></AppGate>} />
                    <Route path="forum/:classId" element={<AppGate><Forum /></AppGate>} />
                    <Route path="forum-moderation" element={<AppGate><ForumModeration /></AppGate>} />
                    <Route path="taken" element={<AppGate><Taken /></AppGate>} />
                    <Route path="analytics" element={<AppGate><Analytics /></AppGate>} />
                    <Route path="security" element={<AppGate><Security /></AppGate>} />
                    <Route path="leerstof" element={<AppGate><Leerstof /></AppGate>} />
                    <Route path="visie" element={<Visie />} />
                    <Route path="calendar" element={<AppGate><Calendar /></AppGate>} />
                    <Route path="profile" element={<AppGate><Profile /></AppGate>} />
                    <Route path="courses/:id" element={<AppGate><CourseDetail /></AppGate>} />
                    <Route path="enroll/:classId" element={<AppGate><EnrollConfirm /></AppGate>} />
                    <Route path="pricing" element={<Pricing />} />
                    <Route path="billing" element={<AppGate><Billing /></AppGate>} />
                    <Route path="billing/coming-soon" element={<BillingComingSoon />} />
                    
                    {/* Redirects for removed AI routes */}
                    <Route path="ai-tutor" element={<Navigate to="/dashboard" replace />} />
                    <Route path="voice-assistant" element={<Navigate to="/dashboard" replace />} />
                    <Route path="whiteboard" element={<Navigate to="/dashboard" replace />} />
                    
                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Routes>
              </div>
              <Toaster />
            </Router>
              </AgeThemeProvider>
            </AuthProviderQuery>
          </TranslationProvider>
        </EnhancedRTLProvider>
        </Suspense>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
