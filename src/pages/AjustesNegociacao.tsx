import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AutoResizeTextarea } from "@/components/ui/auto-resize-textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, 
  Paperclip, 
  Send, 
  Clock, 
  CheckCircle, 
  XCircle, 
  User, 
  Calendar,
  DollarSign,
  BarChart,
  TrendingUp,
  PiggyBank,
  Timer,
  AlertCircle,
  Edit,
  Trash2,
  Download,
  Eye,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import { AjustesService, type SolicitacaoNegociacao, type Anexo, type HistoricoItem, type EstatisticasNegociacao } from '@/services/ajustesService';
import { LoadingState } from '@/components/ui/loading-states';
import config from '@/config/environment';

// Usar os tipos do backend
type Solicitacao = SolicitacaoNegociacao;

const AjustesNegociacao = () => {
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [totalSolicitacoes, setTotalSolicitacoes] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [isBackendAvailable, setIsBackendAvailable] = useState(true);
  const [loadingFiltros, setLoadingFiltros] = useState(false);

  // Estados para estatísticas
  const [estatisticas, setEstatisticas] = useState<EstatisticasNegociacao>({
    solicitacoesCriticas: 0,
    totalSolicitacoes: 0,
    taxaAprovacao: 0,
    protocolosAtualizados: 0,
    tempoMedioRetorno: 0,
    solicitacoesPorStatus: {
      pendente: 0,
      em_analise: 0,
      aprovado: 0,
      rejeitado: 0
    },
    solicitacoesPorPrioridade: {
      baixa: 0,
      media: 0,
      alta: 0,
      critica: 0
    },
    solicitacoesPorCategoria: {
      protocolo: 0,
      medicamento: 0,
      procedimento: 0,
      administrativo: 0
    }
  });

  // Estados para filtros
  const [filtros, setFiltros] = useState({
    status: 'todas' as 'todas' | 'pendente' | 'em_analise' | 'aprovado' | 'rejeitado',
    search: '',
    prioridade: 'todas' as 'todas' | 'baixa' | 'media' | 'alta' | 'critica',
    categoria: 'todas' as 'todas' | 'protocolo' | 'medicamento' | 'procedimento' | 'administrativo'
  });

  const [novaSolicitacao, setNovaSolicitacao] = useState({
    titulo: '',
    descricao: '',
    prioridade: 'media' as 'baixa' | 'media' | 'alta' | 'critica',
    categoria: 'protocolo' as 'protocolo' | 'medicamento' | 'procedimento' | 'administrativo',
    anexos: [] as File[]
  });

  // Referência para o input de arquivo
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carregar dados ao montar componente
  // Verificar se o backend está disponível com retry
  const verificarBackend = async () => {
    const maxRetries = 3;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        console.log(`🔍 Verificando disponibilidade do backend... (tentativa ${retryCount + 1}/${maxRetries})`);
        const response = await fetch(`${config.BACKEND_HEALTH_URL}`);
        
        if (response.ok) {
          console.log('✅ Backend disponível');
          setIsBackendAvailable(true);
          carregarSolicitacoes();
          return;
        } else if (response.status === 503) {
          console.log(`⚠️ Backend temporariamente indisponível (503), tentativa ${retryCount + 1}/${maxRetries}`);
          retryCount++;
          
          if (retryCount < maxRetries) {
            const delay = Math.pow(2, retryCount) * 1000; // 2s, 4s
            console.log(`⏳ Aguardando ${delay}ms antes da próxima tentativa...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        } else {
          console.error('❌ Backend retornou erro:', response.status);
          setIsBackendAvailable(false);
          return;
        }
      } catch (error) {
        console.error(`❌ Erro ao verificar backend (tentativa ${retryCount + 1}/${maxRetries}):`, error);
        retryCount++;
        
        if (retryCount < maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000; // 2s, 4s
          console.log(`⏳ Aguardando ${delay}ms antes da próxima tentativa...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    console.log('❌ Backend não disponível após todas as tentativas');
    setIsBackendAvailable(false);
  };

  useEffect(() => {
    console.log('🚀 useEffect executado - carregando solicitações de negociação');
    verificarBackend();
  }, []); // Executar apenas uma vez ao montar

  // Recarregar quando filtros mudarem (com debounce)
  useEffect(() => {
    if (!isBackendAvailable) return;
    
    const timeoutId = setTimeout(() => {
      console.log('🔄 Filtros mudaram, recarregando...');
      carregarSolicitacoes(true);
    }, 500); // Aguarda 500ms antes de recarregar
    
    return () => clearTimeout(timeoutId);
  }, [filtros.status, filtros.prioridade, filtros.categoria, filtros.search, isBackendAvailable]);

  // Função para lidar com o upload de arquivos
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setNovaSolicitacao(prev => ({
        ...prev,
        anexos: [...prev.anexos, ...Array.from(files)]
      }));
    }
  };

  // Função para remover um arquivo
  const removeFile = (index: number) => {
    setNovaSolicitacao(prev => ({
      ...prev,
      anexos: prev.anexos.filter((_, i) => i !== index)
    }));
  };

  // Função para carregar solicitações do backend
  const carregarSolicitacoes = async (isFilter = false) => {
    // Evitar múltiplas requisições simultâneas
    if (loading || loadingFiltros) {
      console.log('⏳ Já está carregando, ignorando nova requisição');
      return;
    }
    try {
      if (isFilter) {
        setLoadingFiltros(true);
      } else {
        setLoading(true);
      }
      
      console.log('🔍 Carregando solicitações de negociação com filtros:', filtros);
      
      // Sempre enviar os filtros, mesmo que sejam 'todas'
      const response = await AjustesService.listarSolicitacoesNegociacao({
        clinica_id: 1,
        tipo: 'negociacao',
        status: filtros.status === 'todas' ? undefined : filtros.status,
        prioridade: filtros.prioridade === 'todas' ? undefined : filtros.prioridade,
        categoria: filtros.categoria === 'todas' ? undefined : filtros.categoria,
        search: filtros.search || undefined,
        page: currentPage,
        pageSize: pageSize,
        sort: 'created_at:desc'
      });
      
      console.log('✅ Resposta do backend:', response);
      console.log('📋 Solicitações recebidas:', response.items);
      
      // Carregar anexos apenas se necessário e com retry inteligente
      const solicitacoesComAnexos = [];
      for (let i = 0; i < response.items.length; i++) {
        const solicitacao = response.items[i];
        
        // Se já tem anexos, usar os existentes
        if (solicitacao.anexos && solicitacao.anexos.length > 0) {
          solicitacoesComAnexos.push(solicitacao);
          continue;
        }
        
        // Por enquanto, não carregar anexos automaticamente para evitar rate limiting
        // Os anexos serão carregados sob demanda quando o usuário clicar para visualizar
        console.log('📋 Adicionando solicitação sem anexos (serão carregados sob demanda):', solicitacao.id);
        solicitacoesComAnexos.push({ ...solicitacao, anexos: [] });
      }
      
      console.log('📋 Solicitações com anexos carregados:', solicitacoesComAnexos);
      
      setSolicitacoes(solicitacoesComAnexos);
      setTotalSolicitacoes(response.total);
      carregarEstatisticas();
    } catch (error) {
      console.error('❌ Erro ao carregar solicitações:', error);
      setIsBackendAvailable(false);
      toast.error('Erro ao carregar solicitações');
    } finally {
      if (isFilter) {
        setLoadingFiltros(false);
      } else {
        setLoading(false);
      }
    }
  };

  // Função para carregar estatísticas
  const carregarEstatisticas = async () => {
    try {
      const stats = await AjustesService.getEstatisticasNegociacao(1);
      setEstatisticas(stats);
      console.log('📊 Estatísticas carregadas:', stats);
    } catch (error) {
      console.error('❌ Erro ao carregar estatísticas:', error);
    }
  };

  // Função para criar nova solicitação
  const handleCriarSolicitacao = async () => {
    if (!novaSolicitacao.titulo || !novaSolicitacao.descricao) {
      toast.error('Título e descrição são obrigatórios');
      return;
    }

    try {
      setLoading(true);
      
      // 1. Criar a solicitação
      const novaSolicitacaoCriada = await AjustesService.criarSolicitacaoNegociacao({
        clinica_id: 1,
        tipo: 'negociacao',
        titulo: novaSolicitacao.titulo,
        descricao: novaSolicitacao.descricao,
        prioridade: novaSolicitacao.prioridade,
        categoria: novaSolicitacao.categoria
      });

      console.log('✅ Solicitação criada:', novaSolicitacaoCriada);

      // 2. Fazer upload dos anexos se houver
      if (novaSolicitacao.anexos.length > 0) {
        console.log('📎 Fazendo upload de', novaSolicitacao.anexos.length, 'anexos...');
        
        // Processar anexos sequencialmente para evitar erro 429
        for (const file of novaSolicitacao.anexos) {
          try {
            console.log(`📎 Enviando anexo: ${file.name}`);
            const anexo = await AjustesService.uploadAnexo(novaSolicitacaoCriada.id!, file);
            console.log('✅ Anexo enviado:', anexo);
            
            // Delay entre uploads para evitar erro 429
            if (novaSolicitacao.anexos.indexOf(file) < novaSolicitacao.anexos.length - 1) {
              console.log('⏳ Aguardando 1 segundo antes do próximo anexo...');
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          } catch (error) {
            console.error('❌ Erro ao enviar anexo:', file.name, error);
            throw error;
          }
        }
        console.log('🎉 Todos os anexos foram enviados!');
      }

      toast.success('Solicitação criada com sucesso!' + (novaSolicitacao.anexos.length > 0 ? ` ${novaSolicitacao.anexos.length} anexo(s) enviado(s)!` : ''));
      
      // 3. Limpar formulário
      setNovaSolicitacao({ titulo: '', descricao: '', prioridade: 'media', categoria: 'protocolo', anexos: [] });
      
      // 4. Recarregar lista com delay para garantir que o backend processou
      setTimeout(() => {
        carregarSolicitacoes();
        carregarEstatisticas();
      }, 1000);
      
    } catch (error) {
      console.error('❌ Erro ao criar solicitação:', error);
      toast.error('Erro ao criar solicitação');
    } finally {
      setLoading(false);
    }
  };

  // Função para carregar anexos sob demanda
  const carregarAnexosSobDemanda = async (solicitacaoId: number) => {
    try {
      console.log('🔍 Carregando anexos sob demanda para solicitação:', solicitacaoId);
      const anexos = await AjustesService.listarAnexos(solicitacaoId);
      
      if (anexos && Array.isArray(anexos)) {
        // Atualizar a solicitação específica com os anexos
        setSolicitacoes(prev => prev.map(s => 
          s.id === solicitacaoId 
            ? { ...s, anexos: anexos }
            : s
        ));
        console.log('✅ Anexos carregados sob demanda:', anexos);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar anexos sob demanda:', error);
      toast.error('Erro ao carregar anexos');
    }
  };

  // Função para visualizar um arquivo
  const handleViewDocument = (solicitacao: Solicitacao) => {
    console.log("Visualizando documentos da solicitação:", solicitacao.id);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Pendente</Badge>;
      case 'em_analise':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Em Análise</Badge>;
      case 'aprovado':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Aprovado</Badge>;
      case 'rejeitado':
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Rejeitado</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-background">
      <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
        {/* Header com Background Gradiente */}
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/10 p-8">
          <div className="absolute inset-0 bg-grid-white/10" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Ajustes de Negociação
                </h1>
                <p className="text-muted-foreground text-sm md:text-base max-w-2xl">
                  Gerencie solicitações de ajustes e acompanhe o status das negociações
                </p>
              </div>
              <Button 
                size="lg"
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all invisible"
              >
                <FileText className="h-5 w-5" />
                Nova Solicitação
              </Button>
            </div>
          </div>
        </div>



        <div className="space-y-8">
          {/* Grid Superior com Estatísticas e Nova Solicitação */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
            {/* Sidebar com Estatísticas */}
            <div className="md:col-span-2 space-y-4">
              {/* Cards de Estatísticas */}
              <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
                <Card className="bg-primary/5 border-primary/10">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Solicitações Críticas</p>
                        <div className="flex items-baseline gap-2">
                          <h3 className="text-2xl font-bold">{estatisticas.solicitacoesCriticas}</h3>
                          <span className="text-xs text-muted-foreground">urgentes</span>
                        </div>
                      </div>
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <AlertCircle className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border/50">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Solicitações</p>
                        <div className="flex items-baseline gap-2">
                          <h3 className="text-2xl font-bold">{estatisticas.totalSolicitacoes}</h3>
                          <span className="text-xs text-muted-foreground">ativas</span>
                        </div>
                      </div>
                      <div className="p-2 bg-muted rounded-lg">
                        <BarChart className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                              <Card className="md:col-span-1 bg-card border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Taxa de Aprovação</p>
                      <div className="flex items-baseline gap-2">
                          <h3 className="text-2xl font-bold">{estatisticas.taxaAprovacao}%</h3>
                      </div>
                    </div>
                    <div className="p-2 bg-muted rounded-lg">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Protocolos Atualizados</p>
                      <div className="flex items-baseline gap-2">
                          <h3 className="text-2xl font-bold">{estatisticas.protocolosAtualizados}</h3>
                        <span className="text-xs text-muted-foreground">este mês</span>
                      </div>
                    </div>
                    <div className="p-2 bg-muted rounded-lg">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-primary/5 border-primary/10">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Tempo de Retorno</p>
                      <div className="flex items-baseline gap-2">
                          <h3 className="text-2xl font-bold">{estatisticas.tempoMedioRetorno}</h3>
                        <span className="text-xs text-muted-foreground">dias em média</span>
                      </div>
                    </div>
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Timer className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              </div>
            </div>

            {/* Form de Nova Solicitação */}
            <div className="md:col-span-4">
              <Card className="border-primary/10 shadow-md">
                <CardHeader className="space-y-1 bg-primary/5 border-b border-primary/10">
                  <CardTitle className="text-xl font-semibold text-primary">Nova Solicitação</CardTitle>
                  <CardDescription>
                    Preencha os dados para criar uma nova solicitação de ajuste
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4" onSubmit={(e) => {
                    e.preventDefault();
                    handleCriarSolicitacao();
                  }}>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Título da Solicitação</label>
                        <Input
                          placeholder="Digite o título da solicitação"
                          value={novaSolicitacao.titulo}
                          onChange={(e) => setNovaSolicitacao(prev => ({ ...prev, titulo: e.target.value }))}
                          className="border-primary/20 focus:border-primary"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Prioridade</label>
                          <Select value={novaSolicitacao.prioridade} onValueChange={(value: 'baixa' | 'media' | 'alta' | 'critica') => setNovaSolicitacao(prev => ({ ...prev, prioridade: value }))}>
                            <SelectTrigger className="border-primary/20 focus:border-primary">
                              <SelectValue placeholder="Selecione a prioridade" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="baixa">Baixa</SelectItem>
                              <SelectItem value="media">Média</SelectItem>
                              <SelectItem value="alta">Alta</SelectItem>
                              <SelectItem value="critica">Crítica</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Categoria</label>
                          <Select value={novaSolicitacao.categoria} onValueChange={(value: 'protocolo' | 'medicamento' | 'procedimento' | 'administrativo') => setNovaSolicitacao(prev => ({ ...prev, categoria: value }))}>
                            <SelectTrigger className="border-primary/20 focus:border-primary">
                              <SelectValue placeholder="Selecione a categoria" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="protocolo">Protocolo</SelectItem>
                              <SelectItem value="medicamento">Medicamento</SelectItem>
                              <SelectItem value="procedimento">Procedimento</SelectItem>
                              <SelectItem value="administrativo">Administrativo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Descrição</label>
                        <AutoResizeTextarea
                          placeholder="Descreva detalhadamente sua solicitação"
                          value={novaSolicitacao.descricao}
                          onChange={(e) => setNovaSolicitacao(prev => ({ ...prev, descricao: e.target.value }))}
                          className="border-primary/20 focus:border-primary"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Documentos</label>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          className="hidden"
                          multiple
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls"
                        />
                        <div className="space-y-3">
                          <Button 
                            type="button"
                            variant="outline" 
                            className="gap-2 w-full border-primary/20 hover:bg-primary/5 hover:text-primary"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Paperclip className="h-4 w-4" />
                            Anexar Documentos
                          </Button>
                          
                          {novaSolicitacao.anexos.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-sm text-muted-foreground">
                                {novaSolicitacao.anexos.length} arquivo(s) selecionado(s):
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {novaSolicitacao.anexos.map((file, index) => (
                                  <Badge
                                    key={index}
                                    variant="secondary"
                                    className="pl-2 pr-1 py-1 flex items-center gap-1 bg-primary/5 text-primary hover:bg-primary/10"
                                  >
                                    <span className="text-xs truncate max-w-[150px]">
                                      {file.name}
                                    </span>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-4 w-4 hover:bg-transparent hover:text-destructive"
                                      onClick={() => removeFile(index)}
                                    >
                                      <XCircle className="h-3 w-3" />
                                    </Button>
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <p className="text-xs text-muted-foreground">
                            Formatos aceitos: PDF, DOC, DOCX, JPG, JPEG, PNG, XLS, XLSX
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <Button 
                          type="submit" 
                          className="w-full gap-2 bg-primary hover:bg-primary/90"
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              {novaSolicitacao.anexos.length > 0 ? 'Enviando com anexos...' : 'Enviando...'}
                            </>
                          ) : (
                            <>
                          <Send className="h-4 w-4" />
                          Enviar Solicitação
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Lista de Solicitações */}
          <div className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
              <h2 className="text-lg font-semibold tracking-tight">Solicitações Recentes</h2>
                  {!loading && (
                    <p className="text-sm text-muted-foreground">
                      {totalSolicitacoes} solicitação{totalSolicitacoes !== 1 ? 'ões' : ''} encontrada{totalSolicitacoes !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
                <Select 
                  value={filtros.status} 
                  onValueChange={(value) => setFiltros(prev => ({ ...prev, status: value as any }))}
                >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as solicitações</SelectItem>
                  <SelectItem value="pendente">Pendentes</SelectItem>
                  <SelectItem value="em_analise">Em Análise</SelectItem>
                  <SelectItem value="aprovado">Aprovadas</SelectItem>
                  <SelectItem value="rejeitado">Rejeitadas</SelectItem>
                </SelectContent>
              </Select>
              </div>

              {/* Filtros adicionais */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Buscar por texto</label>
                  <Input
                    placeholder="Título, descrição..."
                    value={filtros.search}
                    onChange={(e) => setFiltros(prev => ({ ...prev, search: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Prioridade</label>
                  <Select 
                    value={filtros.prioridade} 
                    onValueChange={(value) => setFiltros(prev => ({ ...prev, prioridade: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as prioridades" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas as prioridades</SelectItem>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="critica">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Categoria</label>
                  <Select 
                    value={filtros.categoria} 
                    onValueChange={(value) => setFiltros(prev => ({ ...prev, categoria: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas as categorias</SelectItem>
                      <SelectItem value="protocolo">Protocolo</SelectItem>
                      <SelectItem value="medicamento">Medicamento</SelectItem>
                      <SelectItem value="procedimento">Procedimento</SelectItem>
                      <SelectItem value="administrativo">Administrativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-2">
                  <Button 
                    onClick={() => setFiltros({ status: 'todas', search: '', prioridade: 'todas', categoria: 'todas' })}
                    variant="outline"
                    size="sm"
                  >
                    Limpar Filtros
                  </Button>
                  <Button 
                    onClick={() => carregarSolicitacoes(true)}
                    disabled={loadingFiltros}
                    size="sm"
                  >
                    {loadingFiltros ? 'Carregando...' : 'Aplicar Filtros'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loading ? (
                <div className="md:col-span-2 lg:col-span-3 text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Carregando solicitações...</p>
                </div>
              ) : solicitacoes.length === 0 ? (
                <div className="md:col-span-2 lg:col-span-3 text-center py-12 border-2 border-dashed border-border rounded-xl">
                  <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-muted-foreground mb-2">
                    Nenhuma solicitação encontrada
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                    {filtros.search || filtros.status !== 'todas' || filtros.prioridade !== 'todas' || filtros.categoria !== 'todas'
                      ? 'Tente ajustar os filtros de busca' 
                      : 'Crie sua primeira solicitação para começar'}
                  </p>
                  {!filtros.search && filtros.status === 'todas' && filtros.prioridade === 'todas' && filtros.categoria === 'todas' && (
                    <Button
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6 py-2 shadow-lg hover:shadow-xl transition-all"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeira Solicitação
                    </Button>
                  )}
                </div>
              ) : (
                solicitacoes.map((solicitacao) => (
                <Card 
                  key={solicitacao.id} 
                  className={cn(
                    "group hover:shadow-md transition-all duration-300 border-l-4",
                    solicitacao.status === 'pendente' ? "border-l-yellow-500" :
                    solicitacao.status === 'em_analise' ? "border-l-blue-500" :
                    solicitacao.status === 'aprovado' ? "border-l-green-500" :
                    "border-l-red-500"
                  )}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-base group-hover:text-primary transition-colors">
                              {solicitacao.titulo}
                            </h3>
                            {getStatusBadge(solicitacao.status)}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                solicitacao.prioridade === 'critica' ? 'bg-red-100 text-red-800' :
                                solicitacao.prioridade === 'alta' ? 'bg-orange-100 text-orange-800' :
                                solicitacao.prioridade === 'media' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {solicitacao.prioridade === 'critica' ? 'Crítica' :
                                 solicitacao.prioridade === 'alta' ? 'Alta' :
                                 solicitacao.prioridade === 'media' ? 'Média' : 'Baixa'}
                              </span>
                            </div>
                            <span className="text-muted-foreground/50">•</span>
                            <div className="flex items-center gap-1">
                              <span className="px-2 py-1 rounded-md text-xs bg-primary/10 text-primary">
                                {solicitacao.categoria === 'protocolo' ? 'Protocolo' :
                                 solicitacao.categoria === 'medicamento' ? 'Medicamento' :
                                 solicitacao.categoria === 'procedimento' ? 'Procedimento' : 'Administrativo'}
                              </span>
                            </div>
                            <span className="text-muted-foreground/50">•</span>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                                {formatDate(solicitacao.created_at || '')}
                            </div>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-muted-foreground hover:text-primary"
                          onClick={async () => {
                            // Se não tem anexos, carregar sob demanda
                            if (!solicitacao.anexos || solicitacao.anexos.length === 0) {
                              await carregarAnexosSobDemanda(solicitacao.id!);
                            }
                            handleViewDocument(solicitacao);
                          }}
                          title="Visualizar documentos"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Descrição */}
                      <p className="text-sm text-muted-foreground">
                        {solicitacao.descricao}
                      </p>

                      {/* Anexos e Timeline em Grid */}
                      <div className="grid grid-cols-1 gap-4 pt-4 border-t">
                        {/* Anexos */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium flex items-center gap-2">
                            <Paperclip className="h-4 w-4" />
                            Documentos Anexados
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {solicitacao.anexos && solicitacao.anexos.length > 0 ? (
                              solicitacao.anexos.map((anexo, index) => (
                              <Badge
                                  key={anexo.id}
                                variant="secondary"
                                className="bg-primary/5 text-primary hover:bg-primary/10 cursor-pointer"
                              >
                                  {anexo.arquivo_nome}
                              </Badge>
                              ))
                            ) : (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>Nenhum anexo</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={async () => {
                                    await carregarAnexosSobDemanda(solicitacao.id!);
                                  }}
                                  className="text-xs hover:text-primary hover:bg-primary/10 px-2 py-1 rounded"
                                  title="Carregar anexos"
                                >
                                  🔄 Carregar
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Timeline */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Histórico
                          </h4>
                          <div className="space-y-2">
                            {solicitacao.historico && solicitacao.historico.map((evento, index) => (
                              <div
                                key={evento.id}
                                className={cn(
                                  "flex items-start gap-2 text-sm",
                                  index === solicitacao.historico.length - 1 && "text-primary"
                                )}
                              >
                                <div className="w-1.5 h-1.5 rounded-full mt-2 bg-primary" />
                                <div>
                                  <p className="font-medium">{evento.status}</p>
                                  <p className="text-muted-foreground text-xs">
                                    {formatDate(evento.created_at)} - {evento.comentario}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AjustesNegociacao; 
