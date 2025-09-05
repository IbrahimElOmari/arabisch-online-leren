
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { EnhancedRTLProvider } from '@/components/rtl/RTLProvider';
import { TranslationProvider } from '@/contexts/TranslationContext';
import { AuthProviderQuery } from '@/components/auth/AuthProviderQuery';
import { AppGate } from '@/components/auth/AppGate';
import { AppLayout } from '@/components/layout/AppLayout';
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
import NotFound from '@/pages/NotFound';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import TermsOfService from '@/pages/TermsOfService';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <EnhancedRTLProvider>
          <TranslationProvider>
            <AuthProviderQuery>
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
                    <Route path="admin" element={<AppGate><Admin /></AppGate>} />
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
                    <Route path="courses/:id" element={<AppGate><CourseDetail /></AppGate>} />
                    <Route path="enroll/:classId" element={<AppGate><EnrollConfirm /></AppGate>} />
                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Routes>
              </div>
              <Toaster />
            </Router>
            </AuthProviderQuery>
          </TranslationProvider>
        </EnhancedRTLProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
