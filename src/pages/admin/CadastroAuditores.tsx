import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  UserCog,
  Plus,
  Search,
  Edit,
  Trash2,
  Save,
  X,
  Phone,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import AnimatedSection from '@/components/AnimatedSection';

interface Auditor {
  id: number;
  nome: string;
  email: string;
  telefone?: string;
  registro_profissional: string;
  especialidade?: string;
  observacoes?: string;
  ativo: boolean;
  created_at: string;
}

const especialidades = [
  'Oncologia',
  'Cardiologia',
  'Radiologia',
  'Cirurgia',
  'Clínica Médica',
  'Auditoria Médica',
  'Outra'
];

const CadastroAuditores = () => {
  const [auditores, setAuditores] = useState<Auditor[]>([]);
  const [editingAuditor, setEditingAuditor] = useState<Auditor | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ativo' | 'inativo'>('all');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    registro_profissional: '',
    especialidade: '',
    observacoes: '',
    username: '',
    senha: '',
    ativo: true
  });

  // Auto-geração de username
  const [autoUserEnabled, setAutoUserEnabled] = useState(true);
  const [suggestedUser, setSuggestedUser] = useState('');

  useEffect(() => {
    loadAuditores();
  }, []);

  const loadAuditores = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/auditores', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || 'admin-special-access'}`
        }
      });

      if (!response.ok) throw new Error('Erro ao carregar auditores');

      const result = await response.json();
      setAuditores(result.data || []);
    } catch (error) {
      console.error('Erro ao carregar auditores:', error);
      toast.error('Erro ao carregar auditores');
      setAuditores([]);
    } finally {
      setLoading(false);
    }
  };

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD').replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9]+/g, '.')
      .replace(/\.+/g, '.')
      .replace(/^\.|\.$/g, '')
      .slice(0, 30);
  };

  // Gerar username automático baseado no nome com prefixo "auditor."
  const buildUsername = (name: string) => `auditor.${slugify(name)}@onkhos.com`;

  const ensureUnique = (base: string) => {
    const existing = new Set(auditores.map(a => a.email.toLowerCase()));
    if (!existing.has(base.toLowerCase())) return base;

    // Para formato auditor.nome@onkhos.com, adicionar contador antes do @
    let counter = 1;
    let candidate = base.replace('@onkhos.com', `.${counter}@onkhos.com`);
    while (existing.has(candidate.toLowerCase())) {
      counter++;
      candidate = base.replace('@onkhos.com', `.${counter}@onkhos.com`);
    }
    return candidate;
  };

  // Auto-gerar username quando o nome mudar
  useEffect(() => {
    if (autoUserEnabled && formData.nome && !editingAuditor) {
      const baseUser = buildUsername(formData.nome);
      const uniqueUser = ensureUnique(baseUser);
      setSuggestedUser(uniqueUser);
      setFormData(prev => ({ ...prev, username: uniqueUser, email: uniqueUser }));
    }
  }, [formData.nome, autoUserEnabled, editingAuditor]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (field === 'username' || field === 'email') {
      setAutoUserEnabled(false);
    }
  };

  const openFormForCreate = () => {
    setEditingAuditor(null);
    setFormData({
      nome: '',
      email: '',
      telefone: '',
      registro_profissional: '',
      especialidade: '',
      observacoes: '',
      username: '',
      senha: '',
      ativo: true
    });
    setAutoUserEnabled(true);
    setSuggestedUser('');
    setIsFormOpen(true);
  };

  const openFormForEdit = (auditor: Auditor) => {
    setEditingAuditor(auditor);
    setFormData({
      nome: auditor.nome,
      email: auditor.email,
      telefone: auditor.telefone || '',
      registro_profissional: auditor.registro_profissional,
      especialidade: auditor.especialidade || '',
      observacoes: auditor.observacoes || '',
      username: auditor.email,
      senha: '',
      ativo: auditor.ativo
    });
    setAutoUserEnabled(false);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingAuditor(null);
    setAutoUserEnabled(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome || !formData.registro_profissional) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (!editingAuditor && !formData.senha) {
      toast.error('Senha é obrigatória para novo auditor');
      return;
    }

    try {
      setSubmitting(true);

      const url = editingAuditor
        ? `/api/admin/auditores/${editingAuditor.id}`
        : '/api/admin/auditores';

      const method = editingAuditor ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || 'admin-special-access'}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao salvar auditor');
      }

      toast.success(editingAuditor ? 'Auditor atualizado com sucesso!' : 'Auditor cadastrado com sucesso!');
      closeForm();
      loadAuditores();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar auditor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este auditor?')) return;

    try {
      const response = await fetch(`/api/admin/auditores/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || 'admin-special-access'}`
        }
      });

      if (!response.ok) throw new Error('Erro ao excluir auditor');

      toast.success('Auditor excluído com sucesso!');
      loadAuditores();
    } catch (error) {
      toast.error('Erro ao excluir auditor');
    }
  };

  const filteredAuditores = auditores.filter(auditor => {
    const matchesSearch = auditor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         auditor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         auditor.registro_profissional.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' ||
                         (statusFilter === 'ativo' && auditor.ativo) ||
                         (statusFilter === 'inativo' && !auditor.ativo);

    return matchesSearch && matchesStatus;
  });

  return (
    <AnimatedSection className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <UserCog className="h-8 w-8" />
            Cadastro de Auditores
          </h2>
          <p className="text-muted-foreground mt-1">
            Gerencie os auditores médicos do sistema
          </p>
        </div>
        <Button onClick={openFormForCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Auditor
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou registro..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ativo">Ativos</SelectItem>
                <SelectItem value="inativo">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Carregando auditores...</p>
            </CardContent>
          </Card>
        ) : filteredAuditores.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <UserCog className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">
                {searchTerm ? 'Nenhum auditor encontrado' : 'Nenhum auditor cadastrado'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAuditores.map((auditor) => (
            <Card key={auditor.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{auditor.nome}</h3>
                      <Badge variant={auditor.ativo ? 'default' : 'secondary'}>
                        {auditor.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" />
                        <span>{auditor.registro_profissional}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span>{auditor.email}</span>
                      </div>
                      {auditor.telefone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>{auditor.telefone}</span>
                        </div>
                      )}
                      {auditor.especialidade && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Especialidade:</span>
                          <span>{auditor.especialidade}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openFormForEdit(auditor)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(auditor.id)}
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

      {/* Dialog de Formulário */}
      <Dialog open={isFormOpen} onOpenChange={closeForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogTitle>
            {editingAuditor ? 'Editar Auditor' : 'Novo Auditor'}
          </DialogTitle>
          <DialogDescription>
            {editingAuditor
              ? 'Atualize as informações do auditor'
              : 'Preencha os dados do novo auditor médico'}
          </DialogDescription>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="font-semibold">Informações Básicas</h3>

              <div>
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => handleInputChange('nome', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="registro_profissional">Registro Profissional (CRM, etc) *</Label>
                <Input
                  id="registro_profissional"
                  placeholder="Ex: CRM 12345/SP"
                  value={formData.registro_profissional}
                  onChange={(e) => handleInputChange('registro_profissional', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="especialidade">Especialidade</Label>
                <Select
                  value={formData.especialidade}
                  onValueChange={(v) => handleInputChange('especialidade', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a especialidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {especialidades.map((esp) => (
                      <SelectItem key={esp} value={esp}>{esp}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  type="tel"
                  value={formData.telefone}
                  onChange={(e) => handleInputChange('telefone', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => handleInputChange('observacoes', e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            {/* Credenciais de Acesso */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold">Credenciais de Acesso</h3>

              <div>
                <Label htmlFor="username">Username / Email *</Label>
                {autoUserEnabled && suggestedUser && !editingAuditor && (
                  <p className="text-xs text-muted-foreground mb-1">
                    Sugestão automática: {suggestedUser}
                  </p>
                )}
                <Input
                  id="username"
                  type="email"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  disabled={autoUserEnabled && !editingAuditor}
                  required
                />
                {!editingAuditor && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-1"
                    onClick={() => setAutoUserEnabled(!autoUserEnabled)}
                  >
                    {autoUserEnabled ? 'Editar manualmente' : 'Gerar automaticamente'}
                  </Button>
                )}
              </div>

              <div>
                <Label htmlFor="senha">
                  Senha {editingAuditor ? '(deixe em branco para manter)' : '*'}
                </Label>
                <div className="relative">
                  <Input
                    id="senha"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.senha}
                    onChange={(e) => handleInputChange('senha', e.target.value)}
                    required={!editingAuditor}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={formData.ativo}
                  onChange={(e) => handleInputChange('ativo', e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="ativo" className="cursor-pointer">Auditor Ativo</Label>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button type="button" variant="outline" onClick={closeForm}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                <Save className="h-4 w-4 mr-2" />
                {submitting ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AnimatedSection>
  );
};

export default CadastroAuditores;
