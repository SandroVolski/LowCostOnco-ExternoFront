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
import { useOperadoraAuth } from '@/contexts/OperadoraAuthContext';
import AnimatedSection from '@/components/AnimatedSection';
import { MouseTilt } from '@/components/MouseTilt';
import { AnalysisService, AnalysisMetrics, OperationalKPIs, ChartData } from '@/services/analysisService';
import { ClinicService, Clinica } from '@/services/clinicService';
import { operadoraAuthService } from '@/services/operadoraAuthService';
import config from '@/config/environment';

// Custom colors that match our brand
const COLORS = ['#79d153', '#8cb369', '#e4a94f', '#f26b6b', '#f7c59f', '#575654'];

const Analysis = () => {
  const { user, isAuthenticated } = useOperadoraAuth();
  
  console.log('🔧 Analysis - User:', user);
  console.log('🔧 Analysis - IsAuthenticated:', isAuthenticated);
  
  // Estados para dados
  const [metrics, setMetrics] = useState<AnalysisMetrics | null>(null);
  const [organData, setOrganData] = useState<any[]>([]);
  const [kpis, setKpis] = useState<OperationalKPIs | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrgan, setSelectedOrgan] = useState<any>(null);
  const [organKey, setOrganKey] = useState(0);
  const [clinics, setClinics] = useState<Clinica[]>([]);
  
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

  // Carregar dados de análise e clínicas reais
  useEffect(() => {
    const loadAnalysisData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔧 Carregando dados de análise...', filters);
        
        // Buscar todos os dados reais do backend
        let [metricsData, organsData, kpisData, chartsData, clinicsData, pacientesResp, solicitacoesResp] = await Promise.all([
          AnalysisService.getAnalysisMetrics(filters),
          AnalysisService.getOrganAnalysisData(filters),
          AnalysisService.getOperationalKPIs(filters),
          AnalysisService.getChartData(filters),
          ClinicService.getAllClinicasForOperadora(),
          // Buscar dados brutos para alinhar contagens com o Dashboard
          operadoraAuthService.authorizedFetch(`/api/pacientes?page=1&limit=10000`),
          operadoraAuthService.authorizedFetch(`/api/solicitacoes?page=1&limit=10000`)
        ]);
        
        console.log('✅ Dados reais carregados:', {
          metrics: metricsData,
          organs: organsData.length,
          kpis: kpisData,
          charts: chartsData,
          clinics: clinicsData?.length || 0
        });
        
        // Fallback quando authorizedFetch retorna null (HTML)
        if (!pacientesResp) {
          const token = localStorage.getItem('operadora_access_token') || '';
          pacientesResp = await fetch(`${config.API_BASE_URL}/pacientes?page=1&limit=10000`, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
        if (!solicitacoesResp) {
          const token = localStorage.getItem('operadora_access_token') || '';
          solicitacoesResp = await fetch(`${config.API_BASE_URL}/solicitacoes?page=1&limit=10000`, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }

        // Normalizar respostas de pacientes/solicitações, ignorando HTML
        let pacientes: any[] = [];
        let solicitacoes: any[] = [];
        try {
          const ctp = pacientesResp.headers.get('content-type') || '';
          if (!ctp.includes('application/json')) throw new Error('HTML pacientes');
          const pjson = await pacientesResp.json();
          pacientes = Array.isArray(pjson?.data?.data) ? pjson.data.data : Array.isArray(pjson?.data) ? pjson.data : [];
        } catch {}
        try {
          const cts = solicitacoesResp.headers.get('content-type') || '';
          if (!cts.includes('application/json')) throw new Error('HTML solicitacoes');
          const sjson = await solicitacoesResp.json();
          solicitacoes = Array.isArray(sjson?.data?.data) ? sjson.data.data : Array.isArray(sjson?.data) ? sjson.data : [];
        } catch {}

        // Aplicar filtros e restringir por clínicas da operadora
        const hasClinicas = Array.isArray(clinicsData) && clinicsData.length > 0;
        const clinicIdSet = new Set((clinicsData || []).map(c => c.id));

        const pacientesFiltrados = pacientes.filter(p => {
          if (!hasClinicas) return false;
          if (p?.clinica_id && !clinicIdSet.has(p.clinica_id)) return false;
          if (filters.clinicId && p.clinica_id !== filters.clinicId) return false;
          if (filters.sex && (p.Sexo || p.sexo) !== filters.sex) return false;
          if (typeof filters.ageMin === 'number' || typeof filters.ageMax === 'number') {
            const dob = p.Data_Nascimento || p.data_nascimento;
            if (dob) {
              const nascimento = new Date(dob);
              const hoje = new Date();
              const idade = Math.floor((hoje.getTime() - nascimento.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
              if (typeof filters.ageMin === 'number' && idade < filters.ageMin) return false;
              if (typeof filters.ageMax === 'number' && idade > filters.ageMax) return false;
            }
          }
          return true;
        });

        const solicitacoesFiltradas = solicitacoes.filter(s => {
          if (!hasClinicas) return false;
          if (s?.clinica_id && !clinicIdSet.has(s.clinica_id)) return false;
          if (filters.clinicId && s.clinica_id !== filters.clinicId) return false;
          return true;
        });

        // Pacientes distintos
        const pacientesUnicosCount = (() => {
          const ids = new Set<any>();
          for (const p of pacientesFiltrados) {
            const pid = p.id || p.paciente_id || p.Codigo || `${p.Paciente_Nome}-${p.Data_Nascimento}`;
            if (pid) ids.add(pid);
          }
          return ids.size;
        })();

        const metricsAligned: AnalysisMetrics = {
          totalSolicitacoes: hasClinicas ? solicitacoesFiltradas.length : 0,
          totalPacientes: hasClinicas ? pacientesUnicosCount : 0,
          sistemasMonitorados: hasClinicas ? (metricsData?.sistemasMonitorados || 0) : 0,
          protocolosAtivos: hasClinicas ? (metricsData?.protocolosAtivos || 0) : 0,
          cidsCadastrados: hasClinicas ? (metricsData?.cidsCadastrados || 0) : 0,
        };

        // KPIs e Charts: zerar quando não houver clínicas
        const kpisAligned: OperationalKPIs | null = hasClinicas ? kpisData : {
          taxaAprovacao: 0,
          tempoMedioAprovacao: 0,
          custoMedioPorPaciente: 0,
          totalSolicitacoes30Dias: 0,
          pacientesUnicos30Dias: 0,
        };

        const chartsAligned: ChartData | null = hasClinicas ? chartsData : {
          medicamentos: [],
          cancerTypes: [],
          monthlyData: [],
        } as any;

        // Organ data: se não houver clínicas, não mostrar órgãos
        const organsAligned = hasClinicas ? organsData : [];

        setMetrics(metricsAligned);
        setOrganData(organsAligned);
        setKpis(kpisAligned);
        setChartData(chartsAligned);
        setClinics(clinicsData || []);
        
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
                    <p className="text-xl font-bold text-teal-500">{clinics.length}</p>
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
                {clinics.map(c => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
                ))}
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
                    {selectedOrgan.cids && selectedOrgan.cids.length > 0 ? (
                      selectedOrgan.cids.map((cidData: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                          <span className="font-mono text-sm">{cidData.cid}</span>
                          <Badge variant="secondary" className="text-xs">
                            {cidData.count} casos
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-muted-foreground text-sm py-4">
                        Nenhum CID encontrado
                      </div>
                    )}
                  </div>
                </div>

                {/* Estatísticas do Órgão */}
                <div className="space-y-3">
                  <h4 className="text-base font-semibold text-foreground">Estatísticas do Órgão</h4>
                  <div className="space-y-2">
                    <div className="p-2 bg-muted/20 rounded-lg">
                      <div className="text-xs font-medium text-muted-foreground">Solicitações Processadas</div>
                      <div className="text-sm font-semibold">{selectedOrgan.solicitacoes?.length || 0}</div>
                    </div>
                    <div className="p-2 bg-muted/20 rounded-lg">
                      <div className="text-xs font-medium text-muted-foreground">Última Atualização</div>
                      <div className="text-sm font-semibold">{new Date().toLocaleDateString('pt-BR')}</div>
                    </div>
                    <div className="p-2 bg-muted/20 rounded-lg">
                      <div className="text-xs font-medium text-muted-foreground">Status</div>
                      <div className="text-sm font-semibold text-support-green">Ativo</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Coluna Central - Corpo Humano */}
              <div className="xl:col-span-6">
                <div className="w-full overflow-x-auto">
                  <div className="min-w-[600px]">
                    <InteractiveAnatomy 
                      filters={filters} 
                      TooltipComponent={(props) => <OperatorAnatomyTooltip {...props} hasSelection={!!selectedOrgan} />}
                      onOrganSelect={(organ) => {
                        console.log('🔧 onOrganSelect chamado com:', organ);
                        console.log('🔧 organ é null?', organ === null);
                        setSelectedOrgan(organ);
                        setOrganKey(prev => prev + 1); // Forçar re-renderização
                        console.log('🔧 selectedOrgan atualizado para:', organ);
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
                    {selectedOrgan.protocols && selectedOrgan.protocols.length > 0 ? (
                      selectedOrgan.protocols.map((protocolData: any, index: number) => (
                        <div key={index} className="p-3 bg-muted/30 rounded-lg border border-border/50">
                          <div className="flex items-center gap-2 mb-1">
                            <Activity className="h-4 w-4 text-primary" />
                            <span className="font-medium text-sm">{protocolData.protocol}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {protocolData.count} solicitações
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-muted-foreground text-sm py-4">
                        Nenhum protocolo encontrado
                      </div>
                    )}
                  </div>
                </div>

                {/* KPIs Operacionais */}
                <div className="space-y-3">
                  <h4 className="text-base font-semibold text-foreground">KPIs Operacionais</h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <h5 className="font-semibold text-sm mb-2">Taxa de Aprovação</h5>
                      <div className="text-2xl font-bold text-support-green">
                        {kpis?.taxaAprovacao || 0}%
                      </div>
                      <div className="text-xs text-muted-foreground">Últimos 30 dias</div>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <h5 className="font-semibold text-sm mb-2">Tempo Médio de Aprovação</h5>
                      <div className="text-2xl font-bold text-primary">
                        {kpis?.tempoMedioAprovacao || 0}h
                      </div>
                      <div className="text-xs text-muted-foreground">SLA atual</div>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <h5 className="font-semibold text-sm mb-2">Solicitações (30d)</h5>
                      <div className="text-2xl font-bold text-highlight-peach">
                        {kpis?.totalSolicitacoes30Dias || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Últimos 30 dias</div>
                    </div>
                  </div>
                </div>

                {/* Informações Adicionais */}
                <div className="space-y-3">
                  <h4 className="text-base font-semibold text-foreground">Informações Adicionais</h4>
                  <div className="space-y-2">
                    <div className="p-2 bg-muted/20 rounded-lg">
                      <div className="text-xs font-medium text-muted-foreground">Última Atualização</div>
                      <div className="text-sm font-semibold">{new Date().toLocaleString('pt-BR')}</div>
                    </div>
                    <div className="p-2 bg-muted/20 rounded-lg">
                      <div className="text-xs font-medium text-muted-foreground">Status do Sistema</div>
                      <div className="text-sm font-semibold text-support-green">Ativo</div>
                    </div>
                    <div className="p-2 bg-muted/20 rounded-lg">
                      <div className="text-xs font-medium text-muted-foreground">Solicitações (30d)</div>
                      <div className="text-sm font-semibold">{kpis?.totalSolicitacoes30Dias || 0}</div>
                    </div>
                    <div className="p-2 bg-muted/20 rounded-lg">
                      <div className="text-xs font-medium text-muted-foreground">Pacientes Únicos (30d)</div>
                      <div className="text-sm font-semibold">{kpis?.pacientesUnicos30Dias || 0}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Layout sem seleção - Corpo humano centralizado */
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="w-full overflow-x-auto">
                <div className="min-w-[600px]">
                  <InteractiveAnatomy 
                    filters={filters} 
                    TooltipComponent={(props) => <OperatorAnatomyTooltip {...props} hasSelection={!!selectedOrgan} />}
                    onOrganSelect={(organ) => {
                      console.log('🔧 onOrganSelect chamado com:', organ);
                      console.log('🔧 organ é null?', organ === null);
                      setSelectedOrgan(organ);
                      setOrganKey(prev => prev + 1); // Forçar re-renderização
                      console.log('🔧 selectedOrgan atualizado para:', organ);
                    }}
                  />
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
                <defs>
                  <linearGradient id="gradMed" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#79d153" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#8cb369" stopOpacity={0.95} />
                  </linearGradient>
                </defs>
                <Pie
                  data={chartData?.medicamentos || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={70}
                  fill="url(#gradMed)"
                  dataKey="value"
                  label={({ name, percent }) => {
                    // Mostrar apenas percentual para evitar sobreposição
                    return percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : '';
                  }}
                >
                  {(chartData?.medicamentos || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#0f172a" strokeWidth={1} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any, name: any) => [
                    `${value} solicitações`,
                    name
                  ]}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value: any) => {
                    // Truncar nomes longos
                    return value.length > 20 ? value.substring(0, 20) + '...' : value;
                  }}
                />
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
                data={chartData?.cancerTypes || []}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <defs>
                  <linearGradient id="gradBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#79d153" stopOpacity={1} />
                    <stop offset="100%" stopColor="#79d153" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="tipo_cancer" tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={{ stroke: '#374151' }} tickLine={{ stroke: '#374151' }} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={{ stroke: '#374151' }} tickLine={{ stroke: '#374151' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="casos" fill="url(#gradBar)" stroke="#79d153" name="Número de Casos" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="lco-card">
          <CardHeader>
            <CardTitle>Solicitações e Pacientes por Mês</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData?.monthlyData || []}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <defs>
                  <linearGradient id="gradLineA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#79d153" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#79d153" stopOpacity={0.2} />
                  </linearGradient>
                  <linearGradient id="gradLineB" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8cb369" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#8cb369" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={{ stroke: '#374151' }} tickLine={{ stroke: '#374151' }} />
                <YAxis yAxisId="left" orientation="left" stroke="#79d153" tick={{ fill: '#9CA3AF' }} />
                <YAxis yAxisId="right" orientation="right" stroke="#8cb369" tick={{ fill: '#9CA3AF' }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="solicitacoes" stroke="#79d153" strokeWidth={2} dot={false} name="Solicitações" />
                <Line yAxisId="right" type="monotone" dataKey="patients" stroke="#8cb369" strokeWidth={2} dot={false} name="Pacientes" />
              </LineChart>
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
              <h3 className="text-lg font-medium mb-2">Taxa de Aprovação</h3>
              <p className="text-3xl font-bold text-support-green">{kpis?.taxaAprovacao || 0}%</p>
              <p className="text-sm text-muted-foreground mt-2">últimos 30 dias</p>
            </div>
            
            <div className="text-center p-6 border rounded-lg">
              <h3 className="text-lg font-medium mb-2">Tempo Médio de Aprovação</h3>
              <p className="text-3xl font-bold text-primary">{kpis?.tempoMedioAprovacao || 0}h</p>
              <p className="text-sm text-muted-foreground mt-2">SLA atual</p>
            </div>
            
            <div className="text-center p-6 border rounded-lg">
              <h3 className="text-lg font-medium mb-2">Pacientes Únicos (30d)</h3>
              <p className="text-3xl font-bold text-highlight-peach">{kpis?.pacientesUnicos30Dias || 0}</p>
              <p className="text-sm text-muted-foreground mt-2">últimos 30 dias</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analysis;
