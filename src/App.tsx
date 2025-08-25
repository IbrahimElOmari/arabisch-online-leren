
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryProvider } from "@/providers/QueryProvider";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProviderQuery } from "@/components/auth/AuthProviderQuery";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Forum from "./pages/Forum";
import Taken from "./pages/Taken";
import Leerstof from "./pages/Leerstof";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import Visie from "./pages/Visie";
import Security from "./pages/Security";
import ForumModeration from "./pages/ForumModeration";
import React from "react";

function App() {
  return (
    <QueryProvider>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <AuthProviderQuery>
            <Routes>
              <Route path="/" element={<AppLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="forum" element={<Forum />} />
                <Route path="taken" element={<Taken />} />
                <Route path="leerstof" element={<Leerstof />} />
                <Route path="auth" element={<Auth />} />
                <Route path="admin" element={<Admin />} />
                <Route path="visie" element={<Visie />} />
                <Route path="security" element={<Security />} />
                <Route path="forum-moderation" element={<ForumModeration />} />
              </Route>
            </Routes>
          </AuthProviderQuery>
        </BrowserRouter>
      </TooltipProvider>
    </QueryProvider>
  );
}

export default App;
