import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Building2, 
  Shield, 
  FileText, 
  BarChart3, 
  Users, 
  Pill, 
  Activity,
  LogOut,
  Plus,
  Search,
  Settings,
  Database,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Check,
  User,
  ShieldCheck,
  ActivitySquare
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import AnimatedSection from '@/components/AnimatedSection';
import Logo from '@/components/Logo';

// Componentes das seções
import CadastroClinicas from '@/pages/admin/CadastroClinicas';
import CadastroOperadoras from '@/pages/admin/CadastroOperadoras';
import LogsSistema from '@/pages/admin/LogsSistema';
import DashboardAdmin from '@/pages/admin/DashboardAdmin';
import GerenciarUsuariosOperadora from '@/pages/admin/GerenciarUsuariosOperadora';

const AdminControleSistema = () => {
  const { isSpecialAdmin, adminUser, logoutAdmin } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [scrolled, setScrolled] = useState(false);

  // Sincronizar a aba com a URL atual
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/admin/clinicas')) {
      setActiveTab('clinicas');
    } else if (path.startsWith('/admin/operadoras')) {
      setActiveTab('operadoras');
    } else {
      setActiveTab('dashboard');
    }
  }, [location.pathname]);

  // Adicionar classe ao body para garantir scroll
  useEffect(() => {
    document.body.classList.add('admin-page');
    
    return () => {
      document.body.classList.remove('admin-page');
    };
  }, []);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  const handleLogout = () => {
    logoutAdmin();
    navigate('/');
    toast.success('Logout administrativo realizado com sucesso!');
  };

  // Confia no guard externo (AdminRoute); renderizar a UI diretamente

  return (
    <div className="min-h-screen bg-background">
      {/* Faixa Administrativa - Estilo de Promoção */}
      <div className="bg-gradient-to-r from-primary via-primary/90 to-primary/80 text-primary-foreground py-2 px-4 text-center font-medium text-sm shadow-sm animate-fade-in">
        <div className="flex items-center justify-center gap-2">
          <ShieldCheck className="h-4 w-4 animate-pulse" />
          <span>ACESSO ADMINISTRATIVO - ÁREA RESTRITA</span>
          <ShieldCheck className="h-4 w-4 animate-pulse" />
        </div>
      </div>

      {/* Header Principal - Estilo das Páginas de Clínicas */}
      <header className={cn(
        "h-16 flex items-center justify-between px-6 z-50 transition-all duration-300",
        scrolled 
          ? "modern-header" 
          : "bg-card border-b border-border animate-slide-down"
      )}>
        <div className="flex items-center gap-4">
          {/* Logo da Empresa */}
          <Logo variant="default" size="sm" withText={true} />
        </div>
        
        {/* Desktop Navigation - Centralizado */}
        <nav className="hidden md:flex items-center space-x-1 absolute left-1/2 transform -translate-x-1/2">
          <button
            onClick={() => navigate('/admin/controle-sistema')}
            className={cn(
              "nav-link hover-lift flex items-center gap-1",
              activeTab === 'dashboard' && "active",
              "animate-fade-in"
            )}
          >
            <BarChart3 className="h-5 w-5" />
            <span>Dashboard</span>
          </button>
          
          <button
            onClick={() => navigate('/admin/clinicas')}
            className={cn(
              "nav-link hover-lift flex items-center gap-1",
              activeTab === 'clinicas' && "active",
              "animate-fade-in"
            )}
          >
            <Building2 className="h-5 w-5" />
            <span>Clínicas</span>
          </button>
          
          <button
            onClick={() => navigate('/admin/operadoras')}
            className={cn(
              "nav-link hover-lift flex items-center gap-1",
              activeTab === 'operadoras' && "active",
              "animate-fade-in"
            )}
          >
            <Shield className="h-5 w-5" />
            <span>Operadoras</span>
          </button>
          
          <button
            onClick={() => setActiveTab('usuarios-operadora')}
            className={cn(
              "nav-link hover-lift flex items-center gap-1",
              activeTab === 'usuarios-operadora' && "active",
              "animate-fade-in"
            )}
          >
            <Users className="h-5 w-5" />
            <span>Usuários Operadora</span>
          </button>
          
          <button
            onClick={() => setActiveTab('logs')}
            className={cn(
              "nav-link hover-lift flex items-center gap-1",
              activeTab === 'logs' && "active",
              "animate-fade-in"
            )}
          >
            <FileText className="h-5 w-5" />
            <span>Logs</span>
          </button>
        </nav>
        
        <div className="flex items-center space-x-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 p-0 relative hover-lift">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                    {adminUser?.username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 animate-scale-in">
              <div className="px-2 py-1.5 text-sm font-medium">{adminUser?.username}</div>
              <div className="px-2 pb-1.5 text-xs text-muted-foreground">Administrador Especial</div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer hover:text-destructive flex items-center gap-2" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <div className="w-full px-6 py-6 pb-20">
        <AnimatedSection>
          <Tabs 
            value={activeTab} 
            onValueChange={(val) => {
              setActiveTab(val);
              if (val === 'dashboard') navigate('/admin/controle-sistema');
              if (val === 'clinicas') navigate('/admin/clinicas');
              if (val === 'operadoras') navigate('/admin/operadoras');
              if (val === 'usuarios-operadora') setActiveTab('usuarios-operadora');
              if (val === 'logs') setActiveTab('logs');
            }} 
            className="space-y-6"
          >
            <TabsContent value="dashboard" className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
              <DashboardAdmin />
            </TabsContent>

            <TabsContent value="clinicas" className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
              <CadastroClinicas />
            </TabsContent>

            <TabsContent value="operadoras" className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
              <CadastroOperadoras />
            </TabsContent>

            <TabsContent value="usuarios-operadora" className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
              <GerenciarUsuariosOperadora />
            </TabsContent>

            <TabsContent value="logs" className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
              <LogsSistema />
            </TabsContent>
          </Tabs>
        </AnimatedSection>
      </div>
    </div>
  );
};

export default AdminControleSistema;
