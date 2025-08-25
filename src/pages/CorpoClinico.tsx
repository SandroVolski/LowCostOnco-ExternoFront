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
import { useDataLoader, useDataMutation } from '@/hooks/useDataLoader';
import { LoadingState, ConnectionStatus } from '@/components/ui/loading-states';

const emptyResponsavel: ResponsavelTecnico = {
  nome: '',
  crm: '',
  especialidade: '',
  especialidade1: '',
  especialidade2: '',
  telefone: '',
  email: '',
  cnes: '',
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
  const [filteredResponsaveis, setFilteredResponsaveis] = useState<ResponsavelTecnico[]>([]);

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

  const responsaveis = profileData || [];

  // Função para aplicar filtros
  const applyFilter = useCallback((responsaveis: ResponsavelTecnico[], filter: string) => {
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
        return sorted.sort((a, b) => a.especialidade.localeCompare(b.especialidade));
      default:
        return sorted;
    }
  }, []);

  // Aplicar filtro quando responsaveis ou filterType mudar
  useEffect(() => {
    setFilteredResponsaveis(applyFilter(responsaveis, filterType));
  }, [responsaveis, filterType, applyFilter]);

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
    if (!currentResponsavel.nome || !currentResponsavel.crm || !currentResponsavel.especialidade) {
      toast.error('Nome, CRM e especialidade são obrigatórios');
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
      
      refetch(); // Recarregar dados
      setIsResponsavelDialogOpen(false);
    } catch (error) {
      console.error('Erro ao salvar responsável:', error);
      toast.error('Erro ao salvar responsável', {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }, [currentResponsavel, isEditingResponsavel, isBackendAvailable, responsaveis, refetch]);

  const handleResponsavelInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentResponsavel(prevResponsavel => ({
      ...prevResponsavel,
      [name]: value,
    }));
  }, []);

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
              Corpo Clínico
            </h1>
            <p className="text-muted-foreground mt-2">
              Gerencie os médicos responsáveis pela clínica para uso nas solicitações de autorização
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
            Adicionar Responsável
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
                Responsáveis Técnicos
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
                  Nenhum responsável técnico cadastrado
                </h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                  Adicione os médicos responsáveis pela clínica para usar nas solicitações de autorização
                </p>
                <Button
                  onClick={handleAddResponsavel}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6 py-2 shadow-lg hover:shadow-xl transition-all"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Primeiro Responsável
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredResponsaveis.map((responsavel, index) => (
                  <Card key={responsavel.id || index} className="border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="font-semibold text-primary text-lg">{responsavel.nome}</h4>
                          <p className="text-sm text-muted-foreground font-medium">{responsavel.crm}</p>
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
                      <div className="space-y-2 text-sm">
                        <div className="p-2 bg-muted/30 rounded-lg">
                          <span className="font-medium text-primary">Especialidade Principal:</span>
                          <p className="text-foreground">{responsavel.especialidade}</p>
                          {responsavel.especialidade1 && (
                            <div className="mt-2">
                              <span className="font-medium text-muted-foreground">Especialidade 1:</span>
                              <p className="text-foreground">{responsavel.especialidade1}</p>
                            </div>
                          )}
                          {responsavel.especialidade2 && (
                            <div className="mt-2">
                              <span className="font-medium text-muted-foreground">Especialidade 2:</span>
                              <p className="text-foreground">{responsavel.especialidade2}</p>
                            </div>
                          )}
                        </div>
                        {responsavel.cnes && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-muted-foreground">CNES:</span>
                            <span className="text-foreground">{responsavel.cnes}</span>
                          </div>
                        )}
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2 text-primary" />
              {isEditingResponsavel ? 'Editar Responsável' : 'Adicionar Responsável'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-sm font-medium">
                Nome Completo *
              </Label>
              <Input
                id="nome"
                name="nome"
                value={currentResponsavel.nome}
                onChange={handleResponsavelInputChange}
                placeholder="Nome do médico"
                className="h-11 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="crm" className="text-sm font-medium">
                  CRM *
                </Label>
                <Input
                  id="crm"
                  name="crm"
                  value={currentResponsavel.crm}
                  onChange={handleResponsavelInputChange}
                  placeholder="Número do CRM"
                  className="h-11 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="especialidade" className="text-sm font-medium">
                  Especialidade Principal *
                </Label>
                <Input
                  id="especialidade"
                  name="especialidade"
                  value={currentResponsavel.especialidade}
                  onChange={handleResponsavelInputChange}
                  placeholder="Especialidade principal"
                  className="h-11 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="especialidade1" className="text-sm font-medium">
                  Especialidade 1
                </Label>
                <Input
                  id="especialidade1"
                  name="especialidade1"
                  value={currentResponsavel.especialidade1 || ''}
                  onChange={handleResponsavelInputChange}
                  placeholder="Especialidade adicional"
                  className="h-11 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="especialidade2" className="text-sm font-medium">
                  Especialidade 2
                </Label>
                <Input
                  id="especialidade2"
                  name="especialidade2"
                  value={currentResponsavel.especialidade2 || ''}
                  onChange={handleResponsavelInputChange}
                  placeholder="Outra especialidade"
                  className="h-11 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cnes" className="text-sm font-medium">
                CNES
              </Label>
              <Input
                id="cnes"
                name="cnes"
                value={currentResponsavel.cnes}
                onChange={handleResponsavelInputChange}
                placeholder="Código CNES do estabelecimento"
                className="h-11 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefone" className="text-sm font-medium">
                  Telefone
                </Label>
                <Input
                  id="telefone"
                  name="telefone"
                  value={currentResponsavel.telefone}
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
                  value={currentResponsavel.email}
                  onChange={handleResponsavelInputChange}
                  placeholder="medico@clinica.com"
                  className="h-11 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
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