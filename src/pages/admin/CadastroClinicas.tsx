import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Phone,
  Mail,
  MapPin,
  FileText,
  Users,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import AnimatedSection from '@/components/AnimatedSection';
import { ClinicService, Clinica, ClinicaCreateInput, ClinicaUpdateInput } from '@/services/clinicService';
import { OperadoraService } from '@/services/operadoraService';

const estados = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const CadastroClinicas = () => {
  const [clinicas, setClinicas] = useState<Clinica[]>([]);
  const [editingClinica, setEditingClinica] = useState<Clinica | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ativo' | 'inativo'>('all');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [operadoras, setOperadoras] = useState<any[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  
  // Estados para paginação
  const [pagination, setPagination] = useState<any>(null);

  const [formData, setFormData] = useState<ClinicaCreateInput>({
    nome: '',
    razao_social: '',
    codigo: '',
    cnpj: '',
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
    usuario: '',
    senha: '',
    status: 'ativo',
    // @ts-ignore
    operadora_id: undefined
  });

  // Controle para auto-geração de usuário corporativo
  const [autoUserEnabled, setAutoUserEnabled] = useState(true);
  const [suggestedUser, setSuggestedUser] = useState('');
  const [userAvailable, setUserAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    loadClinicas(1, searchTerm);
    OperadoraService.getAllOperadoras().then(setOperadoras).catch(() => setOperadoras([]));
  }, []);

  // Resetar paginação e recarregar quando mudar a busca
  useEffect(() => {
    loadClinicas(1, searchTerm);
  }, [searchTerm]);

  const loadClinicas = async (page: number = 1, searchTerm: string = '') => {
    try {
      setLoading(true);

      const result = await ClinicService.getAllClinicas(page, 50, searchTerm);

      setClinicas(result.data);
      setPagination(result.pagination);
    } catch (error) {
      console.error('❌ Erro ao carregar clínicas:', error);
      console.error('❌ Detalhes do erro:', {
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined
      });
      toast.error('Erro ao carregar clínicas');
    } finally {
      setLoading(false);
    }
  };

  // Funções de paginação removidas - agora usando paginação do backend

  const handleInputChange = (field: keyof ClinicaCreateInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Utilitários de geração e verificação
  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD').replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9]+/g, '.')
      .replace(/\.+/g, '.')
      .replace(/^\.|\.$/g, '')
      .slice(0, 64);
  };

  const buildEmailUser = (name: string) => `${slugify(name)}@onkhos.com`;

  const getExistingLogins = () => {
    const clinicUsers = (clinicas || []).map(c => (c.usuario || '').toLowerCase()).filter(Boolean);
    const clinicEmails = (clinicas || []).flatMap(c => Array.isArray(c.emails) ? c.emails : (c as any).email ? [String((c as any).email)] : []).map(e => e.toLowerCase());
    const operadoraEmails = (operadoras || []).map((o: any) => (o.email || '').toLowerCase()).filter(Boolean);
    return new Set([ ...clinicUsers, ...clinicEmails, ...operadoraEmails ]);
  };

  const ensureUnique = (base: string) => {
    const existing = getExistingLogins();
    if (!existing.has(base.toLowerCase())) return base;
    let i = 2;
    let candidate = base.replace(/@/, `${i}@`);
    while (existing.has(candidate.toLowerCase())) {
      i += 1;
      candidate = base.replace(/@/, `${i}@`);
    }
    return candidate;
  };

  // Auto-gerar usuário ao digitar Nome Fantasia
  useEffect(() => {
    if (!autoUserEnabled) return;
    if (!formData.nome?.trim()) {
      setSuggestedUser('');
      setUserAvailable(null);
      return;
    }
    const email = ensureUnique(buildEmailUser(formData.nome.trim()));
    setSuggestedUser(email);
    setUserAvailable(true);
    // Se o campo usuário estiver vazio ou ainda sob auto-geração, preenche
    setFormData(prev => ({ ...prev, usuario: email || prev.usuario }));
  }, [formData.nome]);

  // Se o usuário digitar manualmente, desabilita auto-geração
  useEffect(() => {
    if (!formData.usuario) return;
    if (suggestedUser && formData.usuario !== suggestedUser) setAutoUserEnabled(false);
  }, [formData.usuario]);

  const handleArrayInputChange = (field: 'telefones' | 'emails', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field: 'telefones' | 'emails') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field: 'telefones' | 'emails', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  // Funções para gerenciar contatos por setores
  const handleContatoSetorChange = (setor: string, tipo: 'telefones' | 'emails', index: number, value: string) => {
    setFormData(prev => {
      const setorKey = `contatos_${setor}` as keyof ClinicaCreateInput;
      const contatosSetor = prev[setorKey] as { telefones?: string[]; emails?: string[] } || { telefones: [''], emails: [''] };
      return {
        ...prev,
        [setorKey]: {
          ...contatosSetor,
          [tipo]: (contatosSetor[tipo] || ['']).map((item, i) => i === index ? value : item),
        },
      };
    });
  };

  const addContatoSetor = (setor: string, tipo: 'telefones' | 'emails') => {
    setFormData(prev => {
      const setorKey = `contatos_${setor}` as keyof ClinicaCreateInput;
      const contatosSetor = prev[setorKey] as { telefones?: string[]; emails?: string[] } || { telefones: [''], emails: [''] };
      return {
        ...prev,
        [setorKey]: {
          ...contatosSetor,
          [tipo]: [...(contatosSetor[tipo] || ['']), ''],
        },
      };
    });
  };

  const removeContatoSetor = (setor: string, tipo: 'telefones' | 'emails', index: number) => {
    setFormData(prev => {
      const setorKey = `contatos_${setor}` as keyof ClinicaCreateInput;
      const contatosSetor = prev[setorKey] as { telefones?: string[]; emails?: string[] } || { telefones: [''], emails: [''] };
      const lista = contatosSetor[tipo] || [''];
      if (lista.length <= 1) return prev; // Mantém pelo menos um campo
      return {
        ...prev,
        [setorKey]: {
          ...contatosSetor,
          [tipo]: lista.filter((_, i) => i !== index),
        },
      };
    });
  };

  const validateForm = (): boolean => {
    if (!formData.nome.trim()) {
      toast.error('Nome da clínica é obrigatório');
      return false;
    }
    
    if (!formData.codigo.trim()) {
      toast.error('Código da clínica é obrigatório');
      return false;
    }
    
    if (formData.cnpj && !ClinicService.validateCNPJ(formData.cnpj)) {
      toast.error('CNPJ inválido');
      return false;
    }
    
    if (formData.cep && !ClinicService.validateCEP(formData.cep)) {
      toast.error('CEP inválido');
      return false;
    }
    
    // Validar telefones
    const telefonesValidos = formData.telefones.filter(tel => tel.trim());
    if (telefonesValidos.length === 0) {
      toast.error('Pelo menos um telefone é obrigatório');
      return false;
    }
    
    for (const telefone of telefonesValidos) {
      if (!ClinicService.validatePhone(telefone)) {
        toast.error('Telefone inválido');
        return false;
      }
    }
    
    // Validar emails
    const emailsValidos = formData.emails.filter(email => email.trim());
    if (emailsValidos.length === 0) {
      toast.error('Pelo menos um e-mail é obrigatório');
      return false;
    }
    
    for (const email of emailsValidos) {
      if (!ClinicService.validateEmail(email)) {
        toast.error('E-mail inválido');
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      // Preparar dados para envio
      const dadosParaEnvio = ClinicService.prepareDataForSubmission(formData);

      if (editingClinica) {
        const clinicaAtualizada = await ClinicService.updateClinica(editingClinica.id!, dadosParaEnvio as ClinicaUpdateInput);

        setClinicas(prev => prev.map(c => 
          c.id === editingClinica.id ? clinicaAtualizada : c
        ));

        toast.success('Clínica atualizada com sucesso!');
      } else {
        const novaClinica = await ClinicService.createClinica(dadosParaEnvio as ClinicaCreateInput);

        setClinicas(prev => [...prev, novaClinica]);
        toast.success('Clínica cadastrada com sucesso!');
      }

      resetForm();
      setIsFormOpen(false);
    } catch (error) {
      console.error('❌ Erro ao salvar clínica:', error);
      console.error('❌ Detalhes do erro:', {
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined
      });
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar clínica');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (clinica: Clinica) => {
    setEditingClinica(clinica);
    setFormData({
      nome: clinica.nome || '',
      razao_social: clinica.razao_social || '',
      codigo: clinica.codigo || '',
      cnpj: clinica.cnpj || '',
      endereco_rua: clinica.endereco_rua || '',
      endereco_numero: clinica.endereco_numero || '',
      endereco_bairro: clinica.endereco_bairro || '',
      endereco_complemento: clinica.endereco_complemento || '',
      cidade: clinica.cidade || '',
      estado: clinica.estado || '',
      cep: clinica.cep || '',
      telefones: Array.isArray(clinica.telefones) && clinica.telefones.length > 0 ? clinica.telefones : [''],
      emails: Array.isArray(clinica.emails) && clinica.emails.length > 0 ? clinica.emails : [''],
      contatos_pacientes: clinica.contatos_pacientes || { telefones: [''], emails: [''] },
      contatos_administrativos: clinica.contatos_administrativos || { telefones: [''], emails: [''] },
      contatos_legais: clinica.contatos_legais || { telefones: [''], emails: [''] },
      contatos_faturamento: clinica.contatos_faturamento || { telefones: [''], emails: [''] },
      contatos_financeiro: clinica.contatos_financeiro || { telefones: [''], emails: [''] },
      website: clinica.website || '',
      logo_url: clinica.logo_url || '',
      observacoes: clinica.observacoes || '',
      usuario: clinica.usuario || '',
      senha: clinica.senha || '',
      status: clinica.status || 'ativo',
      // @ts-ignore
      operadora_id: (clinica as any).operadora_id || undefined,
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja inativar esta clínica?')) {
      try {
        setLoading(true);
        const updated = await ClinicService.updateClinica(id, { status: 'inativo' });
        setClinicas(prev => prev.map(c => c.id === id ? updated : c));
        toast.success('Clínica inativada com sucesso!');
      } catch (error) {
        console.error('Erro ao inativar clínica:', error);
        toast.error(error instanceof Error ? error.message : 'Erro ao inativar clínica');
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      razao_social: '',
      codigo: '',
      cnpj: '',
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
      usuario: '',
      senha: '',
      status: 'ativo',
      // @ts-ignore
      operadora_id: undefined,
    });
    setEditingClinica(null);
  };

  // Usar dados diretamente do backend (já filtrados e paginados)
  const displayedClinicas = clinicas;
  const totalClinicas = pagination?.total || 0;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <AnimatedSection>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold">Cadastro de Clínicas</h2>
            <p className="text-muted-foreground">Gerencie as clínicas cadastradas no sistema</p>
          </div>
          <Button 
            onClick={() => setIsFormOpen(true)} 
            className="flex items-center space-x-2 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Nova Clínica</span>
          </Button>
        </div>
      </AnimatedSection>

      {/* Busca */}
      <AnimatedSection delay={100}>
        <div className="lco-card hover:shadow-lg transition-all duration-300">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por nome, código ou CNPJ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium">Status:</label>
                <Select value={statusFilter} onValueChange={(value: 'all' | 'ativo' | 'inativo') => setStatusFilter(value)}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="ativo">Ativas</SelectItem>
                    <SelectItem value="inativo">Inativas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </div>
      </AnimatedSection>

      {/* Lista de Clínicas */}
      <AnimatedSection delay={200}>
        <div className="lco-card hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <span>Clínicas Cadastradas ({totalClinicas})</span>
            </CardTitle>
            <CardDescription>
              Mostrando {displayedClinicas.length} de {totalClinicas} clínicas
              {pagination && ` • Página ${pagination.page} de ${pagination.totalPages}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : displayedClinicas.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma clínica encontrada</p>
              </div>
            ) : (
              <div className="space-y-4">
                {displayedClinicas.map((clinica) => (
                  <div 
                    key={clinica.id} 
                    className={`border rounded-lg p-4 hover:bg-muted/50 transition-all duration-200 hover:shadow-md ${
                      clinica.status === 'inativo' ? 'opacity-50 bg-muted/30' : ''
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center space-x-2 mb-3">
                          <h3 className="font-semibold text-lg">{clinica.nome}</h3>
                          <Badge variant="outline">{clinica.codigo}</Badge>
                          <Badge 
                            variant={clinica.status === 'ativo' ? 'default' : clinica.status === 'pendente' ? 'secondary' : 'destructive'}
                          >
                            {clinica.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm text-muted-foreground">
                          <div>
                            {clinica.cnpj && <p><strong>CNPJ:</strong> {clinica.cnpj}</p>}
                            {clinica.endereco && <p><strong>Endereço:</strong> {clinica.endereco}</p>}
                            {clinica.cidade && clinica.estado && <p><strong>Cidade/UF:</strong> {clinica.cidade} - {clinica.estado}</p>}
                            {clinica.cep && <p><strong>CEP:</strong> {clinica.cep}</p>}
                          </div>
                          <div>
                            <p><strong>Telefones:</strong></p>
                            <ul className="ml-4">
                              {(Array.isArray(clinica.telefones) ? clinica.telefones : []).map((tel, index) => (
                                <li key={index}>{tel}</li>
                              ))}
                            </ul>
                            <p><strong>E-mails:</strong></p>
                            <ul className="ml-4">
                              {(Array.isArray(clinica.emails) ? clinica.emails : []).map((email, index) => (
                                <li key={index}>{email}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        
                        {clinica.website && (
                          <p className="text-sm text-muted-foreground mt-2">
                            <strong>Website:</strong> {clinica.website}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 lg:ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(clinica)}
                          className="flex-1 lg:flex-none"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(clinica.id!)}
                          className="text-destructive hover:text-destructive flex-1 lg:flex-none"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Controles de Paginação (backend) */}
                {pagination && (
                  <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t">
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => loadClinicas(pagination.page - 1, searchTerm)}
                        disabled={!pagination.hasPrev}
                        variant="outline"
                        size="sm"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Anterior
                      </Button>
                      
                      <span className="text-sm text-muted-foreground">
                        Página {pagination.page} de {pagination.totalPages}
                      </span>
                      
                      <Button
                        onClick={() => loadClinicas(pagination.page + 1, searchTerm)}
                        disabled={!pagination.hasNext}
                        variant="outline"
                        size="sm"
                      >
                        Próxima
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      {`Mostrando ${clinicas.length} de ${pagination.total} clínicas`}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </div>
      </AnimatedSection>

      {/* Modal de Formulário */}
      <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-4xl w-[95vw] p-0">
          <DialogTitle className="sr-only">{editingClinica ? 'Editar Clínica' : 'Nova Clínica'}</DialogTitle>
          <DialogDescription className="sr-only">Preencha os dados da clínica</DialogDescription>
          <Card className="w-full max-h-[80vh] overflow-y-auto border-0 shadow-none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {editingClinica ? 'Editar Clínica' : 'Nova Clínica'}
                  </CardTitle>
                  <CardDescription>
                    {editingClinica ? 'Atualize as informações da clínica' : 'Preencha os dados para cadastrar uma nova clínica'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Informações Básicas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome Fantasia *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => handleInputChange('nome', e.target.value)}
                      placeholder="Ex: Clínica Oncológica São Paulo"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="razao_social">Razão Social</Label>
                    <Input
                      id="razao_social"
                      value={formData.razao_social}
                      onChange={(e) => handleInputChange('razao_social', e.target.value)}
                      placeholder="Ex: Clínica Oncológica São Paulo LTDA"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="codigo">Código *</Label>
                    <Input
                      id="codigo"
                      value={formData.codigo}
                      onChange={(e) => handleInputChange('codigo', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="operadora">Operadora</Label>
                    <Select value={String((formData as any).operadora_id || '')} onValueChange={(value) => handleInputChange('operadora_id' as any, value ? parseInt(value) : undefined)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a operadora" />
                      </SelectTrigger>
                      <SelectContent>
                        {operadoras.map(op => (
                          <SelectItem key={op.id} value={String(op.id)}>{op.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input
                      id="cnpj"
                      value={formData.cnpj}
                      onChange={(e) => handleInputChange('cnpj', e.target.value)}
                      placeholder="00.000.000/0000-00"
                    />
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
                        <SelectItem value="pendente">Pendente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Endereço */}
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>Endereço</span>
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="sm:col-span-2 space-y-2">
                      <Label htmlFor="endereco_rua">Rua/Avenida *</Label>
                      <Input
                        id="endereco_rua"
                        value={formData.endereco_rua}
                        onChange={(e) => handleInputChange('endereco_rua', e.target.value)}
                        placeholder="Ex: Rua das Flores"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="endereco_numero">Número *</Label>
                      <Input
                        id="endereco_numero"
                        value={formData.endereco_numero}
                        onChange={(e) => handleInputChange('endereco_numero', e.target.value)}
                        placeholder="123"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="endereco_complemento">Complemento</Label>
                      <Input
                        id="endereco_complemento"
                        value={formData.endereco_complemento}
                        onChange={(e) => handleInputChange('endereco_complemento', e.target.value)}
                        placeholder="Sala 10"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="endereco_bairro">Bairro *</Label>
                      <Input
                        id="endereco_bairro"
                        value={formData.endereco_bairro}
                        onChange={(e) => handleInputChange('endereco_bairro', e.target.value)}
                        placeholder="Centro"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="cidade">Cidade *</Label>
                      <Input
                        id="cidade"
                        value={formData.cidade}
                        onChange={(e) => handleInputChange('cidade', e.target.value)}
                        placeholder="São Paulo"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="estado">Estado *</Label>
                      <Select value={formData.estado} onValueChange={(value) => handleInputChange('estado', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="UF" />
                        </SelectTrigger>
                        <SelectContent>
                          {estados.map(estado => (
                            <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="cep">CEP *</Label>
                      <Input
                        id="cep"
                        value={formData.cep}
                        onChange={(e) => handleInputChange('cep', e.target.value)}
                        placeholder="00000-000"
                      />
                    </div>
                  </div>
                </div>

                {/* Contatos */}
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center space-x-2">
                    <Phone className="h-4 w-4" />
                    <span>Telefones *</span>
                  </h4>
                  
                  {formData.telefones.map((telefone, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        value={telefone}
                        onChange={(e) => handleArrayInputChange('telefones', index, e.target.value)}
                        placeholder="(00) 00000-0000"
                        required={index === 0}
                      />
                      {formData.telefones.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeArrayItem('telefones', index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayItem('telefones')}
                    className="flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Adicionar Telefone</span>
                  </Button>
                </div>

                {/* E-mails */}
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <span>E-mails *</span>
                  </h4>
                  
                  {formData.emails.map((email, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => handleArrayInputChange('emails', index, e.target.value)}
                        placeholder="email@exemplo.com"
                        required={index === 0}
                      />
                      {formData.emails.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeArrayItem('emails', index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayItem('emails')}
                    className="flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Adicionar E-mail</span>
                  </Button>
                </div>

                {/* Vínculo Operadora */}
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center space-x-2">
                    <Building2 className="h-4 w-4" />
                    <span>Vínculo com Operadora</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="operadora">Operadora</Label>
                      <Select value={(formData as any).operadora_id ? String((formData as any).operadora_id) : 'none'} onValueChange={(value) => handleInputChange('operadora_id' as any, value === 'none' ? undefined : Number(value))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sem vínculo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sem vínculo</SelectItem>
                          {operadoras.map((op) => (
                            <SelectItem key={op.id} value={String(op.id)}>{op.nome} - {op.codigo}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Usuário e Senha */}
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>Credenciais de Acesso</span>
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                    <Label htmlFor="usuario">Usuário</Label>
                      <Input
                        id="usuario"
                        value={formData.usuario || ''}
                      onChange={(e) => handleInputChange('usuario', e.target.value)}
                        placeholder="Deixe vazio para gerar automaticamente"
                      />
                    <p className="text-xs text-muted-foreground">
                      {autoUserEnabled ? 'Gerando automaticamente a partir do Nome Fantasia' : 'Você editou manualmente o usuário'}
                    </p>
                    {suggestedUser && (
                      <p className="text-xs">
                        Sugestão: <span className="font-medium">{suggestedUser}</span>
                      </p>
                    )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="senha">Senha</Label>
                      <div className="relative">
                        <Input
                          id="senha"
                          type={showPassword ? "text" : "password"}
                          value={formData.senha || ''}
                          onChange={(e) => handleInputChange('senha', e.target.value)}
                          placeholder="Deixe vazio para usar senha padrão"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Se não preenchida, será definida como "123456"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Informações Adicionais */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      placeholder="www.exemplo.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="logo_url">URL do Logo</Label>
                    <Input
                      id="logo_url"
                      value={formData.logo_url}
                      onChange={(e) => handleInputChange('logo_url', e.target.value)}
                      placeholder="https://exemplo.com/logo.png"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => handleInputChange('observacoes', e.target.value)}
                    placeholder="Informações adicionais sobre a clínica..."
                    rows={3}
                  />
                </div>

                {/* Botões */}
                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsFormOpen(false);
                      resetForm();
                    }}
                    className="w-full sm:w-auto"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                    {submitting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {editingClinica ? 'Atualizar' : 'Cadastrar'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CadastroClinicas;
