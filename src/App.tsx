
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/ui/AppSidebar";
import { AuthProviderRefactored } from "@/components/auth/AuthProviderRefactored";
import { SecurityProvider } from "@/components/security/SecurityProvider";
import { SecurityMonitor } from "@/components/security/SecurityMonitor";
import { SecurityErrorBoundary } from "@/components/error/SecurityErrorBoundary";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AppGate } from "@/components/auth/AppGate";
import Navigation from "./components/Navigation";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Calendar from "./pages/Calendar";
import Forum from "./pages/Forum";
import ForumModeration from "./pages/ForumModeration";
import Security from "./pages/Security";
import Visie from "./pages/Visie";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import ResetPassword from "./pages/ResetPassword";
import EnrollConfirm from "./pages/EnrollConfirm";
import CourseDetail from "./pages/CourseDetail";
import NotFound from "./pages/NotFound";
import "./App.css";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 5000),
      staleTime: 2 * 60 * 1000, // 2 minutes
      gcTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <TooltipProvider>
        <BrowserRouter>
          <SecurityErrorBoundary>
            <AuthProviderRefactored>
              <SecurityMonitor>
                <AppGate>
                  <SidebarProvider>
                    <div className="min-h-screen flex w-full">
                      <AppSidebar />
                      <div className="flex-1 flex flex-col">
                        <Navigation />
                        <main className="flex-1">
                          <Routes>
                            <Route path="/" element={<Index />} />
                            <Route path="/auth" element={<Auth />} />
                            <Route
                              path="/dashboard"
                              element={
                                <ProtectedRoute>
                                  <Dashboard />
                                </ProtectedRoute>
                              }
                            />
                            <Route
                              path="/calendar"
                              element={
                                <ProtectedRoute>
                                  <Calendar />
                                </ProtectedRoute>
                              }
                            />
                            <Route
                              path="/forum"
                              element={
                                <ProtectedRoute>
                                  <Forum />
                                </ProtectedRoute>
                              }
                            />
                            <Route
                              path="/forum-moderation"
                              element={
                                <ProtectedRoute>
                                  <ForumModeration />
                                </ProtectedRoute>
                              }
                            />
                            <Route
                              path="/security"
                              element={
                                <ProtectedRoute>
                                  <Security />
                                </ProtectedRoute>
                              }
                            />
                            <Route path="/visie" element={<Visie />} />
                            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                            <Route path="/terms-of-service" element={<TermsOfService />} />
                            <Route path="/reset-password" element={<ResetPassword />} />
                            <Route path="/enroll-confirm" element={<EnrollConfirm />} />
                            <Route
                              path="/course/:id"
                              element={
                                <ProtectedRoute>
                                  <CourseDetail />
                                </ProtectedRoute>
                              }
                            />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </main>
                      </div>
                    </div>
                  </SidebarProvider>
                </AppGate>
              </SecurityMonitor>
            </AuthProviderRefactored>
          </SecurityErrorBoundary>
        </BrowserRouter>
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
