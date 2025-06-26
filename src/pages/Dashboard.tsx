import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { VialIcon, PillIcon, SyringeIcon } from '@/components/MedicalIcons';
import { CalendarIcon, UsersIcon, ChartPieIcon, AlertCircle, FileText, Clock, CheckCircle, XCircle, Loader2, BarChart3 } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AnimatedSection from '@/components/AnimatedSection';
import { cn } from '@/lib/utils';
import { MouseTilt } from '@/components/MouseTilt';
import { PacienteService, SolicitacaoService, testarConexaoBackend, PatientFromAPI, SolicitacaoFromAPI } from '@/services/api';
import { ClinicService } from '@/services/clinicService';
import { toast } from 'sonner';

// Interfaces para dados processados
interface DashboardMetrics {
  totalPacientes: number;
  totalSolicitacoes: number;
  solicitacoesPendentes: number;
  solicitacoesAprovadas: number;
  pacientesAtivos: number;
  mediaIdadePacientes: number;
}

interface PatientStatusData {
  name: string;
  count: number;
}

interface SolicitacaoStatusData {
  name: string;
  value: number;
  status: string;
}

interface TreatmentDistributionData {
  name: string;
  value: number;
}

interface UpcomingTreatmentData {
  id: string;
  patientName: string;
  treatmentType: string;
  daysRemaining: number;
  cycle: string;
  status: 'urgent' | 'warning' | 'normal';
}

interface SolicitacoesPorMesData {
  mes: string;
  total: number;
  aprovadas: number;
  pendentes: number;
  rejeitadas: number;
}

// Cores consistentes com o tema
const CHART_COLORS = [
  { fill: '#8cb369', stroke: '#a8c97d', glow: '0 0 10px rgba(140, 179, 105, 0.5)' },
  { fill: '#e4a94f', stroke: '#f2c94c', glow: '0 0 10px rgba(228, 169, 79, 0.5)' },
  { fill: '#f26b6b', stroke: '#ff8f8f', glow: '0 0 10px rgba(242, 107, 107, 0.5)' },
  { fill: '#c6d651', stroke: '#d4e37b', glow: '0 0 10px rgba(198, 214, 81, 0.5)' },
  { fill: '#6b7bb3', stroke: '#8a94c7', glow: '0 0 10px rgba(107, 123, 179, 0.5)' },
];

// Cores para distribuição de tratamentos (diferentes das solicitações)
const TREATMENT_COLORS = [
  { fill: '#c6d651', stroke: '#d4e37b', glow: '0 0 10px rgba(198, 214, 81, 0.5)' },
  { fill: '#8cb369', stroke: '#a8c97d', glow: '0 0 10px rgba(140, 179, 105, 0.5)' },
  { fill: '#e4a94f', stroke: '#f2c94c', glow: '0 0 10px rgba(228, 169, 79, 0.5)' },
  { fill: '#35524a', stroke: '#4a6b5f', glow: '0 0 10px rgba(53, 82, 74, 0.5)' },
  { fill: '#f26b6b', stroke: '#ff8f8f', glow: '0 0 10px rgba(242, 107, 107, 0.5)' },
  { fill: '#f7c59f', stroke: '#ffd4b3', glow: '0 0 10px rgba(247, 197, 159, 0.5)' },
];

const Dashboard = () => {
  const { user } = useAuth();
  
  // Estados para dados do backend
  const [backendConnected, setBackendConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalPacientes: 0,
    totalSolicitacoes: 0,
    solicitacoesPendentes: 0,
    solicitacoesAprovadas: 0,
    pacientesAtivos: 0,
    mediaIdadePacientes: 0,
  });
  
  const [patientStatusData, setPatientStatusData] = useState<PatientStatusData[]>([]);
  const [solicitacaoStatusData, setSolicitacaoStatusData] = useState<SolicitacaoStatusData[]>([]);
  const [treatmentDistribution, setTreatmentDistribution] = useState<TreatmentDistributionData[]>([]);
  const [upcomingTreatments, setUpcomingTreatments] = useState<UpcomingTreatmentData[]>([]);
  const [solicitacoesPorMes, setSolicitacoesPorMes] = useState<SolicitacoesPorMesData[]>([]);
  const [recentSolicitacoes, setRecentSolicitacoes] = useState<SolicitacaoFromAPI[]>([]);

  // Verificar conexão e carregar dados
  useEffect(() => {
    checkConnectionAndLoadData();
  }, []);

  const checkConnectionAndLoadData = async () => {
    setLoading(true);
    try {
      console.log('🔧 Verificando conexão com backend...');
      const connected = await testarConexaoBackend();
      setBackendConnected(connected);
      
      if (connected) {
        console.log('✅ Backend conectado, carregando dados do dashboard...');
        await loadDashboardData();
      } else {
        console.log('❌ Backend não conectado');
        toast.error('Backend não conectado', {
          description: 'Dados do dashboard não disponíveis sem conexão com o servidor'
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
      // Carregar dados em paralelo
      const [patientsResult, solicitacoesResult] = await Promise.all([
        PacienteService.listarPacientes({ page: 1, limit: 1000 }),
        SolicitacaoService.listarSolicitacoes({ page: 1, limit: 1000 })
      ]);

      console.log('📊 Dados carregados:', {
        pacientes: patientsResult.data.length,
        solicitacoes: solicitacoesResult.data.length
      });

      // Processar dados dos pacientes
      const patients = patientsResult.data;
      const solicitacoes = solicitacoesResult.data;

      // Calcular métricas básicas
      const totalPacientes = patients.length;
      const pacientesAtivos = patients.filter(p => 
        p.status === 'Em tratamento' || p.status === 'ativo'
      ).length;
      
      const totalSolicitacoes = solicitacoes.length;
      const solicitacoesPendentes = solicitacoes.filter(s => 
        s.status === 'pendente' || s.status === 'em_analise'
      ).length;
      const solicitacoesAprovadas = solicitacoes.filter(s => 
        s.status === 'aprovada'
      ).length;

      // Calcular média de idade
      const idades = patients
        .map(p => p.age || calculateAge(p.Data_Nascimento))
        .filter(age => age > 0);
      const mediaIdadePacientes = idades.length > 0 
        ? Math.round(idades.reduce((sum, age) => sum + age, 0) / idades.length)
        : 0;

      setMetrics({
        totalPacientes,
        totalSolicitacoes,
        solicitacoesPendentes,
        solicitacoesAprovadas,
        pacientesAtivos,
        mediaIdadePacientes,
      });

      // Processar dados para gráficos
      processPatientStatusData(patients);
      processSolicitacaoStatusData(solicitacoes);
      processTreatmentDistribution(solicitacoes);
      processUpcomingTreatments(solicitacoes, patients);
      processSolicitacoesPorMes(solicitacoes);
      
      // Pegar solicitações recentes
      setRecentSolicitacoes(solicitacoes.slice(0, 5));

    } catch (error) {
      console.error('❌ Erro ao carregar dados do dashboard:', error);
      toast.error('Erro ao carregar dados do dashboard');
    }
  };

  const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 0;
    try {
      const birth = new Date(birthDate);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    } catch {
      return 0;
    }
  };

  const processPatientStatusData = (patients: any[]) => {
    const statusCount: Record<string, number> = {};
    
    patients.forEach(patient => {
      const status = patient.status || 'Sem status';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });

    const data = Object.entries(statusCount).map(([name, count]) => ({
      name,
      count: count as number
    }));

    setPatientStatusData(data);
  };

  const processSolicitacaoStatusData = (solicitacoes: SolicitacaoFromAPI[]) => {
    const statusCount: Record<string, number> = {};
    
    solicitacoes.forEach(solicitacao => {
      const status = solicitacao.status || 'pendente';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });

    const statusLabels: Record<string, string> = {
      'pendente': 'Pendente',
      'aprovada': 'Aprovada',
      'rejeitada': 'Rejeitada',
      'em_analise': 'Em Análise'
    };

    const data = Object.entries(statusCount).map(([status, value]) => ({
      name: statusLabels[status] || status,
      value: value as number,
      status
    }));

    setSolicitacaoStatusData(data);
  };

  const processTreatmentDistribution = (solicitacoes: SolicitacaoFromAPI[]) => {
    const treatmentCount: Record<string, number> = {};
    
    solicitacoes.forEach(solicitacao => {
      const finalidade = solicitacao.finalidade || 'Não especificado';
      
      // Mapear finalidades para nomes mais amigáveis
      const finalidadeMap: Record<string, string> = {
        'neoadjuvante': 'Neoadjuvante',
        'adjuvante': 'Adjuvante', 
        'curativo': 'Curativo',
        'controle': 'Controle',
        'radioterapia': 'Radioterapia',
        'paliativo': 'Paliativo'
      };
      
      const finalidadeLabel = finalidadeMap[finalidade] || finalidade;
      treatmentCount[finalidadeLabel] = (treatmentCount[finalidadeLabel] || 0) + 1;
    });

    const data = Object.entries(treatmentCount).map(([name, value]) => ({
      name,
      value: value as number
    }));

    setTreatmentDistribution(data);
  };

  const processUpcomingTreatments = (solicitacoes: SolicitacaoFromAPI[], patients: any[]) => {
    const upcomingData: UpcomingTreatmentData[] = [];
    
    // Pegar solicitações ativas (aprovadas ou em análise)
    const activeSolicitacoes = solicitacoes.filter(s => 
      s.status === 'aprovada' || s.status === 'em_analise'
    );

    activeSolicitacoes.slice(0, 6).forEach((solicitacao, index) => {
      // Simular próximos tratamentos baseado nos ciclos
      const cicloAtual = solicitacao.ciclo_atual || 1;
      const ciclosPrevistos = solicitacao.ciclos_previstos || 6;
      
      if (cicloAtual < ciclosPrevistos) {
        // Calcular dias até próximo ciclo (simulado)
        const diasRestantes = Math.floor(Math.random() * 14) + 1; // 1-14 dias
        
        let status: 'urgent' | 'warning' | 'normal' = 'normal';
        if (diasRestantes <= 3) status = 'urgent';
        else if (diasRestantes <= 7) status = 'warning';
        
        // Determinar tipo de tratamento baseado na finalidade
        const treatmentTypeMap: Record<string, string> = {
          'neoadjuvante': 'Quimioterapia Neoadjuvante',
          'adjuvante': 'Quimioterapia Adjuvante',
          'curativo': 'Quimioterapia Curativa',
          'controle': 'Quimioterapia de Controle',
          'radioterapia': 'Radioterapia',
          'paliativo': 'Quimioterapia Paliativa'
        };
        
        const treatmentType = treatmentTypeMap[solicitacao.finalidade || ''] || 'Quimioterapia';
        
        upcomingData.push({
          id: solicitacao.id?.toString() || index.toString(),
          patientName: solicitacao.cliente_nome,
          treatmentType,
          daysRemaining: diasRestantes,
          cycle: `${cicloAtual + 1}/${ciclosPrevistos}`,
          status
        });
      }
    });

    // Ordenar por urgência (dias restantes)
    upcomingData.sort((a, b) => a.daysRemaining - b.daysRemaining);
    
    setUpcomingTreatments(upcomingData);
  };

  const processSolicitacoesPorMes = (solicitacoes: SolicitacaoFromAPI[]) => {
    const mesesData: Record<string, any> = {};
    
    solicitacoes.forEach(solicitacao => {
      if (!solicitacao.created_at) return;
      
      try {
        const date = new Date(solicitacao.created_at);
        const mesAno = `${date.getMonth() + 1}/${date.getFullYear()}`;
        
        if (!mesesData[mesAno]) {
          mesesData[mesAno] = {
            mes: mesAno,
            total: 0,
            aprovadas: 0,
            pendentes: 0,
            rejeitadas: 0
          };
        }
        
        mesesData[mesAno].total++;
        
        switch (solicitacao.status) {
          case 'aprovada':
            mesesData[mesAno].aprovadas++;
            break;
          case 'rejeitada':
            mesesData[mesAno].rejeitadas++;
            break;
          default:
            mesesData[mesAno].pendentes++;
        }
      } catch (error) {
        console.warn('Erro ao processar data:', solicitacao.created_at);
      }
    });

    const data = Object.values(mesesData)
      .sort((a: any, b: any) => {
        const [mesA, anoA] = a.mes.split('/').map(Number);
        const [mesB, anoB] = b.mes.split('/').map(Number);
        return anoA === anoB ? mesA - mesB : anoA - anoB;
      })
      .slice(-6); // Últimos 6 meses

    setSolicitacoesPorMes(data);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aprovada':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pendente':
      case 'em_analise':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'rejeitada':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  // Diferentes dashboards baseados no papel do usuário
  const renderDashboardContent = () => {
    if (user?.role === 'clinic') {
      return <ClinicDashboard />;
    } else if (user?.role === 'operator') {
      return <OperatorDashboard />;
    } else {
      return <HealthPlanDashboard />;
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
              <p className="text-muted-foreground">Carregando dados do dashboard...</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Cards de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <AnimatedSection delay={100}>
            <MouseTilt maxTilt={5} scale={1.02}>
              <Card className="lco-card hover-lift">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <UsersIcon className="mr-2 h-5 w-5 text-support-green" />
                    Pacientes
                  </CardTitle>
                  <CardDescription>Total de pacientes cadastrados</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{metrics.totalPacientes}</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    <span className="text-support-green">
                      {metrics.pacientesAtivos} ativos
                    </span> • Idade média: {metrics.mediaIdadePacientes} anos
                  </p>
                </CardContent>
              </Card>
            </MouseTilt>
          </AnimatedSection>
          
          <AnimatedSection delay={200}>
            <MouseTilt maxTilt={5} scale={1.02}>
              <Card className="lco-card hover-lift">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <FileText className="mr-2 h-5 w-5 text-support-yellow" />
                    Solicitações
                  </CardTitle>
                  <CardDescription>Autorizações de tratamento</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{metrics.totalSolicitacoes}</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    <span className="text-support-yellow">
                      {metrics.solicitacoesPendentes} pendentes
                    </span> • <span className="text-support-green">
                      {metrics.solicitacoesAprovadas} aprovadas
                    </span>
                  </p>
                </CardContent>
              </Card>
            </MouseTilt>
          </AnimatedSection>
          
          <AnimatedSection delay={300}>
            <MouseTilt maxTilt={5} scale={1.02}>
              <Card className="lco-card hover-lift">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <ChartPieIcon className="mr-2 h-5 w-5 text-highlight-peach" />
                    Taxa de Aprovação
                  </CardTitle>
                  <CardDescription>Solicitações aprovadas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {metrics.totalSolicitacoes > 0 
                      ? Math.round((metrics.solicitacoesAprovadas / metrics.totalSolicitacoes) * 100)
                      : 0}%
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    <span className="text-support-green">
                      {metrics.solicitacoesAprovadas} de {metrics.totalSolicitacoes} solicitações
                    </span>
                  </p>
                </CardContent>
              </Card>
            </MouseTilt>
          </AnimatedSection>
        </div>
        
        {/* Gráficos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Status das Solicitações */}
          <AnimatedSection delay={400}>
            <Card className="lco-card h-[400px]">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5 text-primary" />
                  Status das Solicitações
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[300px] flex justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.2"/>
                      </filter>
                    </defs>
                    <Pie
                      data={solicitacaoStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      animationDuration={1500}
                      animationBegin={200}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                      filter="url(#shadow)"
                    >
                      {solicitacaoStatusData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={CHART_COLORS[index % CHART_COLORS.length].fill}
                          stroke={CHART_COLORS[index % CHART_COLORS.length].stroke}
                          strokeWidth={2}
                          style={{
                            filter: `drop-shadow(${CHART_COLORS[index % CHART_COLORS.length].glow})`
                          }}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '12px', 
                        border: '1px solid var(--border)', 
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        background: 'var(--background)',
                        color: 'hsl(var(--foreground))'
                      }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Legend 
                      wrapperStyle={{
                        paddingTop: '20px',
                        color: 'hsl(var(--foreground))'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </AnimatedSection>
          
          {/* Status dos Pacientes */}
          <AnimatedSection delay={500}>
            <Card className="lco-card h-[400px]">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UsersIcon className="mr-2 h-5 w-5 text-primary" />
                  Status dos Pacientes
                </CardTitle>
                <CardDescription>Distribuição por status atual</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={patientStatusData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#c6d651" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#c6d651" stopOpacity={0.3}/>
                      </linearGradient>
                      <filter id="barShadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.2"/>
                      </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} stroke="var(--border)" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                      axisLine={{ stroke: 'var(--border)' }}
                      tickLine={{ stroke: 'var(--border)' }}
                    />
                    <YAxis 
                      tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                      axisLine={{ stroke: 'var(--border)' }}
                      tickLine={{ stroke: 'var(--border)' }}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(198, 214, 81, 0.1)' }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-background border border-border rounded-lg shadow-lg p-3">
                              <p className="font-medium text-foreground">{label}</p>
                              <p className="text-sm text-muted-foreground">
                                {payload[0].value} pacientes
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar 
                      dataKey="count" 
                      name="Pacientes" 
                      fill="url(#barGradient)"
                      animationDuration={1500}
                      animationBegin={300}
                      radius={[8, 8, 0, 0]}
                      stroke="var(--background)"
                      strokeWidth={2}
                      maxBarSize={50}
                      filter="url(#barShadow)"
                      className="transition-all duration-300 hover:brightness-110"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </AnimatedSection>
        </div>
        
        {/* Gráficos Adicionais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tratamentos a Vencer */}
          <AnimatedSection delay={600}>
            <Card className="lco-card h-[400px]">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarIcon className="mr-2 h-5 w-5 text-primary" />
                  Tratamentos a Vencer
                </CardTitle>
                <CardDescription>Próximos ciclos programados</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] overflow-y-auto">
                <div className="space-y-4">
                  {upcomingTreatments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhum tratamento programado</p>
                    </div>
                  ) : (
                    upcomingTreatments.map((treatment) => (
                      <div 
                        key={treatment.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg transition-all duration-300",
                          treatment.status === 'urgent' ? 'bg-highlight-red/10 hover:bg-highlight-red/20 shadow-[0_0_10px_rgba(242,107,107,0.3)]' :
                          treatment.status === 'warning' ? 'bg-support-yellow/10 hover:bg-support-yellow/20 shadow-[0_0_10px_rgba(228,169,79,0.3)]' :
                          'bg-support-green/10 hover:bg-support-green/20 shadow-[0_0_10px_rgba(140,179,105,0.3)]'
                        )}
                      >
                        <div className="flex-1">
                          <div className="font-medium">{treatment.patientName}</div>
                          <div className="text-sm text-muted-foreground">{treatment.treatmentType}</div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className={cn(
                              "text-sm font-medium",
                              treatment.status === 'urgent' ? 'text-highlight-red' :
                              treatment.status === 'warning' ? 'text-support-yellow' :
                              'text-support-green'
                            )}>
                              {treatment.daysRemaining} dias
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Ciclo {treatment.cycle}
                            </div>
                          </div>
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            treatment.status === 'urgent' ? 'bg-highlight-red animate-pulse shadow-[0_0_10px_rgba(242,107,107,0.5)]' :
                            treatment.status === 'warning' ? 'bg-support-yellow shadow-[0_0_10px_rgba(228,169,79,0.5)]' :
                            'bg-support-green shadow-[0_0_10px_rgba(140,179,105,0.5)]'
                          )} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </AnimatedSection>

          {/* Distribuição de Tratamentos */}
          <AnimatedSection delay={700}>
            <Card className="lco-card h-[400px]">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5 text-primary" />
                  Distribuição de Tratamentos
                </CardTitle>
                <CardDescription>Por finalidade terapêutica</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      <filter id="treatmentShadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.2"/>
                      </filter>
                    </defs>
                    <Pie
                      data={treatmentDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      startAngle={100}
                      endAngle={460}
                      animationDuration={1500}
                      animationBegin={200}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                      filter="url(#treatmentShadow)"
                    >
                      {treatmentDistribution.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={TREATMENT_COLORS[index % TREATMENT_COLORS.length].fill}
                          stroke={TREATMENT_COLORS[index % TREATMENT_COLORS.length].stroke}
                          strokeWidth={2}
                          style={{
                            filter: `drop-shadow(${TREATMENT_COLORS[index % TREATMENT_COLORS.length].glow})`
                          }}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '12px', 
                        border: '1px solid var(--border)', 
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        background: 'var(--background)',
                        color: 'hsl(var(--foreground))'
                      }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Legend 
                      wrapperStyle={{
                        paddingTop: '20px',
                        color: 'hsl(var(--foreground))'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </AnimatedSection>
        </div>

        {/* Solicitações Recentes */}
        <div className="grid grid-cols-1 gap-6">
          <AnimatedSection delay={800}>
            <Card className="lco-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-5 w-5 text-primary" />
                  Solicitações Recentes
                </CardTitle>
                <CardDescription>Últimas solicitações de autorização</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {recentSolicitacoes.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhuma solicitação encontrada</p>
                    </div>
                  ) : (
                    recentSolicitacoes.map((solicitacao) => (
                      <div 
                        key={solicitacao.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg transition-all duration-300 border",
                          solicitacao.status === 'aprovada' ? 'bg-support-green/10 hover:bg-support-green/20 border-support-green/20' :
                          solicitacao.status === 'rejeitada' ? 'bg-highlight-red/10 hover:bg-highlight-red/20 border-highlight-red/20' :
                          'bg-support-yellow/10 hover:bg-support-yellow/20 border-support-yellow/20'
                        )}
                      >
                        <div className="flex-1">
                          <div className="font-medium text-sm">{solicitacao.cliente_nome}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(solicitacao.created_at || '')}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(solicitacao.status || 'pendente')}
                          <span className="text-xs">#{solicitacao.id}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </AnimatedSection>
        </div>

        {/* Solicitações por Mês (se tiver dados suficientes) */}
        {solicitacoesPorMes.length > 1 && (
          <AnimatedSection delay={800}>
            <Card className="lco-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ChartPieIcon className="mr-2 h-5 w-5 text-primary" />
                  Solicitações por Período
                </CardTitle>
                <CardDescription>Evolução das solicitações ao longo do tempo</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={solicitacoesPorMes} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#c6d651" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#c6d651" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="aprovadasGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8cb369" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8cb369" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} stroke="var(--border)" />
                    <XAxis 
                      dataKey="mes" 
                      tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                      axisLine={{ stroke: 'var(--border)' }}
                      tickLine={{ stroke: 'var(--border)' }}
                    />
                    <YAxis 
                      tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                      axisLine={{ stroke: 'var(--border)' }}
                      tickLine={{ stroke: 'var(--border)' }}
                    />
                    <Tooltip 
                      contentStyle={{
                        borderRadius: '12px', 
                        border: '1px solid var(--border)', 
                        background: 'var(--background)',
                        color: 'hsl(var(--foreground))'
                      }}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="total" 
                      stackId="1"
                      stroke="#c6d651" 
                      fill="url(#totalGradient)" 
                      name="Total"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="aprovadas" 
                      stackId="2"
                      stroke="#8cb369" 
                      fill="url(#aprovadasGradient)" 
                      name="Aprovadas"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </AnimatedSection>
        )}
      </div>
    );
  };

  const OperatorDashboard = () => (
    <div className="space-y-6">
      <Card className="lco-card border-blue-200">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-blue-800 mb-2">Dashboard da Operadora</h3>
            <p className="text-blue-600">
              Em desenvolvimento. Funcionalidades específicas da operadora serão implementadas em breve.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const HealthPlanDashboard = () => (
    <div className="space-y-6">
      <Card className="lco-card border-purple-200">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-purple-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-purple-800 mb-2">Dashboard do Plano de Saúde</h3>
            <p className="text-purple-600">
              Em desenvolvimento. Funcionalidades específicas do plano de saúde serão implementadas em breve.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
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