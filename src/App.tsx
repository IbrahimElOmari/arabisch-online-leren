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
import { SessionMonitor } from '@/components/security/SessionMonitor';

// Lazy load RTLProvider to avoid static/dynamic import conflicts
const EnhancedRTLProvider = lazy(() => import('@/components/rtl/RTLProvider').then(m => ({ default: m.EnhancedRTLProvider })));

// Static imports for critical pages
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import ResetPassword from '@/pages/ResetPassword';
import PrivacyPolicy from '@/pages/Legal/PrivacyPolicy';
import TermsOfService from '@/pages/Legal/TermsOfService';
import NotFound from '@/pages/NotFound';

// Lazy load heavy pages for better performance
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Analytics = lazy(() => import('@/pages/Analytics'));
const Security = lazy(() => import('@/pages/Security'));
const Forum = lazy(() => import('@/pages/Forum'));
const ForumModeration = lazy(() => import('@/pages/ForumModeration'));
const Taken = lazy(() => import('@/pages/Taken'));
const Leerstof = lazy(() => import('@/pages/Leerstof'));
const Visie = lazy(() => import('@/pages/Visie'));
const Calendar = lazy(() => import('@/pages/Calendar'));
const CourseDetail = lazy(() => import('@/pages/CourseDetail'));
const EnrollConfirm = lazy(() => import('@/pages/EnrollConfirm'));
const LessonOrganizationPage = lazy(() => import('@/pages/LessonOrganization'));
const OfflineContentPage = lazy(() => import('@/pages/OfflineContent'));
const Pricing = lazy(() => import('@/pages/Pricing'));
const Billing = lazy(() => import('@/pages/Billing'));
const BillingComingSoon = lazy(() => import('@/pages/BillingComingSoon'));
const Profile = lazy(() => import('@/pages/Profile'));
const AdminLayout = lazy(() => import('@/pages/admin/AdminLayout'));
const UsersAdmin = lazy(() => import('@/pages/admin/UsersAdmin'));
const Operations = lazy(() => import('@/pages/admin/Operations'));
const AuditLogs = lazy(() => import('@/pages/admin/AuditLogs'));
const PrivacyTools = lazy(() => import('@/pages/account/PrivacyTools'));

// PR3: Module enrollment pages
const ModuleCatalogPage = lazy(() => import('@/pages/ModuleCatalogPage'));
const EnrollmentPage = lazy(() => import('@/pages/EnrollmentPage'));
const PaymentReturnTestPage = lazy(() => import('@/pages/PaymentReturnTestPage'));
const PlacementTestPage = lazy(() => import('@/pages/PlacementTestPage'));
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
                <SessionMonitor />
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
                    
                    {/* PR3: Module enrollment routes */}
                    <Route path="modules" element={<ModuleCatalogPage />} />
                    <Route path="enroll/module/:moduleId" element={<AppGate><EnrollmentPage /></AppGate>} />
                    <Route path="payment/test-checkout" element={<AppGate><PaymentReturnTestPage /></AppGate>} />
                    <Route path="payment/return" element={<AppGate><PaymentReturnTestPage /></AppGate>} />
                    <Route path="placement-test" element={<AppGate><PlacementTestPage /></AppGate>} />
                    
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
