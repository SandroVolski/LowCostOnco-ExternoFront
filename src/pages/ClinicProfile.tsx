import { useState, useEffect } from 'react';
import { Building2, Upload, Save, Camera, MapPin, Phone, Mail, FileText, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface ClinicProfile {
  id?: number;
  nome: string;
  codigo: string;
  cnpj: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  telefone: string;
  email: string;
  website?: string;
  responsavel_nome: string;
  responsavel_crm: string;
  responsavel_especialidade: string;
  logo_url?: string;
  observacoes?: string;
}

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
  responsavel_nome: '',
  responsavel_crm: '',
  responsavel_especialidade: '',
  logo_url: '',
  observacoes: '',
};



const ClinicProfile = () => {
  const [profile, setProfile] = useState<ClinicProfile>(emptyProfile);
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>('');

  // Carregar dados do perfil ao montar o componente
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      // Por enquanto, usar dados do localStorage
      const savedProfile = localStorage.getItem('clinic_profile');
      if (savedProfile) {
        const profileData = JSON.parse(savedProfile);
        setProfile(profileData);
        setLogoPreview(profileData.logo_url || '');
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      toast.error('Erro ao carregar dados do perfil');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile({
      ...profile,
      [name]: value,
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Verificar se é uma imagem
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione apenas arquivos de imagem');
        return;
      }

      // Verificar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('A imagem deve ter no máximo 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setLogoPreview(dataUrl);
        setProfile({
          ...profile,
          logo_url: dataUrl,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    // Validações básicas
    if (!profile.nome || !profile.codigo) {
      toast.error('Nome e código da clínica são obrigatórios');
      return;
    }

    setLoading(true);
    try {
      // Por enquanto, salvar no localStorage
      localStorage.setItem('clinic_profile', JSON.stringify(profile));
      
      // TODO: Quando implementar o backend, salvar na API
      // await ClinicService.updateProfile(profile);
      
      toast.success('Perfil salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      toast.error('Erro ao salvar perfil');
    } finally {
      setLoading(false);
    }
  };

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 5) return numbers;
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
    if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
    if (numbers.length <= 12) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  // Seção animada
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
                  <Button 
                    type="button"
                    variant="outline" 
                    className="w-full"
                    onClick={() => document.getElementById('logo-upload')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {logoPreview ? 'Alterar Logo' : 'Fazer Upload'}
                  </Button>
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
                    onChange={(e) => {
                      const formatted = formatCNPJ(e.target.value);
                      setProfile({ ...profile, cnpj: formatted });
                    }}
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
                  onChange={(e) => {
                    const formatted = formatCEP(e.target.value);
                    setProfile({ ...profile, cep: formatted });
                  }}
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
                    onChange={(e) => {
                      const formatted = formatPhone(e.target.value);
                      setProfile({ ...profile, telefone: formatted });
                    }}
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

      {/* Responsável Técnico */}
      <AnimatedSection delay={500}>
        <Card className="lco-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2 text-primary" />
              Responsável Técnico
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="responsavel_nome">Nome do Responsável</Label>
                <Input
                  id="responsavel_nome"
                  name="responsavel_nome"
                  value={profile.responsavel_nome}
                  onChange={handleInputChange}
                  placeholder="Dr. João Silva"
                  className="lco-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="responsavel_crm">CRM</Label>
                <Input
                  id="responsavel_crm"
                  name="responsavel_crm"
                  value={profile.responsavel_crm}
                  onChange={handleInputChange}
                  placeholder="CRM 123456/SP"
                  className="lco-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="responsavel_especialidade">Especialidade</Label>
                <Input
                  id="responsavel_especialidade"
                  name="responsavel_especialidade"
                  value={profile.responsavel_especialidade}
                  onChange={handleInputChange}
                  placeholder="Oncologia"
                  className="lco-input"
                />
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

export default ClinicProfile;