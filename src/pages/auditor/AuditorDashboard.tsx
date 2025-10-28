import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuditorAuth } from '@/contexts/AuditorAuthContext';
import { AuditorService } from '@/services/auditorService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  UserCog,
  LogOut,
  ChartBar,
  ArrowRight,
  TrendingUp,
  MessageSquare,
  Calendar,
  Building2,
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner';
import AnimatedSection from '@/components/AnimatedSection';

interface DashboardData {
  total_recursos: number;
  aguardando_analise: number;
  pareceres_emitidos: number;
  media_tempo_analise: number;
  recursos_recentes: any[];
}

const AuditorDashboard = () => {
  const navigate = useNavigate();
  const { auditor, logout } = useAuditorAuth();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await AuditorService.getDashboard();
      setDashboard(data);
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao carregar dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 md:px-6">
      {/* Header */}
      <AnimatedSection>
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/10 p-8">
          <div className="absolute inset-0 bg-grid-white/10" />
          <div className="relative">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Painel do Auditor
              </h1>
              <p className="text-muted-foreground text-sm md:text-base max-w-2xl">
                Bem-vindo, <span className="font-semibold text-foreground">{auditor?.nome}</span>
                {auditor?.registro_profissional && (
                  <span className="ml-2">- {auditor.registro_profissional}</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatedSection delay={100}>
          <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Total de Recursos
                    </p>
                    <p className="text-3xl font-bold text-primary">
                      {dashboard?.total_recursos || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </AnimatedSection>

          <AnimatedSection delay={150}>
            <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-amber-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Aguardando Análise
                    </p>
                    <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                      {dashboard?.aguardando_analise || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-amber-500/10 rounded-xl">
                    <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </AnimatedSection>

          <AnimatedSection delay={200}>
            <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Pareceres Emitidos
                    </p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {dashboard?.pareceres_emitidos || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-green-500/10 rounded-xl">
                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </AnimatedSection>

          <AnimatedSection delay={250}>
            <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Tempo Médio
                    </p>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {dashboard?.media_tempo_analise || 0}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">minutos</p>
                  </div>
                  <div className="p-3 bg-blue-500/10 rounded-xl">
                    <ChartBar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </AnimatedSection>
        </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatedSection delay={300}>
            <Card className="hover:shadow-xl transition-all duration-300 border-2 border-amber-500/20 hover:border-amber-500/40 cursor-pointer group">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-500/10 rounded-xl group-hover:bg-amber-500/20 transition-colors">
                    <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Recursos Pendentes</CardTitle>
                    <CardDescription>
                      {dashboard?.aguardando_analise || 0} recursos aguardando sua análise
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white"
                  onClick={() => navigate('/auditor/recursos?status=em_analise_auditor')}
                >
                  Ver Pendentes
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </AnimatedSection>

          <AnimatedSection delay={350}>
            <Card className="hover:shadow-xl transition-all duration-300 border-2 border-border hover:border-primary/20 cursor-pointer group">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Todos os Recursos</CardTitle>
                    <CardDescription>
                      Ver histórico completo de recursos analisados
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/auditor/recursos')}
                >
                  Ver Todos
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </AnimatedSection>
        </div>

      {/* Recent Resources */}
      {dashboard?.recursos_recentes && dashboard.recursos_recentes.length > 0 && (
        <AnimatedSection delay={400}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Recursos Recentes
                </CardTitle>
                <CardDescription>
                  Últimos recursos atribuídos para análise
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboard.recursos_recentes.map((recurso: any, index: number) => (
                    <div
                      key={recurso.id}
                      className="flex items-center justify-between p-4 border rounded-xl hover:bg-accent/50 cursor-pointer transition-all duration-300 group"
                      onClick={() => navigate(`/auditor/recursos/${recurso.id}`)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <FileText className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground">
                              Guia {recurso.numero_guia_prestador}
                            </span>
                            <Badge 
                              variant={
                                recurso.status_recurso === 'em_analise_auditor' ? 'default' :
                                recurso.status_recurso === 'parecer_emitido' ? 'secondary' :
                                'outline'
                              }
                            >
                              {recurso.status_recurso === 'em_analise_auditor' ? 'Em Análise' :
                               recurso.status_recurso === 'parecer_emitido' ? 'Parecer Emitido' :
                               recurso.status_recurso}
                            </Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-3 w-3" />
                            <span>{recurso.clinica_nome}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-3 w-3" />
                            <span>{recurso.operadora_nome}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-3 w-3" />
                            <span className="font-semibold text-foreground">
                              R$ {parseFloat(recurso.valor_guia).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors ml-4" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
        </AnimatedSection>
      )}
    </div>
  );
};

export default AuditorDashboard;
