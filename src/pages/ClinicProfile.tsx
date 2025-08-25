import { useState, useEffect, useCallback, useMemo } from 'react';
import { Building2, Upload, Save, Camera, MapPin, Phone, Mail, FileText, Globe, Plus, Edit, Trash2, UserPlus, Users, FolderOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePageNavigation } from '@/components/transitions/PageTransitionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ClinicService, ClinicProfile, UpdateProfileRequest } from '@/services/clinicService';
import type { OperadoraCredenciada, Especialidade } from '@/services/clinicService';
import ProtocolsSection from '@/components/ProtocolsSection';

const emptyProfile: ClinicProfile = {
  nome: '',
  codigo: '',
  cnpj: '',
  endereco: '',
  cidade: '',
  estado: '',
  cep: '',
  telefones: [''],
  emails: [''],
  website: '',
  logo_url: '',
  observacoes: '',
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
  const navigate = useNavigate();
  const { navigateWithTransition } = usePageNavigation();
  const [profile, setProfile] = useState<ClinicProfile>(emptyProfile);
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [apiConnected, setApiConnected] = useState(false);
  // Listas de consulta (placeholder para futura integração com API)
  const [operadorasCredenciadas, setOperadorasCredenciadas] = useState<OperadoraCredenciada[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([]);

  // Carregar dados do perfil ao montar o componente
  useEffect(() => {
    loadProfile();
  }, []);
  
  useEffect(() => {
    const carregarListas = async () => {
      try {
        if (!apiConnected) return;
        const [ops, esps] = await Promise.all([
          ClinicService.listarOperadorasCredenciadas({ clinica_id: 1 }),
          ClinicService.listarEspecialidades({ clinica_id: 1 })
        ]);
        setOperadorasCredenciadas(ops);
        setEspecialidades(esps);
      } catch (e) {
        console.warn('Falha ao carregar listas de consulta:', e);
      }
    };
    carregarListas();
  }, [apiConnected]);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      
      // Tentar carregar da API primeiro
      try {
        const profileData = await ClinicService.getProfile();
        const clinica = profileData.clinica;
        
        console.log('🔍 Dados recebidos do backend:', clinica);
        
        // Processar dados de telefones e emails
        let telefones = [''];
        let emails = [''];

        // Processar telefones - verificar se é string JSON ou array
        if (clinica.telefones) {
          console.log('📞 Tipo de telefones:', typeof clinica.telefones, 'Valor:', clinica.telefones);
          
          if (typeof clinica.telefones === 'string') {
            try {
              const telefonesArray = JSON.parse(clinica.telefones);
              console.log('📞 Telefones parseados:', telefonesArray);
              telefones = Array.isArray(telefonesArray) ? telefonesArray.filter(tel => tel && tel.trim() !== '').map(tel => String(tel)) : [''];
            } catch (error) {
              console.warn('Erro ao processar telefones JSON:', error);
              telefones = [String(clinica.telefones)];
            }
          } else if (Array.isArray(clinica.telefones)) {
            console.log('📞 Telefones já é array:', clinica.telefones);
            telefones = clinica.telefones.filter(tel => tel && tel.trim() !== '').map(tel => String(tel));
          }
        }
        
        // Fallback para campo antigo se não há telefones no novo formato
        if (telefones.length === 0 && clinica.telefone && clinica.telefone.trim() !== '') {
          telefones = [String(clinica.telefone)];
        }
        
        if (telefones.length === 0) {
          telefones = [''];
        }
        
        // Garantir que todos os telefones são strings válidas
        telefones = telefones.map(tel => tel || '');

        // Processar emails - verificar se é string JSON ou array
        if (clinica.emails) {
          console.log('📧 Tipo de emails:', typeof clinica.emails, 'Valor:', clinica.emails);
          
          if (typeof clinica.emails === 'string') {
            try {
              const emailsArray = JSON.parse(clinica.emails);
              console.log('📧 Emails parseados:', emailsArray);
              emails = Array.isArray(emailsArray) ? emailsArray.filter(email => email && email.trim() !== '').map(email => String(email)) : [''];
            } catch (error) {
              console.warn('Erro ao processar emails JSON:', error);
              emails = [String(clinica.emails)];
            }
          } else if (Array.isArray(clinica.emails)) {
            console.log('📧 Emails já é array:', clinica.emails);
            emails = Array.isArray(clinica.emails) ? clinica.emails.filter(email => email && email.trim() !== '').map(email => String(email)) : [''];
          }
        }
        
        // Fallback para campo antigo se não há emails no novo formato
        if (emails.length === 0 && clinica.email && clinica.email.trim() !== '') {
          emails = [String(clinica.email)];
        }
        
        if (emails.length === 0) {
          emails = [''];
        }
        
        // Garantir que todos os emails são strings válidas
        emails = emails.map(email => email || '');

        const migratedProfile = {
          ...clinica,
          telefones,
          emails,
        };
        
        console.log('📋 Dados carregados da API:', {
          telefonesOriginais: clinica.telefones,
          emailsOriginais: clinica.emails,
          telefonesProcessados: telefones,
          emailsProcessados: emails,
          totalTelefones: telefones.length,
          totalEmails: emails.length
        });
        
        setProfile(migratedProfile);
        setLogoPreview(migratedProfile.logo_url || '');
        setApiConnected(true);
        console.log('✅ Perfil carregado da API');
      } catch (apiError) {
        console.warn('⚠️  API não disponível, usando localStorage:', apiError);
        setApiConnected(false);
        
        // Fallback para localStorage
        const savedProfile = localStorage.getItem('clinic_profile');
        if (savedProfile) {
          const profileData = JSON.parse(savedProfile);
          
          // Processar dados de telefones e emails do localStorage
          let telefones = [''];
          let emails = [''];

          // Processar telefones - verificar se é string JSON ou array
          if (profileData.telefones) {
            if (typeof profileData.telefones === 'string') {
              try {
                const telefonesArray = JSON.parse(profileData.telefones);
                telefones = Array.isArray(telefonesArray) ? telefonesArray.filter(tel => tel && tel.trim() !== '').map(tel => String(tel)) : [''];
              } catch (error) {
                console.warn('Erro ao processar telefones JSON do localStorage:', error);
                telefones = [String(profileData.telefones)];
              }
            } else if (Array.isArray(profileData.telefones)) {
              telefones = profileData.telefones.filter(tel => tel && tel.trim() !== '').map(tel => String(tel));
            }
          }
          
          // Fallback para campo antigo se não há telefones no novo formato
          if (telefones.length === 0 && profileData.telefone && profileData.telefone.trim() !== '') {
            telefones = [String(profileData.telefone)];
          }
          
          if (telefones.length === 0) {
            telefones = [''];
          }
          
          // Garantir que todos os telefones são strings válidas
          telefones = telefones.map(tel => tel || '');

          // Processar emails - verificar se é string JSON ou array
          if (profileData.emails) {
            if (typeof profileData.emails === 'string') {
              try {
                const emailsArray = JSON.parse(profileData.emails);
                emails = Array.isArray(emailsArray) ? emailsArray.filter(email => email && email.trim() !== '').map(email => String(email)) : [''];
              } catch (error) {
                console.warn('Erro ao processar emails JSON do localStorage:', error);
                emails = [String(profileData.emails)];
              }
            } else if (Array.isArray(profileData.emails)) {
              emails = profileData.emails.filter(email => email && email.trim() !== '').map(email => String(email));
            }
          }
          
          // Fallback para campo antigo se não há emails no novo formato
          if (emails.length === 0 && profileData.email && profileData.email.trim() !== '') {
            emails = [String(profileData.email)];
          }
          
          if (emails.length === 0) {
            emails = [''];
          }
          
          // Garantir que todos os emails são strings válidas
          emails = emails.map(email => email || '');

          const migratedProfile = {
            ...profileData,
            telefones,
            emails,
          };
          
          setProfile(migratedProfile);
          setLogoPreview(migratedProfile.logo_url || '');
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
      // Limpar campos vazios de telefones e emails
      const cleanTelefones = profile.telefones?.filter(tel => tel && tel.trim() !== '') || [''];
      const cleanEmails = profile.emails?.filter(email => email && email.trim() !== '') || [''];
      
      console.log('📋 Dados para salvar:', {
        telefones: cleanTelefones,
        emails: cleanEmails,
        totalTelefones: cleanTelefones.length,
        totalEmails: cleanEmails.length
      });
      
      if (apiConnected) {
        // ✅ CORREÇÃO: Filtrar apenas campos que devem ser atualizados
        const fieldsToExclude = ['id', 'created_at', 'updated_at'];
        const cleanProfile = Object.fromEntries(
          Object.entries({
            ...profile,
            telefones: cleanTelefones,
            emails: cleanEmails,
          }).filter(([key]) => !fieldsToExclude.includes(key))
        );
        
        console.log('🔧 Enviando dados limpos para API:', cleanProfile);
        
        const updateRequest: UpdateProfileRequest = {
          clinica: cleanProfile
        };
        
        const updatedProfile = await ClinicService.updateProfile(updateRequest);
        setProfile(updatedProfile.clinica);
        
        toast.success('Perfil salvo com sucesso na API!');
      } else {
        // Fallback para localStorage
        const profileData = {
          ...profile,
          telefones: cleanTelefones,
          emails: cleanEmails,
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
  }, [profile, apiConnected]);

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

  // Funções para gerenciar múltiplos telefones e emails
  const addTelefone = useCallback(() => {
    setProfile(prevProfile => ({
      ...prevProfile,
      telefones: [...(prevProfile.telefones || ['']), ''],
    }));
  }, []);

  const removeTelefone = useCallback((index: number) => {
    setProfile(prevProfile => ({
      ...prevProfile,
      telefones: prevProfile.telefones?.filter((_, i) => i !== index) || [''],
    }));
  }, []);

  const updateTelefone = useCallback((index: number, value: string) => {
    const formatted = formatPhone(value || '');
    setProfile(prevProfile => ({
      ...prevProfile,
      telefones: prevProfile.telefones?.map((tel, i) => i === index ? formatted : (tel || '')) || [''],
    }));
  }, [formatPhone]);

  const addEmail = useCallback(() => {
    setProfile(prevProfile => ({
      ...prevProfile,
      emails: [...(prevProfile.emails || ['']), ''],
    }));
  }, []);

  const removeEmail = useCallback((index: number) => {
    setProfile(prevProfile => ({
      ...prevProfile,
      emails: prevProfile.emails?.filter((_, i) => i !== index) || [''],
    }));
  }, []);

  const updateEmail = useCallback((index: number, value: string) => {
    setProfile(prevProfile => ({
      ...prevProfile,
      emails: prevProfile.emails?.map((email, i) => i === index ? (value || '') : (email || '')) || [''],
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
          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigateWithTransition('/corpo-clinico')}
              variant="outline"
              className="text-primary border-primary hover:bg-primary/10 transition-all duration-300"
            >
              <Users className="w-4 h-4 mr-2" />
              Corpo Clínico
            </Button>
            <Button
              onClick={() => navigateWithTransition('/cadastro-documentos')}
              variant="outline"
              className="text-secondary-foreground border-secondary hover:bg-secondary/10 transition-all duration-300"
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              Documentos
            </Button>
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
                    className="lco-input bg-muted/30 cursor-not-allowed"
                    disabled
                    required
                  />
                  <p className="text-xs text-muted-foreground">Para alterar, abra um chamado solicitando a atualização pela Operadora.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="codigo">Código da Clínica *</Label>
                  <Input
                    id="codigo"
                    name="codigo"
                    value={profile.codigo}
                    onChange={handleInputChange}
                    placeholder="Ex: CLI001"
                    className="lco-input bg-muted/30 cursor-not-allowed"
                    disabled
                    required
                  />
                  <p className="text-xs text-muted-foreground">Para alterar, abra um chamado solicitando a atualização pela Operadora.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    name="cnpj"
                    value={profile.cnpj}
                    onChange={handleCNPJChange}
                    placeholder="00.000.000/0000-00"
                    className="lco-input bg-muted/30 cursor-not-allowed"
                    disabled
                    maxLength={18}
                  />
                  <p className="text-xs text-muted-foreground">Para alterar, abra um chamado solicitando a atualização pela Operadora.</p>
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

      {/* Operadoras Credenciadas e Especialidades (Consulta) */}
      <AnimatedSection delay={350}>
        <Card className="lco-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="h-5 w-5 mr-2 text-primary" />
              Operadoras Credenciadas e Especialidades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium mb-2">Operadoras Credenciadas</h4>
                {operadorasCredenciadas.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma operadora cadastrada. Solicite à Operadora para manter este cadastro atualizado.</p>
                ) : (
                  <ul className="list-disc list-inside text-sm text-foreground">
                    {operadorasCredenciadas.map((op) => (
                      <li key={op.id || op.nome}>{op.nome}{op.codigo ? ` • ${op.codigo}` : ''}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Especialidades</h4>
                {especialidades.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma especialidade cadastrada. Solicite à Operadora para manter este cadastro atualizado.</p>
                ) : (
                  <ul className="list-disc list-inside text-sm text-foreground">
                    {especialidades.map((esp) => (
                      <li key={esp.id || esp.nome}>{esp.nome}{esp.cbo ? ` • CBO ${esp.cbo}` : ''}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </AnimatedSection>

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
          <CardContent className="space-y-6">
            {/* Telefones e Emails lado a lado */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Telefones */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Telefones</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addTelefone}
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar Telefone
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {profile.telefones?.map((telefone, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          value={telefone || ''}
                          onChange={(e) => updateTelefone(index, e.target.value)}
                          placeholder="(11) 99999-9999"
                          className="lco-input pl-10"
                          maxLength={15}
                        />
                      </div>
                      {profile.telefones && profile.telefones.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTelefone(index)}
                          className="h-10 w-10 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Emails */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">E-mails</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addEmail}
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar E-mail
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {profile.emails?.map((email, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="email"
                          value={email || ''}
                          onChange={(e) => updateEmail(index, e.target.value)}
                          placeholder="contato@suaclinica.com.br"
                          className="lco-input pl-10"
                        />
                      </div>
                      {profile.emails && profile.emails.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEmail(index)}
                          className="h-10 w-10 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
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


    </div>
  );
};

export default ClinicProfileComponent;