import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/auth/AuthProvider";
import Navigation from "@/components/Navigation";
import AnalyticsTracker from "@/components/analytics/AnalyticsTracker";
import ErrorBoundary from "@/components/ui/error-boundary";
import ThemeToggle from "@/components/ui/theme-toggle";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Security from "./pages/Security";
import Visie from "./pages/Visie";
import Calendar from "./pages/Calendar";
import Forum from "./pages/Forum";
import ForumModeration from "./pages/ForumModeration";
import Analytics from "./pages/Analytics";
import NotFound from "./pages/NotFound";
import EnrollConfirmPage from "./pages/EnrollConfirm";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <ThemeToggle />
              <AnalyticsTracker />
              <Navigation />
              <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/visie" element={<Visie />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/forum" element={<Forum />} />
              <Route path="/forum-moderation" element={<ForumModeration />} />
              <Route path="/security" element={<Security />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/enroll-confirm/:classId" element={<EnrollConfirmPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
