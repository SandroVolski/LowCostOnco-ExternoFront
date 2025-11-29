import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Eye, 
  Filter, 
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  LayoutGrid,
  List
} from 'lucide-react';
import { toast } from 'sonner';
import PDFViewerModal from '@/components/PDFViewerModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useOperadoraAuth } from '@/contexts/OperadoraAuthContext';
import { operadoraAuthService } from '@/services/operadoraAuthService';
import { ClinicService, Clinica } from '@/services/clinicService';
import AnimatedSection from '@/components/AnimatedSection';
import { MouseTilt } from '@/components/MouseTilt';
import { CardHoverEffect } from '@/components/ui/card-hover-effect';
import config from '@/config/environment';

// Interface para solicitações de autorização
interface SolicitacaoAutorizacao {
  id: number;
  clinica_id: number;
  paciente_id: number;
  hospital_nome: string;
  hospital_codigo: string;
  cliente_nome: string;
  cliente_codigo: string;
  sexo: 'M' | 'F';
  data_nascimento: string;
  idade: number;
  data_solicitacao: string;
  diagnostico_cid: string;
  diagnostico_descricao: string;
  local_metastases: string;
  estagio_t: string;
  estagio_n: string;
  estagio_m: string;
  estagio_clinico: string;
  tratamento_cirurgia_radio: string;
  tratamento_quimio_adjuvante: string;
  tratamento_quimio_primeira_linha: string;
  tratamento_quimio_segunda_linha: string;
  finalidade: 'neoadjuvante' | 'adjuvante' | 'curativo' | 'controle' | 'radioterapia' | 'paliativo';
  performance_status: string;
  siglas: string;
  ciclos_previstos: number;
  ciclo_atual: number;
  superficie_corporal: number;
  peso: number;
  altura: number;
  medicamentos_antineoplasticos: string;
  dose_por_m2: string;
  dose_total: string;
  via_administracao: string;
  dias_aplicacao_intervalo: string;
  medicacoes_associadas: string;
  medico_assinatura_crm: string;
  numero_autorizacao: string;
  status: 'pendente' | 'aprovada' | 'rejeitada' | 'em_analise';
  observacoes: string;
  created_at: string;
  updated_at: string;
  clinica_nome?: string;
}

// Função para formatar data
const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Função para obter cor do status
const getStatusColor = (status: string) => {
  switch (status) {
    case 'aprovada':
      return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
    case 'rejeitada':
      return 'bg-red-500/10 text-red-700 border-red-200';
    case 'em_analise':
      return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
    case 'pendente':
    default:
      return 'bg-blue-500/10 text-blue-700 border-blue-200';
  }
};

// Função para obter ícone do status
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'aprovada':
      return <CheckCircle className="h-4 w-4" />;
    case 'rejeitada':
      return <XCircle className="h-4 w-4" />;
    case 'em_analise':
      return <Clock className="h-4 w-4" />;
    case 'pendente':
    default:
      return <AlertCircle className="h-4 w-4" />;
  }
};

// Classe de borda lateral por status (para cards no modo grade)
const getStatusBorderClass = (status: string) => {
  switch (status) {
    case 'aprovada':
      return 'border-l-green-500 hover:border-l-green-400';
    case 'rejeitada':
      return 'border-l-red-500 hover:border-l-red-400';
    case 'em_analise':
      return 'border-l-yellow-500 hover:border-l-yellow-400';
    case 'pendente':
    default:
      return 'border-l-blue-500 hover:border-l-blue-400';
  }
};

const OperatorSolicitations = () => {
  const { user, isAuthenticated } = useOperadoraAuth();
  
  // Estados
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoAutorizacao[]>([]);
  const [clinicas, setClinicas] = useState<Clinica[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSolicitacao, setSelectedSolicitacao] = useState<SolicitacaoAutorizacao | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: 'aprovar' | 'rejeitar'; id: number } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSolicitacoes, setTotalSolicitacoes] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  
  // Filtros
  const [filters, setFilters] = useState({
    search: '',
    status: 'todos',
    clinica: 'todas',
    dataInicio: '',
    dataFim: ''
  });

  // Carregar dados
  useEffect(() => {
    loadData();
  }, [filters, currentPage]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carregar clínicas da operadora
      const clinicasData = await ClinicService.getAllClinicasForOperadora();
      setClinicas(clinicasData);
      
      // Carregar solicitações
      await loadSolicitacoes(clinicasData);
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const loadSolicitacoes = async (clinicasParam?: Clinica[]) => {
    try {
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', '10');
      
      if (filters.search) params.append('search', filters.search);
      if (filters.status !== 'todos') params.append('status', filters.status);
      if (filters.clinica !== 'todas') params.append('clinica_id', filters.clinica);
      if (filters.dataInicio) params.append('data_inicio', filters.dataInicio);
      if (filters.dataFim) params.append('data_fim', filters.dataFim);

      // Usar endpoint já existente de solicitações da operadora
      let response = await operadoraAuthService.authorizedFetch(`/api/solicitacoes?${params.toString()}`);
      // Fallback se o proxy devolver HTML (authorizedFetch retorna null)
      if (!response) {
        const token = localStorage.getItem('operadora_access_token') || '';
        response = await fetch(`${config.API_BASE_URL}/solicitacoes?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      if (!response || !response.ok) {
        throw new Error('Erro ao carregar solicitações');
      }
      
      const raw = await response.json();
      // Normalizar shape
      const payload = raw?.data || raw;
      let list = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];

      const clinicsList = Array.isArray(clinicasParam) ? clinicasParam : clinicas;

      // Se a operadora não possui clínicas, a lista deve ficar vazia
      if (!clinicsList || clinicsList.length === 0) {
        list = [];
      } else {
        // Filtrar solicitações somente das clínicas vinculadas à operadora
        const clinicIdSet = new Set(clinicsList.map(c => c.id));
        list = list.filter((s: any) => s?.clinica_id && clinicIdSet.has(s.clinica_id));
      }
      const pagination = payload?.pagination || raw?.pagination || {};

      // Mapear para a interface usada na página
      const mapped: SolicitacaoAutorizacao[] = list.map((s: any) => {
        // tentar calcular idade
        let idadeCalc: number | undefined;
        const nascimento = s.data_nascimento || s.Data_Nascimento || s.paciente?.data_nascimento;
        if (nascimento) {
          const d = new Date(nascimento);
          if (!isNaN(d.getTime())) {
            const hoje = new Date();
            idadeCalc = Math.floor((hoje.getTime() - d.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
          }
        }
        return {
          id: s.id,
          clinica_id: s.clinica_id || s.clinica?.id || 0,
          paciente_id: s.paciente_id || s.paciente?.id || 0,
          hospital_nome: s.hospital_nome || s.hospital?.nome || '-',
          hospital_codigo: s.hospital_codigo || s.hospital?.codigo || '-',
          cliente_nome: s.cliente_nome || s.paciente_nome || s.paciente?.nome || 'Paciente',
          cliente_codigo: s.cliente_codigo || s.paciente?.numero_carteirinha || '-',
          sexo: (s.sexo || s.Sexo || s.paciente?.Sexo || 'M') as 'M' | 'F',
          data_nascimento: nascimento || '',
          idade: s.idade || idadeCalc || 0,
          data_solicitacao: s.data_solicitacao || s.created_at || '',
          diagnostico_cid: s.diagnostico_cid || s.cid || '-',
          diagnostico_descricao: s.diagnostico_descricao || s.diagnostico || '',
          local_metastases: s.local_metastases || '',
          estagio_t: s.estagio_t || '',
          estagio_n: s.estagio_n || '',
          estagio_m: s.estagio_m || '',
          estagio_clinico: s.estagio_clinico || '',
          tratamento_cirurgia_radio: s.tratamento_cirurgia_radio || '',
          tratamento_quimio_adjuvante: s.tratamento_quimio_adjuvante || '',
          tratamento_quimio_primeira_linha: s.tratamento_quimio_primeira_linha || '',
          tratamento_quimio_segunda_linha: s.tratamento_quimio_segunda_linha || '',
          finalidade: (s.finalidade || '-') as any,
          performance_status: s.performance_status || '',
          siglas: s.siglas || '',
          ciclos_previstos: s.ciclos_previstos || 0,
          ciclo_atual: s.ciclo_atual || 0,
          superficie_corporal: s.superficie_corporal || 0,
          peso: s.peso || 0,
          altura: s.altura || 0,
          medicamentos_antineoplasticos: s.medicamentos_antineoplasticos || '',
          dose_por_m2: s.dose_por_m2 || '',
          dose_total: s.dose_total || '',
          via_administracao: s.via_administracao || '',
          dias_aplicacao_intervalo: s.dias_aplicacao_intervalo || '',
          medicacoes_associadas: s.medicacoes_associadas || '',
          medico_assinatura_crm: s.medico_assinatura_crm || '',
          numero_autorizacao: s.numero_autorizacao || '',
          status: (s.status || 'pendente') as any,
          observacoes: s.observacoes || '',
          created_at: s.created_at || '',
          updated_at: s.updated_at || '',
          clinica_nome: s.clinica?.nome || undefined,
        };
      });

      setSolicitacoes(mapped);
      setTotalPages(pagination.totalPages || 1);
      setTotalSolicitacoes(mapped.length);
      
    } catch (error) {
      console.error('❌ Erro ao carregar solicitações:', error);
      toast.error('Erro ao carregar solicitações');
    }
  };

  // Baixar PDF diretamente (sem modal)
  const handleDownloadPDF = async (id: number, nome?: string) => {
    try {
      // Usar fetch manual com Authorization para evitar filtros internos
      const token = localStorage.getItem('operadora_access_token') || '';
      const res = await fetch(`${config.API_BASE_URL}/solicitacoes/${id}/pdf`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || contentType.includes('text/html')) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nome || `solicitacao_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Download iniciado');
    } catch (e) {
      console.error('❌ Erro no download do PDF:', e);
      toast.error('Não foi possível baixar o PDF');
    }
  };

  // Aprovar solicitação
  const handleAprovar = async (id: number) => {
    try {
      const response = await operadoraAuthService.authorizedFetch(`/api/solicitacoes/${id}/aprovar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'aprovada' })
      });
      
      if (response && response.ok) {
        toast.success('Solicitação aprovada com sucesso!');
        loadSolicitacoes();
      } else {
        const errorText = response ? await response.text().catch(() => 'Erro desconhecido') : 'Sem resposta do servidor';
        throw new Error(`Erro ao aprovar solicitação: ${errorText}`);
      }
    } catch (error) {
      console.error('❌ Erro ao aprovar solicitação:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao aprovar solicitação');
    }
  };

  // Rejeitar solicitação
  const handleRejeitar = async (id: number) => {
    try {
      const response = await operadoraAuthService.authorizedFetch(`/api/solicitacoes/${id}/rejeitar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'rejeitada' })
      });
      
      if (response && response.ok) {
        toast.success('Solicitação rejeitada com sucesso!');
        loadSolicitacoes();
      } else {
        const errorText = response ? await response.text().catch(() => 'Erro desconhecido') : 'Sem resposta do servidor';
        throw new Error(`Erro ao rejeitar solicitação: ${errorText}`);
      }
    } catch (error) {
      console.error('❌ Erro ao rejeitar solicitação:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao rejeitar solicitação');
    }
  };

  // Filtrar solicitações
  const filteredSolicitacoes = solicitacoes.filter(solicitacao => {
    const matchesSearch = !filters.search || 
      solicitacao.cliente_nome.toLowerCase().includes(filters.search.toLowerCase()) ||
      solicitacao.diagnostico_cid.toLowerCase().includes(filters.search.toLowerCase()) ||
      solicitacao.hospital_nome.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesStatus = filters.status === 'todos' || solicitacao.status === filters.status;
    const matchesClinica = filters.clinica === 'todas' || solicitacao.clinica_id.toString() === filters.clinica;
    
    // Filtro por data (cliente e servidor) - usar data_solicitacao ou created_at
    const dataBaseStr = solicitacao.data_solicitacao || solicitacao.created_at || '';
    const dataBase = dataBaseStr ? new Date(dataBaseStr) : null;
    let matchesDate = true;
    if (filters.dataInicio) {
      const inicio = new Date(filters.dataInicio + 'T00:00:00');
      matchesDate = matchesDate && (!!dataBase && dataBase >= inicio);
    }
    if (filters.dataFim) {
      const fim = new Date(filters.dataFim + 'T23:59:59');
      matchesDate = matchesDate && (!!dataBase && dataBase <= fim);
    }

    return matchesSearch && matchesStatus && matchesClinica && matchesDate;
  });

  // Estatísticas
  // Estatísticas reais baseadas na lista já filtrada pelas clínicas da operadora
  const stats = {
    total: filteredSolicitacoes.length,
    pendentes: filteredSolicitacoes.filter(s => s.status === 'pendente').length,
    aprovadas: filteredSolicitacoes.filter(s => s.status === 'aprovada').length,
    rejeitadas: filteredSolicitacoes.filter(s => s.status === 'rejeitada').length,
    emAnalise: filteredSolicitacoes.filter(s => s.status === 'em_analise').length
  };

  // Itens para modo grade com mesmo layout do Histórico das Clínicas
  const hoverItems = filteredSolicitacoes.map((solicitacao, index) => ({
    id: solicitacao.id || index,
    title: `Solicitação #${solicitacao.id}`,
    description: `${solicitacao.cliente_nome} - ${solicitacao.hospital_nome}`,
    link: '#',
    status: solicitacao.status,
    data: solicitacao,
  }));

  if (!isAuthenticated) {
    return (
      <div className="space-y-6 animate-fade-in p-6">
        <h1 className="text-2xl font-bold text-foreground">Acesso Negado</h1>
        <p className="text-muted-foreground">Você precisa estar logado para acessar esta página.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Solicitações de Autorização
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie as solicitações de autorização das clínicas credenciadas
            </p>
          </div>
        </div>
        <Button onClick={loadData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <AnimatedSection delay={100}>
          <MouseTilt maxTilt={5} scale={1.02}>
            <Card className="lco-card hover-lift group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold text-blue-500">{stats.total}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-500/20" />
                </div>
              </CardContent>
            </Card>
          </MouseTilt>
        </AnimatedSection>

        <AnimatedSection delay={200}>
          <MouseTilt maxTilt={5} scale={1.02}>
            <Card className="lco-card hover-lift group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                    <p className="text-2xl font-bold text-yellow-500">{stats.pendentes}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500/20" />
                </div>
              </CardContent>
            </Card>
          </MouseTilt>
        </AnimatedSection>

        <AnimatedSection delay={300}>
          <MouseTilt maxTilt={5} scale={1.02}>
            <Card className="lco-card hover-lift group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#1f4edd]/5 to-[#65a3ee]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Aprovadas</p>
                    <p className="text-2xl font-bold text-[#1f4edd]">{stats.aprovadas}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-[#1f4edd]/20" />
                </div>
              </CardContent>
            </Card>
          </MouseTilt>
        </AnimatedSection>

        <AnimatedSection delay={400}>
          <MouseTilt maxTilt={5} scale={1.02}>
            <Card className="lco-card hover-lift group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Rejeitadas</p>
                    <p className="text-2xl font-bold text-red-500">{stats.rejeitadas}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-500/20" />
                </div>
              </CardContent>
            </Card>
          </MouseTilt>
        </AnimatedSection>

        <AnimatedSection delay={500}>
          <MouseTilt maxTilt={5} scale={1.02}>
            <Card className="lco-card hover-lift group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Em Análise</p>
                    <p className="text-2xl font-bold text-purple-500">{stats.emAnalise}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-purple-500/20" />
                </div>
              </CardContent>
            </Card>
          </MouseTilt>
        </AnimatedSection>
      </div>

      {/* Filtros */}
      <Card className="lco-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nome, CID, Hospital..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Status</label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="em_analise">Em Análise</SelectItem>
                  <SelectItem value="aprovada">Aprovada</SelectItem>
                  <SelectItem value="rejeitada">Rejeitada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Clínica</label>
              <Select value={filters.clinica} onValueChange={(value) => setFilters(prev => ({ ...prev, clinica: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as clínicas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as clínicas</SelectItem>
                  {clinicas.map(clinica => (
                    <SelectItem key={clinica.id} value={clinica.id.toString()}>
                      {clinica.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Data Início</label>
              <Input
                type="date"
                value={filters.dataInicio}
                onChange={(e) => setFilters(prev => ({ ...prev, dataInicio: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Data Fim</label>
              <Input
                type="date"
                value={filters.dataFim}
                onChange={(e) => setFilters(prev => ({ ...prev, dataFim: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Solicitações */}
      <Card className="lco-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Solicitações de Autorização</span>
            <div className="flex items-center gap-3">
              <Badge variant="outline">{filteredSolicitacoes.length} solicitações</Badge>
              <div className="flex items-center gap-1 rounded-md border bg-card p-1">
                <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" className="h-8 px-2" onClick={() => setViewMode('list')}>
                  <List className="h-4 w-4" />
                </Button>
                <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="sm" className="h-8 px-2" onClick={() => setViewMode('grid')}>
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Carregando solicitações...</p>
              </div>
            </div>
          ) : filteredSolicitacoes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">Nenhuma solicitação encontrada</h3>
              <p className="text-muted-foreground">Tente ajustar os filtros ou aguarde novas solicitações.</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="space-y-6">
              <CardHoverEffect
                items={hoverItems}
                onViewPDF={(data: any) => {
                  if (data) setSelectedSolicitacao(data);
                }}
                onDownloadPDF={(id: number) => handleDownloadPDF(id, `solicitacao_${id}.pdf`)}
                onApprove={(id: number) => setConfirmAction({ type: 'aprovar', id })}
                onReject={(id: number) => setConfirmAction({ type: 'rejeitar', id })}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSolicitacoes.map((solicitacao, index) => (
                <AnimatedSection key={solicitacao.id} delay={index * 100}>
                  <Card className="transition-all duration-300 border-l-4 group hover:shadow-lg hover:shadow-primary/10" 
                        style={{ borderLeftColor: getStatusColor(solicitacao.status).includes('green') ? '#10b981' : 
                                 getStatusColor(solicitacao.status).includes('red') ? '#ef4444' : 
                                 getStatusColor(solicitacao.status).includes('yellow') ? '#f59e0b' : '#3b82f6' }}>
                    <CardContent className="p-4">
                      {/* Linha superior compacta (sem redundâncias) */}
                      <div className="flex items-center justify-between gap-3">
                        {/* Esquerda: Status + ID */}
                        <div className="flex items-center gap-3">
                          <Badge className={getStatusColor(solicitacao.status)}>
                            {getStatusIcon(solicitacao.status)}
                            <span className="ml-1 capitalize">{solicitacao.status.replace('_', ' ')}</span>
                          </Badge>
                          <span className="text-sm text-muted-foreground">#{solicitacao.id}</span>
                        </div>

                        {/* Ações */}
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => setSelectedSolicitacao(solicitacao)}>
                            <Eye className="h-4 w-4 mr-2" /> Ver PDF
                          </Button>
                          {solicitacao.status === 'pendente' && (
                            <>
                              <Button variant="outline" size="sm" onClick={() => setConfirmAction({ type: 'aprovar', id: solicitacao.id })} className="text-[#1f4edd] hover:text-[#2351c4] hover:bg-blue-50">
                                Aprovar
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => setConfirmAction({ type: 'rejeitar', id: solicitacao.id })} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                Rejeitar
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Linha inferior detalhada (como antes) */}
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Paciente</p>
                          <p className="font-semibold">{solicitacao.cliente_nome}</p>
                          <p className="text-sm text-muted-foreground">
                            {solicitacao.sexo} • {solicitacao.idade} anos
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Diagnóstico</p>
                          <p className="font-semibold text-primary">{solicitacao.diagnostico_cid}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {solicitacao.diagnostico_descricao}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Hospital</p>
                          <p className="font-semibold">{solicitacao.hospital_nome}</p>
                          <p className="text-sm text-muted-foreground">Código: {solicitacao.hospital_codigo}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Data da Solicitação</p>
                          <p className="font-semibold">{formatDate(solicitacao.data_solicitacao)}</p>
                          {solicitacao.finalidade && (
                            <p className="text-sm font-semibold text-primary uppercase mt-1">
                              Finalidade: {solicitacao.finalidade}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </AnimatedSection>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {((currentPage - 1) * 10) + 1} a {Math.min(currentPage * 10, totalSolicitacoes)} de {totalSolicitacoes} solicitações
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Modal de PDF */}
      {selectedSolicitacao && (
        <PDFViewerModal
          isOpen={!!selectedSolicitacao}
          onClose={() => setSelectedSolicitacao(null)}
          solicitacao={selectedSolicitacao as any}
          onApprove={(id) => setConfirmAction({ type: 'aprovar', id })}
          onReject={(id) => setConfirmAction({ type: 'rejeitar', id })}
        />
      )}

      {/* Dialogo de confirmação */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => { if (!open) setConfirmAction(null); }}>
        <AlertDialogContent className="overflow-hidden border-border/50">
          <div className={`-mx-6 -mt-6 px-6 py-5 ${confirmAction?.type === 'aprovar' ? 'bg-gradient-to-r from-[#1f4edd]/15 to-[#65a3ee]/10' : 'bg-gradient-to-r from-red-500/15 to-rose-500/10'}`}>
            <div className="flex items-center gap-3">
              {confirmAction?.type === 'aprovar' ? (
                <ThumbsUp className="h-5 w-5 text-[#1f4edd]" />
              ) : (
                <ThumbsDown className="h-5 w-5 text-red-500" />
              )}
              <h3 className={`text-lg font-semibold ${confirmAction?.type === 'aprovar' ? 'text-[#1f4edd]' : 'text-red-600'}`}>
                {confirmAction?.type === 'aprovar' ? 'Confirmar aprovação' : 'Confirmar rejeição'}
              </h3>
            </div>
          </div>
          <AlertDialogHeader className="pt-3">
            <AlertDialogTitle className="text-base">
              Solicitação #{confirmAction?.id}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              Tem certeza que deseja {confirmAction?.type === 'aprovar' ? 'aprovar' : 'rejeitar'} esta solicitação? Esta ação ficará registrada para auditoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-2 rounded-md border border-dashed border-border/60 p-3 text-xs text-muted-foreground">
            Revise o documento antes de confirmar. Após a confirmação, o solicitante será notificado.
          </div>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="border-border/60">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className={`${confirmAction?.type === 'aprovar' ? 'bg-[#1f4edd] hover:bg-[#2351c4]' : 'bg-red-600 hover:bg-red-700'} text-white`}
              onClick={async () => {
                if (!confirmAction) return;
                const id = confirmAction.id;
                if (confirmAction.type === 'aprovar') {
                  await handleAprovar(id);
                } else {
                  await handleRejeitar(id);
                }
                setConfirmAction(null);
              }}
            >
              {confirmAction?.type === 'aprovar' ? 'Aprovar' : 'Rejeitar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OperatorSolicitations;
