import { useState, useRef, useEffect, useCallback } from 'react';
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
  Stethoscope,
  GraduationCap,
  Building2,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Download,
  Eye,
  Info
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import { AjustesService, type SolicitacaoCorpoClinico, type Anexo, type HistoricoItem } from '@/services/ajustesService';
import { EmailService } from '@/services/emailService';
import { LoadingState } from '@/components/ui/loading-states';
import { useDataLoader } from '@/hooks/useDataLoader';
import { connectionManager } from '@/services/connectionManager';
import config from '@/config/environment';
import { useAuth } from '@/contexts/AuthContext';

const AjustesCorpoClinico = () => {
  // Estados para dados e UI
  const { user } = useAuth();
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoCorpoClinico[]>([]);
  const [totalSolicitacoes, setTotalSolicitacoes] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [isBackendAvailable, setIsBackendAvailable] = useState(true);
  const [loadingFiltros, setLoadingFiltros] = useState(false);

  // Estados para estatísticas
  const [estatisticas, setEstatisticas] = useState({
    totalMedicos: 0,
    totalEspecialidades: 0,
    totalUnidades: 0,
    tempoMedioAprovacao: 0,
    taxaRenovacao: 0,
    solicitacoesPorStatus: {
      pendente: 0,
      em_analise: 0,
      aprovado: 0,
      rejeitado: 0
    }
  });

  // Estados para filtros
  const [filtros, setFiltros] = useState({
    status: 'todas' as 'todas' | 'pendente' | 'em_analise' | 'aprovado' | 'rejeitado',
    search: '',
    medico: '',
    especialidade: ''
  });

  // Estados para formulários
  const [novaSolicitacao, setNovaSolicitacao] = useState({
    titulo: '',
    descricao: '',
    medico: '',
    especialidade: '',
    anexos: [] as File[]
  });

  // Estados para modais
  const [showNovaSolicitacao, setShowNovaSolicitacao] = useState(false);
  const [editingSolicitacao, setEditingSolicitacao] = useState<SolicitacaoCorpoClinico | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedSolicitacao, setSelectedSolicitacao] = useState<SolicitacaoCorpoClinico | null>(null);
  const [novoStatus, setNovoStatus] = useState<'em_analise' | 'aprovado' | 'rejeitado'>('em_analise');
  const [comentarioStatus, setComentarioStatus] = useState('');
  
  // Estado para progresso de upload
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  
  // Estado para visualizador de anexos
  const [showAnexoViewer, setShowAnexoViewer] = useState(false);
  const [selectedAnexo, setSelectedAnexo] = useState<Anexo | null>(null);

  // Referência para o input de arquivo
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      
      console.log('🔍 Carregando solicitações com filtros:', filtros);
      
      // Sempre enviar os filtros, mesmo que sejam 'todas'
      const response = await AjustesService.listarSolicitacoes({
        clinica_id: user?.clinica_id || 1,
        tipo: 'corpo_clinico',
        status: filtros.status === 'todas' ? undefined : filtros.status,
        search: filtros.search || undefined,
        medico: filtros.medico || undefined,
        especialidade: filtros.especialidade || undefined,
        page: currentPage,
        pageSize: pageSize,
        sort: 'created_at:desc'
      });
      
      console.log('✅ Resposta do backend:', response);
      console.log('📋 Solicitações recebidas:', response.items);
      console.log('📎 Anexos nas solicitações:', response.items.map(s => ({ 
        id: s.id, 
        titulo: s.titulo, 
        anexos: s.anexos,
        anexosCount: s.anexos?.length || 0
      })));
      
      // Carregar anexos automaticamente para todas as solicitações
      const solicitacoesComAnexos = [];
      for (let i = 0; i < response.items.length; i++) {
        const solicitacao = response.items[i];
        
        try {
          console.log('🔍 Carregando anexos para solicitação:', solicitacao.id);
          const anexos = await AjustesService.listarAnexos(solicitacao.id!);
          
          if (anexos && Array.isArray(anexos)) {
            solicitacoesComAnexos.push({ ...solicitacao, anexos: anexos });
            console.log('✅ Anexos carregados:', anexos.length, 'para solicitação', solicitacao.id);
          } else {
            solicitacoesComAnexos.push({ ...solicitacao, anexos: [] });
            console.log('📋 Nenhum anexo encontrado para solicitação:', solicitacao.id);
          }
          
          // Delay pequeno entre carregamentos para evitar rate limiting
          if (i < response.items.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (error) {
          console.error('❌ Erro ao carregar anexos para solicitação:', solicitacao.id, error);
          solicitacoesComAnexos.push({ ...solicitacao, anexos: [] });
        }
      }
      
      console.log('📋 Solicitações com anexos carregados:', solicitacoesComAnexos);
      
      setSolicitacoes(solicitacoesComAnexos);
      setTotalSolicitacoes(response.total);
      calcularEstatisticas(solicitacoesComAnexos);
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

  // Função para calcular estatísticas
  const calcularEstatisticas = (solicitacoes: SolicitacaoCorpoClinico[]) => {
    console.log('📊 Calculando estatísticas para:', solicitacoes.length, 'solicitações');
    
    const totalMedicos = new Set(solicitacoes.map(s => s.medico)).size;
    const totalEspecialidades = new Set(solicitacoes.map(s => s.especialidade)).size;
    
    // Contar solicitações por status
    const solicitacoesPorStatus = {
      pendente: solicitacoes.filter(s => s.status === 'pendente').length,
      em_analise: solicitacoes.filter(s => s.status === 'em_analise').length,
      aprovado: solicitacoes.filter(s => s.status === 'aprovado').length,
      rejeitado: solicitacoes.filter(s => s.status === 'rejeitado').length
    };

    // Calcular tempo médio de aprovação (apenas para aprovados)
    const aprovadas = solicitacoes.filter(s => s.status === 'aprovado');
    let tempoMedioAprovacao = 0;
    if (aprovadas.length > 0) {
      const tempos = aprovadas.map(s => {
        if (s.created_at && s.updated_at) {
          const criacao = new Date(s.created_at);
          const atualizacao = new Date(s.updated_at);
          return Math.ceil((atualizacao.getTime() - criacao.getTime()) / (1000 * 60 * 60 * 24));
        }
        return 0;
      }).filter(t => t > 0);
      
      if (tempos.length > 0) {
        tempoMedioAprovacao = Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length);
      }
    }

    // Taxa de renovação (aprovados / total)
    const taxaRenovacao = solicitacoes.length > 0 
      ? Math.round((solicitacoesPorStatus.aprovado / solicitacoes.length) * 100)
      : 0;

    const novasEstatisticas = {
      totalMedicos,
      totalEspecialidades,
      totalUnidades: 3, // Fixo por enquanto
      tempoMedioAprovacao,
      taxaRenovacao,
      solicitacoesPorStatus
    };

    console.log('📈 Estatísticas calculadas:', novasEstatisticas);
    setEstatisticas(novasEstatisticas);
  };

  // Carregar solicitações ao montar componente
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
    console.log('🚀 useEffect executado - carregando solicitações');
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
  }, [filtros.status, filtros.search, filtros.medico, filtros.especialidade, isBackendAvailable]);

  // Função para visualizar um arquivo
  const handleViewDocument = (solicitacao: SolicitacaoCorpoClinico) => {
    console.log("Visualizando documentos da solicitação:", solicitacao.id);
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

  // Função para abrir anexo
  const handleOpenAnexo = (anexo: Anexo) => {
    console.log('📎 Abrindo anexo:', anexo);
    setSelectedAnexo(anexo);
    setShowAnexoViewer(true);
  };

  const getStatusBadge = (status: 'pendente' | 'em_analise' | 'aprovado' | 'rejeitado') => {
    switch (status) {
      case 'pendente':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Pendente</Badge>;
      case 'em_analise':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Em Análise</Badge>;
      case 'aprovado':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Aprovado</Badge>;
      case 'rejeitado':
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Rejeitado</Badge>;
    }
  };

  const getStatusIcon = (status: 'pendente' | 'em_analise' | 'aprovado' | 'rejeitado') => {
    switch (status) {
      case 'pendente':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'em_analise':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'aprovado':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejeitado':
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  // Função para criar nova solicitação
  const handleCriarSolicitacao = async () => {
    if (!novaSolicitacao.titulo || !novaSolicitacao.descricao || !novaSolicitacao.medico || !novaSolicitacao.especialidade) {
      toast.error('Todos os campos são obrigatórios');
      return;
    }

    try {
      setLoading(true);
      
      // 1. Criar a solicitação
      const novaSolicitacaoCriada = await AjustesService.criarSolicitacao({
        clinica_id: 1,
        tipo: 'corpo_clinico',
        titulo: novaSolicitacao.titulo,
        descricao: novaSolicitacao.descricao,
        medico: novaSolicitacao.medico,
        especialidade: novaSolicitacao.especialidade
      });

      console.log('✅ Solicitação criada:', novaSolicitacaoCriada);

                    // 2. Fazer upload dos anexos se houver
      if (novaSolicitacao.anexos.length > 0) {
        console.log('📎 Fazendo upload de', novaSolicitacao.anexos.length, 'anexos...');
        
        // Inicializar progresso
        const progressInicial: { [key: string]: number } = {};
        novaSolicitacao.anexos.forEach(file => {
          progressInicial[file.name] = 0;
        });
        setUploadProgress(progressInicial);
        
        // Processar anexos sequencialmente para evitar erro 429
        const anexosEnviados = [];
        for (const file of novaSolicitacao.anexos) {
          try {
            console.log(`📎 Enviando anexo: ${file.name}`);
            setUploadProgress(prev => ({ ...prev, [file.name]: 50 }));
            
            const anexo = await AjustesService.uploadAnexo(novaSolicitacaoCriada.id!, file);
            
            setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
            anexosEnviados.push(anexo);
            console.log('✅ Anexo enviado:', anexo);
            
            // Delay entre uploads para evitar erro 429
            if (novaSolicitacao.anexos.indexOf(file) < novaSolicitacao.anexos.length - 1) {
              console.log('⏳ Aguardando 1 segundo antes do próximo anexo...');
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          } catch (error) {
            console.error('❌ Erro ao enviar anexo:', file.name, error);
            setUploadProgress(prev => ({ ...prev, [file.name]: -1 })); // -1 indica erro
            throw error;
          }
        }
        console.log('🎉 Todos os anexos foram enviados!');
        
        // Limpar progresso após alguns segundos
        setTimeout(() => setUploadProgress({}), 3000);
      }

      // 3. Enviar email para a operadora
      console.log('📧 Enviando email para operadora...');
      try {
        await EmailService.enviarEmailNovaSolicitacao({
          titulo: novaSolicitacao.titulo,
          descricao: novaSolicitacao.descricao,
          medico: novaSolicitacao.medico,
          especialidade: novaSolicitacao.especialidade,
          clinica: 'Clínica Onkhos', // Nome da clínica
          dataCriacao: new Date().toLocaleString('pt-BR'),
          anexos: novaSolicitacao.anexos.map(file => file.name)
        });
        console.log('✅ Email enviado com sucesso!');
      } catch (error) {
        console.error('❌ Erro ao enviar email:', error);
        // Não vamos falhar a criação da solicitação por causa do email
      }

      toast.success('Solicitação criada com sucesso!' + (novaSolicitacao.anexos.length > 0 ? ` ${novaSolicitacao.anexos.length} anexo(s) enviado(s)!` : '') + ' Email enviado para operadora!');
      
      // 4. Limpar formulário e fechar modal
      setShowNovaSolicitacao(false);
      setNovaSolicitacao({ titulo: '', descricao: '', medico: '', especialidade: '', anexos: [] });
      
      // 5. Recarregar lista com delay para garantir que o backend processou
      setTimeout(() => {
        carregarSolicitacoes();
      }, 1000);
      
    } catch (error) {
      console.error('❌ Erro ao criar solicitação:', error);
      toast.error('Erro ao criar solicitação');
    } finally {
      setLoading(false);
    }
  };

  // Função para editar solicitação
  const handleEditarSolicitacao = async () => {
    if (!editingSolicitacao) return;

    try {
      setLoading(true);
      await AjustesService.atualizarSolicitacao(editingSolicitacao.id!, {
        titulo: editingSolicitacao.titulo,
        descricao: editingSolicitacao.descricao,
        medico: editingSolicitacao.medico,
        especialidade: editingSolicitacao.especialidade
      });

      toast.success('Solicitação atualizada com sucesso!');
      setEditingSolicitacao(null);
      carregarSolicitacoes();
    } catch (error) {
      console.error('Erro ao atualizar solicitação:', error);
      toast.error('Erro ao atualizar solicitação');
    } finally {
      setLoading(false);
    }
  };

  // Função para alterar status
  const handleAlterarStatus = async () => {
    if (!selectedSolicitacao) return;

    try {
      setLoading(true);
      await AjustesService.alterarStatus(selectedSolicitacao.id!, {
        status: novoStatus,
        comentario: comentarioStatus
      });

      toast.success('Status alterado com sucesso!');
      setShowStatusModal(false);
      setSelectedSolicitacao(null);
      setNovoStatus('em_analise');
      setComentarioStatus('');
      carregarSolicitacoes();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status');
    } finally {
      setLoading(false);
    }
  };

  // Função para excluir solicitação
  const handleExcluirSolicitacao = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta solicitação?')) return;

    try {
      setLoading(true);
      await AjustesService.excluirSolicitacao(id);
      toast.success('Solicitação excluída com sucesso!');
      carregarSolicitacoes();
    } catch (error) {
      console.error('Erro ao excluir solicitação:', error);
      toast.error('Erro ao excluir solicitação');
    } finally {
      setLoading(false);
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
                  Ajustes do Corpo Clínico
                </h1>
                <p className="text-muted-foreground text-sm md:text-base max-w-2xl">
                  Gerencie solicitações relacionadas ao corpo clínico e mantenha sua equipe atualizada
                </p>
              </div>

            </div>
          </div>
        </div>



        {/* Componentes de Estatísticas - Nova Seção Superior */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Componente Profissionais */}
          <Card className="bg-primary/5 border-primary/10 hover:shadow-lg transition-all duration-300 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground font-medium">Profissionais</p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-3xl font-bold text-primary">{estatisticas.totalMedicos}</h3>
                    <span className="text-xs text-muted-foreground">ativos</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Médicos cadastrados no sistema
                  </p>
                </div>
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Stethoscope className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Componente Especialidades */}
          <Card className="bg-card border-border/50 hover:shadow-lg transition-all duration-300 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground font-medium">Especialidades</p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-3xl font-bold">{estatisticas.totalEspecialidades}</h3>
                    <span className="text-xs text-muted-foreground">áreas</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Especialidades médicas disponíveis
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-xl">
                  <GraduationCap className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Componente Aprovadas/Rejeitadas */}
          <Card className="bg-card border-border/50 hover:shadow-lg transition-all duration-300 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground font-medium">Aprovadas/Rejeitadas</p>
                  <div className="flex items-baseline gap-3">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-xl font-bold text-green-600">{estatisticas.solicitacoesPorStatus.aprovado}</span>
                    </div>
                    <span className="text-muted-foreground">/</span>
                    <div className="flex items-center gap-1">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="text-xl font-bold text-red-600">{estatisticas.solicitacoesPorStatus.rejeitado}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Solicitações processadas
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-xl">
                  <CheckCircle className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          {/* Form de Nova Solicitação */}
          <div>
              <Card className="border-primary/10 shadow-md">
                <CardHeader className="space-y-1 bg-primary/5 border-b border-primary/10">
                  <CardTitle className="text-xl font-semibold text-primary">Nova Solicitação</CardTitle>
                  <CardDescription>
                    Preencha os dados do profissional para criar uma nova solicitação
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4" onSubmit={(e) => {
                    e.preventDefault();
                    handleCriarSolicitacao();
                  }}>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Nome do Profissional</label>
                        <Input
                          placeholder="Digite o nome completo do profissional"
                          value={novaSolicitacao.medico}
                          onChange={(e) => setNovaSolicitacao(prev => ({ ...prev, medico: e.target.value }))}
                          className="border-primary/20 focus:border-primary"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Especialidade</label>
                        <Select
                          value={novaSolicitacao.especialidade}
                          onValueChange={(value) => setNovaSolicitacao(prev => ({ ...prev, especialidade: value }))}
                        >
                          <SelectTrigger className="border-primary/20 focus:border-primary">
                            <SelectValue placeholder="Selecione a especialidade" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Oncologia Clínica">Oncologia Clínica</SelectItem>
                            <SelectItem value="Hematologia">Hematologia</SelectItem>
                            <SelectItem value="Radioterapia">Radioterapia</SelectItem>
                            <SelectItem value="Cirurgia Oncológica">Cirurgia Oncológica</SelectItem>
                            <SelectItem value="Oncologia Pediátrica">Oncologia Pediátrica</SelectItem>
                            <SelectItem value="Pesquisa Clínica">Pesquisa Clínica</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Título da Solicitação</label>
                        <Input
                          placeholder="Digite o título da solicitação"
                          value={novaSolicitacao.titulo}
                          onChange={(e) => setNovaSolicitacao(prev => ({ ...prev, titulo: e.target.value }))}
                          className="border-primary/20 focus:border-primary"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium">Descrição</label>
                          <TooltipProvider delayDuration={0}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 hover:bg-primary/10"
                                >
                                  <Info className="h-4 w-4 text-primary" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <div className="text-sm">
                                  <p className="font-medium mb-2">Documentos necessários:</p>
                                  <ul className="space-y-1 text-xs">
                                    <li>• Identidade Profissional</li>
                                    <li>• Diploma (Frente e Verso)</li>
                                    <li>• Comprovantes de Especializações</li>
                                    <li>• Comprovante de Vínculo no CNES</li>
                                  </ul>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <div className="relative">
                          <AutoResizeTextarea
                            placeholder=" "
                            value={novaSolicitacao.descricao}
                            onChange={(e) => setNovaSolicitacao(prev => ({ ...prev, descricao: e.target.value }))}
                            className="border-primary/20 focus:border-primary min-h-[180px] resize-none"
                          />
                          {!novaSolicitacao.descricao && (
                            <div className="absolute inset-0 p-3 text-sm text-muted-foreground pointer-events-none whitespace-pre font-sans leading-relaxed">
{`Descreva detalhadamente sua solicitação.
Documentos necessários:
• Identidade Profissional
• Diploma (Frente e Verso)
• Comprovantes de Especializações
• Comprovante de Vínculo no CNES`}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Documentos</label>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          className="hidden"
                          multiple
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
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
                                {novaSolicitacao.anexos.map((file, index) => {
                                  const progress = uploadProgress[file.name] || 0;
                                  const isError = progress === -1;
                                  
                                  return (
                                  <Badge
                                    key={index}
                                    variant="secondary"
                                      className={cn(
                                        "pl-2 pr-1 py-1 flex items-center gap-1 transition-all",
                                        isError 
                                          ? "bg-red-100 text-red-700 border-red-200" 
                                          : "bg-primary/5 text-primary hover:bg-primary/10"
                                      )}
                                    >
                                      <span className="text-xs truncate max-w-[120px]">
                                      {file.name}
                                    </span>
                                      {progress > 0 && progress < 100 && (
                                        <span className="text-xs text-muted-foreground">
                                          ({progress}%)
                                        </span>
                                      )}
                                      {progress === 100 && (
                                        <span className="text-xs text-green-600">
                                          ✓
                                        </span>
                                      )}
                                      {isError && (
                                        <span className="text-xs text-red-600">
                                          ✗
                                        </span>
                                      )}
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
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          
                          <p className="text-xs text-muted-foreground">
                            Formatos aceitos: PDF, DOC, DOCX, JPG, JPEG, PNG
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <Button 
                          type="submit" 
                          className="flex-1 gap-2 bg-primary hover:bg-primary/90"
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

              {/* Filtros de busca */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Buscar por texto</label>
                  <Input
                    placeholder="Título, descrição, médico..."
                    value={filtros.search}
                    onChange={(e) => setFiltros(prev => ({ ...prev, search: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Profissional</label>
                  <Input
                    placeholder="Nome do profissional"
                    value={filtros.medico}
                    onChange={(e) => setFiltros(prev => ({ ...prev, medico: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Especialidade</label>
                  <Input
                    placeholder="Especialidade"
                    value={filtros.especialidade}
                    onChange={(e) => setFiltros(prev => ({ ...prev, especialidade: e.target.value }))}
                  />
                </div>
              </div>
              
              {/* Botões de ação dos filtros */}
              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => setFiltros({ status: 'todas', search: '', medico: '', especialidade: '' })}
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
                    {filtros.search || filtros.medico || filtros.especialidade || filtros.status !== 'todas'
                      ? 'Tente ajustar os filtros de busca' 
                      : 'Crie sua primeira solicitação para começar'}
                  </p>
                  {!filtros.search && !filtros.medico && !filtros.especialidade && filtros.status === 'todas' && (
                    <Button
                      onClick={() => setShowNovaSolicitacao(true)}
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
                    "group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-l-4 cursor-pointer",
                    "hover:border-l-8 hover:scale-[1.02]",
                    solicitacao.status === 'pendente' ? "border-l-yellow-500 hover:border-l-yellow-400" :
                    solicitacao.status === 'em_analise' ? "border-l-blue-500 hover:border-l-blue-400" :
                    solicitacao.status === 'aprovado' ? "border-l-green-500 hover:border-l-green-400" :
                    "border-l-red-500 hover:border-l-red-400"
                  )}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-base group-hover:text-primary group-hover:scale-105 transition-all duration-300 origin-left">
                              {solicitacao.titulo}
                            </h3>
                            <div className="group-hover:scale-110 transition-transform duration-300">
                            {getStatusBadge(solicitacao.status)}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1 group-hover:text-primary transition-colors duration-300">
                                <User className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                              {solicitacao.medico}
                            </div>
                              <span className="text-muted-foreground/50 group-hover:text-primary/50 transition-colors duration-300">•</span>
                              <div className="flex items-center gap-1 group-hover:text-primary transition-colors duration-300">
                                <GraduationCap className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                              {solicitacao.especialidade}
                            </div>
                              <span className="text-muted-foreground/50 group-hover:text-primary/50 transition-colors duration-300">•</span>
                              <div className="flex items-center gap-1 group-hover:text-primary transition-colors duration-300">
                                <Calendar className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                                {formatDate(solicitacao.created_at || '')}
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Descrição */}
                      <p className="text-sm text-muted-foreground">
                        {solicitacao.descricao}
                      </p>

                      {/* Anexos e Timeline em Grid */}
                      <div className="grid grid-cols-1 gap-4 pt-4 border-t">
                        {/* Anexos */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium flex items-center gap-2 group-hover:text-primary transition-colors duration-300">
                            <Paperclip className="h-4 w-4 group-hover:rotate-12 transition-transform duration-300" />
                            Documentos Anexados
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {solicitacao.anexos && solicitacao.anexos.length > 0 ? (
                              solicitacao.anexos.map((anexo, index) => (
                                <div
                                  key={anexo.id}
                                  className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-3 py-2 hover:bg-primary/10 hover:border-primary/30 transition-all duration-300 hover:scale-105"
                                >
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <Paperclip className="h-4 w-4 text-primary flex-shrink-0" />
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium text-primary truncate max-w-[150px]">
                                        {anexo.arquivo_nome}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {(anexo.arquivo_tamanho / 1024).toFixed(1)} KB
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleOpenAnexo(anexo)}
                                      className="h-7 w-7 p-0 hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                                      title="Visualizar documento"
                                    >
                                      <Eye className="h-3 w-3" />
                                    </Button>
                                    
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        if (anexo.arquivo_url.startsWith('http')) {
                                          window.open(anexo.arquivo_url, '_blank');
                                        } else {
                                          const downloadUrl = AjustesService.getDownloadUrl(anexo.id);
                                          window.open(downloadUrl, '_blank');
                                        }
                                      }}
                                      className="h-7 w-7 p-0 hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                                      title="Baixar documento"
                                    >
                                      <Download className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>Nenhum anexo</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Timeline */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium flex items-center gap-2 group-hover:text-primary transition-colors duration-300">
                            <Clock className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                            Histórico
                          </h4>
                          <div className="space-y-2">
                            {solicitacao.historico?.map((evento, index) => (
                              <div
                                key={evento.id}
                                className={cn(
                                  "flex items-start gap-2 text-sm",
                                  index === (solicitacao.historico?.length || 0) - 1 && "text-primary"
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
                            )) || (
                              <span className="text-sm text-muted-foreground">Nenhum histórico</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Botões de Ação */}
                      <div className="flex items-center gap-2 pt-4 border-t opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingSolicitacao(solicitacao)}
                          className="flex-1 hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-105"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedSolicitacao(solicitacao);
                            setShowStatusModal(true);
                          }}
                          className="flex-1 hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-105"
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          Status
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExcluirSolicitacao(solicitacao.id!)}
                          className="text-destructive hover:text-destructive/80 hover:bg-destructive hover:text-destructive-foreground transition-all duration-300 hover:scale-105"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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

      {/* Modal Nova Solicitação */}
      {showNovaSolicitacao && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Nova Solicitação</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Título</label>
                <Input
                  value={novaSolicitacao.titulo}
                  onChange={(e) => setNovaSolicitacao(prev => ({ ...prev, titulo: e.target.value }))}
                  placeholder="Título da solicitação"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Descrição</label>
                <AutoResizeTextarea
                  value={novaSolicitacao.descricao}
                  onChange={(e) => setNovaSolicitacao(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Descrição detalhada da solicitação"
                  className="min-h-[100px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Profissional</label>
                  <Input
                    value={novaSolicitacao.medico}
                    onChange={(e) => setNovaSolicitacao(prev => ({ ...prev, medico: e.target.value }))}
                    placeholder="Nome do profissional"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Especialidade</label>
                  <Input
                    value={novaSolicitacao.especialidade}
                    onChange={(e) => setNovaSolicitacao(prev => ({ ...prev, especialidade: e.target.value }))}
                    placeholder="Especialidade"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button onClick={handleCriarSolicitacao} disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {novaSolicitacao.anexos.length > 0 ? 'Criando com anexos...' : 'Criando...'}
                  </>
                ) : (
                  'Criar Solicitação'
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowNovaSolicitacao(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Solicitação */}
      {editingSolicitacao && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Editar Solicitação</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Título</label>
                <Input
                  value={editingSolicitacao.titulo}
                  onChange={(e) => setEditingSolicitacao(prev => prev ? { ...prev, titulo: e.target.value } : null)}
                  placeholder="Título da solicitação"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Descrição</label>
                <AutoResizeTextarea
                  value={editingSolicitacao.descricao}
                  onChange={(e) => setEditingSolicitacao(prev => prev ? { ...prev, descricao: e.target.value } : null)}
                  placeholder="Descrição detalhada da solicitação"
                  className="min-h-[100px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Profissional</label>
                  <Input
                    value={editingSolicitacao.medico}
                    onChange={(e) => setEditingSolicitacao(prev => prev ? { ...prev, medico: e.target.value } : null)}
                    placeholder="Nome do profissional"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Especialidade</label>
                  <Input
                    value={editingSolicitacao.especialidade}
                    onChange={(e) => setEditingSolicitacao(prev => prev ? { ...prev, especialidade: e.target.value } : null)}
                    placeholder="Especialidade"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button onClick={handleEditarSolicitacao} disabled={loading} className="flex-1">
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
              <Button variant="outline" onClick={() => setEditingSolicitacao(null)}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Alterar Status */}
      {showStatusModal && selectedSolicitacao && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Alterar Status</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Novo Status</label>
                <Select value={novoStatus} onValueChange={(value: any) => setNovoStatus(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="em_analise">Em Análise</SelectItem>
                    <SelectItem value="aprovado">Aprovado</SelectItem>
                    <SelectItem value="rejeitado">Rejeitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Comentário (opcional)</label>
                <AutoResizeTextarea
                  value={comentarioStatus}
                  onChange={(e) => setComentarioStatus(e.target.value)}
                  placeholder="Comentário sobre a alteração de status"
                  className="min-h-[80px]"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button onClick={handleAlterarStatus} disabled={loading} className="flex-1">
                {loading ? 'Alterando...' : 'Alterar Status'}
              </Button>
              <Button variant="outline" onClick={() => setShowStatusModal(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Visualizador de Anexos */}
      {showAnexoViewer && selectedAnexo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <Paperclip className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-semibold">{selectedAnexo.arquivo_nome}</h3>
                  <p className="text-sm text-muted-foreground">
                    {(selectedAnexo.arquivo_tamanho / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (selectedAnexo.arquivo_url.startsWith('http')) {
                      window.open(selectedAnexo.arquivo_url, '_blank');
                    } else {
                      const downloadUrl = AjustesService.getDownloadUrl(selectedAnexo.id);
                      window.open(downloadUrl, '_blank');
                    }
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAnexoViewer(false)}
                >
                  Fechar
                </Button>
              </div>
            </div>

            {/* Conteúdo */}
            <div className="p-4 h-[calc(90vh-120px)] overflow-auto">
              {selectedAnexo.arquivo_nome.toLowerCase().endsWith('.pdf') ? (
                // Visualizador de PDF
                <iframe
                  src={selectedAnexo.arquivo_url.startsWith('http') 
                    ? selectedAnexo.arquivo_url 
                    : AjustesService.getDownloadUrl(selectedAnexo.id)
                  }
                  className="w-full h-full border rounded"
                  title={selectedAnexo.arquivo_nome}
                />
              ) : selectedAnexo.arquivo_nome.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                // Visualizador de imagens
                <div className="flex items-center justify-center h-full">
                  <img
                    src={selectedAnexo.arquivo_url.startsWith('http') 
                      ? selectedAnexo.arquivo_url 
                      : AjustesService.getDownloadUrl(selectedAnexo.id)
                    }
                    alt={selectedAnexo.arquivo_nome}
                    className="max-w-full max-h-full object-contain rounded shadow-lg"
                  />
                </div>
              ) : (
                // Para outros tipos de arquivo, mostrar informações e botão de download
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                  <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center">
                    <FileText className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium mb-2">{selectedAnexo.arquivo_nome}</h4>
                    <p className="text-muted-foreground mb-4">
                      Este tipo de arquivo não pode ser visualizado diretamente.
                    </p>
                    <Button
                      onClick={() => {
                        if (selectedAnexo.arquivo_url.startsWith('http')) {
                          window.open(selectedAnexo.arquivo_url, '_blank');
                        } else {
                          const downloadUrl = AjustesService.getDownloadUrl(selectedAnexo.id);
                          window.open(downloadUrl, '_blank');
                        }
                      }}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Baixar Arquivo
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AjustesCorpoClinico; 