import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Download, 
  Eye, 
  Filter, 
  Calendar,
  User,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { SolicitacaoService, SolicitacaoFromAPI } from '@/services/api';
import { toast } from 'sonner';
import PDFViewerModal from '@/components/PDFViewerModal';
import { CardHoverEffect } from '@/components/ui/card-hover-effect';
import { useLocation } from 'react-router-dom';
import { useRef } from 'react';

// Função local para formatar data
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

const HistoricoSolicitacoes = () => {
  const location = useLocation();
  const highlightRef = useRef<number | null>(null);
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoFromAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: 'todos',
    dateFrom: '',
    dateTo: '',
    operadora: 'todas'
  });
  const [selectedPDF, setSelectedPDF] = useState<SolicitacaoFromAPI | null>(null);
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingPDF, setLoadingPDF] = useState<number | null>(null);
  const [downloadingPDF, setDownloadingPDF] = useState<number | null>(null);

  // Carregar dados
  useEffect(() => {
    loadSolicitacoes();
  }, [currentPage, filters]);

  // Após carregar, se veio authId no state, rolar até o item e destacar
  useEffect(() => {
    const state = location.state as any;
    if (!state || !solicitacoes.length) return;
    const targetId = state.authId || state.scrollToAuth;
    if (!targetId) return;
    const el = document.getElementById(`auth-${targetId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-primary', 'ring-offset-2', 'rounded-xl');
      if (highlightRef.current) window.clearTimeout(highlightRef.current);
      highlightRef.current = window.setTimeout(() => {
        el.classList.remove('ring-2', 'ring-primary', 'ring-offset-2', 'rounded-xl');
      }, 3000);
    }
  }, [location.state, solicitacoes]);

  const loadSolicitacoes = async () => {
    try {
      setLoading(true);
      const state = location.state as any;
      const wantsDeepLink = !!(state && (state.authId || state.scrollToAuth));
      const response = await SolicitacaoService.listarSolicitacoes({
        page: currentPage,
        limit: wantsDeepLink ? 1000 : 10,
        clinica_id: 1 // Assumindo que é sempre a clínica 1
      });
      
      setSolicitacoes(response.data);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error);
      toast.error('Erro ao carregar histórico de solicitações');
    } finally {
      setLoading(false);
    }
  };

  // Funções de filtro
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'todos',
      dateFrom: '',
      dateTo: '',
      operadora: 'todas'
    });
    setCurrentPage(1);
  };

  // Funções de status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aprovada':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pendente':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'rejeitada':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'em_analise':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprovada':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejeitada':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'em_analise':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'aprovada':
        return 'Aprovada';
      case 'pendente':
        return 'Pendente';
      case 'rejeitada':
        return 'Rejeitada';
      case 'em_analise':
        return 'Em Análise';
      default:
        return 'Pendente';
    }
  };

  // Funções de PDF
  const handleViewPDF = async (solicitacao: SolicitacaoFromAPI) => {
    setLoadingPDF(solicitacao.id!);
    try {
      // Simular tempo de carregamento do PDF
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSelectedPDF(solicitacao);
      setShowPDFModal(true);
      toast.success('PDF carregado com sucesso!');
    } catch (error) {
      console.error('Erro ao carregar PDF:', error);
      toast.error('Erro ao carregar PDF');
    } finally {
      setLoadingPDF(null);
    }
  };

  const handleDownloadPDF = async (id: number) => {
    setDownloadingPDF(id);
    try {
      await SolicitacaoService.downloadPDF(id);
      toast.success('PDF baixado com sucesso!');
    } catch (error) {
      console.error('Erro ao baixar PDF:', error);
      toast.error('Erro ao baixar PDF');
    } finally {
      setDownloadingPDF(null);
    }
  };

  // Lista de operadoras disponíveis (simulada - em produção viria da API)
  const operadorasDisponiveis = [
    'Unimed',
    'Amil',
    'SulAmérica',
    'Bradesco',
    'Porto Seguro',
    'NotreDame',
    'Hapvida'
  ];

  // Simulação de relacionamento paciente-operadora (em produção viria da API)
  const getOperadoraPorPaciente = (nomeCliente: string): string => {
    // Simulação baseada no nome do cliente para demonstração
    // Em produção, isso seria uma consulta real ao banco de dados
    const hash = nomeCliente.toLowerCase().charCodeAt(0) % operadorasDisponiveis.length;
    return operadorasDisponiveis[hash];
  };

  // Filtragem de dados
  const filteredSolicitacoes = solicitacoes.filter(solicitacao => {
    const matchesSearch = !filters.search || 
      solicitacao.cliente_nome.toLowerCase().includes(filters.search.toLowerCase()) ||
      solicitacao.numero_autorizacao?.toLowerCase().includes(filters.search.toLowerCase()) ||
      solicitacao.hospital_nome.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesStatus = filters.status === 'todos' || solicitacao.status === filters.status;
    
    const matchesDateFrom = !filters.dateFrom || 
      new Date(solicitacao.data_solicitacao) >= new Date(filters.dateFrom);
    
    const matchesDateTo = !filters.dateTo || 
      new Date(solicitacao.data_solicitacao) <= new Date(filters.dateTo);
    
    // Filtro de operadora baseado no paciente da solicitação
    const matchesOperadora = filters.operadora === 'todas' || 
      getOperadoraPorPaciente(solicitacao.cliente_nome) === filters.operadora;
    
    return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo && matchesOperadora;
  });

  // Preparar dados para CardHoverEffect
  const hoverItems = filteredSolicitacoes.map((solicitacao, index) => ({
    id: solicitacao.id || index,
    title: `Solicitação #${solicitacao.id}`,
    description: `${solicitacao.cliente_nome} - ${getOperadoraPorPaciente(solicitacao.cliente_nome)} - ${solicitacao.hospital_nome}`,
    link: '#',
    usage: solicitacao.ciclos_previstos || 0,
    protocols: [solicitacao.diagnostico_cid || 'N/A'],
    percentage: Number(solicitacao.superficie_corporal) || 0,
    status: solicitacao.status || 'pendente',
    cicloAtual: solicitacao.ciclo_atual || 0,
    data: {
      ...solicitacao,
      operadora: getOperadoraPorPaciente(solicitacao.cliente_nome)
    }
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/10 p-8">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Histórico de Solicitações
              </h1>
              <p className="text-muted-foreground text-sm md:text-base max-w-2xl">
                Acompanhe todas as solicitações de autorização e seus status
              </p>
            </div>
            <Button
              onClick={loadSolicitacoes}
              disabled={loading}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>
      </div>

      {/* Lista de Solicitações */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <span>Solicitações ({filteredSolicitacoes.length})</span>
            </CardTitle>
            
            {/* Filtros Compactos */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-48 h-8 text-sm"
                />
              </div>
              
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger className="w-32 h-8 text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="aprovada">Aprovada</SelectItem>
                  <SelectItem value="rejeitada">Rejeitada</SelectItem>
                  <SelectItem value="em_analise">Em Análise</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filters.operadora} onValueChange={(value) => handleFilterChange('operadora', value)}>
                <SelectTrigger className="w-36 h-8 text-sm">
                  <SelectValue placeholder="Operadora" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  {operadorasDisponiveis.map((operadora) => (
                    <SelectItem key={operadora} value={operadora}>
                      {operadora}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="h-8 text-xs"
              >
                Limpar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Carregando...</span>
            </div>
          ) : filteredSolicitacoes.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma solicitação encontrada</p>
            </div>
          ) : (
            <div className="space-y-6">
              <CardHoverEffect 
                items={hoverItems} 
                onViewPDF={handleViewPDF}
                onDownloadPDF={handleDownloadPDF}
                loadingPDF={loadingPDF}
                downloadingPDF={downloadingPDF}
              />
            </div>
          )}

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </div>
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
        </CardContent>
      </Card>

      {/* Modal de PDF */}
      {showPDFModal && selectedPDF && (
        <PDFViewerModal
          isOpen={showPDFModal}
          onClose={() => setShowPDFModal(false)}
          solicitacao={selectedPDF}
        />
      )}
    </div>
  );
};

export default HistoricoSolicitacoes; 