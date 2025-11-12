import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Brain, Heart, FileText, BarChart3, Loader2, AlertCircle } from 'lucide-react';
import { InteractiveAnatomy } from '@/components/anatomy/InteractiveAnatomy';
import AnimatedSection from '@/components/AnimatedSection';
import { MouseTilt } from '@/components/MouseTilt';
import { AnalysisService, AnalysisMetrics } from '@/services/analysisService';
import { useState, useEffect } from 'react';

const Analyses = () => {
  const [metrics, setMetrics] = useState<AnalysisMetrics | null>(null);
  const [organData, setOrganData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar dados de análise
  useEffect(() => {
    const loadAnalysisData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Carregar métricas e dados de órgãos em paralelo
        const [analysisMetrics, organAnalysisData] = await Promise.all([
          AnalysisService.getAnalysisMetrics(),
          AnalysisService.getOrganAnalysisData()
        ]);

        setMetrics(analysisMetrics);
        setOrganData(organAnalysisData);
      } catch (err) {
        console.error('❌ Erro ao carregar dados de análise:', err);
        setError('Erro ao carregar dados de análise');
      } finally {
        setLoading(false);
      }
    };

    loadAnalysisData();
  }, []);

  // Mostrar loading
  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando dados de análise...</p>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar erro
  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-800 mb-2">Erro ao carregar dados</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Análises Anatômicas
            </h1>
            <p className="text-muted-foreground mt-1">
              Visualize dados de pacientes por sistema corporal de forma interativa
            </p>
          </div>
        </div>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Sistema Nervoso */}
        <AnimatedSection delay={100}>
          <MouseTilt maxTilt={5} scale={1.02}>
            <Card className="lco-card hover-lift group relative overflow-hidden h-32">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-4 relative z-10 h-full flex flex-col justify-center">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Brain className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground leading-tight">Sistema Nervoso</p>
                    <p className="text-xl font-bold text-primary">
                      {organData.find(organ => organ.organId === 'brain')?.patients || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">pacientes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </MouseTilt>
        </AnimatedSection>

        {/* Sistema Respiratório */}
        <AnimatedSection delay={200}>
          <MouseTilt maxTilt={5} scale={1.02}>
            <Card className="lco-card hover-lift group relative overflow-hidden h-32">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-4 relative z-10 h-full flex flex-col justify-center">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground leading-tight">Sistema Respiratório</p>
                    <p className="text-xl font-bold text-blue-500">
                      {organData.find(organ => organ.organId === 'lungs')?.patients || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">pacientes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </MouseTilt>
        </AnimatedSection>

        {/* Sistema Cardiovascular */}
        <AnimatedSection delay={300}>
          <MouseTilt maxTilt={5} scale={1.02}>
            <Card className="lco-card hover-lift group relative overflow-hidden h-32">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-4 relative z-10 h-full flex flex-col justify-center">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                    <Heart className="h-6 w-6 text-red-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground leading-tight">Sistema Cardiovascular</p>
                    <p className="text-xl font-bold text-red-500">
                      {organData.find(organ => organ.organId === 'heart')?.patients || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">pacientes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </MouseTilt>
        </AnimatedSection>

        {/* Sistema Digestivo */}
        <AnimatedSection delay={400}>
          <MouseTilt maxTilt={5} scale={1.02}>
            <Card className="lco-card hover-lift group relative overflow-hidden h-32">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-4 relative z-10 h-full flex flex-col justify-center">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <Activity className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground leading-tight">Sistema Digestivo</p>
                    <p className="text-xl font-bold text-orange-500">
                      {(organData.find(organ => organ.organId === 'liver')?.patients || 0) + 
                       (organData.find(organ => organ.organId === 'stomach')?.patients || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">pacientes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </MouseTilt>
        </AnimatedSection>

        {/* Sistema Urinário */}
        <AnimatedSection delay={500}>
          <MouseTilt maxTilt={5} scale={1.02}>
            <Card className="lco-card hover-lift group relative overflow-hidden h-32">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-4 relative z-10 h-full flex flex-col justify-center">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center">
                    <Activity className="h-6 w-6 text-cyan-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground leading-tight">Sistema Urinário</p>
                    <p className="text-xl font-bold text-cyan-500">
                      {(organData.find(organ => organ.organId === 'kidneys')?.patients || 0) + 
                       (organData.find(organ => organ.organId === 'bladder')?.patients || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">pacientes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </MouseTilt>
        </AnimatedSection>

        {/* Sistema Reprodutor */}
        <AnimatedSection delay={600}>
          <MouseTilt maxTilt={5} scale={1.02}>
            <Card className="lco-card hover-lift group relative overflow-hidden h-32">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-4 relative z-10 h-full flex flex-col justify-center">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-pink-500/10 flex items-center justify-center">
                    <Heart className="h-6 w-6 text-pink-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground leading-tight">Sistema Reprodutor</p>
                    <p className="text-xl font-bold text-pink-500">
                      {(organData.find(organ => organ.organId === 'prostate')?.patients || 0) + 
                       (organData.find(organ => organ.organId === 'breast')?.patients || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">pacientes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </MouseTilt>
        </AnimatedSection>
      </div>

      {/* Componente Anatômico Principal */}
      <AnimatedSection delay={700}>
        <Card className="lco-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Análise Anatômica Interativa
            </CardTitle>
            <CardDescription>
              Passe o mouse sobre os órgãos para visualizar informações detalhadas sobre pacientes, CIDs e protocolos de tratamento.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <InteractiveAnatomy />
          </CardContent>
        </Card>
      </AnimatedSection>

      {/* Informações Adicionais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatedSection delay={800}>
          <Card className="lco-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Como Usar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">1</span>
                  </div>
                  <div>
                    <p className="font-medium">Passe o mouse sobre os órgãos</p>
                    <p className="text-sm text-muted-foreground">Os órgãos ficam destacados quando você passa o mouse sobre eles</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">2</span>
                  </div>
                  <div>
                    <p className="font-medium">Visualize as informações</p>
                    <p className="text-sm text-muted-foreground">Veja dados de pacientes, CIDs e protocolos no tooltip</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">3</span>
                  </div>
                  <div>
                    <p className="font-medium">Explore diferentes sistemas</p>
                    <p className="text-sm text-muted-foreground">Navegue entre os diferentes sistemas corporais disponíveis</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </AnimatedSection>

        <AnimatedSection delay={900}>
          <Card className="lco-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Estatísticas Gerais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total de Pacientes</span>
                  <span className="text-lg font-bold text-primary">
                    {metrics ? metrics.totalPacientes.toLocaleString() : 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Sistemas Monitorados</span>
                  <span className="text-lg font-bold text-primary">
                    {metrics ? metrics.sistemasMonitorados : 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Protocolos Ativos</span>
                  <span className="text-lg font-bold text-primary">
                    {metrics ? metrics.protocolosAtivos : 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">CIDs Cadastrados</span>
                  <span className="text-lg font-bold text-primary">
                    {metrics ? metrics.cidsCadastrados : 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </AnimatedSection>
      </div>
    </div>
  );
};

export default Analyses;
