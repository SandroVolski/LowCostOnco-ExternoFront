import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Building2,
  Shield,
  User
} from 'lucide-react';
import { toast } from 'sonner';
import AnimatedSection from '@/components/AnimatedSection';
import { OperadoraService } from '@/services/operadoraService';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface OperadoraUser {
  id: number;
  nome: string;
  email: string;
  username?: string;
  role: 'operadora_admin' | 'operadora_user';
  status: 'ativo' | 'inativo';
  operadora_id: number;
  operadora: {
    id: number;
    nome: string;
    codigo: string;
  };
  created_at: string;
  last_login?: string;
}

interface OperadoraUserCreateInput {
  nome: string;
  email: string;
  username?: string;
  password: string;
  operadora_id: number;
  role: 'operadora_admin' | 'operadora_user';
}

const GerenciarUsuariosOperadora = () => {
  const [operadoras, setOperadoras] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<OperadoraUser[]>([]);
  const [editingUser, setEditingUser] = useState<OperadoraUser | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOperadora, setSelectedOperadora] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<OperadoraUserCreateInput>({
    nome: '',
    email: '',
    username: '',
    password: '',
    operadora_id: 0,
    role: 'operadora_user'
  });

  useEffect(() => {
    loadOperadoras();
  }, []);

  useEffect(() => {
    if (selectedOperadora) {
      loadUsuariosOperadora(parseInt(selectedOperadora));
    } else {
      setUsuarios([]);
    }
  }, [selectedOperadora]);

  const loadOperadoras = async () => {
    try {
      setLoading(true);
      const operadorasData = await OperadoraService.getAllOperadoras();
      setOperadoras(operadorasData);
    } catch (error) {
      console.error('Erro ao carregar operadoras:', error);
      toast.error('Erro ao carregar operadoras');
    } finally {
      setLoading(false);
    }
  };

  const loadUsuariosOperadora = async (operadoraId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/operadora-auth/users/${operadoraId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar usuários');
      }

      const data = await response.json();
      setUsuarios(data.users || []);
    } catch (error) {
      console.error('Erro ao carregar usuários da operadora:', error);
      toast.error('Erro ao carregar usuários da operadora');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof OperadoraUserCreateInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.nome.trim()) {
      toast.error('Nome é obrigatório');
      return false;
    }
    
    if (!formData.email.trim()) {
      toast.error('Email é obrigatório');
      return false;
    }
    
    if (!formData.password.trim()) {
      toast.error('Senha é obrigatória');
      return false;
    }
    
    if (!formData.operadora_id) {
      toast.error('Operadora é obrigatória');
      return false;
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

      const response = await fetch('/api/operadora-auth/register', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar usuário');
      }

      const data = await response.json();

      // Recarregar lista de usuários
      if (selectedOperadora) {
        await loadUsuariosOperadora(parseInt(selectedOperadora));
      }

      toast.success('Usuário criado com sucesso!');
      resetForm();
      setIsFormOpen(false);
    } catch (error) {
      console.error('❌ Erro ao criar usuário:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao criar usuário');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (user: OperadoraUser) => {
    setEditingUser(user);
    setFormData({
      nome: user.nome,
      email: user.email,
      username: user.username || '',
      password: '',
      operadora_id: user.operadora_id,
      role: user.role
    });
    setIsFormOpen(true);
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      email: '',
      username: '',
      password: '',
      operadora_id: 0,
      role: 'operadora_user'
    });
    setEditingUser(null);
  };

  const filteredUsuarios = usuarios.filter(usuario =>
    usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (usuario.username && usuario.username.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const selectedOperadoraData = operadoras.find(op => op.id === parseInt(selectedOperadora));

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <AnimatedSection>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold">Gerenciar Usuários da Operadora</h2>
            <p className="text-muted-foreground">Gerencie os usuários das operadoras de planos de saúde</p>
          </div>
          <Button 
            onClick={() => setIsFormOpen(true)} 
            className="flex items-center space-x-2 w-full sm:w-auto"
            disabled={!selectedOperadora}
          >
            <Plus className="h-4 w-4" />
            <span>Novo Usuário</span>
          </Button>
        </div>
      </AnimatedSection>

      {/* Seleção de Operadora */}
      <AnimatedSection delay={100}>
        <Card className="hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <span>Selecionar Operadora</span>
            </CardTitle>
            <CardDescription>
              Escolha uma operadora para gerenciar seus usuários
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="operadora">Operadora</Label>
                <Select value={selectedOperadora} onValueChange={setSelectedOperadora}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma operadora" />
                  </SelectTrigger>
                  <SelectContent>
                    {operadoras.map((operadora) => (
                      <SelectItem key={operadora.id} value={operadora.id.toString()}>
                        {operadora.nome} - {operadora.codigo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedOperadoraData && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    <span className="font-medium">{selectedOperadoraData.nome}</span>
                    <Badge variant="outline">{selectedOperadoraData.codigo}</Badge>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </AnimatedSection>

      {/* Busca */}
      {selectedOperadora && (
        <AnimatedSection delay={200}>
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por nome, email ou username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>
        </AnimatedSection>
      )}

      {/* Lista de Usuários */}
      {selectedOperadora && (
        <AnimatedSection delay={300}>
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Usuários da Operadora ({filteredUsuarios.length})</span>
              </CardTitle>
              <CardDescription>
                {selectedOperadoraData && `Usuários de ${selectedOperadoraData.nome}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredUsuarios.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum usuário encontrado</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredUsuarios.map((usuario) => (
                    <div key={usuario.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-all duration-200 hover:shadow-md">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center space-x-2 mb-3">
                            <h3 className="font-semibold text-lg">{usuario.nome}</h3>
                            <Badge variant="outline">{usuario.email}</Badge>
                            <Badge 
                              variant={usuario.role === 'operadora_admin' ? 'default' : 'secondary'}
                              className="flex items-center gap-1"
                            >
                              {usuario.role === 'operadora_admin' ? (
                                <Shield className="h-3 w-3" />
                              ) : (
                                <User className="h-3 w-3" />
                              )}
                              {usuario.role.replace('_', ' ')}
                            </Badge>
                            <Badge 
                              variant={usuario.status === 'ativo' ? 'default' : 'destructive'}
                            >
                              {usuario.status}
                            </Badge>
                          </div>
                          
                          <div className="text-sm text-muted-foreground">
                            {usuario.username && <p><strong>Username:</strong> {usuario.username}</p>}
                            <p><strong>Data de Cadastro:</strong> {usuario.created_at}</p>
                            {usuario.last_login && <p><strong>Último Login:</strong> {usuario.last_login}</p>}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 lg:ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(usuario)}
                            className="flex-1 lg:flex-none"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </AnimatedSection>
      )}

      {/* Modal de Formulário */}
      <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-2xl w-[95vw] p-0">
          <Card className="w-full max-h-[80vh] overflow-y-auto border-0 shadow-none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                  </CardTitle>
                  <CardDescription>
                    {editingUser ? 'Atualize as informações do usuário' : 'Preencha os dados para criar um novo usuário'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Informações Básicas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => handleInputChange('nome', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="operadora">Operadora *</Label>
                    <Select 
                      value={formData.operadora_id.toString()} 
                      onValueChange={(value) => handleInputChange('operadora_id', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma operadora" />
                      </SelectTrigger>
                      <SelectContent>
                        {operadoras.map((operadora) => (
                          <SelectItem key={operadora.id} value={operadora.id.toString()}>
                            {operadora.nome} - {operadora.codigo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="role">Função</Label>
                    <Select 
                      value={formData.role} 
                      onValueChange={(value) => handleInputChange('role', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="operadora_user">Usuário</SelectItem>
                        <SelectItem value="operadora_admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                    {editingUser ? 'Atualizar' : 'Criar'}
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

export default GerenciarUsuariosOperadora;
