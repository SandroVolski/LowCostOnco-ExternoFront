import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AdminProvider } from "./contexts/AdminContext";
import { OperadoraAuthProvider } from "./contexts/OperadoraAuthContext";
import { PageTransitionProvider } from "./components/transitions/PageTransitionContext";
import { PageTransitionWrapper } from "./components/transitions/PageTransitionWrapper";
import Layout from "./components/layout/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import PatientDashboard from "./pages/PatientDashboard";
import OperatorPatients from "./pages/OperatorPatients";
import OperatorClinics from "./pages/OperatorClinics";
import OperatorSolicitations from "./pages/OperatorSolicitations";
import OperatorAjustes from "./pages/OperatorAjustes";
import Patients from "./pages/Patients";
import Reports from "./pages/Reports";
import Analysis from "./pages/Analysis";
import Analyses from "./pages/Analyses";
import Expenses from "./pages/Expenses";
import Chat from "./pages/Chat";
import ClinicProfile from "./pages/ClinicProfile";
import NotFound from "./pages/NotFound";
import RecursosGlosas from "./pages/RecursosGlosas";
import Protocols from "./pages/Protocols";
import AjustesNegociacao from "./pages/AjustesNegociacao";
import AjustesCorpoClinico from "./pages/AjustesCorpoClinico";
import HistoricoSolicitacoes from "./pages/HistoricoSolicitacoes";
import CorpoClinico from "./pages/CorpoClinico";
import CadastroDocumentos from "./pages/CadastroDocumentos";
import ClinicRegisterAdmin from "./pages/ClinicRegisterAdmin";
import AdminLogin from "./pages/AdminLogin";
import AdminControleSistema from "./pages/AdminControleSistema";
import { useAdmin } from "./contexts/AdminContext";

const queryClient = new QueryClient();

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isSpecialAdmin } = useAdmin();
  if (!isSpecialAdmin) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AdminProvider>
            <OperadoraAuthProvider>
              <PageTransitionProvider>
                <PageTransitionWrapper>
                <Routes>
                  <Route path="/" element={<Login />} />
                  
                  {/* Rota genérica que redireciona baseado no role */}
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

                  {/* Rotas específicas para cada tipo de usuário */}
                  <Route 
                    path="/dashboard-clinica" 
                    element={
                      <ProtectedRoute allowedRoles={['clinic']}>
                        <Layout pageTitle="Dashboard da Clínica">
                          <Dashboard />
                        </Layout>
                      </ProtectedRoute>
                    } 
                  />

                  <Route 
                    path="/dashboard-operadora" 
                    element={
                      <ProtectedRoute allowedRoles={['operator']}>
                        <Layout pageTitle="Dashboard da Operadora">
                          <Dashboard />
                        </Layout>
                      </ProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path="/patient-dashboard" 
                    element={
                      <ProtectedRoute allowedRoles={['clinic']}>
                        <Layout pageTitle="Dashboard de Pacientes">
                          <PatientDashboard />
                        </Layout>
                      </ProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path="/analyses" 
                    element={
                      <ProtectedRoute allowedRoles={['clinic']}>
                        <Layout pageTitle="Análises Anatômicas">
                          <Analyses />
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
                    path="/protocols" 
                    element={
                      <ProtectedRoute allowedRoles={['clinic']}>
                        <Layout pageTitle="Protocolos">
                          <Protocols />
                        </Layout>
                      </ProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path="/reports" 
                    element={
                      <ProtectedRoute allowedRoles={['clinic', 'operator']}>
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
                    path="/ajustes-negociacao" 
                    element={
                      <ProtectedRoute allowedRoles={['clinic']}>
                        <Layout pageTitle="Ajustes de Negociação">
                          <AjustesNegociacao />
                        </Layout>
                      </ProtectedRoute>
                    } 
                  />

                  <Route 
                    path="/ajustes-corpo-clinico" 
                    element={
                      <ProtectedRoute allowedRoles={['clinic']}>
                        <Layout pageTitle="Ajustes do Corpo Clínico">
                          <AjustesCorpoClinico />
                        </Layout>
                      </ProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path="/historico-solicitacoes" 
                    element={
                      <ProtectedRoute allowedRoles={['clinic']}>
                        <Layout pageTitle="Histórico de Solicitações">
                          <HistoricoSolicitacoes />
                        </Layout>
                      </ProtectedRoute>
                    } 
                  />
                  
                  <Route path="/admin" element={<Layout pageTitle="Admin Onkhos"><AdminLogin /></Layout>} />
                  
                  
                  {/* Rotas Administrativas Especiais */}
                  <Route 
                    path="/admin/controle-sistema" 
                    element={
                      <AdminRoute>
                        <AdminControleSistema />
                      </AdminRoute>
                    } 
                  />
                  
                  <Route 
                    path="/admin/clinicas/register" 
                    element={
                      <AdminRoute>
                        <Layout pageTitle="Cadastro Administrativo de Clínicas">
                          <ClinicRegisterAdmin />
                        </Layout>
                      </AdminRoute>
                    } 
                  />
                            
                  <Route 
                    path="/corpo-clinico" 
                    element={
                      <ProtectedRoute allowedRoles={['clinic']}>
                        <Layout pageTitle="Profissionais">
                          <CorpoClinico />
                        </Layout>
                      </ProtectedRoute>
                    } 
                  />

                  <Route 
                    path="/cadastro-documentos" 
                    element={
                      <ProtectedRoute allowedRoles={['clinic']}>
                        <Layout pageTitle="Cadastro de Documentos">
                          <CadastroDocumentos />
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
                      <ProtectedRoute allowedRoles={['clinic', 'operator']}>
                        <Layout pageTitle="Chat">
                          <Chat />
                        </Layout>
                      </ProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path="/operator-patients" 
                    element={
                      <ProtectedRoute allowedRoles={['operator']}>
                        <Layout pageTitle="Pacientes da Operadora">
                          <OperatorPatients />
                        </Layout>
                      </ProtectedRoute>
                    } 
                  />

                  {/* Rota removida: Clínicas da Operadora agora é parte do Dashboard principal */}

                  <Route 
                    path="/operator-solicitacoes" 
                    element={
                      <ProtectedRoute allowedRoles={['operator']}>
                        <Layout pageTitle="Solicitações da Operadora">
                          <OperatorSolicitations />
                        </Layout>
                      </ProtectedRoute>
                    } 
                  />

                  <Route 
                    path="/operator-ajustes" 
                    element={
                      <ProtectedRoute allowedRoles={['operator']}>
                        <Layout pageTitle="Ajustes da Operadora">
                          <OperatorAjustes />
                        </Layout>
                      </ProtectedRoute>
                    } 
                  />
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
                </PageTransitionWrapper>
              </PageTransitionProvider>
            </OperadoraAuthProvider>
          </AdminProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;