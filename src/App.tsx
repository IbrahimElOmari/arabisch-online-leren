import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryProvider } from "@/providers/QueryProvider";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProviderQuery } from "@/components/auth/AuthProviderQuery";
import Dashboard from "./pages/Dashboard";
import Forum from "./pages/Forum";
import Taken from "./pages/Taken";
import Leerstof from "./pages/Leerstof";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import React from "react";

function App() {
  return (
    <QueryProvider>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <AuthProviderQuery>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/forum" element={<Forum />} />
              <Route path="/taken" element={<Taken />} />
              <Route path="/leerstof" element={<Leerstof />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </AuthProviderQuery>
        </BrowserRouter>
      </TooltipProvider>
    </QueryProvider>
  );
}

export default App;
