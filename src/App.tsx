import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { PageTransitionProvider } from "./components/transitions/PageTransitionContext";
import { PageTransitionWrapper } from "./components/transitions/PageTransitionWrapper";
import Layout from "./components/layout/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import Reports from "./pages/Reports";
import Analysis from "./pages/Analysis";
import Expenses from "./pages/Expenses";
import Chat from "./pages/Chat";
import ClinicProfile from "./pages/ClinicProfile";
import NotFound from "./pages/NotFound";
import RecursosGlosas from "./pages/RecursosGlosas";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <PageTransitionProvider>
            <PageTransitionWrapper>
              <Routes>
                <Route path="/" element={<Login />} />
                
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Layout pageTitle="Dashboard">
                        <Dashboard />
                      </Layout>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/patients" 
                  element={
                    <ProtectedRoute allowedRoles={['clinic']}>
                      <Layout pageTitle="Pacientes">
                        <Patients />
                      </Layout>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/reports" 
                  element={
                    <ProtectedRoute allowedRoles={['clinic']}>
                      <Layout pageTitle="Solicitação de Autorização">
                        <Reports />
                      </Layout>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute allowedRoles={['clinic']}>
                      <Layout pageTitle="Perfil da Clínica">
                        <ClinicProfile />
                      </Layout>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/recursos-glosas" 
                  element={
                    <ProtectedRoute allowedRoles={['clinic']}>
                      <Layout pageTitle="Recursos de Glosas">
                        <RecursosGlosas />
                      </Layout>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/analysis" 
                  element={
                    <ProtectedRoute allowedRoles={['operator']}>
                      <Layout pageTitle="Análise">
                        <Analysis />
                      </Layout>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/expenses" 
                  element={
                    <ProtectedRoute allowedRoles={['healthPlan']}>
                      <Layout pageTitle="Gastos">
                        <Expenses />
                      </Layout>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/chat" 
                  element={
                    <ProtectedRoute>
                      <Layout pageTitle="Chat">
                        <Chat />
                      </Layout>
                    </ProtectedRoute>
                  } 
                />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </PageTransitionWrapper>
          </PageTransitionProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;