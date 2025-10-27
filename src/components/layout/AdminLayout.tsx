import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { ShieldCheck, BarChart3, Building2, Shield } from 'lucide-react';

interface AdminLayoutProps {
  pageTitle?: string;
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ pageTitle, children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path: string) => location.pathname.startsWith(path);
  return (
    <div className="min-h-screen bg-background">
      {/* Faixa administrativa (igual ao painel) */}
      <div className="bg-gradient-to-r from-primary via-primary/90 to-primary/80 text-primary-foreground py-2 px-4 text-center font-medium text-sm shadow-sm">
        <div className="flex items-center justify-center gap-2">
          <ShieldCheck className="h-4 w-4" />
          <span>ACESSO ADMINISTRATIVO - ÁREA RESTRITA</span>
          <ShieldCheck className="h-4 w-4" />
        </div>
      </div>

      {/* Header com navegação simples para admin */}
      <header className={cn(
        "h-16 flex items-center justify-between px-6 bg-card border-b border-border"
      )}>
        <div className="flex items-center gap-3">
          <Logo variant="default" size="sm" withText={true} />
          {pageTitle && (
            <span className="text-sm text-muted-foreground">/ {pageTitle}</span>
          )}
        </div>
        <nav className="hidden md:flex items-center space-x-1">
          <Button 
            variant={isActive('/admin/controle-sistema') ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => navigate('/admin/controle-sistema')}
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Painel
          </Button>
          <Button 
            variant={isActive('/admin/clinicas') ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => navigate('/admin/clinicas')}
            className="flex items-center gap-2"
          >
            <Building2 className="h-4 w-4" />
            Clínicas
          </Button>
          <Button 
            variant={isActive('/admin/operadoras') ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => navigate('/admin/operadoras')}
            className="flex items-center gap-2"
          >
            <Shield className="h-4 w-4" />
            Operadoras
          </Button>
        </nav>
      </header>

      {/* Conteúdo */}
      <main className="container mx-auto px-6 py-6">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;


