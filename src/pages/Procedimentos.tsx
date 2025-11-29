import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Save, 
  X,
  FileText,
  DollarSign,
  Building2,
  CheckCircle,
  AlertCircle,
  LayoutGrid,
  LayoutList,
  FlipHorizontal,
  Calendar,
  Package
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import AnimatedSection from '@/components/AnimatedSection';
import { 
  ProcedimentoService,
  Procedimento,
  ProcedimentoOperadora,
  ProcedimentoCreateInput,
  ProcedimentoUpdateInput,
  NegociacaoCreateInput,
  NegociacaoUpdateInput
} from '@/services/procedimentoService';
import { OperadoraService, Operadora } from '@/services/operadoraService';
import { useAuth } from '@/contexts/AuthContext';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface NegociacaoTemp extends Omit<NegociacaoCreateInput, 'clinica_id'> {
  temp_id?: string;
  operadora_nome?: string;
}

const UNIDADES_PAGAMENTO = [
  'por sessão',
  'por dia',
  'por procedimento',
  'por unidade',
  'por hora',
  'por consulta',
  'por atendimento',
  'por aplicação',
  'por ciclo',
  'personalizado'
];

// Componente de Card Flip para Grade
const ProcedimentoFlipCard = ({ 
  procedimento, 
  negociacoes,
  onEdit, 
  onDelete,
  onAddNegociacao,
  onEditNegociacao,
  onDeleteNegociacao
}: {
  procedimento: Procedimento;
  negociacoes: ProcedimentoOperadora[];
  onEdit: (procedimento: Procedimento) => void;
  onDelete: (id: number) => void;
  onAddNegociacao: (procedimento: Procedimento) => void;
  onEditNegociacao: (negociacao: ProcedimentoOperadora) => void;
  onDeleteNegociacao: (id: number) => void;
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [preventFlip, setPreventFlip] = useState(false);

  const procedimentoNegociacoes = negociacoes.filter(n => n.procedimento_id === procedimento.id);

  const handleCardClick = () => {
    if (preventFlip) return;
    setIsFlipped(!isFlipped);
  };

  return (
    <div 
      className="h-[400px] w-full perspective-1000 cursor-pointer select-none"
      onClick={handleCardClick}
    >
      <div className={`relative w-full h-full transition-all duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
        {/* FRENTE - Informações do Procedimento */}
        <div className="absolute inset-0 w-full h-full backface-hidden">
          <Card className="h-full hover:shadow-lg transition-shadow duration-300 flex flex-col">
            <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-primary/10 border-b">
              <div className="flex items-start justify-between mb-2">
                <CardTitle className="text-base font-bold line-clamp-2 flex-1">{procedimento.descricao}</CardTitle>
                <Badge variant={procedimento.status === 'ativo' ? 'default' : 'secondary'} className="text-xs ml-2">
                  {ProcedimentoService.formatStatus(procedimento.status)}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="text-xs font-mono">
                  {procedimento.codigo}
                </Badge>
                <Badge className="text-xs bg-primary/10 text-primary border-primary/20">
                  {ProcedimentoService.formatCategoria(procedimento.categoria)}
                </Badge>
              </div>
            </CardHeader>

            <CardContent 
              className="flex-1 p-4 overflow-y-auto"
              onMouseEnter={() => setPreventFlip(true)}
              onMouseLeave={() => setPreventFlip(false)}
            >
              <div className="space-y-3">
                {/* Informações em cards */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-muted/50 rounded-lg p-2">
                    <p className="text-xs text-muted-foreground mb-1">Unidade</p>
                    <p className="text-sm font-semibold">{procedimento.unidade_pagamento}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2">
                    <p className="text-xs text-muted-foreground mb-1">Fracionamento</p>
                    <Badge variant={procedimento.fracionamento ? 'default' : 'secondary'} className="text-xs h-5">
                      {procedimento.fracionamento ? 'Sim' : 'Não'}
                    </Badge>
                  </div>
                </div>

                <Separator />

                {/* Estatísticas de Negociações */}
                <div className="bg-primary/5 rounded-lg p-3 space-y-2 border border-primary/10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      Negociações
                    </span>
                    <Badge variant="outline" className="font-bold">{procedimentoNegociacoes.length}</Badge>
                  </div>
                  {procedimentoNegociacoes.length > 0 && (
                    <div className="text-xs text-center text-muted-foreground pt-2 flex items-center justify-center gap-1">
                      <FlipHorizontal className="h-3 w-3" />
                      Clique para visualizar
                    </div>
                  )}
                </div>

                {/* Observações */}
                {procedimento.observacoes && (
                  <>
                    <Separator />
                    <div className="bg-muted/30 rounded-lg p-2">
                      <p className="text-xs text-muted-foreground mb-1">Observações</p>
                      <p className="text-xs line-clamp-3">{procedimento.observacoes}</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>

            <div 
              className="p-3 border-t bg-muted/30 flex gap-2"
              onMouseEnter={() => setPreventFlip(true)}
              onMouseLeave={() => setPreventFlip(false)}
              onClick={(e) => e.stopPropagation()}
            >
              <Button variant="outline" size="sm" onClick={() => onAddNegociacao(procedimento)} className="flex-1">
                <Plus className="h-3 w-3 mr-1" />
                Negociação
              </Button>
              <Button variant="outline" size="sm" onClick={() => onEdit(procedimento)}>
                <Edit className="h-3 w-3" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => onDelete(procedimento.id!)} className="text-destructive">
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </Card>
        </div>

        {/* VERSO - Negociações */}
        <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
          <Card className="h-full flex flex-col bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/20">
            <CardHeader className="pb-3 bg-gradient-to-r from-primary/10 to-primary/20 border-b">
              <div className="flex justify-between items-start mb-2">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Negociações
                </CardTitle>
                <div className="text-xs text-muted-foreground flex items-center gap-1 px-2 py-1 bg-background/80 rounded-md">
                  <FlipHorizontal className="h-3 w-3" />
                  Voltar
                </div>
              </div>
              <CardDescription className="text-xs">{procedimento.descricao} • {procedimento.codigo}</CardDescription>
            </CardHeader>
            
            <CardContent className="flex-1 p-3 overflow-y-auto">
              {procedimentoNegociacoes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <DollarSign className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">Nenhuma negociação cadastrada</p>
                  <p className="text-xs text-muted-foreground mt-1">Adicione valores negociados</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {procedimentoNegociacoes.map((neg) => {
                    const isVigente = ProcedimentoService.isNegociacaoVigente(neg);
                    return (
                      <div 
                        key={neg.id} 
                        className={`border-2 rounded-lg p-3 bg-background hover:shadow-md transition-all ${
                          isVigente ? 'border-blue-300' : 'border-border'
                        }`}
                        onMouseEnter={() => setPreventFlip(true)}
                        onMouseLeave={() => setPreventFlip(false)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-semibold flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {neg.operadora_nome}
                              </p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {neg.credenciado ? (
                                  <Badge className="bg-blue-100 text-blue-800 text-xs h-5">
                                    <CheckCircle className="h-2 w-2 mr-1" />
                                    Credenciado
                                  </Badge>
                                ) : (
                                  <Badge className="bg-yellow-100 text-yellow-800 text-xs h-5">
                                    <AlertCircle className="h-2 w-2 mr-1" />
                                    Não Credenciado
                                  </Badge>
                                )}
                                {isVigente ? (
                                  <Badge className="bg-blue-100 text-blue-800 text-xs h-5">Vigente</Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-xs h-5">Não Vigente</Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="bg-primary/5 rounded-md p-2">
                            <p className="text-xs text-muted-foreground">Valor</p>
                            <p className="text-base font-bold text-primary">{ProcedimentoService.formatValor(neg.valor)}</p>
                          </div>

                          <div className="text-xs space-y-0.5">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Início:</span>
                              <span className="font-medium">{new Date(neg.data_inicio).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Fim:</span>
                              <span className="font-medium">
                                {neg.data_fim ? new Date(neg.data_fim).toLocaleDateString('pt-BR') : 'Sem prazo'}
                              </span>
                            </div>
                          </div>

                          {neg.observacoes && (
                            <div className="text-xs pt-2 border-t">
                              <span className="text-muted-foreground">Obs:</span>
                              <p className="line-clamp-2 mt-0.5">{neg.observacoes}</p>
                            </div>
                          )}

                          <div className="flex gap-1 pt-2 border-t">
                            <Button variant="ghost" size="sm" onClick={() => onEditNegociacao(neg)} className="flex-1 h-7 text-xs">
                              <Edit className="h-3 w-3 mr-1" />
                              Editar
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => onDeleteNegociacao(neg.id!)} className="flex-1 h-7 text-xs text-destructive hover:text-destructive">
                              <Trash2 className="h-3 w-3 mr-1" />
                              Excluir
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const Procedimentos = () => {
  const { user } = useAuth();
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);
  const [negociacoes, setNegociacoes] = useState<ProcedimentoOperadora[]>([]);
  const [operadoras, setOperadoras] = useState<Operadora[]>([]);
  const [operadoraClinica, setOperadoraClinica] = useState<Operadora | null>(null);
  const [selectedProcedimento, setSelectedProcedimento] = useState<Procedimento | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isNegociacaoFormOpen, setIsNegociacaoFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [listTab, setListTab] = useState<'procedimentos' | 'negociacoes'>('procedimentos');
  const [editingNegociacao, setEditingNegociacao] = useState<ProcedimentoOperadora | null>(null);
  const [negociacoesTemp, setNegociacoesTemp] = useState<NegociacaoTemp[]>([]);
  const [unidadePagamentoCustomizada, setUnidadePagamentoCustomizada] = useState('');

  const [formData, setFormData] = useState<ProcedimentoCreateInput>({
    clinica_id: user?.clinica_id || 0,
    codigo: '',
    descricao: '',
    categoria: 'honorarios',
    unidade_pagamento: '',
    fracionamento: false,
    status: 'ativo',
    observacoes: ''
  });

  const [negociacaoFormData, setNegociacaoFormData] = useState<NegociacaoCreateInput>({
    operadora_id: 0,
    clinica_id: user?.clinica_id || 0,
    valor: 0,
    credenciado: false,
    data_inicio: new Date().toISOString().split('T')[0],
    data_fim: null,
    status: 'ativo',
    observacoes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!user?.clinica_id) {
      toast.error('Clínica não identificada');
      return;
    }

    try {
      setLoading(true);
      const [procData, negData, opData, opClinica] = await Promise.all([
        ProcedimentoService.getProcedimentosByClinica(user.clinica_id),
        ProcedimentoService.getNegociacoesByClinica(user.clinica_id),
        OperadoraService.getAllOperadoras(),
        OperadoraService.getOperadoraByClinica(user.clinica_id)
      ]);
      
      setProcedimentos(procData);
      setNegociacoes(negData);
      setOperadoras(opData);
      
      if (opClinica) {
        setOperadoraClinica(opClinica);
      } else {
        toast.warning('Esta clínica não possui uma operadora vinculada');
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProcedimentoCreateInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNegociacaoInputChange = (field: keyof NegociacaoCreateInput, value: any) => {
    setNegociacaoFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddNegociacaoTemp = () => {
    if (!formData.codigo || !formData.descricao || !formData.unidade_pagamento) {
      toast.error('Preencha os campos do procedimento antes de adicionar negociações');
      return;
    }

    const novaNegociacao: NegociacaoTemp = {
      temp_id: `temp_${Date.now()}`,
      operadora_id: operadoraClinica?.id || 0,
      operadora_nome: operadoraClinica?.nome || '',
      valor: 0,
      credenciado: false,
      data_inicio: new Date().toISOString().split('T')[0],
      data_fim: null,
      status: 'ativo',
      observacoes: ''
    };

    setNegociacoesTemp(prev => [...prev, novaNegociacao]);
  };

  const handleRemoveNegociacaoTemp = (temp_id: string) => {
    setNegociacoesTemp(prev => prev.filter(n => n.temp_id !== temp_id));
  };

  const handleUpdateNegociacaoTemp = (temp_id: string, field: string, value: any) => {
    setNegociacoesTemp(prev => prev.map(n => 
      n.temp_id === temp_id ? { ...n, [field]: value } : n
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.codigo || !formData.descricao || !formData.unidade_pagamento) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setSubmitting(true);
      
      if (selectedProcedimento) {
        const updated = await ProcedimentoService.updateProcedimento(
          selectedProcedimento.id!,
          formData as ProcedimentoUpdateInput
        );
        setProcedimentos(prev => prev.map(p => p.id === selectedProcedimento.id ? updated : p));
        toast.success('Procedimento atualizado com sucesso!');
      } else {
        const created = await ProcedimentoService.createProcedimento(formData);
        setProcedimentos(prev => [...prev, created]);
        
        if (negociacoesTemp.length > 0 && created.id) {
          for (const negTemp of negociacoesTemp) {
            const { temp_id, operadora_nome, ...negData } = negTemp;
            try {
              const negCriada = await ProcedimentoService.createNegociacao(created.id, {
                ...negData,
                clinica_id: user?.clinica_id || 0
              });
              setNegociacoes(prev => [...prev, negCriada]);
            } catch (err) {
              console.error('Erro ao criar negociação:', err);
            }
          }
        }
        
        toast.success('Procedimento criado com sucesso!');
      }
      
      resetForm();
      setIsFormOpen(false);
    } catch (error) {
      console.error('Erro ao salvar procedimento:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar procedimento');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNegociacaoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProcedimento || !negociacaoFormData.operadora_id || negociacaoFormData.valor <= 0) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setSubmitting(true);
      
      if (editingNegociacao) {
        const updated = await ProcedimentoService.updateNegociacao(
          editingNegociacao.id!,
          negociacaoFormData as NegociacaoUpdateInput
        );
        setNegociacoes(prev => prev.map(n => n.id === editingNegociacao.id ? updated : n));
        toast.success('Negociação atualizada com sucesso!');
      } else {
        const created = await ProcedimentoService.createNegociacao(
          selectedProcedimento.id!,
          negociacaoFormData
        );
        setNegociacoes(prev => [...prev, created]);
        toast.success('Negociação criada com sucesso!');
      }
      
      resetNegociacaoForm();
      setIsNegociacaoFormOpen(false);
    } catch (error) {
      console.error('Erro ao salvar negociação:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar negociação');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (procedimento: Procedimento) => {
    setSelectedProcedimento(procedimento);
    setFormData({
      clinica_id: procedimento.clinica_id,
      codigo: procedimento.codigo,
      descricao: procedimento.descricao,
      categoria: procedimento.categoria,
      unidade_pagamento: procedimento.unidade_pagamento,
      fracionamento: procedimento.fracionamento,
      status: procedimento.status,
      observacoes: procedimento.observacoes || ''
    });
    
    if (!UNIDADES_PAGAMENTO.includes(procedimento.unidade_pagamento)) {
      setUnidadePagamentoCustomizada(procedimento.unidade_pagamento);
    }
    
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este procedimento?')) return;

    try {
      await ProcedimentoService.deleteProcedimento(id);
      setProcedimentos(prev => prev.filter(p => p.id !== id));
      toast.success('Procedimento excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir procedimento:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir procedimento');
    }
  };

  const handleAddNegociacao = (procedimento: Procedimento) => {
    setSelectedProcedimento(procedimento);
    setEditingNegociacao(null);
    resetNegociacaoForm();
    setIsNegociacaoFormOpen(true);
  };

  const handleEditNegociacao = (negociacao: ProcedimentoOperadora) => {
    const procedimento = procedimentos.find(p => p.id === negociacao.procedimento_id);
    if (!procedimento) return;
    
    setSelectedProcedimento(procedimento);
    setEditingNegociacao(negociacao);
    setNegociacaoFormData({
      operadora_id: negociacao.operadora_id,
      clinica_id: negociacao.clinica_id,
      valor: negociacao.valor,
      credenciado: negociacao.credenciado,
      data_inicio: negociacao.data_inicio,
      data_fim: negociacao.data_fim || null,
      status: negociacao.status,
      observacoes: negociacao.observacoes || ''
    });
    setIsNegociacaoFormOpen(true);
  };

  const handleDeleteNegociacao = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta negociação?')) return;

    try {
      await ProcedimentoService.deleteNegociacao(id);
      setNegociacoes(prev => prev.filter(n => n.id !== id));
      toast.success('Negociação excluída com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir negociação:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir negociação');
    }
  };

  const resetForm = () => {
    setFormData({
      clinica_id: user?.clinica_id || 0,
      codigo: '',
      descricao: '',
      categoria: 'honorarios',
      unidade_pagamento: '',
      fracionamento: false,
      status: 'ativo',
      observacoes: ''
    });
    setSelectedProcedimento(null);
    setNegociacoesTemp([]);
    setUnidadePagamentoCustomizada('');
  };

  const resetNegociacaoForm = () => {
    setNegociacaoFormData({
      operadora_id: operadoraClinica?.id || 0,
      clinica_id: user?.clinica_id || 0,
      valor: 0,
      credenciado: false,
      data_inicio: new Date().toISOString().split('T')[0],
      data_fim: null,
      status: 'ativo',
      observacoes: ''
    });
    setEditingNegociacao(null);
  };

  const filteredProcedimentos = procedimentos.filter(p =>
    p.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.descricao.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredNegociacoes = negociacoes.filter(n => {
    const proc = procedimentos.find(p => p.id === n.procedimento_id);
    if (!proc) return false;
    return proc.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
           proc.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
           n.operadora_nome?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <AnimatedSection>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl md:text-3xl font-bold">Procedimentos</h2>
            <p className="text-muted-foreground text-sm">Gerencie procedimentos e negociações com operadoras</p>
          </div>
          <Button onClick={() => { resetForm(); setIsFormOpen(true); }} className="w-full lg:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Novo Procedimento
          </Button>
        </div>
      </AnimatedSection>

      {/* Busca e Toggle */}
      <AnimatedSection delay={100}>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="default"
                  onClick={() => setViewMode('grid')}
                  className="flex-1 md:flex-none"
                >
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  Grade
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="default"
                  onClick={() => setViewMode('list')}
                  className="flex-1 md:flex-none"
                >
                  <LayoutList className="h-4 w-4 mr-2" />
                  Lista
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </AnimatedSection>

      {/* Conteúdo */}
      <AnimatedSection delay={200}>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary"></div>
              <p className="text-muted-foreground">Carregando...</p>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          filteredProcedimentos.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum procedimento encontrado</h3>
                <p className="text-muted-foreground mb-6">
                  {searchTerm ? 'Tente ajustar sua busca' : 'Adicione o primeiro procedimento'}
                </p>
                <Button onClick={() => { resetForm(); setIsFormOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Procedimento
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProcedimentos.map((procedimento, index) => (
                <AnimatedSection key={procedimento.id} delay={30 * index}>
                  <ProcedimentoFlipCard
                    procedimento={procedimento}
                    negociacoes={negociacoes}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onAddNegociacao={handleAddNegociacao}
                    onEditNegociacao={handleEditNegociacao}
                    onDeleteNegociacao={handleDeleteNegociacao}
                  />
                </AnimatedSection>
              ))}
            </div>
          )
        ) : (
          <Tabs value={listTab} onValueChange={(v) => setListTab(v as 'procedimentos' | 'negociacoes')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="procedimentos">
                <FileText className="h-4 w-4 mr-2" />
                Procedimentos ({filteredProcedimentos.length})
              </TabsTrigger>
              <TabsTrigger value="negociacoes">
                <DollarSign className="h-4 w-4 mr-2" />
                Negociações ({filteredNegociacoes.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="procedimentos" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  {filteredProcedimentos.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                      <p>Nenhum procedimento encontrado</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredProcedimentos.map((proc) => {
                        const procNegociacoes = negociacoes.filter(n => n.procedimento_id === proc.id);
                        const negVigentes = procNegociacoes.filter(n => ProcedimentoService.isNegociacaoVigente(n));
                        
                        return (
                          <div 
                            key={proc.id} 
                            className="group relative border-2 rounded-xl p-5 hover:shadow-lg transition-all duration-300 hover:border-primary/30 bg-gradient-to-br from-background to-muted/20"
                          >
                            {/* Badge de destaque no canto */}
                            <div className="absolute -top-2 -right-2">
                              <Badge 
                                variant={proc.status === 'ativo' ? 'default' : 'secondary'}
                                className="shadow-md"
                              >
                                {ProcedimentoService.formatStatus(proc.status)}
                              </Badge>
                            </div>

                            <div className="flex flex-col lg:flex-row gap-5">
                              {/* Lado esquerdo - Informações principais */}
                              <div className="flex-1 space-y-4">
                                {/* Header */}
                                <div className="space-y-2">
                                  <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                                    {proc.descricao}
                                  </h3>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant="outline" className="font-mono text-xs">
                                      {proc.codigo}
                                    </Badge>
                                    <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                                      {ProcedimentoService.formatCategoria(proc.categoria)}
                                    </Badge>
                                    {procNegociacoes.length > 0 && (
                                      <Badge variant="secondary" className="text-xs">
                                        <DollarSign className="h-3 w-3 mr-1" />
                                        {procNegociacoes.length} {procNegociacoes.length === 1 ? 'negociação' : 'negociações'}
                                      </Badge>
                                    )}
                                    {negVigentes.length > 0 && (
                                      <Badge className="bg-blue-100 text-blue-800 text-xs">
                                        {negVigentes.length} vigente{negVigentes.length !== 1 && 's'}
                                      </Badge>
                                    )}
                                  </div>
                                </div>

                                {/* Informações em grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <div className="bg-muted/50 rounded-lg p-3 border border-border/50">
                                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                      <FileText className="h-3 w-3" />
                                      Unidade de Pagamento
                                    </p>
                                    <p className="font-semibold text-sm">{proc.unidade_pagamento}</p>
                                  </div>
                                  <div className="bg-muted/50 rounded-lg p-3 border border-border/50">
                                    <p className="text-xs text-muted-foreground mb-1">Fracionamento</p>
                                    <Badge variant={proc.fracionamento ? 'default' : 'secondary'} className="text-xs">
                                      {proc.fracionamento ? 'Permitido' : 'Não Permitido'}
                                    </Badge>
                                  </div>
                                  <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
                                    <p className="text-xs text-muted-foreground mb-1">Total de Negociações</p>
                                    <p className="font-bold text-lg text-primary">{procNegociacoes.length}</p>
                                  </div>
                                </div>

                                {/* Observações */}
                                {proc.observacoes && (
                                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                                    <p className="text-xs font-medium text-amber-900 dark:text-amber-200 mb-1 flex items-center gap-1">
                                      <AlertCircle className="h-3 w-3" />
                                      Observações
                                    </p>
                                    <p className="text-sm text-amber-800 dark:text-amber-300">{proc.observacoes}</p>
                                  </div>
                                )}
                              </div>

                              {/* Lado direito - Ações */}
                              <div className="flex flex-col gap-2 lg:min-w-[160px]">
                                <Button 
                                  variant="default" 
                                  size="sm" 
                                  onClick={() => handleAddNegociacao(proc)} 
                                  className="w-full shadow-md hover:shadow-lg transition-all"
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Nova Negociação
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleEdit(proc)} 
                                  className="w-full"
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleDelete(proc.id!)} 
                                  className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Excluir
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="negociacoes" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  {filteredNegociacoes.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-30" />
                      <p>Nenhuma negociação encontrada</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredNegociacoes.map((neg) => {
                        const isVigente = ProcedimentoService.isNegociacaoVigente(neg);
                        return (
                          <div 
                            key={neg.id} 
                            className={`group relative border-2 rounded-xl p-5 hover:shadow-lg transition-all duration-300 ${
                              isVigente 
                                ? 'bg-gradient-to-br from-blue-50 to-blue-50 dark:from-blue-950/20 dark:to-blue-950/20 border-blue-300 dark:border-blue-800' 
                                : 'bg-gradient-to-br from-background to-muted/20 hover:border-primary/30'
                            }`}
                          >
                            {/* Badge de status no canto */}
                            <div className="absolute -top-2 -right-2 flex gap-1">
                              {isVigente ? (
                                <Badge className="bg-[#1f4edd] text-white shadow-md">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Vigente
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="shadow-md">Não Vigente</Badge>
                              )}
                            </div>

                            <div className="flex flex-col lg:flex-row gap-5">
                              {/* Lado esquerdo - Informações */}
                              <div className="flex-1 space-y-4">
                                {/* Header */}
                                <div className="space-y-2">
                                  <div className="flex items-start gap-3">
                                    <div className="bg-primary/10 p-2 rounded-lg">
                                      <DollarSign className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="flex-1">
                                      <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                                        {neg.procedimento_descricao}
                                      </h3>
                                      <div className="flex flex-wrap items-center gap-2 mt-1">
                                        <Badge variant="outline" className="font-mono text-xs">
                                          {neg.procedimento_codigo}
                                        </Badge>
                                        <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200 text-xs">
                                          <Building2 className="h-3 w-3 mr-1" />
                                          {neg.operadora_nome}
                                        </Badge>
                                        {neg.credenciado ? (
                                          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 text-xs">
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                            Credenciado
                                          </Badge>
                                        ) : (
                                          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200 text-xs">
                                            <AlertCircle className="h-3 w-3 mr-1" />
                                            Não Credenciado
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Informações em grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                                    <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                                      <DollarSign className="h-3 w-3" />
                                      Valor Negociado
                                    </p>
                                    <p className="text-2xl font-bold text-primary">
                                      {ProcedimentoService.formatValor(neg.valor)}
                                    </p>
                                  </div>
                                  <div className="bg-muted/50 rounded-lg p-4 border border-border/50">
                                    <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      Período de Vigência
                                    </p>
                                    <div className="space-y-1">
                                      <p className="text-xs">
                                        <span className="text-muted-foreground">Início:</span>{' '}
                                        <span className="font-semibold">
                                          {new Date(neg.data_inicio).toLocaleDateString('pt-BR')}
                                        </span>
                                      </p>
                                      <p className="text-xs">
                                        <span className="text-muted-foreground">Fim:</span>{' '}
                                        <span className="font-semibold">
                                          {neg.data_fim ? new Date(neg.data_fim).toLocaleDateString('pt-BR') : 'Sem prazo definido'}
                                        </span>
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Observações */}
                                {neg.observacoes && (
                                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                                    <p className="text-xs font-medium text-blue-900 dark:text-blue-200 mb-1 flex items-center gap-1">
                                      <AlertCircle className="h-3 w-3" />
                                      Observações
                                    </p>
                                    <p className="text-sm text-blue-800 dark:text-blue-300">{neg.observacoes}</p>
                                  </div>
                                )}
                              </div>

                              {/* Lado direito - Ações */}
                              <div className="flex flex-col gap-2 lg:min-w-[140px]">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleEditNegociacao(neg)} 
                                  className="w-full"
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleDeleteNegociacao(neg.id!)} 
                                  className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Excluir
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </AnimatedSection>

      {/* Modal de Formulário de Procedimento */}
      <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogTitle>{selectedProcedimento ? 'Editar Procedimento' : 'Novo Procedimento'}</DialogTitle>
          <DialogDescription>
            {selectedProcedimento ? 'Atualize as informações do procedimento' : 'Preencha os dados do novo procedimento'}
          </DialogDescription>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Dados do Procedimento
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigo">Código *</Label>
                  <Input
                    id="codigo"
                    value={formData.codigo}
                    onChange={(e) => handleInputChange('codigo', e.target.value)}
                    placeholder="Ex: CONS001"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria *</Label>
                  <Select value={formData.categoria} onValueChange={(value) => handleInputChange('categoria', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="honorarios">Honorários</SelectItem>
                      <SelectItem value="taxas_diarias">Taxas e Diárias</SelectItem>
                      <SelectItem value="materiais_medicamentos">Materiais e Medicamentos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição *</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => handleInputChange('descricao', e.target.value)}
                  placeholder="Descreva o procedimento..."
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unidade_pagamento">Unidade de Pagamento *</Label>
                  <Select 
                    value={formData.unidade_pagamento || 'personalizado'} 
                    onValueChange={(value) => {
                      if (value === 'personalizado') {
                        handleInputChange('unidade_pagamento', '');
                      } else {
                        handleInputChange('unidade_pagamento', value);
                        setUnidadePagamentoCustomizada('');
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIDADES_PAGAMENTO.map(unidade => (
                        <SelectItem key={unidade} value={unidade}>
                          {unidade === 'personalizado' ? '📝 Personalizado' : unidade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(!formData.unidade_pagamento || !UNIDADES_PAGAMENTO.slice(0, -1).includes(formData.unidade_pagamento)) && (
                    <Input
                      placeholder="Digite a unidade de pagamento..."
                      value={unidadePagamentoCustomizada}
                      onChange={(e) => {
                        setUnidadePagamentoCustomizada(e.target.value);
                        handleInputChange('unidade_pagamento', e.target.value);
                      }}
                      required
                    />
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="fracionamento"
                  checked={formData.fracionamento}
                  onCheckedChange={(checked) => handleInputChange('fracionamento', checked)}
                />
                <Label htmlFor="fracionamento" className="cursor-pointer text-sm">
                  Permite Fracionamento de Pagamento
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => handleInputChange('observacoes', e.target.value)}
                  placeholder="Informações adicionais..."
                  rows={2}
                />
              </div>
            </div>

            {!selectedProcedimento && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-lg flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Negociações
                    </h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddNegociacaoTemp}
                      disabled={!formData.codigo || !formData.descricao || !formData.unidade_pagamento}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar
                    </Button>
                  </div>

                  {!formData.codigo || !formData.descricao || !formData.unidade_pagamento ? (
                    <div className="text-sm text-muted-foreground bg-muted p-4 rounded-md">
                      <AlertCircle className="h-4 w-4 inline mr-2" />
                      Preencha os campos do procedimento para adicionar negociações
                    </div>
                  ) : negociacoesTemp.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-4 border-2 border-dashed rounded-md">
                      Nenhuma negociação adicionada
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {negociacoesTemp.map((neg) => (
                        <div key={neg.temp_id} className="border rounded-lg p-4 space-y-3 bg-muted/30">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{neg.operadora_nome}</span>
                            <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveNegociacaoTemp(neg.temp_id!)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Valor (R$) *</Label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={neg.valor || ''}
                                onChange={(e) => handleUpdateNegociacaoTemp(neg.temp_id!, 'valor', parseFloat(e.target.value))}
                                required
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Data Início *</Label>
                              <Input
                                type="date"
                                value={neg.data_inicio}
                                onChange={(e) => handleUpdateNegociacaoTemp(neg.temp_id!, 'data_inicio', e.target.value)}
                                required
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Data Fim</Label>
                              <Input
                                type="date"
                                value={neg.data_fim || ''}
                                onChange={(e) => handleUpdateNegociacaoTemp(neg.temp_id!, 'data_fim', e.target.value || null)}
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`credenciado_${neg.temp_id}`}
                                checked={neg.credenciado}
                                onCheckedChange={(checked) => handleUpdateNegociacaoTemp(neg.temp_id!, 'credenciado', checked)}
                              />
                              <Label htmlFor={`credenciado_${neg.temp_id}`} className="text-sm cursor-pointer">
                                Credenciado
                              </Label>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Status</Label>
                              <Select 
                                value={neg.status || 'ativo'} 
                                onValueChange={(value) => handleUpdateNegociacaoTemp(neg.temp_id!, 'status', value)}
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="ativo">Ativo</SelectItem>
                                  <SelectItem value="inativo">Inativo</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <Label className="text-xs">Observações</Label>
                            <Textarea
                              value={neg.observacoes || ''}
                              onChange={(e) => handleUpdateNegociacaoTemp(neg.temp_id!, 'observacoes', e.target.value)}
                              placeholder="Informações adicionais..."
                              rows={2}
                              className="text-sm"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => { setIsFormOpen(false); resetForm(); }}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {selectedProcedimento ? 'Atualizar' : 'Cadastrar'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Negociação */}
      <Dialog open={isNegociacaoFormOpen} onOpenChange={(open) => { setIsNegociacaoFormOpen(open); if (!open) resetNegociacaoForm(); }}>
        <DialogContent className="max-w-2xl">
          <DialogTitle>{editingNegociacao ? 'Editar Negociação' : 'Nova Negociação'}</DialogTitle>
          <DialogDescription>
            {selectedProcedimento && `Procedimento: ${selectedProcedimento.descricao}`}
          </DialogDescription>
          
          <form onSubmit={handleNegociacaoSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Operadora Vinculada</Label>
              <Input
                value={operadoraClinica?.nome || 'Nenhuma operadora vinculada'}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valor">Valor (R$) *</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  min="0"
                  value={negociacaoFormData.valor || ''}
                  onChange={(e) => handleNegociacaoInputChange('valor', parseFloat(e.target.value))}
                  required
                />
              </div>
              <div className="flex items-center space-x-2 pt-8">
                <Checkbox
                  id="credenciado"
                  checked={negociacaoFormData.credenciado}
                  onCheckedChange={(checked) => handleNegociacaoInputChange('credenciado', checked)}
                />
                <Label htmlFor="credenciado" className="cursor-pointer">
                  Credenciado
                </Label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data_inicio">Data Início *</Label>
                <Input
                  id="data_inicio"
                  type="date"
                  value={negociacaoFormData.data_inicio}
                  onChange={(e) => handleNegociacaoInputChange('data_inicio', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data_fim">Data Fim</Label>
                <Input
                  id="data_fim"
                  type="date"
                  value={negociacaoFormData.data_fim || ''}
                  onChange={(e) => handleNegociacaoInputChange('data_fim', e.target.value || null)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="neg_status">Status</Label>
              <Select 
                value={negociacaoFormData.status} 
                onValueChange={(value) => handleNegociacaoInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                  <SelectItem value="vencido">Vencido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="neg_observacoes">Observações</Label>
              <Textarea
                id="neg_observacoes"
                value={negociacaoFormData.observacoes}
                onChange={(e) => handleNegociacaoInputChange('observacoes', e.target.value)}
                placeholder="Informações adicionais..."
                rows={2}
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => { setIsNegociacaoFormOpen(false); resetNegociacaoForm(); }}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {editingNegociacao ? 'Atualizar' : 'Cadastrar'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Procedimentos;
