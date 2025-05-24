import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { VialIcon, PillIcon, SyringeIcon } from '@/components/MedicalIcons';
import { CalendarIcon, UsersIcon, ChartPieIcon } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AnimatedSection from '@/components/AnimatedSection';
import { cn } from '@/lib/utils';
import { MouseTilt } from '@/components/MouseTilt';

// Dados para gráficos
const medicationData = [
  { name: 'Jan', rituximabe: 30, trastuzumabe: 45, bevacizumabe: 20 },
  { name: 'Fev', rituximabe: 35, trastuzumabe: 40, bevacizumabe: 25 },
  { name: 'Mar', rituximabe: 25, trastuzumabe: 50, bevacizumabe: 30 },
  { name: 'Abr', rituximabe: 40, trastuzumabe: 55, bevacizumabe: 35 },
  { name: 'Mai', rituximabe: 45, trastuzumabe: 45, bevacizumabe: 40 },
  { name: 'Jun', rituximabe: 50, trastuzumabe: 60, bevacizumabe: 35 },
];

const treatmentData = [
  { name: 'Quimioterapia', value: 40 },
  { name: 'Radioterapia', value: 30 },
  { name: 'Imunoterapia', value: 20 },
  { name: 'Cirurgia', value: 10 },
];

// Atualizando as cores para um esquema mais moderno com efeitos neon
const COLORS = [
  {
    fill: '#8cb369',
    stroke: '#a8c97d',
    glow: '0 0 10px rgba(140, 179, 105, 0.5)'
  },
  {
    fill: '#e4a94f',
    stroke: '#f2c94c',
    glow: '0 0 10px rgba(228, 169, 79, 0.5)'
  },
  {
    fill: '#f26b6b',
    stroke: '#ff8f8f',
    glow: '0 0 10px rgba(242, 107, 107, 0.5)'
  },
  {
    fill: '#c6d651',
    stroke: '#d4e37b',
    glow: '0 0 10px rgba(198, 214, 81, 0.5)'
  }
];

const patientStatusData = [
  { name: 'Em tratamento', count: 28 },
  { name: 'Em remissão', count: 14 },
  { name: 'Monitoramento', count: 8 },
  { name: 'Alta', count: 6 },
];

// Dados para tratamentos a vencer
const upcomingTreatmentsData = [
  {
    id: '1',
    patientName: 'Maria Silva',
    treatmentType: 'Quimioterapia',
    daysRemaining: 3,
    cycle: '4/6',
    status: 'urgent'
  },
  {
    id: '2',
    patientName: 'João Mendes',
    treatmentType: 'Radioterapia',
    daysRemaining: 5,
    cycle: '2/8',
    status: 'warning'
  },
  {
    id: '3',
    patientName: 'Ana Costa',
    treatmentType: 'Imunoterapia',
    daysRemaining: 7,
    cycle: '3/4',
    status: 'normal'
  },
  {
    id: '4',
    patientName: 'Carlos Santos',
    treatmentType: 'Quimioterapia',
    daysRemaining: 2,
    cycle: '5/6',
    status: 'urgent'
  }
];

const Dashboard = () => {
  const { user } = useAuth();
  
  // Different dashboard content based on user role
  const renderDashboardContent = () => {
    if (user?.role === 'clinic') {
      return <ClinicDashboard />;
    } else if (user?.role === 'operator') {
      return <OperatorDashboard />;
    } else {
      return <HealthPlanDashboard />;
    }
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      {renderDashboardContent()}
    </div>
  );
};

const ClinicDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AnimatedSection delay={100}>
          <MouseTilt maxTilt={5} scale={1.02}>
            <Card className="lco-card hover-lift">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <UsersIcon className="mr-2 h-5 w-5 text-support-green" />
                  Pacientes
                </CardTitle>
                <CardDescription>Total de pacientes ativos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">42</div>
                <p className="text-sm text-muted-foreground mt-2">
                  <span className="text-support-green">↑ 8%</span> desde o último mês
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
                  <CalendarIcon className="mr-2 h-5 w-5 text-support-yellow" />
                  Tratamentos
                </CardTitle>
                <CardDescription>Tratamentos em andamento</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">28</div>
                <p className="text-sm text-muted-foreground mt-2">
                  <span className="text-highlight-red">↓ 3%</span> desde o último mês
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
                  Gastos Mensais
                </CardTitle>
                <CardDescription>Medicamentos oncológicos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">R$ 127.450,00</div>
                <p className="text-sm text-muted-foreground mt-2">
                  <span className="text-support-green">↓ 5%</span> desde o último mês
                </p>
              </CardContent>
            </Card>
          </MouseTilt>
        </AnimatedSection>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatedSection delay={400}>
          <Card className="lco-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <PillIcon className="mr-2" />
                Medicamentos Mais Utilizados
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={medicationData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="rituximabe" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8cb369" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8cb369" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="trastuzumabe" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e4a94f" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#e4a94f" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="bevacizumabe" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c6d651" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#c6d651" stopOpacity={0.1}/>
                    </linearGradient>
                    <filter id="areaShadow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.2"/>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} stroke="var(--border)" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ 
                      fill: 'hsl(var(--foreground))',
                      fontSize: 12
                    }}
                    axisLine={{ stroke: 'var(--border)' }}
                    tickLine={{ stroke: 'var(--border)' }}
                  />
                  <YAxis 
                    tick={{ 
                      fill: 'hsl(var(--foreground))',
                      fontSize: 12
                    }}
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
                            {payload.map((entry, index) => (
                              <p key={index} className="text-sm text-muted-foreground">
                                {entry.name}: {entry.value} unidades
                              </p>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend 
                    wrapperStyle={{
                      paddingTop: '20px',
                      color: 'hsl(var(--foreground))'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="rituximabe" 
                    stackId="1"
                    stroke="#8cb369" 
                    fill="url(#rituximabe)" 
                    fillOpacity={0.8} 
                    animationDuration={1500}
                    strokeWidth={2}
                    filter="url(#areaShadow)"
                    className="transition-all duration-300 hover:brightness-110"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="trastuzumabe" 
                    stackId="1"
                    stroke="#e4a94f" 
                    fill="url(#trastuzumabe)" 
                    fillOpacity={0.8} 
                    animationDuration={1500}
                    strokeWidth={2}
                    filter="url(#areaShadow)"
                    className="transition-all duration-300 hover:brightness-110"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="bevacizumabe" 
                    stackId="1"
                    stroke="#c6d651" 
                    fill="url(#bevacizumabe)" 
                    fillOpacity={0.8} 
                    animationDuration={1500}
                    strokeWidth={2}
                    filter="url(#areaShadow)"
                    className="transition-all duration-300 hover:brightness-110"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </AnimatedSection>
        
        <AnimatedSection delay={500}>
          <Card className="lco-card">
            <CardHeader>
              <CardTitle>Distribuição de Tratamentos</CardTitle>
              <CardDescription>Por tipo de terapia</CardDescription>
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
                    data={treatmentData}
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
                    {treatmentData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length].fill}
                        stroke={COLORS[index % COLORS.length].stroke}
                        strokeWidth={2}
                        style={{
                          filter: `drop-shadow(${COLORS[index % COLORS.length].glow})`
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
                    itemStyle={{
                      color: 'hsl(var(--foreground))'
                    }}
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatedSection delay={600}>
          <Card className="lco-card">
            <CardHeader>
              <CardTitle>Status dos Pacientes</CardTitle>
              <CardDescription>Visão geral do progresso</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={patientStatusData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
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
                    tick={{ 
                      fill: 'hsl(var(--foreground))',
                      fontSize: 12
                    }}
                    axisLine={{ stroke: 'var(--border)' }}
                    tickLine={{ stroke: 'var(--border)' }}
                  />
                  <YAxis 
                    tick={{ 
                      fill: 'hsl(var(--foreground))',
                      fontSize: 12
                    }}
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

        <AnimatedSection delay={600}>
          <Card className="lco-card">
            <CardHeader>
              <CardTitle>Tratamentos a Vencer</CardTitle>
              <CardDescription>Próximos tratamentos programados</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] overflow-y-auto">
              <div className="space-y-4">
                {upcomingTreatmentsData.map((treatment) => (
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
                ))}
              </div>
            </CardContent>
          </Card>
        </AnimatedSection>
      </div>
    </div>
  );
};

const OperatorDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="lco-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <UsersIcon className="mr-2 h-5 w-5 text-support-green" />
              Clínicas Parceiras
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">17</div>
            <p className="text-sm text-muted-foreground mt-2">
              <span className="text-support-green">↑ 3</span> novas parcerias
            </p>
          </CardContent>
        </Card>
        
        <Card className="lco-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <VialIcon className="mr-2" />
              Tratamentos Aprovados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">135</div>
            <p className="text-sm text-muted-foreground mt-2">
              <span className="text-support-green">↑ 12%</span> desde o último período
            </p>
          </CardContent>
        </Card>
        
        <Card className="lco-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <ChartPieIcon className="mr-2 h-5 w-5 text-highlight-peach" />
              Economia Estimada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">R$ 1.45M</div>
            <p className="text-sm text-muted-foreground mt-2">
              <span className="text-support-green">↑ 8%</span> em comparação ao modelo tradicional
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card className="lco-card">
        <CardHeader>
          <CardTitle>Análise de Desempenho</CardTitle>
          <CardDescription>Visão geral dos principais indicadores</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center p-12 text-muted-foreground">
            Gráficos de análise da operadora serão exibidos aqui
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const HealthPlanDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="lco-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <UsersIcon className="mr-2 h-5 w-5 text-support-green" />
              Pacientes Atendidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">538</div>
            <p className="text-sm text-muted-foreground mt-2">
              <span className="text-support-green">↑ 7%</span> desde o último trimestre
            </p>
          </CardContent>
        </Card>
        
        <Card className="lco-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <SyringeIcon className="mr-2" />
              Autorizações Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">47</div>
            <p className="text-sm text-muted-foreground mt-2">
              <span className="text-highlight-red">↑ 15%</span> desde a última semana
            </p>
          </CardContent>
        </Card>
        
        <Card className="lco-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <ChartPieIcon className="mr-2 h-5 w-5 text-highlight-peach" />
              Gastos Totais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">R$ 4.72M</div>
            <p className="text-sm text-muted-foreground mt-2">
              <span className="text-support-green">↓ 12%</span> desde a adoção do programa
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card className="lco-card">
        <CardHeader>
          <CardTitle>Análise de Custos</CardTitle>
          <CardDescription>Distribuição de gastos por tipo de tratamento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center p-12 text-muted-foreground">
            Gráficos de gastos do plano de saúde serão exibidos aqui
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
