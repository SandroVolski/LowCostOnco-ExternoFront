import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  FileText, 
  Mail, 
  Clock, 
  CheckCircle, 
  XCircle, 
  User, 
  Calendar,
  Search,
  Filter,
  Eye,
  Reply,
  AlertCircle,
  Building2,
  MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import { operadoraAuthService } from '@/services/operadoraAuthService';
import { LoadingState } from '@/components/ui/loading-states';
import AnimatedSection from '@/components/AnimatedSection';
import { MouseTilt } from '@/components/MouseTilt';
import config from '@/config/environment';

// Tipos para os ajustes
interface Ajuste {
  id: number;
  clinica_id: number;
  clinica_nome: string;
  tipo: 'corpo_clinico' | 'negociacao';
  titulo: string;
  descricao: string;
  status: 'pendente' | 'em_analise' | 'aprovado' | 'rejeitado';
  prioridade?: 'baixa' | 'media' | 'alta' | 'critica';
  categoria?: 'protocolo' | 'medicamento' | 'procedimento' | 'administrativo';
  medico?: string;
  especialidade?: string;
  created_at: string;
  updated_at: string;
  anexos?: Anexo[];
  historico?: HistoricoItem[];
}

interface Anexo {
  id: number;
  solicitacao_id: number;
  arquivo_url: string;
  arquivo_nome: string;
  arquivo_tamanho: number;
  created_at: string;
}

interface HistoricoItem {
  id: number;
  solicitacao_id: number;
  status: string;
  comentario: string;
  created_at: string;
}

interface Clinica {
  id: number;
  nome: string;
}

const OperatorAjustes = () => {
  const [ajustes, setAjustes] = useState<Ajuste[]>([]);
  const [clinicas, setClinicas] = useState<Clinica[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAjuste, setSelectedAjuste] = useState<Ajuste | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [sendingResponse, setSendingResponse] = useState(false);
  
  // Filtros
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    clinicaId: '',
    tipo: '',
    prioridade: '',
    categoria: ''
  });

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // Carregar dados iniciais
  useEffect(() => {
    loadAjustes();
    loadClinicas();
  }, [currentPage, filters]);

  const loadAjustes = async () => {
    try {
      setLoading(true);
      
      // Construir parâmetros da query
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: itemsPerPage.toString(),
        sort: 'created_at:desc'
      });

      // Adicionar filtros
      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);
      if (filters.tipo) params.append('tipo', filters.tipo);
      if (filters.prioridade) params.append('prioridade', filters.prioridade);
      if (filters.categoria) params.append('categoria', filters.categoria);

      let response = await operadoraAuthService.authorizedFetch(
        `/api/ajustes/solicitacoes?${params.toString()}`
      );

      if (!response) {
        const token = localStorage.getItem('operadora_access_token') || '';
        response = await fetch(`${config.API_BASE_URL}/ajustes/solicitacoes?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      if (!response || !response.ok) {
        throw new Error('Erro ao carregar ajustes');
      }

      const data = await response.json();
      
      if (data.success) {
        setAjustes(data.data.items || []);
        setTotalPages(Math.ceil((data.data.total || 0) / itemsPerPage));
      } else {
        throw new Error(data.message || 'Erro ao carregar ajustes');
      }
    } catch (error) {
      console.error('Erro ao carregar ajustes:', error);
      toast.error('Erro ao carregar ajustes');
    } finally {
      setLoading(false);
    }
  };

  const loadClinicas = async () => {
    try {
      let response = await operadoraAuthService.authorizedFetch('/api/clinicas/por-operadora');
      if (!response) {
        const token = localStorage.getItem('operadora_access_token') || '';
        response = await fetch(`${config.API_BASE_URL}/clinicas/por-operadora`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      if (response && response.ok) {
        const data = await response.json();
        if (data.success) {
          setClinicas(data.data || []);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar clínicas:', error);
    }
  };

  const loadAjusteDetails = async (id: number) => {
    try {
      let response = await operadoraAuthService.authorizedFetch(`/api/ajustes/solicitacoes/${id}`);
      if (!response) {
        const token = localStorage.getItem('operadora_access_token') || '';
        response = await fetch(`${config.API_BASE_URL}/ajustes/solicitacoes/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      if (response && response.ok) {
        const data = await response.json();
        if (data.success) {
          setSelectedAjuste(data.data);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes do ajuste:', error);
      toast.error('Erro ao carregar detalhes');
    }
  };

  const handleResponse = async () => {
    if (!selectedAjuste || !responseText.trim()) {
      toast.error('Digite uma resposta');
      return;
    }

    try {
      setSendingResponse(true);
      
      // Simular envio de email (aqui você integraria com um serviço de email real)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Atualizar status do ajuste para "em_analise" após resposta
      let response = await operadoraAuthService.authorizedFetch(
        `/api/ajustes/solicitacoes/${selectedAjuste.id}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'em_analise',
            comentario: `Resposta da operadora: ${responseText}`
          })
        }
      );

      if (!response) {
        const token = localStorage.getItem('operadora_access_token') || '';
        response = await fetch(`${config.API_BASE_URL}/ajustes/solicitacoes/${selectedAjuste.id}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            status: 'em_analise',
            comentario: `Resposta da operadora: ${responseText}`
          })
        });
      }

      if (response && response.ok) {
        toast.success('Resposta enviada com sucesso!');
        setShowResponseModal(false);
        setResponseText('');
        loadAjustes(); // Recarregar lista
      } else {
        throw new Error('Erro ao atualizar status');
      }
    } catch (error) {
      console.error('Erro ao enviar resposta:', error);
      toast.error('Erro ao enviar resposta');
    } finally {
      setSendingResponse(false);
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      const response = await operadoraAuthService.authorizedFetch(
        `/api/ajustes/solicitacoes/${id}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: newStatus,
            comentario: `Status alterado para ${newStatus} pela operadora`
          })
        }
      );

      if (response.ok) {
        toast.success('Status atualizado com sucesso!');
        loadAjustes();
      } else {
        throw new Error('Erro ao atualizar status');
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'em_analise': return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'aprovado': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
      case 'rejeitado': return 'bg-red-500/10 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pendente': return 'Pendente';
      case 'em_analise': return 'Em Análise';
      case 'aprovado': return 'Aprovado';
      case 'rejeitado': return 'Rejeitado';
      default: return status;
    }
  };

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'baixa': return 'bg-[#1f4edd]/10 text-[#1f4edd]';
      case 'media': return 'bg-yellow-500/10 text-yellow-700';
      case 'alta': return 'bg-orange-500/10 text-orange-700';
      case 'critica': return 'bg-red-500/10 text-red-700';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredAjustes = ajustes.filter(ajuste => {
    if (filters.clinicaId && ajuste.clinica_id !== parseInt(filters.clinicaId)) return false;
    return true;
  });

  if (loading) {
    return <LoadingState message="Carregando ajustes..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Ajustes Recebidos</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os ajustes enviados pelas clínicas parceiras
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Building2 className="h-6 w-6 text-primary" />
          <span className="text-sm text-muted-foreground">
            {ajustes.length} ajuste{ajustes.length !== 1 ? 's' : ''} recebido{ajustes.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
      {/* Filtros */}
      <Card className="lco-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-primary" />
            <span>Filtros</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Título ou descrição..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Status</label>
                <Select
                  value={filters.status || 'all'}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === 'all' ? '' : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="em_analise">Em Análise</SelectItem>
                    <SelectItem value="aprovado">Aprovado</SelectItem>
                    <SelectItem value="rejeitado">Rejeitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Clínica</label>
                <Select
                  value={filters.clinicaId || 'all'}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, clinicaId: value === 'all' ? '' : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as clínicas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as clínicas</SelectItem>
                    {clinicas.map(clinica => (
                      <SelectItem key={clinica.id} value={clinica.id.toString()}>
                        {clinica.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Tipo</label>
                <Select
                  value={filters.tipo || 'all'}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, tipo: value === 'all' ? '' : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="corpo_clinico">Corpo Clínico</SelectItem>
                    <SelectItem value="negociacao">Negociação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
          </div>
        </CardContent>
      </Card>
      {/* Grid de Cards de Ajustes */}
      {filteredAjustes.length === 0 ? (
        <Card className="lco-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Nenhum ajuste encontrado</h3>
            <p className="text-muted-foreground text-center">
              Não há ajustes que correspondam aos filtros selecionados.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAjustes.map((ajuste, index) => (
            <AnimatedSection key={ajuste.id} delay={index * 100}>
              <MouseTilt maxTilt={5} scale={1.02}>
                <Card className="lco-card hover-lift group relative overflow-hidden border-l-4" style={{
                  borderLeftColor: getStatusColor(ajuste.status).includes('[#1f4edd]') ? '#1f4edd' : 
                                  getStatusColor(ajuste.status).includes('red') ? '#ef4444' : 
                                  getStatusColor(ajuste.status).includes('yellow') ? '#f59e0b' : '#3b82f6'
                }}>
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* ID do Ajuste com cor por status */}
                  <div className="absolute top-4 right-4 z-10">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white",
                        getStatusColor(ajuste.status).includes('[#1f4edd]') && "bg-[#1f4edd]",
                        getStatusColor(ajuste.status).includes('red') && "bg-red-500",
                        getStatusColor(ajuste.status).includes('yellow') && "bg-yellow-500 text-black",
                        !getStatusColor(ajuste.status).includes('[#1f4edd]') && !getStatusColor(ajuste.status).includes('red') && !getStatusColor(ajuste.status).includes('yellow') && "bg-blue-500"
                      )}
                    >
                      #{ajuste.id}
                    </div>
                  </div>

                  <CardContent className="p-6 relative z-10">
                    {/* Status Principal */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-xs font-medium",
                          getStatusColor(ajuste.status)
                        )}>
                          {getStatusLabel(ajuste.status)}
                        </span>
                      </div>
                    </div>

                    {/* Título */}
                    <CardTitle className="pr-12">
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Ajuste #{ajuste.id}</div>
                        <div className="text-base font-semibold text-foreground line-clamp-2">
                          {ajuste.titulo}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {ajuste.clinica_nome}
                        </div>
                      </div>
                    </CardTitle>

                    {/* Metadados principais */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="text-center p-2 rounded-lg bg-muted/30">
                        <div className="text-sm font-medium text-foreground">
                          {formatDate(ajuste.created_at)}
                        </div>
                        <div className="text-xs text-muted-foreground">Data</div>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-muted/30">
                        <div className="text-sm font-medium text-foreground">
                          {ajuste.tipo === 'corpo_clinico' ? 'Corpo Clínico' : 'Negociação'}
                        </div>
                        <div className="text-xs text-muted-foreground">Tipo</div>
                      </div>
                    </div>

                    {/* Informações Adicionais */}
                    {ajuste.prioridade && (
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="text-center p-2 rounded-lg bg-primary/5">
                          <div className="text-sm font-medium text-foreground">
                            {ajuste.prioridade.toUpperCase()}
                          </div>
                          <div className="text-xs text-muted-foreground">Prioridade</div>
                        </div>
                        {ajuste.categoria && (
                          <div className="text-center p-2 rounded-lg bg-primary/5">
                            <div className="text-sm font-medium text-foreground">
                              {ajuste.categoria}
                            </div>
                            <div className="text-xs text-muted-foreground">Categoria</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Médico */}
                    {ajuste.medico && (
                      <div className="space-y-2 mb-3">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Médico Responsável
                        </div>
                        <div className="flex items-center space-x-2 p-2 bg-muted/30 rounded-lg">
                          <User className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium text-foreground">{ajuste.medico}</span>
                        </div>
                      </div>
                    )}

                    <CardDescription className="text-xs opacity-75 mt-3 line-clamp-3">
                      {ajuste.descricao}
                    </CardDescription>

                    {/* Botões de ação - Ver Detalhes e Responder */}
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/50">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadAjusteDetails(ajuste.id)}
                        className="flex-1 h-8 text-xs"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Ver Detalhes
                      </Button>

                      {ajuste.status === 'pendente' && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedAjuste(ajuste);
                            setShowResponseModal(true);
                          }}
                          className="flex-1 h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          <Reply className="h-3 w-3 mr-1" />
                          Responder
                        </Button>
                      )}
                    </div>

                    {/* Botões de ação - Aprovar/Rejeitar (apenas em_analise) */}
                    {ajuste.status === 'em_analise' && (
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(ajuste.id, 'aprovado')}
                          className="flex-1 h-8 text-xs text-[#1f4edd] hover:text-[#2351c4] hover:bg-blue-50"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Aprovar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(ajuste.id, 'rejeitado')}
                          className="flex-1 h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Rejeitar
                        </Button>
                      </div>
                    )}
                    {ajuste.status !== 'em_analise' && (
                      // Espaço reservado para manter a mesma altura dos cards
                      (<div className="mt-2 h-8" />)
                    )}
                  </CardContent>
                </Card>
              </MouseTilt>
            </AnimatedSection>
          ))}
        </div>
      )}
      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          <span className="text-sm text-gray-600">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Próxima
          </Button>
        </div>
      )}
      {/* Modal de Resposta */}
      {showResponseModal && selectedAjuste && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl">
            <Card className="lco-card border-primary/20 shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-primary/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <MessageSquare className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-foreground">Responder Ajuste</CardTitle>
                      <CardDescription className="text-muted-foreground mt-1">
                        Enviando resposta para: <span className="font-semibold text-primary">{selectedAjuste.clinica_nome}</span>
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowResponseModal(false);
                      setResponseText('');
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Informações do Ajuste */}
                  <div className="bg-muted/30 rounded-lg p-4">
                    <h4 className="font-semibold text-foreground mb-2">Ajuste #{selectedAjuste.id}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{selectedAjuste.titulo}</p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(selectedAjuste.created_at)}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Building2 className="h-3 w-3" />
                        <span>{selectedAjuste.clinica_nome}</span>
                      </span>
                    </div>
                  </div>

                  {/* Campo de Resposta */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Sua Resposta</label>
                    <Textarea
                      placeholder="Digite sua resposta aqui..."
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      rows={6}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      Sua resposta será enviada por email para a clínica.
                    </p>
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex justify-end space-x-3 pt-4 border-t border-border/50">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowResponseModal(false);
                        setResponseText('');
                      }}
                      className="px-6"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleResponse}
                      disabled={sendingResponse || !responseText.trim()}
                      className="px-6 bg-primary hover:bg-primary/90"
                    >
                      {sendingResponse ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4 mr-2" />
                          Enviar Resposta
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      {/* Modal de Detalhes */}
      {selectedAjuste && !showResponseModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <Card className="lco-card border-primary/20 shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-primary/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-foreground">Detalhes do Ajuste</CardTitle>
                      <CardDescription className="text-muted-foreground mt-1">
                        {selectedAjuste.titulo}
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedAjuste(null)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Informações Básicas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Status</label>
                      <Badge className={cn("border", getStatusColor(selectedAjuste.status))}>
                        {getStatusLabel(selectedAjuste.status)}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Clínica</label>
                      <div className="flex items-center space-x-2 p-2 bg-muted/30 rounded-lg">
                        <Building2 className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">{selectedAjuste.clinica_nome}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Data de Criação</label>
                      <div className="flex items-center space-x-2 p-2 bg-muted/30 rounded-lg">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">{formatDate(selectedAjuste.created_at)}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Tipo</label>
                      <div className="p-2 bg-muted/30 rounded-lg">
                        <span className="text-sm font-medium text-foreground">
                          {selectedAjuste.tipo === 'corpo_clinico' ? 'Corpo Clínico' : 'Negociação'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Informações Adicionais */}
                  {(selectedAjuste.prioridade || selectedAjuste.categoria || selectedAjuste.medico) && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-foreground border-b border-border/50 pb-2">Informações Adicionais</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {selectedAjuste.prioridade && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Prioridade</label>
                            <div className="flex items-center space-x-2 p-2 bg-muted/30 rounded-lg">
                              <AlertCircle className="h-4 w-4 text-orange-500" />
                              <span className="text-sm font-medium text-foreground">{selectedAjuste.prioridade.toUpperCase()}</span>
                            </div>
                          </div>
                        )}
                        {selectedAjuste.categoria && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Categoria</label>
                            <div className="flex items-center space-x-2 p-2 bg-muted/30 rounded-lg">
                              <FileText className="h-4 w-4 text-blue-500" />
                              <span className="text-sm font-medium text-foreground">{selectedAjuste.categoria}</span>
                            </div>
                          </div>
                        )}
                        {selectedAjuste.medico && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Médico Responsável</label>
                            <div className="flex items-center space-x-2 p-2 bg-muted/30 rounded-lg">
                              <User className="h-4 w-4 text-purple-500" />
                              <span className="text-sm font-medium text-foreground">{selectedAjuste.medico}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Descrição */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Descrição</label>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                        {selectedAjuste.descricao}
                      </p>
                    </div>
                  </div>

                  {/* Histórico */}
                  {selectedAjuste.historico && selectedAjuste.historico.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-foreground border-b border-border/50 pb-2">Histórico de Alterações</h4>
                      <div className="space-y-3">
                        {selectedAjuste.historico.map((item, index) => (
                          <div key={index} className="flex items-start space-x-3 p-4 bg-muted/30 rounded-lg border-l-4 border-primary/20">
                            <div className="p-1 bg-primary/10 rounded-full">
                              <Clock className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center space-x-3">
                                <Badge className={cn("text-xs", getStatusColor(item.status))}>
                                  {getStatusLabel(item.status)}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(item.created_at)}
                                </span>
                              </div>
                              {item.comentario && (
                                <p className="text-sm text-foreground bg-background/50 p-3 rounded-lg">
                                  {item.comentario}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperatorAjustes;
