import { useOperadoraAuth } from '@/contexts/OperadoraAuthContext';
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
import { DashboardService } from '@/services/dashboardService';
import { operadoraAuthService } from '@/services/operadoraAuthService';
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
  totalClinicas: number;
  totalPacientes: number;
  taxaAprovacao: number;
  tempoMedioResposta: number;
  custoTotalPeriodo: number;
  custoMedioPorPaciente: number;
  economiaEstimativa: number;
  slaDentroPrazo: number;
}

interface PatientStatusData {
  status: string;
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
  { color: '#8cb369', shadow: '0 0 10px rgba(140, 179, 105, 0.5)' },
  { color: '#e4a94f', shadow: '0 0 10px rgba(228, 169, 79, 0.5)' },
  { color: '#f26b6b', shadow: '0 0 10px rgba(242, 107, 107, 0.5)' },
  { color: '#79d153', shadow: '0 0 10px rgba(121, 209, 83, 0.5)' },
  { color: '#74b9ff', shadow: '0 0 10px rgba(116, 185, 255, 0.5)' },
  { color: '#fd79a8', shadow: '0 0 10px rgba(253, 121, 168, 0.5)' },
  { color: '#fdcb6e', shadow: '0 0 10px rgba(253, 203, 110, 0.5)' },
  { color: '#6c5ce7', shadow: '0 0 10px rgba(108, 92, 231, 0.5)' },
  { color: '#a29bfe', shadow: '0 0 10px rgba(162, 155, 254, 0.5)' },
  { color: '#f7c59f', shadow: '0 0 10px rgba(247, 197, 159, 0.5)' },
];

const OperadoraDashboard = () => {
  const { user } = useOperadoraAuth();
  
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
    totalClinicas: 0,
    totalPacientes: 0,
    taxaAprovacao: 0,
    tempoMedioResposta: 0,
    custoTotalPeriodo: 0,
    custoMedioPorPaciente: 0,
    economiaEstimativa: 0,
    slaDentroPrazo: 0,
  });
  
  const [patientStatusData, setPatientStatusData] = useState<PatientStatusData[]>([]);
  const [solicitacaoStatusData, setSolicitacaoStatusData] = useState<SolicitacaoStatusData[]>([]);
  const [treatmentDistribution, setTreatmentDistribution] = useState<TreatmentDistributionData[]>([]);
  const [upcomingTreatments, setUpcomingTreatments] = useState<UpcomingTreatmentData[]>([]);
  const [solicitacoesPorMes, setSolicitacoesPorMes] = useState<SolicitacoesPorMesData[]>([]);
  const [statusPorClinica, setStatusPorClinica] = useState<any[]>([]);
  const [activePrinciples, setActivePrinciples] = useState<ActivePrincipleData[]>([]);
  const [recentSolicitacoes, setRecentSolicitacoes] = useState<any[]>([]);
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
        toast.error('Backend não está disponível. Verifique se o servidor está rodando.');
      }
    } catch (error) {
      console.error('❌ Erro ao verificar conexão:', error);
      toast.error('Erro ao conectar com o backend');
    } finally {
      setLoading(false);
    }
  };

  const testarConexaoBackend = async (): Promise<boolean> => {
    try {
      const response = await fetch('http://localhost:3001/health');
      return response.ok;
    } catch {
      return false;
    }
  };

  const loadDashboardData = async () => {
    try {
      const dashboardData = await DashboardService.getAllDashboardData();

      // Converter dados do DashboardService para o formato esperado
      const systemMetrics = dashboardData.metrics;
      const chartsData = dashboardData.chartsData;
      const performance = dashboardData.performance;

      // Atualizar métricas
      setMetrics({
        totalSolicitacoes: systemMetrics.solicitacoesMes,
        solicitacoesEmProcessamento: systemMetrics.solicitacoesHoje,
        solicitacoesAutorizadas: Math.round(systemMetrics.solicitacoesMes * (systemMetrics.taxaAprovacao / 100)),
        solicitacoesNegadas: Math.round(systemMetrics.solicitacoesMes * ((100 - systemMetrics.taxaAprovacao) / 100)),
        solicitacoesEmAnalise: Math.round(systemMetrics.solicitacoesMes * 0.1), // Estimativa
        prazoMedioAutorizacao: systemMetrics.tempoMedioResposta,
        solicitacoesHoje: systemMetrics.solicitacoesHoje,
        solicitacoesSemana: systemMetrics.solicitacoesSemana,
        solicitacoesMes: systemMetrics.solicitacoesMes,
        totalClinicas: systemMetrics.totalClinicas || 0,
        totalPacientes: systemMetrics.totalPacientes || 0,
        taxaAprovacao: systemMetrics.taxaAprovacao || 0,
        tempoMedioResposta: systemMetrics.tempoMedioResposta || 0,
        custoTotalPeriodo: systemMetrics.custoTotalPeriodo || 0,
        custoMedioPorPaciente: systemMetrics.custoMedioPorPaciente || 0,
        economiaEstimativa: systemMetrics.economiaEstimativa || 0,
        slaDentroPrazo: systemMetrics.slaDentroPrazo || 0,
      });

      // Atualizar dados dos gráficos
      setSolicitacoesPorMes(chartsData.chartData.map(item => ({
        mes: item.mes,
        total: item.solicitacoes,
        autorizadas: item.aprovacoes,
        negadas: item.negadas,
        emAnalise: item.emAnalise
      })));

      // Atualizar performance das clínicas
      setStatusPorClinica(performance.map(item => ({
        name: item.nome,
        solicitacoes: item.totalSolicitacoes,
        aprovacoes: item.solicitacoesAprovadas,
        negadas: item.solicitacoesNegadas,
        taxaAprovacao: item.taxaAprovacao,
        tempoMedio: item.tempoMedioResposta
      })));

      // Atualizar princípios ativos
      setActivePrinciples(chartsData.activePrinciples.map((item, index) => ({
        name: item.name,
        count: item.count,
        color: TREATMENT_COLORS[index % TREATMENT_COLORS.length].color
      })));
    } catch (error) {
      console.error('❌ Erro ao carregar dados do dashboard:', error);
      toast.error('Erro ao carregar dados do dashboard');
    }
  };

  const loadClinicasCredenciadas = async () => {
    try {
      const response = await operadoraAuthService.authorizedFetch('/api/clinicas/por-operadora');
      
      if (response && response.ok) {
        const data = await response.json();
      } else {
        throw new Error('Backend error');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar clínicas:', error);
    }
  };

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

  // Calcular dados derivados primeiro
  const totalSolicitacoes = metrics.totalSolicitacoes || 0;
  // Dados de distribuição de tempo de autorização (do backend)
  const tempoAutorizacaoDist = [
    { faixa: '0-1d', qtd: 0 },
    { faixa: '2-3d', qtd: 0 },
    { faixa: '4-5d', qtd: 0 },
    { faixa: '6-7d', qtd: 0 },
    { faixa: '8+d', qtd: 0 },
  ];

  // Usar dados reais do estado
  const kpis = {
    totalClinicas: metrics.totalClinicas || 0,
    totalSolicitacoes: totalSolicitacoes,
    taxaAprovacao: metrics.taxaAprovacao || 0,
    tempoMedioAnaliseDias: metrics.tempoMedioResposta || 0,
    totalPacientes: metrics.totalPacientes || 0,
    custoTotalPeriodo: metrics.custoTotalPeriodo || 0,
    custoMedioPorPaciente: metrics.custoMedioPorPaciente || 0,
    economiaEstimativa: metrics.economiaEstimativa || 0,
    taxaNegacao: metrics.solicitacoesNegadas / Math.max(totalSolicitacoes, 1),
    slaDentroPrazo: metrics.slaDentroPrazo || 0,
  };

  // Usar dados reais dos gráficos
  const statusPorClinicaData = statusPorClinica || [];

  // Usar dados reais dos protocolos e princípios ativos
  const protocolosTop = activePrinciples.slice(0, 4).map(p => ({
    name: p.name,
    value: p.count
  }));

  const principiosAtivosTop = activePrinciples.slice(0, 5).map(p => ({
    name: p.name,
    value: p.count
  }));

  // Dados de performance das clínicas usando dados reais
  const desempenhoClinica = statusPorClinicaData.map(item => ({
    name: item.name,
    aprovacao: item.aprovacoes / Math.max(item.solicitacoes, 1) * 100,
    tempo: item.tempoMedio,
    solicitacoes: item.solicitacoes
  }));

  // Dados de custo dos princípios ativos usando dados reais
  const principiosPorCusto = activePrinciples.slice(0, 5).map(p => ({
    name: p.name,
    custo: p.count * 500, // Estimativa de custo baseado na quantidade
    color: p.color
  }));

  return (
    <div className="space-y-6">
      {/* Header da Operadora */}
      <Card className="lco-card border-blue-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-3">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Operadora</div>
              <div className="text-2xl font-bold">
                {user?.nome || 'Operadora'}
              </div>
            </div>
          </div>
          {/* Toolbar de filtros simplificada - apenas seletor de clínica */}
          <div className="w-full md:w-auto">
            <div className="flex gap-3">
              <div className="min-w-[240px]">
                <div className="text-xs font-medium text-muted-foreground mb-1">Clínica</div>
                <Select>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Todas as clínicas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as clínicas</SelectItem>
                    {statusPorClinicaData.map((clinica, index) => (
                      <SelectItem key={index} value={String(index)}>{clinica.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="lco-card border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clínicas</CardTitle>
            <Building2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{kpis.totalClinicas}</div>
            <p className="text-xs text-muted-foreground">
              Clínicas credenciadas
            </p>
          </CardContent>
        </Card>

        <Card className="lco-card border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Solicitações</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{kpis.totalSolicitacoes}</div>
            <p className="text-xs text-muted-foreground">
              Últimos 30 dias
            </p>
          </CardContent>
        </Card>

        <Card className="lco-card border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Aprovação</CardTitle>
            <CheckCircle className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{kpis.taxaAprovacao.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Média geral
            </p>
          </CardContent>
        </Card>

        <Card className="lco-card border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{kpis.tempoMedioAnaliseDias.toFixed(1)}d</div>
            <p className="text-xs text-muted-foreground">
              Para análise
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Métricas Financeiras */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="lco-card border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Total do Período</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {kpis.custoTotalPeriodo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Últimos 30 dias
            </p>
          </CardContent>
        </Card>

        <Card className="lco-card border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Médio por Paciente</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              R$ {kpis.custoMedioPorPaciente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Por paciente
            </p>
          </CardContent>
        </Card>

        <Card className="lco-card border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Economia Estimada</CardTitle>
            <ChartPieIcon className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              R$ {kpis.economiaEstimativa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Economia potencial
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos e Análises */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Solicitações por Mês */}
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

        {/* Gráfico de Status das Solicitações */}
        <Card className="lco-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Status das Solicitações
            </CardTitle>
            <CardDescription>
              Distribuição por status atual
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
                  data={[
                    { name: 'Aprovadas', value: metrics.solicitacoesAutorizadas, color: '#10b981' },
                    { name: 'Em Análise', value: metrics.solicitacoesEmAnalise, color: '#f59e0b' },
                    { name: 'Negativas', value: metrics.solicitacoesNegadas, color: '#ef4444' }
                  ]} 
                  dataKey="value" 
                  cx="50%" cy="50%" 
                  outerRadius={80}
                  innerRadius={40}
                  stroke="var(--card)"
                  strokeWidth={2}
                  filter="url(#pieShadow)"
                >
                  {[
                    { name: 'Aprovadas', value: metrics.solicitacoesAutorizadas, color: '#10b981' },
                    { name: 'Em Análise', value: metrics.solicitacoesEmAnalise, color: '#f59e0b' },
                    { name: 'Negativas', value: metrics.solicitacoesNegadas, color: '#ef4444' }
                  ].map((entry, index) => (
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
      </div>

      {/* Performance das Clínicas */}
      <Card className="lco-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Performance das Clínicas
          </CardTitle>
          <CardDescription>
            Ranking de performance das clínicas credenciadas
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusPorClinica}>
              <defs>
                <linearGradient id="barGradient2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--card)', 
                  border: '1px solid var(--border)',
                  borderRadius: '8px'
                }} 
              />
              <Bar dataKey="solicitacoes" fill="url(#barGradient2)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default OperadoraDashboard;
