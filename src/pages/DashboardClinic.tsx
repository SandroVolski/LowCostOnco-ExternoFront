import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VialIcon, PillIcon, SyringeIcon } from '@/components/MedicalIcons';
import { CalendarIcon, UsersIcon, ChartPieIcon, AlertCircle, FileText, Clock, CheckCircle, XCircle, Loader2, BarChart3, ArrowRight, Pill, Activity, Building2, Users } from 'lucide-react';
import { CardHoverEffect, Card as HoverCard, CardTitle as HoverCardTitle, CardDescription as HoverCardDescription } from '@/components/ui/card-hover-effect';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AnimatedSection from '@/components/AnimatedSection';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { MouseTilt } from '@/components/MouseTilt';
import { PacienteService, SolicitacaoService, ProtocoloService, testarConexaoBackend, PatientFromAPI, SolicitacaoFromAPI, ProtocoloFromAPI } from '@/services/api';
import { ClinicService } from '@/services/clinicService';
import { toast } from 'sonner';

// Interfaces para dados processados
interface DashboardMetrics {
  totalSolicitacoes: number;
  solicitacoesEmProcessamento: number;
  solicitacoesAutorizadas: number;
  solicitacoesNegadas: number;
  solicitacoesEmAnalise: number;
  prazoMedioAutorizacao: number;
  solicitacoesHoje: number;
  solicitacoesSemana: number;
  solicitacoesMes: number;
}

interface PatientStatusData {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

interface SolicitacaoStatusData {
  status: string;
  count: number;
  percentage: number;
  color: string;
}

interface TreatmentDistributionData {
  treatment: string;
  count: number;
  percentage: number;
  color: string;
}

interface UpcomingTreatmentData {
  id: string;
  patient: string;
  treatment: string;
  date: string;
  status: string;
}

interface SolicitacoesPorMesData {
  mes: string;
  total: number;
  autorizadas: number;
  negadas: number;
  emAnalise: number;
}

interface ActivePrincipleData {
  name: string;
  count: number;
  color: string;
}

const TREATMENT_COLORS = [
  { color: '#65a3ee', shadow: '0 0 10px rgba(101, 163, 238, 0.5)' },
  { color: '#e4a94f', shadow: '0 0 10px rgba(228, 169, 79, 0.5)' },
  { color: '#f26b6b', shadow: '0 0 10px rgba(242, 107, 107, 0.5)' },
  { color: '#1f4edd', shadow: '0 0 10px rgba(31, 78, 221, 0.5)' },
  { color: '#74b9ff', shadow: '0 0 10px rgba(116, 185, 255, 0.5)' },
  { color: '#fd79a8', shadow: '0 0 10px rgba(253, 121, 168, 0.5)' },
  { color: '#fdcb6e', shadow: '0 0 10px rgba(253, 203, 110, 0.5)' },
  { color: '#6c5ce7', shadow: '0 0 10px rgba(108, 92, 231, 0.5)' },
  { color: '#a29bfe', shadow: '0 0 10px rgba(162, 155, 254, 0.5)' },
  { color: '#f7c59f', shadow: '0 0 10px rgba(247, 197, 159, 0.5)' },
];

const Dashboard = () => {
  const { user } = useAuth();
  
  // Estados para dados do backend
  const [backendConnected, setBackendConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalSolicitacoes: 0,
    solicitacoesEmProcessamento: 0,
    solicitacoesAutorizadas: 0,
    solicitacoesNegadas: 0,
    solicitacoesEmAnalise: 0,
    prazoMedioAutorizacao: 0,
    solicitacoesHoje: 0,
    solicitacoesSemana: 0,
    solicitacoesMes: 0,
  });
  
  const [patientStatusData, setPatientStatusData] = useState<PatientStatusData[]>([]);
  const [solicitacaoStatusData, setSolicitacaoStatusData] = useState<SolicitacaoStatusData[]>([]);
  const [treatmentDistribution, setTreatmentDistribution] = useState<TreatmentDistributionData[]>([]);
  const [upcomingTreatments, setUpcomingTreatments] = useState<UpcomingTreatmentData[]>([]);
  const [solicitacoesPorMes, setSolicitacoesPorMes] = useState<SolicitacoesPorMesData[]>([]);
  const [statusPorClinica, setStatusPorClinica] = useState<any[]>([]);
  const [activePrinciples, setActivePrinciples] = useState<ActivePrincipleData[]>([]);
  const [recentSolicitacoes, setRecentSolicitacoes] = useState<SolicitacaoFromAPI[]>([]);
  const [hovered, setHovered] = useState(false);

  // Verificar conexão e carregar dados
  useEffect(() => {
    checkConnectionAndLoadData();
  }, []);

  const checkConnectionAndLoadData = async () => {
    try {
      setLoading(true);
      
      // Testar conexão com backend
      const connected = await testarConexaoBackend();
      setBackendConnected(connected);
      
      if (connected) {
        await loadDashboardData();
      } else {
        toast.error('Backend não disponível', {
          description: 'Não foi possível conectar com o servidor. Verifique se o backend está rodando.'
        });
      }
    } catch (error) {
      console.error('❌ Erro ao verificar conexão:', error);
      setBackendConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      // Carregar dados dos pacientes
      const pacientes = await PacienteService.listarPacientes();

      // Carregar dados das solicitações
      const solicitacoes = await SolicitacaoService.listarSolicitacoes();

      // Carregar dados dos protocolos
      const protocolos = await ProtocoloService.listarProtocolos();

      // Processar dados dos pacientes
      const pacientesAtivos = pacientes.filter(p => p.status === 'Ativo');
      const pacientesEmTratamento = pacientes.filter(p => p.status === 'Em Tratamento');
      const pacientesEmRemissao = pacientes.filter(p => p.status === 'Em Remissão');

      // Processar dados das solicitações
      const solicitacoesHoje = solicitacoes.filter(s => {
        const hoje = new Date().toISOString().split('T')[0];
        return s.data_solicitacao?.startsWith(hoje);
      });

      const solicitacoesSemana = solicitacoes.filter(s => {
        const umaSemanaAtras = new Date();
        umaSemanaAtras.setDate(umaSemanaAtras.getDate() - 7);
        return new Date(s.data_solicitacao || '') >= umaSemanaAtras;
      });

      const solicitacoesMes = solicitacoes.filter(s => {
        const umMesAtras = new Date();
        umMesAtras.setDate(umMesAtras.getDate() - 30);
        return new Date(s.data_solicitacao || '') >= umMesAtras;
      });

      const solicitacoesAprovadas = solicitacoes.filter(s => s.status === 'aprovada');
      const solicitacoesNegadas = solicitacoes.filter(s => s.status === 'rejeitada');
      const solicitacoesEmAnalise = solicitacoes.filter(s => s.status === 'em_analise');

      // Calcular métricas
      const totalSolicitacoes = solicitacoes.length;
      const taxaAprovacao = totalSolicitacoes > 0 ? (solicitacoesAprovadas.length / totalSolicitacoes) * 100 : 0;

      // Calcular tempo médio de autorização
      const solicitacoesComResposta = solicitacoes.filter(s => s.data_resposta && s.status === 'aprovada');
      const tempoMedioResposta = solicitacoesComResposta.length > 0 
        ? solicitacoesComResposta.reduce((acc, s) => {
            const dataSolicitacao = new Date(s.data_solicitacao || '');
            const dataResposta = new Date(s.data_resposta || '');
            const diffTime = Math.abs(dataResposta.getTime() - dataSolicitacao.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return acc + diffDays;
          }, 0) / solicitacoesComResposta.length
        : 0;

      // Atualizar métricas
      setMetrics({
        totalSolicitacoes,
        solicitacoesEmProcessamento: solicitacoesEmAnalise.length,
        solicitacoesAutorizadas: solicitacoesAprovadas.length,
        solicitacoesNegadas: solicitacoesNegadas.length,
        solicitacoesEmAnalise: solicitacoesEmAnalise.length,
        prazoMedioAutorizacao: tempoMedioResposta,
        solicitacoesHoje: solicitacoesHoje.length,
        solicitacoesSemana: solicitacoesSemana.length,
        solicitacoesMes: solicitacoesMes.length,
      });

      // Processar dados para gráficos
      const statusPacientes = [
        { name: 'Ativos', count: pacientesAtivos.length, percentage: (pacientesAtivos.length / pacientes.length) * 100, color: '#10b981' },
        { name: 'Em Tratamento', count: pacientesEmTratamento.length, percentage: (pacientesEmTratamento.length / pacientes.length) * 100, color: '#f59e0b' },
        { name: 'Em Remissão', count: pacientesEmRemissao.length, percentage: (pacientesEmRemissao.length / pacientes.length) * 100, color: '#3b82f6' },
      ];

      const statusSolicitacoes = [
        { status: 'Aprovadas', count: solicitacoesAprovadas.length, percentage: (solicitacoesAprovadas.length / totalSolicitacoes) * 100, color: '#10b981' },
        { status: 'Negadas', count: solicitacoesNegadas.length, percentage: (solicitacoesNegadas.length / totalSolicitacoes) * 100, color: '#ef4444' },
        { status: 'Em Análise', count: solicitacoesEmAnalise.length, percentage: (solicitacoesEmAnalise.length / totalSolicitacoes) * 100, color: '#f59e0b' },
      ];

      // Dados de distribuição de tratamentos
      const distribuicaoTratamentos = protocolos.map((protocolo, index) => ({
        treatment: protocolo.nome,
        count: Math.floor(Math.random() * 20) + 5, // Simulado
        percentage: Math.floor(Math.random() * 30) + 10,
        color: TREATMENT_COLORS[index % TREATMENT_COLORS.length].color
      }));

      // Dados de solicitações por mês (últimos 6 meses)
      const solicitacoesPorMesData = [];
      for (let i = 5; i >= 0; i--) {
        const data = new Date();
        data.setMonth(data.getMonth() - i);
        const mes = data.toLocaleDateString('pt-BR', { month: 'short' });
        const solicitacoesDoMes = solicitacoes.filter(s => {
          const dataSolicitacao = new Date(s.data_solicitacao || '');
          return dataSolicitacao.getMonth() === data.getMonth() && dataSolicitacao.getFullYear() === data.getFullYear();
        });
        
        solicitacoesPorMesData.push({
          mes,
          total: solicitacoesDoMes.length,
          autorizadas: solicitacoesDoMes.filter(s => s.status === 'aprovada').length,
          negadas: solicitacoesDoMes.filter(s => s.status === 'rejeitada').length,
          emAnalise: solicitacoesDoMes.filter(s => s.status === 'em_analise').length,
        });
      }

      // Atualizar estados
      setPatientStatusData(statusPacientes);
      setSolicitacaoStatusData(statusSolicitacoes);
      setTreatmentDistribution(distribuicaoTratamentos);
      setSolicitacoesPorMes(solicitacoesPorMesData);

      // Dados de próximos tratamentos (simulado)
      const proximosTratamentos = pacientes.slice(0, 5).map((paciente, index) => ({
        id: `tratamento-${index}`,
        patient: paciente.nome,
        treatment: protocolos[index % protocolos.length]?.nome || 'Tratamento Padrão',
        date: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
        status: ['Agendado', 'Confirmado', 'Pendente'][index % 3]
      }));

      setUpcomingTreatments(proximosTratamentos);
    } catch (error) {
      console.error('❌ Erro ao carregar dados do dashboard:', error);
      toast.error('Erro ao carregar dados do dashboard');
    }
  };

  const handleViewPDF = async (solicitacao: SolicitacaoFromAPI) => {
    try {
      if (solicitacao.pdf_url) {
        window.open(solicitacao.pdf_url, '_blank');
      } else {
        toast.error('PDF não disponível', {
          description: 'Verifique se a solicitação possui PDF disponível'
        });
      }
    } catch (error) {
      console.error('Erro ao abrir PDF:', error);
      toast.error('Erro ao abrir PDF', {
        description: 'Verifique se a solicitação possui PDF disponível'
      });
    }
  };

  const ClinicDashboard = () => {
    if (!backendConnected) {
      return (
        <div className="space-y-6">
          <Card className="lco-card border-orange-200">
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-orange-800 mb-2">Backend não conectado</h3>
                <p className="text-orange-600 mb-4">
                  Para visualizar os dados do dashboard, certifique-se de que o servidor backend está rodando.
                </p>
                <button 
                  onClick={checkConnectionAndLoadData}
                  className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
                >
                  Tentar Novamente
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Carregando dados reais do dashboard...</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Cards de Métricas Reais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <AnimatedSection delay={100}>
            <MouseTilt maxTilt={5} scale={1.02}>
              <Card className="lco-card hover-lift group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-support-green/5 to-support-green/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardHeader className="pb-2 relative z-10">
                  <CardTitle className="text-lg flex items-center">
                    <CalendarIcon className="mr-2 h-5 w-5 text-support-green" />
                    Solicitações Hoje
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-3xl font-bold text-support-green mb-2">
                    {metrics.solicitacoesHoje}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Solicitações recebidas hoje
                  </p>
                </CardContent>
              </Card>
            </MouseTilt>
          </AnimatedSection>

          <AnimatedSection delay={200}>
            <MouseTilt maxTilt={5} scale={1.02}>
              <Card className="lco-card hover-lift group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-support-blue/5 to-support-blue/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardHeader className="pb-2 relative z-10">
                  <CardTitle className="text-lg flex items-center">
                    <UsersIcon className="mr-2 h-5 w-5 text-support-blue" />
                    Total de Pacientes
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-3xl font-bold text-support-blue mb-2">
                    {patientStatusData.reduce((acc, item) => acc + item.count, 0)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Pacientes cadastrados
                  </p>
                </CardContent>
              </Card>
            </MouseTilt>
          </AnimatedSection>

          <AnimatedSection delay={300}>
            <MouseTilt maxTilt={5} scale={1.02}>
              <Card className="lco-card hover-lift group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-support-purple/5 to-support-purple/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardHeader className="pb-2 relative z-10">
                  <CardTitle className="text-lg flex items-center">
                    <ChartPieIcon className="mr-2 h-5 w-5 text-support-purple" />
                    Taxa de Aprovação
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-3xl font-bold text-support-purple mb-2">
                    {metrics.totalSolicitacoes > 0 ? ((metrics.solicitacoesAutorizadas / metrics.totalSolicitacoes) * 100).toFixed(1) : 0}%
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Solicitações aprovadas
                  </p>
                </CardContent>
              </Card>
            </MouseTilt>
          </AnimatedSection>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnimatedSection delay={400}>
            <Card className="lco-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Status dos Pacientes
                </CardTitle>
                <CardDescription>
                  Distribuição dos pacientes por status
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      <filter id="pieShadow" x="-50%" y="-50%" width="200%" height="200%">
                        <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.1"/>
                      </filter>
                    </defs>
                    <Pie 
                      data={patientStatusData} 
                      dataKey="count" 
                      cx="50%" cy="50%" 
                      outerRadius={80}
                      innerRadius={40}
                      stroke="var(--card)"
                      strokeWidth={2}
                      filter="url(#pieShadow)"
                    >
                      {patientStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--card)', 
                        border: '1px solid var(--border)',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </AnimatedSection>

          <AnimatedSection delay={500}>
            <Card className="lco-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Solicitações por Mês
                </CardTitle>
                <CardDescription>
                  Evolução das solicitações nos últimos meses
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={solicitacoesPorMes}>
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--card)', 
                        border: '1px solid var(--border)',
                        borderRadius: '8px'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="total" 
                      stroke="#3b82f6" 
                      fill="url(#areaGradient)" 
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </AnimatedSection>
        </div>

        {/* Próximos Tratamentos */}
        <AnimatedSection delay={600}>
          <Card className="lco-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Próximos Tratamentos
              </CardTitle>
              <CardDescription>
                Tratamentos agendados para os próximos dias
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingTreatments.map((treatment, index) => (
                  <div key={treatment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Pill className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{treatment.patient}</p>
                        <p className="text-sm text-muted-foreground">{treatment.treatment}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{treatment.date}</p>
                      <Badge variant={treatment.status === 'Confirmado' ? 'default' : 'secondary'}>
                        {treatment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </AnimatedSection>
      </div>
    );
  };

  const HealthPlanDashboard = () => (
    <div className="space-y-6">
      <Card className="lco-card">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Dashboard do Plano de Saúde</h3>
            <p className="text-muted-foreground">
              Esta funcionalidade está em desenvolvimento.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Diferentes dashboards baseados no papel do usuário
  const renderDashboardContent = () => {
    if (user?.role === 'clinic') {
      return <ClinicDashboard />;
    } else {
      return <HealthPlanDashboard />;
    }
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div
          className="flex items-center gap-3"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Dashboard
          </h1>
        </div>
        {backendConnected && (
          <button
            onClick={checkConnectionAndLoadData}
            disabled={loading}
            className="px-3 py-1 text-sm bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors disabled:opacity-50"
          >
            {loading ? 'Atualizando...' : 'Atualizar'}
          </button>
        )}
      </div>
      {renderDashboardContent()}
    </div>
  );
};

export default Dashboard;
