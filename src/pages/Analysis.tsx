import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { InteractiveAnatomy } from '@/components/anatomy/InteractiveAnatomy';
import OperatorAnatomyTooltip from '@/components/anatomy/OperatorAnatomyTooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Filter, Activity, BarChart3, Users, TrendingUp, AlertCircle, Loader2, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AnimatedSection from '@/components/AnimatedSection';
import { MouseTilt } from '@/components/MouseTilt';
import { AnalysisService, AnalysisMetrics } from '@/services/analysisService';

// Mock data for charts
const medicationData = [
  { name: 'Trastuzumabe', value: 35 },
  { name: 'Bevacizumabe', value: 25 },
  { name: 'Pembrolizumabe', value: 20 },
  { name: 'Rituximabe', value: 15 },
  { name: 'Outros', value: 5 },
];

const monthlyData = [
  { name: 'Jan', cost: 120000, patients: 35 },
  { name: 'Fev', cost: 145000, patients: 42 },
  { name: 'Mar', cost: 132000, patients: 38 },
  { name: 'Abr', cost: 170000, patients: 55 },
  { name: 'Mai', cost: 190000, patients: 65 },
];

const cancerTypeData = [
  { name: 'Mama', cases: 42 },
  { name: 'Pulmão', cases: 28 },
  { name: 'Colorretal', cases: 22 },
  { name: 'Próstata', cases: 18 },
  { name: 'Linfomas', cases: 15 },
  { name: 'Outros', cases: 30 },
];

const costReductionData = [
  { name: 'Jan', traditional: 200000, lowCost: 120000 },
  { name: 'Fev', traditional: 220000, lowCost: 145000 },
  { name: 'Mar', traditional: 210000, lowCost: 132000 },
  { name: 'Abr', traditional: 260000, lowCost: 170000 },
  { name: 'Mai', traditional: 280000, lowCost: 190000 },
];

// Custom colors that match our brand
const COLORS = ['#79d153', '#8cb369', '#e4a94f', '#f26b6b', '#f7c59f', '#575654'];

const Analysis = () => {
  const { user, isAuthenticated } = useAuth();
  
  console.log('🔧 Analysis - User:', user);
  console.log('🔧 Analysis - IsAuthenticated:', isAuthenticated);
  
  // Estados para dados
  const [metrics, setMetrics] = useState<AnalysisMetrics | null>(null);
  const [organData, setOrganData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrgan, setSelectedOrgan] = useState<any>(null);
  const [organKey, setOrganKey] = useState(0);
  
  // Filtros
  const [clinicId, setClinicId] = useState<number | undefined>(undefined);
  const [sex, setSex] = useState<'M' | 'F' | 'O' | undefined>(undefined);
  const [ageMin, setAgeMin] = useState<number | undefined>(undefined);
  const [ageMax, setAgeMax] = useState<number | undefined>(undefined);

  const filters = { clinicId, sex, ageMin, ageMax };

  // Debug: Log quando selectedOrgan muda
  useEffect(() => {
    console.log('🔧 selectedOrgan mudou:', selectedOrgan);
    if (selectedOrgan) {
      console.log('🔧 Dados do órgão selecionado:', {
        name: selectedOrgan.name,
        patients: selectedOrgan.patients,
        cids: selectedOrgan.cids,
        protocols: selectedOrgan.protocols
      });
    }
  }, [selectedOrgan]);

  // Carregar dados de análise
  useEffect(() => {
    const loadAnalysisData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔧 Carregando dados de análise...', filters);
        
        // Dados mock para operadora (enquanto backend não implementa os endpoints)
        const mockMetrics: AnalysisMetrics = {
          totalSolicitacoes: 156,
          totalPacientes: 89,
          sistemasMonitorados: 8,
          protocolosAtivos: 12,
          cidsCadastrados: 24
        };

        const mockOrganData = [
          {
            organId: 'brain',
            organName: 'Cérebro',
            patients: 15,
            cids: ['C71.0', 'C71.1', 'C71.9'],
            protocols: ['Protocolo Glioma', 'Protocolo Meningioma'],
            color: 'medical-purple',
            description: 'Tumores primários do sistema nervoso central',
            solicitacoes: []
          },
          {
            organId: 'lungs',
            organName: 'Pulmões',
            patients: 28,
            cids: ['C34.0', 'C34.1', 'C34.9'],
            protocols: ['Protocolo NSCLC', 'Protocolo SCLC'],
            color: 'medical-blue',
            description: 'Carcinomas pulmonares e metástases',
            solicitacoes: []
          },
          {
            organId: 'breast',
            organName: 'Mama',
            patients: 32,
            cids: ['C50.0', 'C50.1', 'C50.9'],
            protocols: ['Protocolo HER2+', 'Protocolo TNBC'],
            color: 'medical-pink',
            description: 'Carcinomas mamários',
            solicitacoes: []
          },
          {
            organId: 'liver',
            organName: 'Fígado',
            patients: 18,
            cids: ['C22.0', 'C22.1', 'C22.9'],
            protocols: ['Protocolo Hepatocarcinoma'],
            color: 'medical-orange',
            description: 'Hepatocarcinoma e metástases hepáticas',
            solicitacoes: []
          },
          {
            organId: 'stomach',
            organName: 'Estômago',
            patients: 12,
            cids: ['C16.0', 'C16.1', 'C16.9'],
            protocols: ['Protocolo Gástrico'],
            color: 'medical-teal',
            description: 'Adenocarcinomas gástricos',
            solicitacoes: []
          },
          {
            organId: 'kidneys',
            organName: 'Rins',
            patients: 8,
            cids: ['C64', 'C65'],
            protocols: ['Protocolo Renal'],
            color: 'medical-red',
            description: 'Carcinomas renais',
            solicitacoes: []
          }
        ];
        
        console.log('✅ Dados mock carregados:', {
          metrics: mockMetrics,
          organs: mockOrganData.length
        });
        
        setMetrics(mockMetrics);
        setOrganData(mockOrganData);
        
      } catch (err) {
        console.error('❌ Erro ao carregar dados de análise:', err);
        setError('Erro ao carregar dados de análise');
      } finally {
        setLoading(false);
      }
    };

    loadAnalysisData();
  }, [filters.clinicId, filters.sex, filters.ageMin, filters.ageMax]);
  
  // Se não estiver autenticado, mostrar mensagem
  if (!isAuthenticated) {
    return (
      <div className="space-y-6 animate-fade-in p-6">
        <h1 className="text-2xl font-bold text-foreground">Acesso Negado</h1>
        <p className="text-muted-foreground">Você precisa estar logado para acessar esta página.</p>
      </div>
    );
  }

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
              Análises Anatômicas • Operadora
            </h1>
            <p className="text-muted-foreground mt-1">
              Visualize dados de pacientes por sistema corporal com filtros avançados
            </p>
          </div>
        </div>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total de Pacientes */}
        <AnimatedSection delay={100}>
          <MouseTilt maxTilt={5} scale={1.02}>
            <Card className="lco-card hover-lift group relative overflow-hidden h-32">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-4 relative z-10 h-full flex flex-col justify-center">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground leading-tight">Total Pacientes</p>
                    <p className="text-xl font-bold text-primary">
                      {metrics?.totalPacientes || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">atendidos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </MouseTilt>
        </AnimatedSection>

        {/* Total de Solicitações */}
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
                    <p className="text-xs font-medium text-muted-foreground leading-tight">Solicitações</p>
                    <p className="text-xl font-bold text-blue-500">
                      {metrics?.totalSolicitacoes || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">processadas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </MouseTilt>
        </AnimatedSection>

        {/* Sistemas Monitorados */}
        <AnimatedSection delay={300}>
          <MouseTilt maxTilt={5} scale={1.02}>
            <Card className="lco-card hover-lift group relative overflow-hidden h-32">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-4 relative z-10 h-full flex flex-col justify-center">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Activity className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground leading-tight">Sistemas</p>
                    <p className="text-xl font-bold text-green-500">
                      {metrics?.sistemasMonitorados || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">monitorados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </MouseTilt>
        </AnimatedSection>

        {/* Protocolos Ativos */}
        <AnimatedSection delay={400}>
          <MouseTilt maxTilt={5} scale={1.02}>
            <Card className="lco-card hover-lift group relative overflow-hidden h-32">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-4 relative z-10 h-full flex flex-col justify-center">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground leading-tight">Protocolos</p>
                    <p className="text-xl font-bold text-purple-500">
                      {metrics?.protocolosAtivos || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">ativos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </MouseTilt>
        </AnimatedSection>

        {/* CIDs Cadastrados */}
        <AnimatedSection delay={500}>
          <MouseTilt maxTilt={5} scale={1.02}>
            <Card className="lco-card hover-lift group relative overflow-hidden h-32">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-4 relative z-10 h-full flex flex-col justify-center">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground leading-tight">CIDs</p>
                    <p className="text-xl font-bold text-orange-500">
                      {metrics?.cidsCadastrados || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">cadastrados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </MouseTilt>
        </AnimatedSection>

        {/* Clínicas Parceiras */}
        <AnimatedSection delay={600}>
          <MouseTilt maxTilt={5} scale={1.02}>
            <Card className="lco-card hover-lift group relative overflow-hidden h-32">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-4 relative z-10 h-full flex flex-col justify-center">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-teal-500/10 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-teal-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground leading-tight">Clínicas</p>
                    <p className="text-xl font-bold text-teal-500">4</p>
                    <p className="text-xs text-muted-foreground">parceiras</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </MouseTilt>
        </AnimatedSection>
      </div>

      {/* Filtros avançados */}
      <Card className="lco-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Filter className="w-5 h-5" /> Filtros Avançados</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1"><Building2 className="w-4 h-4" /> Clínica</div>
            <Select onValueChange={(v) => setClinicId(v === 'todas' ? undefined : Number(v))}>
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="1">Clínica Onco Vida</SelectItem>
                <SelectItem value="2">Centro Oncológico Alfa</SelectItem>
                <SelectItem value="3">Instituto Beta</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">Sexo</div>
            <Select onValueChange={(v) => setSex(v === 'todos' ? undefined : (v as 'M'|'F'|'O'))}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="M">Masculino</SelectItem>
                <SelectItem value="F">Feminino</SelectItem>
                <SelectItem value="O">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">Idade mínima</div>
            <Input type="number" min={0} max={120} placeholder="Ex.: 18" onChange={(e) => setAgeMin(e.target.value ? Number(e.target.value) : undefined)} />
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">Idade máxima</div>
            <Input type="number" min={0} max={120} placeholder="Ex.: 80" onChange={(e) => setAgeMax(e.target.value ? Number(e.target.value) : undefined)} />
          </div>
        </CardContent>
      </Card>
      {/* Corpo humano interativo com detalhes ao lado */}
      <Card key={organKey} className="lco-card">
        <CardHeader>
          <CardTitle>Mapa Anatômico • Incidência por Órgão</CardTitle>
          <p className="text-sm text-muted-foreground">
            Clique em um órgão para ver detalhes dos pacientes
          </p>
        </CardHeader>
        <CardContent>
          {selectedOrgan ? (
            /* Layout com órgão selecionado - 3 colunas */
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              {/* Coluna Esquerda - Estatísticas e CIDs */}
              <div className="xl:col-span-3 space-y-4">
                {/* Header do Órgão */}
                <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: `hsl(var(--medical-${selectedOrgan.color}))` }}
                  />
                  <div>
                    <h3 className="text-lg font-semibold">{selectedOrgan.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedOrgan.description}</p>
                  </div>
                </div>

                {/* Estatísticas Principais */}
                <div className="space-y-3">
                  <h4 className="text-base font-semibold text-foreground">Estatísticas</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg">
                      <span className="text-sm font-medium">Total de Pacientes</span>
                      <span className="text-xl font-bold text-primary">{selectedOrgan.patients}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-500/5 rounded-lg">
                      <span className="text-sm font-medium">CIDs Únicos</span>
                      <span className="text-xl font-bold text-blue-500">{selectedOrgan.cids.length}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-500/5 rounded-lg">
                      <span className="text-sm font-medium">Protocolos Ativos</span>
                      <span className="text-xl font-bold text-green-500">{selectedOrgan.protocols.length}</span>
                    </div>
                  </div>
                </div>

                {/* CIDs Principais */}
                <div className="space-y-3">
                  <h4 className="text-base font-semibold text-foreground">CIDs Principais</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedOrgan.cids.map((cid: string, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                        <span className="font-mono text-sm">{cid}</span>
                        <Badge variant="secondary" className="text-xs">
                          {Math.floor(Math.random() * 20) + 1} casos
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Distribuição por Idade */}
                <div className="space-y-3">
                  <h4 className="text-base font-semibold text-foreground">Distribuição por Idade</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { range: '0-30', count: Math.floor(selectedOrgan.patients * 0.1), color: 'bg-blue-500' },
                      { range: '31-50', count: Math.floor(selectedOrgan.patients * 0.25), color: 'bg-green-500' },
                      { range: '51-70', count: Math.floor(selectedOrgan.patients * 0.45), color: 'bg-yellow-500' },
                      { range: '70+', count: Math.floor(selectedOrgan.patients * 0.2), color: 'bg-red-500' }
                    ].map((ageGroup, index) => (
                      <div key={index} className="text-center">
                        <div className={`h-8 ${ageGroup.color} rounded-lg flex items-center justify-center mb-1`}>
                          <span className="text-white font-bold text-xs">{ageGroup.count}</span>
                        </div>
                        <div className="text-xs font-medium">{ageGroup.range}</div>
                        <div className="text-xs text-muted-foreground">
                          {Math.round((ageGroup.count / selectedOrgan.patients) * 100)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Coluna Central - Corpo Humano */}
              <div className="xl:col-span-6">
                <div className="w-full overflow-x-auto">
                  <div className="min-w-[600px]">
                    <InteractiveAnatomy 
                      filters={filters} 
                      TooltipComponent={OperatorAnatomyTooltip}
                      onOrganSelect={(organ) => {
                        console.log('🔧 Órgão selecionado:', organ);
                        setSelectedOrgan(organ);
                        setOrganKey(prev => prev + 1); // Forçar re-renderização
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Coluna Direita - Protocolos e KPIs */}
              <div className="xl:col-span-3 space-y-4">
                {/* Protocolos de Tratamento */}
                <div className="space-y-3">
                  <h4 className="text-base font-semibold text-foreground">Protocolos de Tratamento</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedOrgan.protocols.map((protocol: string, index: number) => (
                      <div key={index} className="p-3 bg-muted/30 rounded-lg border border-border/50">
                        <div className="flex items-center gap-2 mb-1">
                          <Activity className="h-4 w-4 text-primary" />
                          <span className="font-medium text-sm">{protocol}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {Math.floor(Math.random() * 15) + 5} pacientes ativos
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* KPIs Operacionais */}
                <div className="space-y-3">
                  <h4 className="text-base font-semibold text-foreground">KPIs Operacionais</h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <h5 className="font-semibold text-sm mb-2">Taxa de Aprovação</h5>
                      <div className="text-2xl font-bold text-support-green">
                        {Math.floor(Math.random() * 20) + 75}%
                      </div>
                      <div className="text-xs text-muted-foreground">Últimos 30 dias</div>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <h5 className="font-semibold text-sm mb-2">Tempo Médio de Aprovação</h5>
                      <div className="text-2xl font-bold text-primary">
                        {Math.floor(Math.random() * 48) + 12}h
                      </div>
                      <div className="text-xs text-muted-foreground">SLA atual</div>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <h5 className="font-semibold text-sm mb-2">Custo Médio por Paciente</h5>
                      <div className="text-2xl font-bold text-highlight-peach">
                        R$ {Math.floor(Math.random() * 5000) + 2000}
                      </div>
                      <div className="text-xs text-muted-foreground">Tratamento completo</div>
                    </div>
                  </div>
                </div>

                {/* Informações Adicionais */}
                <div className="space-y-3">
                  <h4 className="text-base font-semibold text-foreground">Informações Adicionais</h4>
                  <div className="space-y-2">
                    <div className="p-2 bg-muted/20 rounded-lg">
                      <div className="text-xs font-medium text-muted-foreground">Última Atualização</div>
                      <div className="text-sm font-semibold">Hoje, 14:30</div>
                    </div>
                    <div className="p-2 bg-muted/20 rounded-lg">
                      <div className="text-xs font-medium text-muted-foreground">Status do Sistema</div>
                      <div className="text-sm font-semibold text-support-green">Ativo</div>
                    </div>
                    <div className="p-2 bg-muted/20 rounded-lg">
                      <div className="text-xs font-medium text-muted-foreground">Próxima Revisão</div>
                      <div className="text-sm font-semibold">Em 7 dias</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Layout sem seleção - Corpo humano centralizado com instruções */
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="w-full overflow-x-auto">
                <div className="min-w-[600px]">
                  <InteractiveAnatomy 
                    filters={filters} 
                    TooltipComponent={OperatorAnatomyTooltip}
                    onOrganSelect={(organ) => {
                      console.log('🔧 Órgão selecionado:', organ);
                      setSelectedOrgan(organ);
                      setOrganKey(prev => prev + 1); // Forçar re-renderização
                    }}
                  />
                </div>
              </div>
              
              {/* Card de Instruções */}
              <div className="max-w-md mx-auto">
                <div className="text-center space-y-3 text-muted-foreground p-6 bg-muted/30 rounded-lg">
                  <Activity className="h-12 w-12 mx-auto text-primary/50" />
                  <div>
                    <p className="text-lg font-medium">Selecione um órgão</p>
                    <p className="text-sm">Clique em um órgão no mapa para ver os detalhes dos pacientes</p>
                  </div>
                  <ul className="text-xs space-y-1 text-left">
                    <li>• Número de pacientes</li>
                    <li>• CIDs principais</li>
                    <li>• Protocolos ativos</li>
                    <li>• Estatísticas detalhadas</li>
                    <li>• KPIs operacionais</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">Usuário: {user?.username || 'N/A'} | Role: {user?.role || 'N/A'}</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="lco-card">
          <CardHeader>
            <CardTitle>Distribuição de Medicamentos</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={medicationData}
                  cx="50%"
                  cy="60%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {medicationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="lco-card">
          <CardHeader>
            <CardTitle>Tipos de Câncer Tratados</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={cancerTypeData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="cases" fill="#79d153" name="Número de Casos" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="lco-card">
          <CardHeader>
            <CardTitle>Custos e Pacientes por Mês</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={monthlyData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" stroke="#79d153" />
                <YAxis yAxisId="right" orientation="right" stroke="#8cb369" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="cost" stroke="#79d153" name="Custos (R$)" />
                <Line yAxisId="right" type="monotone" dataKey="patients" stroke="#8cb369" name="Pacientes" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="lco-card">
          <CardHeader>
            <CardTitle>Economia vs. Modelo Tradicional</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={costReductionData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="traditional" fill="#f26b6b" name="Modelo Tradicional (R$)" />
                <Bar dataKey="lowCost" fill="#8cb369" name="Low Cost Onco (R$)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      <Card className="lco-card">
        <CardHeader>
          <CardTitle>Indicadores de Desempenho</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 border rounded-lg">
              <h3 className="text-lg font-medium mb-2">Economia Total</h3>
              <p className="text-3xl font-bold text-support-green">R$ 523.000</p>
              <p className="text-sm text-muted-foreground mt-2">vs. modelo tradicional</p>
            </div>
            
            <div className="text-center p-6 border rounded-lg">
              <h3 className="text-lg font-medium mb-2">Eficiência de Tratamento</h3>
              <p className="text-3xl font-bold text-primary-green">87%</p>
              <p className="text-sm text-muted-foreground mt-2">taxa de resposta positiva</p>
            </div>
            
            <div className="text-center p-6 border rounded-lg">
              <h3 className="text-lg font-medium mb-2">Satisfação do Paciente</h3>
              <p className="text-3xl font-bold text-highlight-peach">9.2/10</p>
              <p className="text-sm text-muted-foreground mt-2">baseado em pesquisas</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analysis;
