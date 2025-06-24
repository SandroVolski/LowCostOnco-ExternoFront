import { useState, useEffect, useCallback, useMemo } from 'react';
import { Building2, Upload, Save, Camera, MapPin, Phone, Mail, FileText, Globe, Plus, Edit, Trash2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ClinicService, ClinicProfile, ResponsavelTecnico, UpdateProfileRequest } from '@/services/clinicService';

const emptyProfile: ClinicProfile = {
  nome: '',
  codigo: '',
  cnpj: '',
  endereco: '',
  cidade: '',
  estado: '',
  cep: '',
  telefone: '',
  email: '',
  website: '',
  logo_url: '',
  observacoes: '',
};

const emptyResponsavel: ResponsavelTecnico = {
  nome: '',
  crm: '',
  especialidade: '',
  telefone: '',
  email: '',
};

// Mover AnimatedSection para fora do componente para evitar re-criação
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

const ClinicProfileComponent = () => {
  const [profile, setProfile] = useState<ClinicProfile>(emptyProfile);
  const [responsaveis, setResponsaveis] = useState<ResponsavelTecnico[]>([]);
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [isResponsavelDialogOpen, setIsResponsavelDialogOpen] = useState(false);
  const [currentResponsavel, setCurrentResponsavel] = useState<ResponsavelTecnico>(emptyResponsavel);
  const [isEditingResponsavel, setIsEditingResponsavel] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);

  // Carregar dados do perfil ao montar o componente
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      
      // Tentar carregar da API primeiro
      try {
        const profileData = await ClinicService.getProfile();
        setProfile(profileData.clinica);
        setResponsaveis(profileData.responsaveis_tecnicos || []);
        setLogoPreview(profileData.clinica.logo_url || '');
        setApiConnected(true);
        console.log('✅ Perfil carregado da API');
      } catch (apiError) {
        console.warn('⚠️  API não disponível, usando localStorage:', apiError);
        setApiConnected(false);
        
        // Fallback para localStorage
        const savedProfile = localStorage.getItem('clinic_profile');
        if (savedProfile) {
          const profileData = JSON.parse(savedProfile);
          
          // Garantir que responsaveis_tecnicos existe
          if (!profileData.responsaveis_tecnicos) {
            profileData.responsaveis_tecnicos = [];
          }
          
          setProfile(profileData);
          setResponsaveis(profileData.responsaveis_tecnicos);
          setLogoPreview(profileData.logo_url || '');
        }
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      toast.error('Erro ao carregar dados do perfil');
    } finally {
      setLoading(false);
    }
  }, []);

  // Função otimizada para mudanças de input
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prevProfile => ({
      ...prevProfile,
      [name]: value,
    }));
  }, []);

  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione apenas arquivos de imagem');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('A imagem deve ter no máximo 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setLogoPreview(dataUrl);
        setProfile(prevProfile => ({
          ...prevProfile,
          logo_url: dataUrl,
        }));
      };
      reader.readAsDataURL(file);
    }
  }, []);

  // ✅ FUNÇÃO CORRIGIDA - Filtrar apenas campos necessários para atualização
  const handleSave = useCallback(async () => {
    // Validações básicas
    if (!profile.nome || !profile.codigo) {
      toast.error('Nome e código da clínica são obrigatórios');
      return;
    }

    setLoading(true);
    try {
      if (apiConnected) {
        // ✅ CORREÇÃO: Filtrar apenas campos que devem ser atualizados
        const fieldsToExclude = ['id', 'created_at', 'updated_at'];
        const cleanProfile = Object.fromEntries(
          Object.entries(profile).filter(([key]) => !fieldsToExclude.includes(key))
        );
        
        console.log('🔧 Enviando dados limpos para API:', cleanProfile);
        
        const updateRequest: UpdateProfileRequest = {
          clinica: cleanProfile
        };
        
        const updatedProfile = await ClinicService.updateProfile(updateRequest);
        setProfile(updatedProfile.clinica);
        setResponsaveis(updatedProfile.responsaveis_tecnicos || []);
        
        toast.success('Perfil salvo com sucesso na API!');
      } else {
        // Fallback para localStorage
        const profileData = {
          ...profile,
          responsaveis_tecnicos: responsaveis
        };
        localStorage.setItem('clinic_profile', JSON.stringify(profileData));
        
        toast.success('Perfil salvo localmente!', {
          description: 'API não disponível. Dados salvos no navegador.'
        });
      }
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      toast.error('Erro ao salvar perfil', {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      setLoading(false);
    }
  }, [profile, responsaveis, apiConnected]);

  // Funções de formatação otimizadas
  const formatCEP = useCallback((value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 5) return numbers;
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  }, []);

  const formatCNPJ = useCallback((value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
    if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
    if (numbers.length <= 12) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
  }, []);

  const formatPhone = useCallback((value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  }, []);

  // Funções de formatação específicas para cada campo otimizadas
  const handleCEPChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCEP(e.target.value);
    setProfile(prevProfile => ({
      ...prevProfile,
      cep: formatted,
    }));
  }, [formatCEP]);

  const handleCNPJChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNPJ(e.target.value);
    setProfile(prevProfile => ({
      ...prevProfile,
      cnpj: formatted,
    }));
  }, [formatCNPJ]);

  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setProfile(prevProfile => ({
      ...prevProfile,
      telefone: formatted,
    }));
  }, [formatPhone]);

  // Funções para responsáveis técnicos otimizadas
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
      if (apiConnected && responsavel.id) {
        // Usar API
        await ClinicService.removeResponsavel(responsavel.id);
        setResponsaveis(prev => prev.filter(r => r.id !== responsavel.id));
        toast.success('Responsável removido com sucesso!');
      } else {
        // Fallback para localStorage
        const updatedResponsaveis = responsaveis.filter(r => r !== responsavel);
        setResponsaveis(updatedResponsaveis);
        
        // Salvar no localStorage
        const profileData = {
          ...profile,
          responsaveis_tecnicos: updatedResponsaveis
        };
        localStorage.setItem('clinic_profile', JSON.stringify(profileData));
        
        toast.success('Responsável removido com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao remover responsável:', error);
      toast.error('Erro ao remover responsável', {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }, [apiConnected, responsaveis, profile]);

  const handleSaveResponsavel = useCallback(async () => {
    if (!currentResponsavel.nome || !currentResponsavel.crm || !currentResponsavel.especialidade) {
      toast.error('Nome, CRM e especialidade são obrigatórios');
      return;
    }

    try {
      if (apiConnected) {
        // ✅ CORREÇÃO: Filtrar campos para responsáveis também
        const fieldsToExclude = ['id', 'clinica_id', 'created_at', 'updated_at'];
        const cleanResponsavel = Object.fromEntries(
          Object.entries(currentResponsavel).filter(([key]) => !fieldsToExclude.includes(key))
        );
        
        if (isEditingResponsavel && currentResponsavel.id) {
          const updatedResponsavel = await ClinicService.updateResponsavel(
            currentResponsavel.id, 
            cleanResponsavel
          );
          setResponsaveis(prev => prev.map(r => 
            r.id === currentResponsavel.id ? updatedResponsavel : r
          ));
          toast.success('Responsável atualizado com sucesso!');
        } else {
          const newResponsavel = await ClinicService.addResponsavel(cleanResponsavel);
          setResponsaveis(prev => [...prev, newResponsavel]);
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
        
        setResponsaveis(updatedResponsaveis);
        
        // Salvar no localStorage
        const profileData = {
          ...profile,
          responsaveis_tecnicos: updatedResponsaveis
        };
        localStorage.setItem('clinic_profile', JSON.stringify(profileData));
      }
      
      setIsResponsavelDialogOpen(false);
    } catch (error) {
      console.error('Erro ao salvar responsável:', error);
      toast.error('Erro ao salvar responsável', {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }, [currentResponsavel, isEditingResponsavel, apiConnected, responsaveis, profile]);

  const handleResponsavelInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentResponsavel(prevResponsavel => ({
      ...prevResponsavel,
      [name]: value,
    }));
  }, []);

  // Memoizar elementos que não mudam frequentemente
  const logoUploadButton = useMemo(() => (
    <Button 
      type="button"
      variant="outline" 
      className="w-full"
      onClick={() => document.getElementById('logo-upload')?.click()}
    >
      <Upload className="h-4 w-4 mr-2" />
      {logoPreview ? 'Alterar Logo' : 'Fazer Upload'}
    </Button>
  ), [logoPreview]);

  if (loading && !profile.nome) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3">Carregando perfil da clínica...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AnimatedSection>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Perfil da Clínica
            </h1>
            <p className="text-muted-foreground mt-2">
              Configure as informações da sua clínica para uso nos documentos e solicitações
            </p>
            {!apiConnected && (
              <p className="text-orange-600 text-sm mt-1">
                ⚠️ API não disponível. Dados salvos localmente.
              </p>
            )}
          </div>
          <Button 
            onClick={handleSave}
            disabled={loading}
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </AnimatedSection>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Logo da Clínica */}
        <AnimatedSection delay={100}>
          <Card className="lco-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Camera className="h-5 w-5 mr-2 text-primary" />
                Logo da Clínica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 border-2 border-dashed border-border rounded-lg flex items-center justify-center mb-4 bg-muted/30">
                  {logoPreview ? (
                    <img 
                      src={logoPreview} 
                      alt="Logo da clínica" 
                      className="w-full h-full object-contain rounded-lg"
                    />
                  ) : (
                    <div className="text-center">
                      <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Logo da clínica</p>
                    </div>
                  )}
                </div>
                
                <div className="w-full">
                  <Label htmlFor="logo-upload" className="sr-only">
                    Upload da logo
                  </Label>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  {logoUploadButton}
                </div>
                
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Recomendado: 300x300px, PNG ou JPG, máx. 5MB
                </p>
              </div>
            </CardContent>
          </Card>
        </AnimatedSection>

        {/* Informações Básicas */}
        <AnimatedSection delay={200} className="lg:col-span-2">
          <Card className="lco-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="h-5 w-5 mr-2 text-primary" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome da Clínica *</Label>
                  <Input
                    id="nome"
                    name="nome"
                    value={profile.nome}
                    onChange={handleInputChange}
                    placeholder="Ex: Clínica Oncológica São Paulo"
                    className="lco-input"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="codigo">Código da Clínica *</Label>
                  <Input
                    id="codigo"
                    name="codigo"
                    value={profile.codigo}
                    onChange={handleInputChange}
                    placeholder="Ex: CLI001"
                    className="lco-input"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    name="cnpj"
                    value={profile.cnpj}
                    onChange={handleCNPJChange}
                    placeholder="00.000.000/0000-00"
                    className="lco-input"
                    maxLength={18}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="website"
                      name="website"
                      value={profile.website}
                      onChange={handleInputChange}
                      placeholder="https://www.suaclinica.com.br"
                      className="lco-input pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </AnimatedSection>
      </div>

      {/* Endereço */}
      <AnimatedSection delay={300}>
        <Card className="lco-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-primary" />
              Endereço
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2 md:col-span-2 lg:col-span-3">
                <Label htmlFor="endereco">Endereço Completo</Label>
                <Input
                  id="endereco"
                  name="endereco"
                  value={profile.endereco}
                  onChange={handleInputChange}
                  placeholder="Rua, número, complemento"
                  className="lco-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  name="cep"
                  value={profile.cep}
                  onChange={handleCEPChange}
                  placeholder="00000-000"
                  className="lco-input"
                  maxLength={9}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  name="cidade"
                  value={profile.cidade}
                  onChange={handleInputChange}
                  placeholder="São Paulo"
                  className="lco-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Input
                  id="estado"
                  name="estado"
                  value={profile.estado}
                  onChange={handleInputChange}
                  placeholder="SP"
                  className="lco-input"
                  maxLength={2}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </AnimatedSection>

      {/* Contato */}
      <AnimatedSection delay={400}>
        <Card className="lco-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Phone className="h-5 w-5 mr-2 text-primary" />
              Informações de Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="telefone"
                    name="telefone"
                    value={profile.telefone}
                    onChange={handlePhoneChange}
                    placeholder="(11) 99999-9999"
                    className="lco-input pl-10"
                    maxLength={15}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={profile.email}
                    onChange={handleInputChange}
                    placeholder="contato@suaclinica.com.br"
                    className="lco-input pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </AnimatedSection>

      {/* Responsáveis Técnicos */}
      <AnimatedSection delay={500}>
        <Card className="lco-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-primary" />
                Responsáveis Técnicos
              </div>
              <Button
                onClick={handleAddResponsavel}
                variant="outline"
                size="sm"
                className="text-primary border-primary hover:bg-primary/10"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Responsável
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {responsaveis.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                <UserPlus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  Nenhum responsável técnico cadastrado
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Adicione os médicos responsáveis pela clínica para usar nas solicitações de autorização
                </p>
                <Button
                  onClick={handleAddResponsavel}
                  variant="outline"
                  className="text-primary border-primary hover:bg-primary/10"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Primeiro Responsável
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {responsaveis.map((responsavel, index) => (
                  <Card key={responsavel.id || index} className="border border-border hover:border-primary/30 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-primary">{responsavel.nome}</h4>
                          <p className="text-sm text-muted-foreground">{responsavel.crm}</p>
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
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">Especialidade:</span> {responsavel.especialidade}</p>
                        {responsavel.telefone && (
                          <p><span className="font-medium">Telefone:</span> {responsavel.telefone}</p>
                        )}
                        {responsavel.email && (
                          <p><span className="font-medium">E-mail:</span> {responsavel.email}</p>
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

      {/* Observações */}
      <AnimatedSection delay={600}>
        <Card className="lco-card">
          <CardHeader>
            <CardTitle>Observações Adicionais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="observacoes">Informações Adicionais</Label>
              <Textarea
                id="observacoes"
                name="observacoes"
                value={profile.observacoes}
                onChange={handleInputChange}
                placeholder="Informações adicionais sobre a clínica..."
                className="lco-input min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>
      </AnimatedSection>

      {/* Botão de Salvar no final */}
      <AnimatedSection delay={700}>
        <div className="flex justify-end">
          <Button 
            onClick={handleSave}
            disabled={loading}
            size="lg"
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Perfil da Clínica
              </>
            )}
          </Button>
        </div>
      </AnimatedSection>

      {/* Dialog para Responsável Técnico */}
      <Dialog open={isResponsavelDialogOpen} onOpenChange={setIsResponsavelDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditingResponsavel ? 'Editar Responsável Técnico' : 'Adicionar Responsável Técnico'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="responsavel_nome">Nome Completo *</Label>
              <Input
                id="responsavel_nome"
                name="nome"
                value={currentResponsavel.nome}
                onChange={handleResponsavelInputChange}
                placeholder="Dr. João Silva"
                className="lco-input"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsavel_crm">CRM *</Label>
              <Input
                id="responsavel_crm"
                name="crm"
                value={currentResponsavel.crm}
                onChange={handleResponsavelInputChange}
                placeholder="CRM 123456/SP"
                className="lco-input"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsavel_especialidade">Especialidade *</Label>
              <Input
                id="responsavel_especialidade"
                name="especialidade"
                value={currentResponsavel.especialidade}
                onChange={handleResponsavelInputChange}
                placeholder="Oncologia"
                className="lco-input"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsavel_telefone">Telefone</Label>
              <Input
                id="responsavel_telefone"
                name="telefone"
                value={currentResponsavel.telefone}
                onChange={handleResponsavelInputChange}
                placeholder="(11) 99999-9999"
                className="lco-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsavel_email">E-mail</Label>
              <Input
                id="responsavel_email"
                name="email"
                type="email"
                value={currentResponsavel.email}
                onChange={handleResponsavelInputChange}
                placeholder="joao.silva@clinica.com"
                className="lco-input"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsResponsavelDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="button" 
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              onClick={handleSaveResponsavel}
            >
              {isEditingResponsavel ? 'Salvar Alterações' : 'Adicionar Responsável'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClinicProfileComponent;