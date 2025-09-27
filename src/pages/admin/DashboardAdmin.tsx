import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  BarChart3, 
  Building2, 
  Users, 
  Pill, 
  FileText, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Database, 
  Shield
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import AnimatedSection from '@/components/AnimatedSection';
import { MouseTilt } from '@/components/MouseTilt';
import { AdminDashboardService, AdminSystemMetrics, OperadoraInfo, ClinicaInfo, AdminChartsData } from '@/services/adminDashboardService';
import { toast } from 'sonner';

// Interfaces importadas do service

// Cores consistentes com o tema do sistema
const CHART_COLORS = [
  { fill: '#8cb369', stroke: '#a8c97d', glow: '0 0 10px rgba(140, 179, 105, 0.5)' },
  { fill: '#e4a94f', stroke: '#f2c94c', glow: '0 0 10px rgba(228, 169, 79, 0.5)' },
  { fill: '#f26b6b', stroke: '#ff8f8f', glow: '0 0 10px rgba(242, 107, 107, 0.5)' },
  { fill: '#79d153', stroke: '#a5e882', glow: '0 0 10px rgba(121, 209, 83, 0.5)' },
  { fill: '#6b7bb3', stroke: '#8a94c7', glow: '0 0 10px rgba(107, 123, 179, 0.5)' },
];

const DashboardAdmin = () => {
  const [metrics, setMetrics] = useState<AdminSystemMetrics>({
    totalClinicas: 0,
    totalOperadoras: 0,
    totalProtocolos: 0,
    totalPacientes: 0,
    totalSolicitacoes: 0,
    solicitacoesHoje: 0,
    solicitacoesSemana: 0,
    solicitacoesMes: 0,
    taxaAprovacaoGeral: 0,
    tempoMedioResposta: 0,
    clinicasAtivas: 0,
    operadorasAtivas: 0
  });

  const [operadoras, setOperadoras] = useState<OperadoraInfo[]>([]);
  const [clinicas, setClinicas] = useState<ClinicaInfo[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para dados dos gráficos
  const [chartData, setChartData] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);

  useEffect(() => {
    // Carregar dados reais do dashboard administrativo
    const loadAdminDashboardData = async () => {
      try {
        setLoading(true);
        console.log('🔧 Carregando dados do dashboard administrativo...');
        
        // Buscar todos os dados administrativos de uma vez
        const adminData = await AdminDashboardService.getAllAdminData();
        
        setMetrics(adminData.metrics);
        // Dados detalhados não são listados no dashboard; mantidos internamente se precisar
        setOperadoras(adminData.operadoras);
        setClinicas(adminData.clinicas);
        
        // Atualizar dados dos gráficos com verificações de segurança
        setChartData(adminData.chartsData?.chartData || []);
        setPerformanceData(adminData.chartsData?.performanceData || []);
        setStatusData(adminData.chartsData?.statusData || []);
        setTrendData(adminData.chartsData?.trendData || []);
        
        console.log('✅ Dashboard administrativo carregado com sucesso');
        toast.success('Dashboard administrativo atualizado com dados reais');
      } catch (error) {
        console.error('❌ Erro ao carregar dados do dashboard administrativo:', error);
        
        // Em caso de erro, mostrar dados vazios ao invés de mock
        setMetrics({
          totalClinicas: 0,
          totalOperadoras: 0,
          totalProtocolos: 0,
          totalPacientes: 0,
          totalSolicitacoes: 0,
          solicitacoesHoje: 0,
          solicitacoesSemana: 0,
          solicitacoesMes: 0,
          taxaAprovacaoGeral: 0,
          tempoMedioResposta: 0,
          clinicasAtivas: 0,
          operadorasAtivas: 0
        });
        setOperadoras([]);
        setClinicas([]);
        setChartData([]);
        setPerformanceData([]);
        setStatusData([]);
        setTrendData([]);
        
        toast.error('Erro ao carregar dados administrativos. Verifique a conexão com o servidor.');
      } finally {
        setLoading(false);
      }
    };

    loadAdminDashboardData();
  }, []);

  // Dados dos gráficos agora são gerenciados pelos estados

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
        <AnimatedSection delay={100}>
          <MouseTilt maxTilt={5} scale={1.02}>
            <div className="lco-card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 dark:from-blue-900/20 dark:to-blue-800/20 dark:border-blue-700/50 hover-lift group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-support-green/5 to-support-green/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="pb-2 relative z-10">
                <CardTitle className="text-lg flex items-center">
                  <Building2 className="mr-2 h-5 w-5 text-support-green" />
                  Total de Clínicas
                </CardTitle>
                <CardDescription>Clínicas ativas no sistema</CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold">{metrics.totalClinicas}</div>
                <p className="text-sm text-muted-foreground mt-2">
                  <span className="text-support-green">
                    {metrics.operadorasAtivas} operadoras ativas
                  </span>
                </p>
              </CardContent>
            </div>
          </MouseTilt>
        </AnimatedSection>

        {/* Total de Operadoras */}
        <AnimatedSection delay={150}>
          <MouseTilt maxTilt={5} scale={1.02}>
            <div className="lco-card bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200 dark:from-indigo-900/20 dark:to-indigo-800/20 dark:border-indigo-700/50 hover-lift group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="pb-2 relative z-10">
                <CardTitle className="text-lg flex items-center">
                  <Shield className="mr-2 h-5 w-5 text-indigo-600" />
                  Total de Operadoras
                </CardTitle>
                <CardDescription>Operadoras cadastradas</CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold">{metrics.totalOperadoras}</div>
                <p className="text-sm text-muted-foreground mt-2">
                  <span className="text-indigo-600">
                    {metrics.operadorasAtivas} ativas
                  </span>
                </p>
              </CardContent>
            </div>
          </MouseTilt>
        </AnimatedSection>

        <AnimatedSection delay={200}>
          <MouseTilt maxTilt={5} scale={1.02}>
            <div className="lco-card bg-gradient-to-br from-green-50 to-green-100 border-green-200 dark:from-green-900/20 dark:to-green-800/20 dark:border-green-700/50 hover-lift group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-support-yellow/5 to-support-yellow/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="pb-2 relative z-10">
                <CardTitle className="text-lg flex items-center">
                  <Users className="mr-2 h-5 w-5 text-support-yellow" />
                  Total de Pacientes
                </CardTitle>
                <CardDescription>Pacientes cadastrados</CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold">{metrics.totalPacientes.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground mt-2">
                  <span className="text-support-yellow">
                    {metrics.totalSolicitacoes} solicitações totais
                  </span>
                </p>
              </CardContent>
            </div>
          </MouseTilt>
        </AnimatedSection>

        <AnimatedSection delay={300}>
          <MouseTilt maxTilt={5} scale={1.02}>
            <div className="lco-card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 dark:from-purple-900/20 dark:to-purple-800/20 dark:border-purple-700/50 hover-lift group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-highlight-peach/5 to-highlight-peach/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="pb-2 relative z-10">
                <CardTitle className="text-lg flex items-center">
                  <FileText className="mr-2 h-5 w-5 text-highlight-peach" />
                  Protocolos
                </CardTitle>
                <CardDescription>Protocolos disponíveis</CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold">{metrics.totalProtocolos}</div>
                <p className="text-sm text-muted-foreground mt-2">
                  <span className="text-highlight-peach">
                    {metrics.totalPrincipiosAtivos} princípios ativos
                  </span>
                </p>
              </CardContent>
            </div>
          </MouseTilt>
        </AnimatedSection>

        <AnimatedSection delay={400}>
          <MouseTilt maxTilt={5} scale={1.02}>
            <div className="lco-card bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 dark:from-orange-900/20 dark:to-orange-800/20 dark:border-orange-700/50 hover-lift group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-support-green/5 to-support-green/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="pb-2 relative z-10">
                <CardTitle className="text-lg flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5 text-support-green" />
                  Taxa de Aprovação
                </CardTitle>
                <CardDescription>Média geral do sistema</CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold">{metrics.taxaAprovacaoGeral}%</div>
                <p className="text-sm text-muted-foreground mt-2">
                  <span className="text-support-green">
                    {metrics.tempoMedioResposta} dias tempo médio
                  </span>
                </p>
              </CardContent>
            </div>
          </MouseTilt>
        </AnimatedSection>
      </div>

      {/* Gráficos e Estatísticas */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Gráfico de Solicitações por Mês */}
        <AnimatedSection delay={500}>
          <div className="lco-card hover:shadow-2xl transition-all duration-500 overflow-hidden h-[400px] group">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Solicitações por Mês</span>
              </CardTitle>
              <CardDescription>Evolução das solicitações ao longo do ano</CardDescription>
            </CardHeader>
            <CardContent className="p-6 h-[320px] bg-gradient-to-br from-background via-background to-muted/20">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart 
                  data={chartData || []} 
                  margin={{ top: 20, right: 40, left: 20, bottom: 20 }}
                >
                  <defs>
                    {/* Gradiente moderno para Solicitações */}
                    <linearGradient id="solicitacoesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                      <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.05}/>
                    </linearGradient>
                    
                    {/* Gradiente moderno para Aprovadas */}
                    <linearGradient id="aprovacoesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--secondary))" stopOpacity={0.8}/>
                      <stop offset="50%" stopColor="hsl(var(--secondary))" stopOpacity={0.4}/>
                      <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity={0.05}/>
                    </linearGradient>
                    
                    {/* Gradiente moderno para Pendentes */}
                    <linearGradient id="pendentesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.8}/>
                      <stop offset="50%" stopColor="hsl(var(--accent))" stopOpacity={0.4}/>
                      <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0.05}/>
                    </linearGradient>
                    
                    {/* Filtro de sombra para efeito neon */}
                    <filter id="neonGlow">
                      <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="hsl(var(--primary))" floodOpacity="0.3"/>
                    </filter>
                  </defs>
                  
                  {/* Grid moderno com opacidade reduzida */}
                  <CartesianGrid 
                    strokeDasharray="5 5" 
                    opacity={0.08} 
                    stroke="hsl(var(--border))"
                    strokeWidth={1}
                  />
                  
                  {/* Eixo X modernizado */}
                  <XAxis 
                    dataKey="mes" 
                    tick={{ 
                      fill: 'hsl(var(--muted-foreground))', 
                      fontSize: 11,
                      fontWeight: 500
                    }}
                    axisLine={{ 
                      stroke: 'hsl(var(--border))', 
                      strokeWidth: 1,
                      opacity: 0.3
                    }}
                    tickLine={{ 
                      stroke: 'hsl(var(--border))', 
                      strokeWidth: 1,
                      opacity: 0.3
                    }}
                    tickMargin={8}
                  />
                  
                  {/* Eixo Y modernizado */}
                  <YAxis 
                    tick={{ 
                      fill: 'hsl(var(--muted-foreground))', 
                      fontSize: 11,
                      fontWeight: 500
                    }}
                    axisLine={{ 
                      stroke: 'hsl(var(--border))', 
                      strokeWidth: 1,
                      opacity: 0.3
                    }}
                    tickLine={{ 
                      stroke: 'hsl(var(--border))', 
                      strokeWidth: 1,
                      opacity: 0.3
                    }}
                    tickMargin={8}
                  />
                  
                  {/* Tooltip modernizado */}
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                      color: 'hsl(var(--foreground))'
                    }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  
                  {/* Legend modernizada */}
                  <Legend 
                    wrapperStyle={{
                      paddingTop: '20px',
                      color: 'hsl(var(--foreground))'
                    }}
                  />
                  
                  {/* Áreas com gradientes modernos */}
                  <Area 
                    type="monotone" 
                    dataKey="solicitacoes" 
                    stackId="1" 
                    stroke="hsl(var(--primary))" 
                    fill="url(#solicitacoesGradient)" 
                    fillOpacity={0.8}
                    strokeWidth={2}
                    filter="url(#neonGlow)"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="aprovacoes" 
                    stackId="1" 
                    stroke="hsl(var(--secondary))" 
                    fill="url(#aprovacoesGradient)" 
                    fillOpacity={0.8}
                    strokeWidth={2}
                    filter="url(#neonGlow)"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="pendentes" 
                    stackId="1" 
                    stroke="hsl(var(--accent))" 
                    fill="url(#pendentesGradient)" 
                    fillOpacity={0.8}
                    strokeWidth={2}
                    filter="url(#neonGlow)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </div>
        </AnimatedSection>

        {/* Gráfico de Pizza - Status das Solicitações */}
        <AnimatedSection delay={300}>
          <div className="lco-card hover:shadow-2xl transition-all duration-500 h-[400px] group">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PieChart className="h-5 w-5" />
                <span>Status das Solicitações</span>
              </CardTitle>
              <CardDescription>Distribuição por status atual</CardDescription>
            </CardHeader>
            <CardContent className="h-[320px] flex justify-center">
              {statusData && statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.2"/>
                      </filter>
                    </defs>
                    <Pie
                      data={statusData || []}
                      cx="50%"
                      cy="60%"
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
                      {statusData && statusData.map((entry, index) => (
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
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <PieChart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum dado disponível</p>
                  </div>
                </div>
              )}
            </CardContent>
          </div>
        </AnimatedSection>
      </div>

      {/* Gráfico de Linha - Tendências do Sistema (Largura Total) */}
      <AnimatedSection delay={600}>
        <div className="lco-card hover:shadow-2xl transition-all duration-500 h-[400px] group">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Tendências do Sistema</span>
            </CardTitle>
            <CardDescription>Evolução dos principais indicadores</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData || []} margin={{ top: 20, right: 40, left: 20, bottom: 20 }}>
                <defs>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                  </linearGradient>
                  <filter id="lineShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.2"/>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} stroke="var(--border)" />
                <XAxis 
                  dataKey="periodo" 
                  tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                  axisLine={{ stroke: 'var(--border)' }}
                />
                <YAxis 
                  dataKey="usuarios" 
                  tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                  axisLine={{ stroke: 'var(--border)' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
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
                <Line
                  type="monotone"
                  dataKey="solicitacoes"
                  name="Solicitações"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  fill="url(#lineGradient)"
                  filter="url(#lineShadow)"
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="aprovacoes"
                  name="Aprovações"
                  stroke="hsl(var(--secondary))"
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--secondary))', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: 'hsl(var(--secondary))', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </div>
      </AnimatedSection>

      {/* As listagens detalhadas foram removidas para manter o dashboard focado em visão geral */}

      {/* Performance das Clínicas */}
      <AnimatedSection delay={700}>
        <div className="lco-card hover:shadow-2xl transition-all duration-500 group">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Performance das Clínicas</span>
            </CardTitle>
            <CardDescription>Taxa de aprovação por clínica</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={clinicas || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#79d153" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#79d153" stopOpacity={0.3}/>
                  </linearGradient>
                  <filter id="barShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.2"/>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} stroke="var(--border)" />
                <XAxis 
                  dataKey="nome" 
                  tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                  axisLine={{ stroke: 'var(--border)' }}
                  angle={-20}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                  axisLine={{ stroke: 'var(--border)' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    color: 'hsl(var(--foreground))'
                  }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: any, name: any) => [`${value}%`, name]}
                />
                <Bar 
                  dataKey="taxaAprovacao" 
                  fill="url(#barGradient)" 
                  radius={[6, 6, 0, 0]}
                  filter="url(#barShadow)"
                  name="Taxa de Aprovação"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </div>
      </AnimatedSection>

      {/* Resumo Rápido */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <AnimatedSection delay={800}>
          <div className="lco-card bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200 dark:from-amber-900/20 dark:to-amber-800/20 dark:border-amber-700/50 hover:shadow-xl transition-all duration-300 hover-lift group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300">Solicitações Hoje</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-amber-900 dark:text-amber-100">{metrics.solicitacoesHoje}</div>
              <p className="text-xs text-amber-600 dark:text-amber-400">Novas solicitações</p>
            </CardContent>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={900}>
          <div className="lco-card bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200 dark:from-emerald-900/20 dark:to-amber-800/20 dark:border-emerald-700/50 hover:shadow-xl transition-all duration-300 hover-lift group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Princípios Ativos</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">{metrics.totalPrincipiosAtivos}</div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">Cadastrados no sistema</p>
            </CardContent>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={1000}>
          <div className="lco-card bg-gradient-to-r from-rose-50 to-rose-100 border-rose-200 dark:from-rose-900/20 dark:to-rose-800/20 dark:border-rose-700/50 hover:shadow-xl transition-all duration-300 hover-lift group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-rose-700 dark:text-rose-300">Tempo Médio</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-rose-900 dark:text-rose-100">{metrics.tempoMedioResposta}d</div>
              <p className="text-xs text-rose-600 dark:text-rose-400">Resposta das operadoras</p>
            </CardContent>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
};

export default DashboardAdmin;
