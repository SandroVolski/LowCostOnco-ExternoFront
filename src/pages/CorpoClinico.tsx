import { useState, useEffect, useCallback, useMemo } from 'react';
import { FileText, Plus, Edit, Trash2, UserPlus, Save, Users, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ClinicService, ResponsavelTecnico } from '@/services/clinicService';
import { OperadoraService, Operadora } from '@/services/operadoraService';
import { useDataLoader, useDataMutation } from '@/hooks/useDataLoader';
import { LoadingState, ConnectionStatus } from '@/components/ui/loading-states';

const emptyResponsavel: ResponsavelTecnico = {
  nome: '',
  tipo_profissional: 'medico',
  registro_conselho: '',
  uf_registro: '',
  especialidade_principal: '',
  rqe_principal: '',
  especialidade_secundaria: '',
  rqe_secundaria: '',
  cnes: '',
  telefone: '',
  email: '',
  responsavel_tecnico: false,
  operadoras_habilitadas: [],
  documentos: {
    carteira_conselho: '',
    diploma: '',
    comprovante_especializacao: ''
  },
  status: 'ativo',
};

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

const CorpoClinico = () => {
  const [isResponsavelDialogOpen, setIsResponsavelDialogOpen] = useState(false);
  const [currentResponsavel, setCurrentResponsavel] = useState<ResponsavelTecnico>(emptyResponsavel);
  const [isEditingResponsavel, setIsEditingResponsavel] = useState(false);
  const [filterType, setFilterType] = useState<string>('recent');
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [operadoras, setOperadoras] = useState<Operadora[]>([]);
  const [loadingOperadoras, setLoadingOperadoras] = useState(false);
  // Lista derivada memoizada para evitar setState em efeito

  // Usar o novo sistema de carregamento
  const {
    data: profileData,
    loading,
    error,
    refetch,
    isBackendAvailable
  } = useDataLoader({
    key: 'corpo-clinico',
    loader: async () => {
      const data = await ClinicService.getProfile();
      return data.responsaveis_tecnicos || [];
    },
    fallback: () => {
      const savedProfile = localStorage.getItem('clinic_profile');
      if (savedProfile) {
        const data = JSON.parse(savedProfile);
        return data.responsaveis_tecnicos || [];
      }
      return null;
    },
    ttl: 2 * 60 * 1000, // 2 minutos
    showToast: false
  });

  const [localResponsaveis, setLocalResponsaveis] = useState<ResponsavelTecnico[]>([]);
  
  // Atualizar responsáveis locais quando profileData mudar
  useEffect(() => {
    if (profileData && Array.isArray(profileData)) {
      setLocalResponsaveis(profileData);
    }
  }, [profileData]);

  // Carregar operadoras do backend
  useEffect(() => {
    const loadOperadoras = async () => {
      try {
        setLoadingOperadoras(true);
        const operadorasData = await OperadoraService.getAllOperadoras();
        // Filtrar apenas operadoras ativas
        const operadorasAtivas = operadorasData.filter(op => op.status === 'ativo');
        setOperadoras(operadorasAtivas);
        console.log('✅ Operadoras carregadas:', operadorasAtivas.length);
      } catch (error) {
        console.error('❌ Erro ao carregar operadoras:', error);
        toast.error('Erro ao carregar operadoras. Usando lista padrão.');
        // Fallback para lista padrão em caso de erro
        setOperadoras([
          { id: 1, nome: 'Unimed', codigo: 'UNIMED', status: 'ativo' },
          { id: 2, nome: 'Bradesco Saúde', codigo: 'BRADESCO', status: 'ativo' },
          { id: 3, nome: 'Amil', codigo: 'AMIL', status: 'ativo' },
          { id: 4, nome: 'SulAmérica', codigo: 'SULAMERICA', status: 'ativo' },
          { id: 5, nome: 'NotreDame Intermédica', codigo: 'NOTREDAME', status: 'ativo' }
        ]);
      } finally {
        setLoadingOperadoras(false);
      }
    };

    loadOperadoras();
  }, []);
  
  const responsaveis = localResponsaveis;

  // Função para aplicar filtros (sem depender de hooks para não recriar em cada render)
  function applyFilter(responsaveis: ResponsavelTecnico[], filter: string) {
    const sorted = [...responsaveis];
    
    switch (filter) {
      case 'recent':
        return sorted.sort((a, b) => (b.id || 0) - (a.id || 0));
      case 'oldest':
        return sorted.sort((a, b) => (a.id || 0) - (b.id || 0));
      case 'az':
        return sorted.sort((a, b) => a.nome.localeCompare(b.nome));
      case 'za':
        return sorted.sort((a, b) => b.nome.localeCompare(a.nome));
      case 'specialty':
        return sorted.sort((a, b) => a.especialidade_principal.localeCompare(b.especialidade_principal));
      default:
        return sorted;
    }
  }

  // Responsáveis filtrados (derivado)
  const filteredResponsaveis = useMemo(() => {
    return applyFilter(responsaveis, filterType);
  }, [responsaveis, filterType]);

  // Funções para responsáveis técnicos
  const handleAddResponsavel = useCallback(() => {
    setCurrentResponsavel({...emptyResponsavel});
    setIsEditingResponsavel(false);
    setIsResponsavelDialogOpen(true);
  }, []);

  const handleEditResponsavel = useCallback((responsavel: ResponsavelTecnico) => {
    setCurrentResponsavel(responsavel);
    setIsEditingResponsavel(true);
    setIsResponsavelDialogOpen(true);
  }, []);

  const handleDeleteResponsavel = useCallback(async (responsavel: ResponsavelTecnico) => {
    try {
      if (isBackendAvailable && responsavel.id) {
        // Usar API
        await ClinicService.removeResponsavel(responsavel.id);
        refetch(); // Recarregar dados
        toast.success('Responsável removido com sucesso!');
      } else {
        // Fallback para localStorage
        const updatedResponsaveis = responsaveis.filter(r => r !== responsavel);
        
        // Salvar no localStorage
        const savedProfile = localStorage.getItem('clinic_profile');
        if (savedProfile) {
          const profileData = JSON.parse(savedProfile);
          profileData.responsaveis_tecnicos = updatedResponsaveis;
          localStorage.setItem('clinic_profile', JSON.stringify(profileData));
        }
        
        refetch(); // Recarregar dados
        toast.success('Responsável removido com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao remover responsável:', error);
      toast.error('Erro ao remover responsável', {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }, [isBackendAvailable, responsaveis, refetch]);

  const handleSaveResponsavel = useCallback(async () => {
    if (!currentResponsavel.nome || !currentResponsavel.registro_conselho || !currentResponsavel.especialidade_principal) {
      toast.error('Nome, Registro do Conselho e especialidade principal são obrigatórios');
      return;
    }

    try {
      if (isBackendAvailable) {
        const { id, ...cleanResponsavel } = currentResponsavel;
        
        if (isEditingResponsavel && currentResponsavel.id) {
          await ClinicService.updateResponsavel(
            currentResponsavel.id, 
            cleanResponsavel
          );
          toast.success('Responsável atualizado com sucesso!');
        } else {
          await ClinicService.addResponsavel(cleanResponsavel);
          toast.success('Responsável adicionado com sucesso!');
        }
      } else {
        // Fallback para localStorage
        let updatedResponsaveis;
        
        if (isEditingResponsavel) {
          updatedResponsaveis = responsaveis.map(r => 
            r === currentResponsavel ? currentResponsavel : r
          );
          toast.success('Responsável atualizado com sucesso!');
        } else {
          const responsavelWithId = {
            ...currentResponsavel,
            id: Date.now() // ID temporário
          };
          updatedResponsaveis = [...responsaveis, responsavelWithId];
          toast.success('Responsável adicionado com sucesso!');
        }
        
        // Salvar no localStorage
        const savedProfile = localStorage.getItem('clinic_profile');
        if (savedProfile) {
          const profileData = JSON.parse(savedProfile);
          profileData.responsaveis_tecnicos = updatedResponsaveis;
          localStorage.setItem('clinic_profile', JSON.stringify(profileData));
        }
      }

      await refetch(); // Recarregar dados

      // Forçar recarregamento após um pequeno delay para garantir que o backend processou
      setTimeout(async () => {
        await refetch();
      }, 500);

      setIsResponsavelDialogOpen(false);
    } catch (error) {
      console.error('Erro ao salvar responsável:', error);
      toast.error('Erro ao salvar responsável', {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }, [currentResponsavel, isEditingResponsavel, isBackendAvailable, responsaveis, refetch]);

  const handleResponsavelInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement> | { target: { name: string; value: any } }) => {
    const { name, value } = e.target;
    setCurrentResponsavel(prevResponsavel => ({
      ...prevResponsavel,
      [name]: value,
    }));
  }, []);

  const handleToggleStatus = useCallback(async (responsavel: ResponsavelTecnico, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (togglingId) return; // Previne cliques múltiplos
    
    try {
      setTogglingId(responsavel.id || null);
      const newStatus = responsavel.status === 'ativo' ? 'inativo' : 'ativo';
      
      // Atualizar UI imediatamente (otimistic update)
      setLocalResponsaveis(prev => 
        prev.map(r => 
          r.id === responsavel.id 
            ? { ...r, status: newStatus }
            : r
        )
      );
      
      if (isBackendAvailable) {
        if (!responsavel.id) {
          throw new Error('ID do profissional não encontrado');
        }
        
        await ClinicService.updateResponsavel(responsavel.id, {
          ...responsavel,
          status: newStatus
        });
        
        toast.success(`Profissional ${newStatus === 'ativo' ? 'ativado' : 'desativado'} com sucesso!`);
      } else {
        const savedProfile = localStorage.getItem('clinic_profile');
        if (savedProfile) {
          const data = JSON.parse(savedProfile);
          if (data.responsaveis_tecnicos) {
            const updatedResponsaveis = data.responsaveis_tecnicos.map((r: any) => 
              r.id === responsavel.id ? { ...r, status: newStatus } : r
            );
            data.responsaveis_tecnicos = updatedResponsaveis;
            localStorage.setItem('clinic_profile', JSON.stringify(data));
          }
        }
        toast.success(`Profissional ${newStatus === 'ativo' ? 'ativado' : 'desativado'} localmente!`);
      }
      
      // Limpar cache do localStorage antes de refetch
      const cacheKey = 'corpo-clinico';
      const cacheData = localStorage.getItem('dataLoader_cache');
      if (cacheData) {
        try {
          const cache = JSON.parse(cacheData);
          if (cache[cacheKey]) {
            delete cache[cacheKey];
            localStorage.setItem('dataLoader_cache', JSON.stringify(cache));
          }
        } catch (e) {
          console.error('Erro ao limpar cache:', e);
        }
      }
      
      // Recarregar dados com cache limpo para confirmar
      await refetch();
    } catch (error) {
      console.error('Erro ao alterar status do profissional:', error);
      toast.error('Erro ao alterar status do profissional');
      
      // Reverter mudança otimista em caso de erro
      const originalStatus = responsavel.status;
      setLocalResponsaveis(prev => 
        prev.map(r => 
          r.id === responsavel.id 
            ? { ...r, status: originalStatus }
            : r
        )
      );
    } finally {
      setTogglingId(null);
    }
  }, [isBackendAvailable, refetch, togglingId]);
  
  return (
    <LoadingState
      loading={loading}
      error={error}
      isBackendAvailable={isBackendAvailable}
      onRetry={refetch}
      loadingText="Carregando corpo clínico..."
      errorText="Erro ao carregar dados do corpo clínico"
    >
      <div className="space-y-6">
      {/* Header */}
      <AnimatedSection>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Profissionais
            </h1>
            <p className="text-muted-foreground mt-2">
              Gerencie os profissionais de saúde da clínica
            </p>
            {!isBackendAvailable && (
              <p className="text-orange-600 text-sm mt-1">
                ⚠️ API não disponível. Dados salvos localmente.
              </p>
            )}
          </div>
          <Button
            onClick={handleAddResponsavel}
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Profissional
          </Button>
        </div>
      </AnimatedSection>

      {/* Lista de Responsáveis */}
      <AnimatedSection delay={200}>
        <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl flex items-center text-foreground font-semibold">
                <div className="p-2 bg-primary/10 rounded-lg mr-3">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                Equipe Assistencial
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[180px] h-9">
                      <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Mais Recente</SelectItem>
                      <SelectItem value="oldest">Mais Antigo</SelectItem>
                      <SelectItem value="az">A-Z</SelectItem>
                      <SelectItem value="za">Z-A</SelectItem>
                      <SelectItem value="specialty">Especialidade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            {filteredResponsaveis.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
                <UserPlus className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-medium text-muted-foreground mb-2">
                  Nenhum profissional cadastrado
                </h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                  Adicione os profissionais de saúde da clínica
                </p>
                <Button
                  onClick={handleAddResponsavel}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6 py-2 shadow-lg hover:shadow-xl transition-all"
                >
                  <Plus className="w-4 w-4 mr-2" />
                  Adicionar Primeiro Profissional
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredResponsaveis.map((responsavel, index) => (
                  <Card 
                    key={responsavel.id || index} 
                    className={`border border-border hover:border-primary/30 transition-all duration-500 ease-in-out hover:shadow-lg hover:scale-[1.02] ${
                      responsavel.status === 'inativo' ? 'opacity-50 blur-[0.5px]' : 'opacity-100'
                    }`}
                    style={{
                      transition: 'opacity 0.5s ease-in-out, filter 0.5s ease-in-out, transform 0.3s ease-in-out'
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="mb-1">
                            <h4 className="font-semibold text-primary text-base">{responsavel.nome}</h4>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-muted-foreground font-medium">
                              {responsavel.tipo_profissional === 'medico' ? 'Médico' :
                               responsavel.tipo_profissional === 'nutricionista' ? 'Nutricionista' :
                               responsavel.tipo_profissional === 'enfermeiro' ? 'Enfermeiro' :
                               responsavel.tipo_profissional === 'farmaceutico' ? 'Farmacêutico' :
                               responsavel.tipo_profissional === 'terapeuta_ocupacional' ? 'Terapeuta Ocupacional' :
                               responsavel.tipo_profissional}
                            </span>
                            {responsavel.responsavel_tecnico && (
                              <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full font-medium">
                                Responsável Técnico
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {responsavel.registro_conselho} - {responsavel.uf_registro}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-primary/10"
                            onClick={() => handleEditResponsavel(responsavel)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-destructive/10 text-destructive"
                            onClick={() => handleDeleteResponsavel(responsavel)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-1.5 text-sm">
                        <div className="p-1.5 bg-muted/30 rounded-lg">
                          <span className="font-medium text-primary">Especialidade Principal:</span>
                          <p className="text-foreground">{responsavel.especialidade_principal}</p>
                          {responsavel.rqe_principal && (
                            <p className="text-xs text-muted-foreground">RQE: {responsavel.rqe_principal}</p>
                          )}
                          {responsavel.especialidade_secundaria && (
                            <div className="mt-2">
                              <span className="font-medium text-muted-foreground">Especialidade Secundária:</span>
                              <p className="text-foreground">{responsavel.especialidade_secundaria}</p>
                              {responsavel.rqe_secundaria && (
                                <p className="text-xs text-muted-foreground">RQE: {responsavel.rqe_secundaria}</p>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-muted-foreground">CNES:</span>
                          <span className="text-foreground">{responsavel.cnes}</span>
                        </div>
                        {responsavel.telefone && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-muted-foreground">Telefone:</span>
                            <span className="text-foreground">{responsavel.telefone}</span>
                          </div>
                        )}
                        {responsavel.email && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-muted-foreground">E-mail:</span>
                            <span className="text-foreground">{responsavel.email}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </AnimatedSection>

      {/* Modal para Adicionar/Editar Responsável */}
      <Dialog open={isResponsavelDialogOpen} onOpenChange={setIsResponsavelDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby="corpo-clinico-dialog-desc">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2 text-primary" />
              {isEditingResponsavel ? 'Editar Profissional' : 'Adicionar Profissional'}
            </DialogTitle>
            <p id="corpo-clinico-dialog-desc" className="sr-only">Preencha os campos obrigatórios para salvar o profissional de saúde da clínica.</p>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Nome Completo */}
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-sm font-medium">
                Nome Completo *
              </Label>
              <Input
                id="nome"
                name="nome"
                value={currentResponsavel.nome}
                onChange={handleResponsavelInputChange}
                placeholder="Nome do profissional"
                className="h-11 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                required
              />
            </div>

            {/* Tipo de Profissional e Registro */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo_profissional" className="text-sm font-medium">
                  Tipo de Profissional *
                </Label>
                <Select 
                  value={currentResponsavel.tipo_profissional} 
                  onValueChange={(value) => handleResponsavelInputChange({ target: { name: 'tipo_profissional', value } })}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="medico">Médico</SelectItem>
                    <SelectItem value="nutricionista">Nutricionista</SelectItem>
                    <SelectItem value="enfermeiro">Enfermeiro</SelectItem>
                    <SelectItem value="farmaceutico">Farmacêutico</SelectItem>
                    <SelectItem value="terapeuta_ocupacional">Terapeuta Ocupacional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="registro_conselho" className="text-sm font-medium">
                  Registro Conselho *
                </Label>
                <Input
                  id="registro_conselho"
                  name="registro_conselho"
                  value={currentResponsavel.registro_conselho}
                  onChange={handleResponsavelInputChange}
                  placeholder="Número do registro"
                  className="h-11 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  required
                />
              </div>
            </div>

            {/* UF do Registro */}
            <div className="space-y-2">
              <Label htmlFor="uf_registro" className="text-sm font-medium">
                UF do Registro *
              </Label>
              <Select 
                value={currentResponsavel.uf_registro} 
                onValueChange={(value) => handleResponsavelInputChange({ target: { name: 'uf_registro', value } })}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Selecione a UF" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AC">AC</SelectItem>
                  <SelectItem value="AL">AL</SelectItem>
                  <SelectItem value="AP">AP</SelectItem>
                  <SelectItem value="AM">AM</SelectItem>
                  <SelectItem value="BA">BA</SelectItem>
                  <SelectItem value="CE">CE</SelectItem>
                  <SelectItem value="DF">DF</SelectItem>
                  <SelectItem value="ES">ES</SelectItem>
                  <SelectItem value="GO">GO</SelectItem>
                  <SelectItem value="MA">MA</SelectItem>
                  <SelectItem value="MT">MT</SelectItem>
                  <SelectItem value="MS">MS</SelectItem>
                  <SelectItem value="MG">MG</SelectItem>
                  <SelectItem value="PA">PA</SelectItem>
                  <SelectItem value="PB">PB</SelectItem>
                  <SelectItem value="PR">PR</SelectItem>
                  <SelectItem value="PE">PE</SelectItem>
                  <SelectItem value="PI">PI</SelectItem>
                  <SelectItem value="RJ">RJ</SelectItem>
                  <SelectItem value="RN">RN</SelectItem>
                  <SelectItem value="RS">RS</SelectItem>
                  <SelectItem value="RO">RO</SelectItem>
                  <SelectItem value="RR">RR</SelectItem>
                  <SelectItem value="SC">SC</SelectItem>
                  <SelectItem value="SP">SP</SelectItem>
                  <SelectItem value="SE">SE</SelectItem>
                  <SelectItem value="TO">TO</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Especialidade Principal + RQE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="especialidade_principal" className="text-sm font-medium">
                  Especialidade Principal *
                </Label>
                <Input
                  id="especialidade_principal"
                  name="especialidade_principal"
                  value={currentResponsavel.especialidade_principal}
                  onChange={handleResponsavelInputChange}
                  placeholder="Especialidade principal"
                  className="h-11 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rqe_principal" className="text-sm font-medium">
                  RQE Principal
                </Label>
                <Input
                  id="rqe_principal"
                  name="rqe_principal"
                  value={currentResponsavel.rqe_principal || ''}
                  onChange={handleResponsavelInputChange}
                  placeholder="Número do RQE"
                  className="h-11 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            {/* Especialidade Secundária + RQE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="especialidade_secundaria" className="text-sm font-medium">
                  Especialidade Secundária
                </Label>
                <Input
                  id="especialidade_secundaria"
                  name="especialidade_secundaria"
                  value={currentResponsavel.especialidade_secundaria || ''}
                  onChange={handleResponsavelInputChange}
                  placeholder="Especialidade secundária"
                  className="h-11 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rqe_secundaria" className="text-sm font-medium">
                  RQE Secundária
                </Label>
                <Input
                  id="rqe_secundaria"
                  name="rqe_secundaria"
                  value={currentResponsavel.rqe_secundaria || ''}
                  onChange={handleResponsavelInputChange}
                  placeholder="Número do RQE"
                  className="h-11 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            {/* CNES */}
            <div className="space-y-2">
              <Label htmlFor="cnes" className="text-sm font-medium">
                CNES *
              </Label>
              <Input
                id="cnes"
                name="cnes"
                value={currentResponsavel.cnes}
                onChange={handleResponsavelInputChange}
                placeholder="CNES do Profissional no Estabelecimento"
                className="h-11 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                required
              />
            </div>

            {/* Responsável Técnico */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="responsavel_tecnico"
                  name="responsavel_tecnico"
                  checked={currentResponsavel.responsavel_tecnico}
                  onChange={(e) => handleResponsavelInputChange({ target: { name: 'responsavel_tecnico', value: e.target.checked } })}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <Label htmlFor="responsavel_tecnico" className="text-sm font-medium">
                  Responsável Técnico
                </Label>
              </div>
            </div>

            {/* Contatos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefone" className="text-sm font-medium">
                  Telefone
                </Label>
                <Input
                  id="telefone"
                  name="telefone"
                  value={currentResponsavel.telefone || ''}
                  onChange={handleResponsavelInputChange}
                  placeholder="(11) 99999-9999"
                  className="h-11 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  E-mail
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={currentResponsavel.email || ''}
                  onChange={handleResponsavelInputChange}
                  placeholder="profissional@clinica.com"
                  className="h-11 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            {/* Status - COMENTADO (controle apenas pela Operadora) */}
            {/* 
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-medium">
                Status *
              </Label>
              <Select 
                value={currentResponsavel.status} 
                onValueChange={(value) => handleResponsavelInputChange({ target: { name: 'status', value } })}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            */}

            {/* Operadoras Habilitadas */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Operadoras Habilitadas</h4>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Selecione as operadoras para as quais este profissional está habilitado a prescrever:
                </Label>
                {loadingOperadoras ? (
                  <div className="flex items-center justify-center p-4 border rounded-md">
                    <span className="text-sm text-muted-foreground">Carregando operadoras...</span>
                  </div>
                ) : operadoras.length === 0 ? (
                  <div className="flex items-center justify-center p-4 border rounded-md bg-yellow-50">
                    <span className="text-sm text-yellow-700">Nenhuma operadora cadastrada no sistema.</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto border rounded-md p-3">
                    {operadoras.map((operadora) => (
                      <div key={operadora.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`operadora_${operadora.id}`}
                          checked={currentResponsavel.operadoras_habilitadas?.includes(operadora.id || 0) || false}
                          onChange={(e) => {
                            const isChecked = e.target.checked;
                            const currentOperadoras = currentResponsavel.operadoras_habilitadas || [];
                            const newOperadoras = isChecked
                              ? [...currentOperadoras, operadora.id || 0]
                              : currentOperadoras.filter(id => id !== operadora.id);
                            
                            handleResponsavelInputChange({ 
                              target: { 
                                name: 'operadoras_habilitadas', 
                                value: newOperadoras 
                              } 
                            });
                          }}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <Label htmlFor={`operadora_${operadora.id}`} className="text-sm cursor-pointer">
                          {operadora.nome}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Upload de Documentos */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Documentos</h4>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="carteira_conselho" className="text-sm font-medium">
                    Carteira do Conselho Profissional
                  </Label>
                  <Input
                    id="carteira_conselho"
                    name="carteira_conselho"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleResponsavelInputChange({ 
                          target: { 
                            name: 'documentos', 
                            value: { 
                              ...currentResponsavel.documentos, 
                              carteira_conselho: file.name 
                            } 
                          } 
                        });
                      }
                    }}
                    className="h-11 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="diploma" className="text-sm font-medium">
                    Diploma
                  </Label>
                  <Input
                    id="diploma"
                    name="diploma"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleResponsavelInputChange({ 
                          target: { 
                            name: 'documentos', 
                            value: { 
                              ...currentResponsavel.documentos, 
                              diploma: file.name 
                            } 
                          } 
                        });
                      }
                    }}
                    className="h-11 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comprovante_especializacao" className="text-sm font-medium">
                    Comprovante de Especialização
                  </Label>
                  <Input
                    id="comprovante_especializacao"
                    name="comprovante_especializacao"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleResponsavelInputChange({ 
                          target: { 
                            name: 'documentos', 
                            value: { 
                              ...currentResponsavel.documentos, 
                              comprovante_especializacao: file.name 
                            } 
                          } 
                        });
                      }
                    }}
                    className="h-11 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsResponsavelDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveResponsavel}
              className="bg-primary hover:bg-primary/90"
            >
              <Save className="w-4 h-4 mr-2" />
              {isEditingResponsavel ? 'Atualizar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </LoadingState>
  );
};

export default CorpoClinico; 