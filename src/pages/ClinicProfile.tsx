import { useState, useEffect, useCallback, useMemo } from 'react';
import { Building2, Upload, Save, Camera, MapPin, Phone, Mail, FileText, Globe, Plus, Edit, Trash2, UserPlus, Users, FolderOpen, DollarSign } from 'lucide-react';
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
  razao_social: '',
  codigo: '',
  cnpj: '',
  endereco: '',
  endereco_rua: '',
  endereco_numero: '',
  endereco_bairro: '',
  endereco_complemento: '',
  cidade: '',
  estado: '',
  cep: '',
  telefones: [''],
  emails: [''],
  contatos_pacientes: { telefones: [''], emails: [''] },
  contatos_administrativos: { telefones: [''], emails: [''] },
  contatos_legais: { telefones: [''], emails: [''] },
  contatos_faturamento: { telefones: [''], emails: [''] },
  contatos_financeiro: { telefones: [''], emails: [''] },
  website: '',
  logo_url: '',
  observacoes: '',
};

// Helper para garantir que nenhum input receba null/undefined
const normalizeProfile = (p: Partial<ClinicProfile>): ClinicProfile => {
  const ensureArray = (arr?: string[]) => (Array.isArray(arr) && arr.length > 0 ? arr.map(v => v ?? '') : ['']);
  const ensureSetor = (s?: { telefones?: string[]; emails?: string[] }) => ({
    telefones: ensureArray(s?.telefones),
    emails: ensureArray(s?.emails)
  });

  return {
    nome: p.nome ?? '',
    razao_social: p.razao_social ?? '',
    codigo: p.codigo ?? '',
    cnpj: p.cnpj ?? '',
    endereco: p.endereco ?? '',
    endereco_rua: p.endereco_rua ?? '',
    endereco_numero: p.endereco_numero ?? '',
    endereco_bairro: p.endereco_bairro ?? '',
    endereco_complemento: p.endereco_complemento ?? '',
    cidade: p.cidade ?? '',
    estado: p.estado ?? '',
    cep: p.cep ?? '',
    telefones: ensureArray(p.telefones),
    emails: ensureArray(p.emails),
    contatos_pacientes: ensureSetor(p.contatos_pacientes),
    contatos_administrativos: ensureSetor(p.contatos_administrativos),
    contatos_legais: ensureSetor(p.contatos_legais),
    contatos_faturamento: ensureSetor(p.contatos_faturamento),
    contatos_financeiro: ensureSetor(p.contatos_financeiro),
    website: p.website ?? '',
    logo_url: p.logo_url ?? '',
    observacoes: p.observacoes ?? ''
  };
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

// Componente helper para renderizar seção de contatos por setor
const ContatoSetorSection = ({ 
  setor, 
  label, 
  color, 
  telefones, 
  emails, 
  onAddTelefone, 
  onRemoveTelefone, 
  onUpdateTelefone, 
  onAddEmail, 
  onRemoveEmail, 
  onUpdateEmail 
}: { 
  setor: string; 
  label: string; 
  color: string; 
  telefones: string[]; 
  emails: string[]; 
  onAddTelefone: () => void; 
  onRemoveTelefone: (index: number) => void; 
  onUpdateTelefone: (index: number, value: string) => void; 
  onAddEmail: () => void; 
  onRemoveEmail: (index: number) => void; 
  onUpdateEmail: (index: number, value: string) => void; 
}) => (
  <div className="border border-border rounded-lg p-4 space-y-4">
    <div className="flex items-center gap-2 mb-3">
      <div className={`h-2 w-2 rounded-full ${color}`}></div>
      <Label className={`text-base font-semibold ${color.replace('bg-', 'text-')}`}>{label}</Label>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Telefones */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm">Telefones</Label>
          <Button type="button" variant="ghost" size="sm" onClick={onAddTelefone} className="h-7 px-2">
            <Plus className="h-3 w-3 mr-1" />
            Adicionar
          </Button>
        </div>
        {telefones?.map((tel, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <Input 
              value={tel || ''} 
              placeholder="(11) 99999-9999" 
              className="lco-input flex-1"
              inputMode="tel"
              maxLength={16}
              onChange={(e) => onUpdateTelefone(idx, e.target.value)}
            />
            {telefones.length > 1 && (
              <Button type="button" variant="ghost" size="sm" onClick={() => onRemoveTelefone(idx)} className="h-10 w-10 p-0 text-red-500 hover:text-red-700">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
      {/* E-mails */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm">E-mails</Label>
          <Button type="button" variant="ghost" size="sm" onClick={onAddEmail} className="h-7 px-2">
            <Plus className="h-3 w-3 mr-1" />
            Adicionar
          </Button>
        </div>
        {emails?.map((email, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <Input 
              value={email || ''} 
              placeholder={`${setor}@clinica.com`} 
              className="lco-input flex-1"
              onChange={(e) => onUpdateEmail(idx, e.target.value)}
            />
            {emails.length > 1 && (
              <Button type="button" variant="ghost" size="sm" onClick={() => onRemoveEmail(idx)} className="h-10 w-10 p-0 text-red-500 hover:text-red-700">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
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

        // Processar dados de telefones e emails
        let telefones = [''];
        let emails = [''];

        // Processar telefones - verificar se é string JSON ou array
        if (clinica.telefones) {
          if (typeof clinica.telefones === 'string') {
            try {
              const telefonesArray = JSON.parse(clinica.telefones);
              telefones = Array.isArray(telefonesArray) ? telefonesArray.filter(tel => tel && tel.trim() !== '').map(tel => String(tel)) : [''];
            } catch (error) {
              console.warn('Erro ao processar telefones JSON:', error);
              telefones = [String(clinica.telefones)];
            }
          } else if (Array.isArray(clinica.telefones)) {
            telefones = clinica.telefones.filter(tel => tel && tel.trim() !== '').map(tel => String(tel));
          }
        }

        // Fallback para campo antigo se não há telefones no novo formato
        if (telefones.length === 0 && (clinica as any).telefone && (clinica as any).telefone.trim() !== '') {
          telefones = [String((clinica as any).telefone)];
        }

        if (telefones.length === 0) {
          telefones = [''];
        }

        // Garantir que todos os telefones são strings válidas
        telefones = telefones.map(tel => tel || '');

        // Processar emails - verificar se é string JSON ou array
        if (clinica.emails) {
          if (typeof clinica.emails === 'string') {
            try {
              const emailsArray = JSON.parse(clinica.emails);
              emails = Array.isArray(emailsArray) ? emailsArray.filter(email => email && email.trim() !== '').map(email => String(email)) : [''];
            } catch (error) {
              console.warn('Erro ao processar emails JSON:', error);
              emails = [String(clinica.emails)];
            }
          } else if (Array.isArray(clinica.emails)) {
            emails = Array.isArray(clinica.emails) ? clinica.emails.filter(email => email && email.trim() !== '').map(email => String(email)) : [''];
          }
        }

        // Fallback para campo antigo se não há emails no novo formato
        if (emails.length === 0 && (clinica as any).email && (clinica as any).email.trim() !== '') {
          emails = [String((clinica as any).email)];
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
        // Normalizar strings nulas para inputs controlados
        const normalizedProfile = normalizeProfile(migratedProfile);

        setProfile(normalizedProfile);
        setLogoPreview(normalizedProfile.logo_url || '');
        setApiConnected(true);
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
          // Normalização adicional para inputs controlados
          const normalizedProfile = normalizeProfile(migratedProfile);
          
          setProfile(normalizedProfile);
          setLogoPreview(normalizedProfile.logo_url || '');
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
      const cleanTelefones = (profile.telefones || [])
        .map(t => (t || '').trim())
        .filter(t => t !== '');
      const cleanEmails = (profile.emails || [])
        .map(e => (e || '').trim())
        .filter(e => e !== '');

      // Limpar contatos por setor
      const cleanSetor = (s?: { telefones?: string[]; emails?: string[] }) => ({
        telefones: (s?.telefones || []).map(t => (t || '').trim()).filter(Boolean),
        emails: (s?.emails || []).map(e => (e || '').trim()).filter(Boolean)
      });
      const contatos_pacientes = cleanSetor(profile.contatos_pacientes);
      const contatos_administrativos = cleanSetor(profile.contatos_administrativos);
      const contatos_legais = cleanSetor(profile.contatos_legais);
      const contatos_faturamento = cleanSetor(profile.contatos_faturamento);
      const contatos_financeiro = cleanSetor(profile.contatos_financeiro);

      if (apiConnected) {
        // ✅ CORREÇÃO: Filtrar apenas campos que devem ser atualizados
        const fieldsToExclude = ['id', 'created_at', 'updated_at'];
        const cleanProfile = Object.fromEntries(
          Object.entries({
            ...profile,
            telefones: cleanTelefones,
            emails: cleanEmails,
            contatos_pacientes,
            contatos_administrativos,
            contatos_legais,
            contatos_faturamento,
            contatos_financeiro,
          }).filter(([key, value]) => !fieldsToExclude.includes(key) && value !== undefined)
        );

        const updateRequest: UpdateProfileRequest = {
          // usar o tipo amplo para evitar exigência de campos obrigatórios no payload de update
          clinica: cleanProfile as unknown as ClinicProfile
        };

        const updatedProfile = await ClinicService.updateProfile(updateRequest);
        setProfile(normalizeProfile(updatedProfile.clinica as Partial<ClinicProfile>));

        toast.success('Perfil salvo com sucesso na API!');
      } else {
        // Fallback para localStorage
        const profileData = {
          ...profile,
          telefones: cleanTelefones,
          emails: cleanEmails,
          contatos_pacientes,
          contatos_administrativos,
          contatos_legais,
          contatos_faturamento,
          contatos_financeiro,
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

  // Funções para gerenciar contatos por setor
  const addContatoSetor = useCallback((setor: string, tipo: 'telefones' | 'emails') => {
    setProfile(prevProfile => {
      const setorKey = `contatos_${setor}` as keyof ClinicProfile;
      const contatosSetor = prevProfile[setorKey] as { telefones?: string[]; emails?: string[] } || { telefones: [''], emails: [''] };
      return {
        ...prevProfile,
        [setorKey]: {
          ...contatosSetor,
          [tipo]: [...(contatosSetor[tipo] || ['']), ''],
        },
      };
    });
  }, []);

  const removeContatoSetor = useCallback((setor: string, tipo: 'telefones' | 'emails', index: number) => {
    setProfile(prevProfile => {
      const setorKey = `contatos_${setor}` as keyof ClinicProfile;
      const contatosSetor = prevProfile[setorKey] as { telefones?: string[]; emails?: string[] } || { telefones: [''], emails: [''] };
      const lista = contatosSetor[tipo] || [''];
      if (lista.length <= 1) return prevProfile; // Mantém pelo menos um campo
      return {
        ...prevProfile,
        [setorKey]: {
          ...contatosSetor,
          [tipo]: lista.filter((_, i) => i !== index),
        },
      };
    });
  }, []);

  const updateContatoSetor = useCallback((setor: string, tipo: 'telefones' | 'emails', index: number, value: string) => {
    setProfile(prevProfile => {
      const setorKey = `contatos_${setor}` as keyof ClinicProfile;
      const contatosSetor = prevProfile[setorKey] as { telefones?: string[]; emails?: string[] } || { telefones: [''], emails: [''] };
      const formatted = tipo === 'telefones' ? formatPhone(value || '') : (value || '');
      return {
        ...prevProfile,
        [setorKey]: {
          ...contatosSetor,
          [tipo]: (contatosSetor[tipo] || ['']).map((item, i) => i === index ? formatted : item || ''),
        },
      };
    });
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
              Ajuste os dados cadastrais
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
              Profissionais
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
              onClick={() => navigateWithTransition('/procedimentos')}
              variant="outline"
              className="text-green-600 border-green-600 hover:bg-green-50 transition-all duration-300"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Procedimentos
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
                Informações Cadastrais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Fantasia *</Label>
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="razao_social">Razão Social</Label>
                  <Input
                    id="razao_social"
                    name="razao_social"
                    value={profile.razao_social || ''}
                    onChange={handleInputChange}
                    placeholder="Ex: Clínica Oncológica São Paulo LTDA"
                    className="lco-input bg-muted/30 cursor-not-allowed"
                    disabled
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
                    className="lco-input bg-muted/30 cursor-not-allowed"
                    disabled
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
                    className="lco-input bg-muted/30 cursor-not-allowed"
                    disabled
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
              value={profile.website ?? ''}
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
              <div className="space-y-2 md:col-span-2 lg:col-span-2">
                <Label htmlFor="endereco_rua">Rua/Avenida *</Label>
                <Input
                  id="endereco_rua"
                  name="endereco_rua"
                  value={profile.endereco_rua || ''}
                  onChange={handleInputChange}
                  placeholder="Ex: Rua das Flores"
                  className="lco-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endereco_numero">Número *</Label>
                <Input
                  id="endereco_numero"
                  name="endereco_numero"
                  value={profile.endereco_numero || ''}
                  onChange={handleInputChange}
                  placeholder="123"
                  className="lco-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endereco_complemento">Complemento</Label>
                <Input
                  id="endereco_complemento"
                  name="endereco_complemento"
                  value={profile.endereco_complemento || ''}
                  onChange={handleInputChange}
                  placeholder="Sala 10, Andar 2"
                  className="lco-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endereco_bairro">Bairro *</Label>
                <Input
                  id="endereco_bairro"
                  name="endereco_bairro"
                  value={profile.endereco_bairro || ''}
                  onChange={handleInputChange}
                  placeholder="Centro"
                  className="lco-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade *</Label>
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
                <Label htmlFor="estado">Estado *</Label>
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

              <div className="space-y-2">
                <Label htmlFor="cep">CEP *</Label>
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
            </div>
          </CardContent>
        </Card>
      </AnimatedSection>

      {/* Contato - Organizado por Setores */}
      <AnimatedSection delay={400}>
        <Card className="lco-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Phone className="h-5 w-5 mr-2 text-primary" />
              Informações de Contato por Setor
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Organize os contatos da clínica por áreas de atuação
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <ContatoSetorSection
              setor="pacientes"
              label="Atendimento ao Paciente"
              color="bg-blue-500"
              telefones={profile.contatos_pacientes?.telefones || ['']}
              emails={profile.contatos_pacientes?.emails || ['']}
              onAddTelefone={() => addContatoSetor('pacientes', 'telefones')}
              onRemoveTelefone={(idx) => removeContatoSetor('pacientes', 'telefones', idx)}
              onUpdateTelefone={(idx, value) => updateContatoSetor('pacientes', 'telefones', idx, value)}
              onAddEmail={() => addContatoSetor('pacientes', 'emails')}
              onRemoveEmail={(idx) => removeContatoSetor('pacientes', 'emails', idx)}
              onUpdateEmail={(idx, value) => updateContatoSetor('pacientes', 'emails', idx, value)}
            />
            
            <ContatoSetorSection
              setor="administrativos"
              label="Administrativo"
              color="bg-green-500"
              telefones={profile.contatos_administrativos?.telefones || ['']}
              emails={profile.contatos_administrativos?.emails || ['']}
              onAddTelefone={() => addContatoSetor('administrativos', 'telefones')}
              onRemoveTelefone={(idx) => removeContatoSetor('administrativos', 'telefones', idx)}
              onUpdateTelefone={(idx, value) => updateContatoSetor('administrativos', 'telefones', idx, value)}
              onAddEmail={() => addContatoSetor('administrativos', 'emails')}
              onRemoveEmail={(idx) => removeContatoSetor('administrativos', 'emails', idx)}
              onUpdateEmail={(idx, value) => updateContatoSetor('administrativos', 'emails', idx, value)}
            />
            
            <ContatoSetorSection
              setor="legais"
              label="Jurídico / Legal"
              color="bg-purple-500"
              telefones={profile.contatos_legais?.telefones || ['']}
              emails={profile.contatos_legais?.emails || ['']}
              onAddTelefone={() => addContatoSetor('legais', 'telefones')}
              onRemoveTelefone={(idx) => removeContatoSetor('legais', 'telefones', idx)}
              onUpdateTelefone={(idx, value) => updateContatoSetor('legais', 'telefones', idx, value)}
              onAddEmail={() => addContatoSetor('legais', 'emails')}
              onRemoveEmail={(idx) => removeContatoSetor('legais', 'emails', idx)}
              onUpdateEmail={(idx, value) => updateContatoSetor('legais', 'emails', idx, value)}
            />
            
            <ContatoSetorSection
              setor="faturamento"
              label="Faturamento"
              color="bg-orange-500"
              telefones={profile.contatos_faturamento?.telefones || ['']}
              emails={profile.contatos_faturamento?.emails || ['']}
              onAddTelefone={() => addContatoSetor('faturamento', 'telefones')}
              onRemoveTelefone={(idx) => removeContatoSetor('faturamento', 'telefones', idx)}
              onUpdateTelefone={(idx, value) => updateContatoSetor('faturamento', 'telefones', idx, value)}
              onAddEmail={() => addContatoSetor('faturamento', 'emails')}
              onRemoveEmail={(idx) => removeContatoSetor('faturamento', 'emails', idx)}
              onUpdateEmail={(idx, value) => updateContatoSetor('faturamento', 'emails', idx, value)}
            />
            
            <ContatoSetorSection
              setor="financeiro"
              label="Financeiro"
              color="bg-red-500"
              telefones={profile.contatos_financeiro?.telefones || ['']}
              emails={profile.contatos_financeiro?.emails || ['']}
              onAddTelefone={() => addContatoSetor('financeiro', 'telefones')}
              onRemoveTelefone={(idx) => removeContatoSetor('financeiro', 'telefones', idx)}
              onUpdateTelefone={(idx, value) => updateContatoSetor('financeiro', 'telefones', idx, value)}
              onAddEmail={() => addContatoSetor('financeiro', 'emails')}
              onRemoveEmail={(idx) => removeContatoSetor('financeiro', 'emails', idx)}
              onUpdateEmail={(idx, value) => updateContatoSetor('financeiro', 'emails', idx, value)}
            />
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