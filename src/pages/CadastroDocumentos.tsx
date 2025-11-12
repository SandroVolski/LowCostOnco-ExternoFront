import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { FolderOpen, Upload, Save, Calendar, FileText, Edit, Trash2, Download, AlertTriangle, CheckCircle, Clock, Archive, Plus, Filter, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ClinicService, Documento } from '@/services/clinicService';
import { useDataLoader, useDataMutation } from '@/hooks/useDataLoader';
import { LoadingState } from '@/components/ui/loading-states';
import { cn } from '@/lib/utils';
import config from '@/config/environment';
import { useAuth } from '@/contexts/AuthContext';

const emptyDocumento: Documento = {
  nome: '',
  tipo: '',
  descricao: '',
  data_envio: new Date().toISOString().split('T')[0],
  data_vencimento: '',
  status: 'ativo',
  clinica_id: 1
};

// Tipos de documento predefinidos
const TIPOS_DOCUMENTO = [
  'Alvará de Funcionamento',
  'Licença Sanitária',
  'CNES',
  'Certificado de Responsabilidade Técnica',
  'Seguro de Responsabilidade Civil',
  'Contrato com Operadoras',
  'Certificação ISO',
  'Licença Ambiental',
  'Certificado de Calibração',
  'Outros'
];

// Componente AnimatedSection
const AnimatedSection = ({ children, delay = 0, className = "" }: {
  children: React.ReactNode;
  delay?: number;  
  className?: string;
}) => (
  <div 
    className={`animate-fade-in-up ${className}`}
    style={{ animationDelay: `${delay}ms` }}
  >
    {children}
  </div>
);

const CadastroDocumentos = () => {
  const [isDocumentoDialogOpen, setIsDocumentoDialogOpen] = useState(false);
  const { user } = useAuth();
  const [currentDocumento, setCurrentDocumento] = useState<Documento>(emptyDocumento);
  const [isEditingDocumento, setIsEditingDocumento] = useState(false);
  const [filterType, setFilterType] = useState<string>('todos');
  // Lista filtrada derivada (useMemo evita loops de atualização)
  // Removemos setState em efeito para impedir "Maximum update depth exceeded"
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado para forçar refresh da lista
  const [refreshKey, setRefreshKey] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false); // Proteção contra múltiplas operações

  // Usar o sistema de carregamento
  const {
    data: documentosData,
    loading,
    error,
    refetch,
    isBackendAvailable
  } = useDataLoader({
    key: `documentos:${user?.clinica_id || 1}:${refreshKey}`, // Inclui clinica_id para chave estável por clínica
    loader: async () => {
      return await ClinicService.listarDocumentos({ clinica_id: user?.clinica_id || 1 });
    },
    fallback: () => {
      const savedDocumentos = localStorage.getItem('clinic_documentos');
      return savedDocumentos ? JSON.parse(savedDocumentos) : [];
    },
    ttl: 30 * 1000, // 30 segundos de cache (evita loop infinito)
    showToast: false
  });

  // Normaliza tanto { documentos: [...] } quanto [...] para sempre virar array
  const documentos = Array.isArray(documentosData)
  ? documentosData
  : (documentosData?.documentos ?? []);

  // Log dos documentos carregados (apenas em desenvolvimento)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {}
  }, [documentos]);

  // Função para calcular status baseado na data de vencimento (APENAS para documentos sem status)
  const calcularStatus = useCallback((documento: Documento): Documento['status'] => {
    // Se já tem status do banco, mantém ele
    if (documento.status && documento.status !== 'ativo') {
      return documento.status;
    }
    
    // Só calcula se não tiver data de vencimento ou se for necessário
    if (!documento.data_vencimento) return 'ativo';
    
    const hoje = new Date();
    const vencimento = new Date(documento.data_vencimento);
    const diasParaVencer = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 3600 * 24));
    
    if (diasParaVencer < 0) return 'vencido';
    if (diasParaVencer <= 30) return 'vencendo';
    return 'ativo';
  }, []);

  // Atualizar status e filtrar documentos sem setState (evita re-renders em loop)
  const documentosComStatus = useMemo(() => {
    return documentos.map(doc => ({
      ...doc,
      status: calcularStatus(doc)
    }));
  }, [documentos, calcularStatus]);

  const filteredDocumentos = useMemo(() => {
    return applyFilter(documentosComStatus, filterType);
  }, [documentosComStatus, filterType]);

  // Função para aplicar filtros (declaração normal evita ordem de inicialização)
  function applyFilter(documentos: Documento[], filter: string) {
    let filtered = [...documentos];
    
    switch (filter) {
      case 'ativo':
        filtered = filtered.filter(doc => doc.status === 'ativo');
        break;
      case 'vencendo':
        filtered = filtered.filter(doc => doc.status === 'vencendo');
        break;
      case 'vencido':
        filtered = filtered.filter(doc => doc.status === 'vencido');
        break;
      case 'arquivado':
        filtered = filtered.filter(doc => doc.status === 'arquivado');
        break;
      default:
        // 'todos' - não filtra
        break;
    }
    
    // Ordenar por data de vencimento (mais próximos primeiro)
    return filtered.sort((a, b) => {
      if (!a.data_vencimento && !b.data_vencimento) return 0;
      if (!a.data_vencimento) return 1;
      if (!b.data_vencimento) return -1;
      return new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime();
    });
  }

  // Funções para documentos
  const handleAddDocumento = useCallback(() => {
    setCurrentDocumento({...emptyDocumento});
    setIsEditingDocumento(false);
    setSelectedFile(null);
    setIsDocumentoDialogOpen(true);
  }, []);

  const handleEditDocumento = useCallback((documento: Documento) => {
    setCurrentDocumento(documento);
    setIsEditingDocumento(true);
    setSelectedFile(null);
    setIsDocumentoDialogOpen(true);
  }, []);

  const handleDeleteDocumento = useCallback(async (documento: Documento) => {
    if (isUpdating) return; // Evita múltiplas operações simultâneas
    
    setIsUpdating(true);
    try {
      if (isBackendAvailable && documento.id) {
        await ClinicService.removerDocumento(documento.id);
        setRefreshKey(prev => prev + 1);
        // Aguarda um pouco para garantir que a chave foi atualizada
        await new Promise(resolve => setTimeout(resolve, 100));
        await refetch();
        toast.success('Documento removido com sucesso!');
      } else {
        // Fallback para localStorage
        const updatedDocumentos = documentos.filter(d => d !== documento);
        localStorage.setItem('clinic_documentos', JSON.stringify(updatedDocumentos));
        setRefreshKey(prev => prev + 1);
        // Aguarda um pouco para garantir que a chave foi atualizada
        await new Promise(resolve => setTimeout(resolve, 100));
        await refetch();
        toast.success('Documento removido com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao remover documento:', error);
      toast.error('Erro ao remover documento', {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      setIsUpdating(false);
    }
  }, [isBackendAvailable, documentos, refetch, isUpdating]);

  const handleSaveDocumento = useCallback(async () => {
    if (isUpdating) return; // Evita múltiplas operações simultâneas
    
    if (!currentDocumento.nome || !currentDocumento.tipo || !currentDocumento.data_envio) {
      toast.error('Nome, tipo e data de envio são obrigatórios');
      return;
    }

    setIsUpdating(true);
    try {
      if (isBackendAvailable) {
        if (selectedFile) {
          // Upload com arquivo
          const { id, created_at, updated_at, ...documentoData } = currentDocumento;
          await ClinicService.uploadDocumento(selectedFile, documentoData);
          toast.success('Documento enviado com sucesso!');
        } else if (isEditingDocumento && currentDocumento.id) {
          // Atualização sem arquivo
          await ClinicService.atualizarDocumento(currentDocumento.id, currentDocumento);
          toast.success('Documento atualizado com sucesso!');
        } else {
          toast.error('Selecione um arquivo para upload');
          return;
        }
      } else {
        // Fallback para localStorage
        let updatedDocumentos;
        
        if (isEditingDocumento) {
          updatedDocumentos = documentos.map(d => 
            d === currentDocumento ? currentDocumento : d
          );
          toast.success('Documento atualizado com sucesso!');
        } else {
          const documentoWithId = {
            ...currentDocumento,
            id: Date.now(),
            arquivo_nome: selectedFile?.name,
            arquivo_tamanho: selectedFile?.size
          };
          updatedDocumentos = [...documentos, documentoWithId];
          toast.success('Documento adicionado com sucesso!');
        }
        
        localStorage.setItem('clinic_documentos', JSON.stringify(updatedDocumentos));
      }
      
      // Forçar refresh imediato da lista
      setRefreshKey(prev => prev + 1);
      // Aguarda um pouco para garantir que a chave foi atualizada
      await new Promise(resolve => setTimeout(resolve, 100));
      await refetch();
      setIsDocumentoDialogOpen(false);
    } catch (error) {
      console.error('Erro ao salvar documento:', error);
      toast.error('Erro ao salvar documento', {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      setIsUpdating(false);
    }
  }, [currentDocumento, isEditingDocumento, isBackendAvailable, documentos, refetch, selectedFile, isUpdating]);

  const handleDocumentoInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentDocumento(prev => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/jpg'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast.error('Tipo de arquivo não permitido', {
          description: 'Apenas PDF, DOC, DOCX, JPG e PNG são aceitos'
        });
        return;
      }
      
      // Validar tamanho (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Arquivo muito grande', {
          description: 'O arquivo deve ter no máximo 10MB'
        });
        return;
      }
      
      setSelectedFile(file);
    }
  }, []);

  const getStatusBadge = (status: Documento['status']) => {
    switch (status) {
      case 'ativo':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Ativo</Badge>;
      case 'vencendo':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Vencendo</Badge>;
      case 'vencido':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Vencido</Badge>;
      case 'arquivado':
        return <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20">Arquivado</Badge>;
      default:
        return null;
    }
  };

  const getStatusIcon = (status: Documento['status']) => {
    switch (status) {
      case 'ativo':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'vencendo':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'vencido':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'arquivado':
        return <Archive className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerTitle, setViewerTitle] = useState<string>('');

  const openViewer = (doc: Documento) => {
    const url = doc.arquivo_url || (doc.id ? `${config.API_BASE_URL}/clinicas/documentos/${doc.id}/download` : '');
    setViewerUrl(url || null);
    setViewerTitle(doc.nome || doc.arquivo_nome || 'Documento');
    setIsViewerOpen(true);
  };

  const closeViewer = () => {
    setIsViewerOpen(false);
    setViewerUrl(null);
  };

  const isImage = (url?: string | null) => !!url && /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(url);
  const isPdf = (url?: string | null) => !!url && /\.pdf(\?|$)/i.test(url);



  return (
    <LoadingState
      loading={loading}
      error={error}
      isBackendAvailable={isBackendAvailable}
      onRetry={refetch}
      loadingText="Carregando documentos..."
      errorText="Erro ao carregar documentos"
    >
      <div className="space-y-6">
        {/* Header */}
        <AnimatedSection>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Cadastro de Documentos
              </h1>
              <p className="text-muted-foreground mt-2">
                Gerencie os documentos da clínica com controle de vencimento
              </p>
              {!isBackendAvailable && (
                <p className="text-orange-600 text-sm mt-1">
                  ⚠️ API não disponível. Dados salvos localmente.
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
            <Button
              onClick={handleAddDocumento}
                disabled={isUpdating}
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Documento
            </Button>
            </div>
          </div>
        </AnimatedSection>

        {/* Lista de Documentos */}
        <AnimatedSection delay={200}>
          <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
            <CardHeader className="pb-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center text-foreground font-semibold">
                  <div className="p-2 bg-primary/10 rounded-lg mr-3">
                    <FolderOpen className="h-6 w-6 text-primary" />
                  </div>
                  Documentos da Clínica
                  <Badge variant="secondary" className="ml-3 text-xs">
                    {filteredDocumentos.length} de {documentos.length} documentos
                  </Badge>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="w-[180px] h-9">
                        <SelectValue placeholder="Filtrar por status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="ativo">Ativos</SelectItem>
                        <SelectItem value="vencendo">Vencendo</SelectItem>
                        <SelectItem value="vencido">Vencidos</SelectItem>
                        <SelectItem value="arquivado">Arquivados</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              {filteredDocumentos.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
                  <FolderOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-muted-foreground mb-2">
                    Nenhum documento cadastrado
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                    Adicione os documentos da clínica para manter o controle de vencimentos
                  </p>
                  <Button
                    onClick={handleAddDocumento}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6 py-2 shadow-lg hover:shadow-xl transition-all"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Primeiro Documento
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredDocumentos.map((documento, index) => (
                    <Card 
                      key={documento.id || index} 
                      className={cn(
                        "relative rounded-xl overflow-hidden border border-border/70 hover:border-primary/30 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5",
                      )}
                    >
                      <div
                        className={cn(
                          "absolute inset-x-0 top-0 h-1",
                          documento.status === 'ativo' ? "bg-green-500" :
                          documento.status === 'vencendo' ? "bg-yellow-500" :
                          documento.status === 'vencido' ? "bg-red-500" : "bg-gray-400"
                      )}
                      />
                      <CardContent className="p-6">
                        <div className="flex flex-col space-y-4">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(documento.status)}
                                <h4 className="font-semibold text-base group-hover:text-primary transition-colors line-clamp-1">
                                  {documento.nome}
                                </h4>
                              </div>
                              <p className="text-sm text-muted-foreground">{documento.tipo}</p>
                              {getStatusBadge(documento.status)}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-primary/10"
                                onClick={() => handleEditDocumento(documento)}
                                disabled={isUpdating}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-destructive/10 text-destructive"
                                onClick={() => handleDeleteDocumento(documento)}
                                disabled={isUpdating}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Informações */}
                          <div className="space-y-3 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Data de Envio:</span>
                              <span className="font-medium">{formatDate(documento.data_envio)}</span>
                            </div>
                            
                            {documento.data_vencimento && (
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Vencimento:</span>
                                <span className={cn(
                                  "font-medium",
                                  documento.status === 'vencido' ? "text-red-500" :
                                  documento.status === 'vencendo' ? "text-yellow-500" :
                                  "text-foreground"
                                )}>
                                  {formatDate(documento.data_vencimento)}
                                </span>
                              </div>
                            )}

                            {documento.arquivo_nome && (
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Arquivo:</span>
                                <div className="text-right">
                                  <p className="font-medium text-xs line-clamp-1" title={documento.arquivo_nome}>
                                    {documento.arquivo_nome}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatFileSize(documento.arquivo_tamanho)}
                                  </p>

                                  {/* ADICIONE ESTE BLOCO */}
                                  <div className="flex gap-2 justify-end mt-2">
                                    {documento.arquivo_url && (
                                      <button
                                        type="button"
                                        onClick={() => openViewer(documento)}
                                        className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/15 transition"
                                        title="Visualizar"
                                      >
                                        <Eye className="h-3 w-3" />
                                        Visualizar
                                      </button>
                                    )}
                                    {documento.id && (
                                      <a
                                        href={`${config.API_BASE_URL}/clinicas/documentos/${documento.id}/download`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-muted hover:bg-muted/70 transition"
                                        title="Baixar"
                                      >
                                        <Download className="h-3 w-3" />
                                        Baixar
                                      </a>
                                    )}
                                  </div>
                                  {/* FIM DO BLOCO */}
                                </div>
                              </div>
                            )}

                            {documento.descricao && (
                              <div className="pt-2 border-t">
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {documento.descricao}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </AnimatedSection>

        {/* Modal para Adicionar/Editar Documento */}
        <Dialog open={isDocumentoDialogOpen} onOpenChange={setIsDocumentoDialogOpen}>
          <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden overscroll-contain">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-primary" />
                {isEditingDocumento ? 'Editar Documento' : 'Adicionar Documento'}
              </DialogTitle>
            </DialogHeader>
            <div className="px-4 pt-4">
              <div className="max-h-[65vh] overflow-y-auto space-y-4 pr-2">
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-sm font-medium">
                  Nome do Documento *
                </Label>
                <Input
                  id="nome"
                  name="nome"
                  value={currentDocumento.nome}
                  onChange={handleDocumentoInputChange}
                  placeholder="Nome do documento"
                  className="h-11 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tipo" className="text-sm font-medium">
                  Tipo de Documento *
                </Label>
                <Select 
                  value={currentDocumento.tipo} 
                  onValueChange={(value) => setCurrentDocumento(prev => ({ ...prev, tipo: value }))}
                >
                  <SelectTrigger className="h-11 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_DOCUMENTO.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao" className="text-sm font-medium">
                  Descrição
                </Label>
                <Textarea
                  id="descricao"
                  name="descricao"
                  value={currentDocumento.descricao || ''}
                  onChange={handleDocumentoInputChange}
                  placeholder="Descrição opcional do documento"
                  className="border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="data_envio" className="text-sm font-medium">
                    Data de Envio *
                  </Label>
                  <Input
                    id="data_envio"
                    name="data_envio"
                    type="date"
                    value={currentDocumento.data_envio}
                    onChange={handleDocumentoInputChange}
                    className="h-11 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="data_vencimento" className="text-sm font-medium">
                    Data de Vencimento
                  </Label>
                  <Input
                    id="data_vencimento"
                    name="data_vencimento"
                    type="date"
                    value={currentDocumento.data_vencimento || ''}
                    onChange={handleDocumentoInputChange}
                    className="h-11 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="arquivo" className="text-sm font-medium">
                  Arquivo {!isEditingDocumento && '*'}
                </Label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <div className="space-y-3">
                  <Button 
                    type="button"
                    variant="outline" 
                    className="gap-2 w-full border-primary/20 hover:bg-primary/5 hover:text-primary"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                    {selectedFile ? 'Alterar Arquivo' : 'Selecionar Arquivo'}
                  </Button>
                  
                  {selectedFile && (
                    <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-primary truncate">
                            {selectedFile.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(selectedFile.size)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                    
                    {isEditingDocumento && !selectedFile && currentDocumento.arquivo_nome && (
                      <div className="p-3 bg-muted/40 rounded-lg border border-border/40">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="h-4 w-4 text-primary" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{currentDocumento.arquivo_nome}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(currentDocumento.arquivo_tamanho)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {currentDocumento.arquivo_url && (
                              <button
                                type="button"
                                onClick={() => openViewer(currentDocumento)}
                                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/15 transition"
                                title="Visualizar"
                              >
                                <Eye className="h-3 w-3" />
                                Visualizar
                              </button>
                            )}
                            {currentDocumento.id && (
                              <a
                                href={`${config.API_BASE_URL}/clinicas/documentos/${currentDocumento.id}/download`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-muted hover:bg-muted/70 transition"
                                title="Baixar"
                              >
                                <Download className="h-3 w-3" />
                                Baixar
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  
                  <p className="text-xs text-muted-foreground">
                    Formatos aceitos: PDF, DOC, DOCX, JPG, PNG (máx. 10MB)
                  </p>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="px-4 pb-4">
              <Button
                variant="outline"
                onClick={() => setIsDocumentoDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveDocumento}
                disabled={isUpdating}
                className="bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className={`w-4 h-4 mr-2 ${isUpdating ? 'animate-spin' : ''}`} />
                {isUpdating ? 'Salvando...' : (isEditingDocumento ? 'Atualizar' : 'Adicionar')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de visualização (popout) */}
        <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
          <DialogContent className="max-w-5xl w-full p-0 overflow-hidden">
            <DialogHeader className="px-4 py-3 border-b">
              <DialogTitle className="text-base">{viewerTitle}</DialogTitle>
            </DialogHeader>

            <div className="h-[75vh] bg-muted/30">
              {viewerUrl ? (
                isImage(viewerUrl) ? (
                  <div className="w-full h-full flex items-center justify-center p-2">
                    <img
                      src={viewerUrl}
                      alt={viewerTitle}
                      className="max-w-full max-h-full rounded-md shadow"
                    />
                  </div>
                ) : (
                  <object
                    data={viewerUrl}
                    type="application/pdf"
                    className="w-full h-full"
                  >
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                      <p className="text-sm text-muted-foreground">
                        Não foi possível visualizar o arquivo embutido.
                      </p>
                      <div className="mt-3 flex gap-2">
                        <a
                          href={viewerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs underline text-primary"
                        >
                          Abrir em nova aba
                        </a>
                        <button
                          type="button"
                          onClick={closeViewer}
                          className="text-xs underline"
                        >
                          Fechar
                        </button>
                      </div>
                    </div>
                  </object>
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">Nenhum arquivo selecionado</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </LoadingState>
  );
};

export default CadastroDocumentos; 