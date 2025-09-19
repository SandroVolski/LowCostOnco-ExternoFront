import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import AnimatedSection from '@/components/AnimatedSection';
import { OperadoraService, Operadora, OperadoraCreateInput, OperadoraUpdateInput } from '@/services/operadoraService';

const CadastroOperadoras = () => {
  const [operadoras, setOperadoras] = useState<Operadora[]>([]);
  const [editingOperadora, setEditingOperadora] = useState<Operadora | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Estados para paginação
  const [operadorasPerPage] = useState(8);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAll, setShowAll] = useState(false);

  const [formData, setFormData] = useState<OperadoraCreateInput>({
    nome: '',
    codigo: '',
    cnpj: '',
    status: 'ativo',
    email: '',
    senha: ''
  });

  useEffect(() => {
    loadOperadoras();
  }, []);

  // Resetar paginação quando mudar a busca
  useEffect(() => {
    setCurrentPage(1);
    setShowAll(false);
  }, [searchTerm]);

  const loadOperadoras = async () => {
    try {
      console.log('🔧 Iniciando carregamento de operadoras...');
      setLoading(true);
      
      console.log('🔧 Chamando OperadoraService.getAllOperadoras()...');
      const operadorasData = await OperadoraService.getAllOperadoras();
      
      console.log('✅ Operadoras recebidas:', operadorasData);
      console.log('📊 Total de operadoras:', operadorasData.length);
      
      setOperadoras(operadorasData);
    } catch (error) {
      console.error('❌ Erro ao carregar operadoras:', error);
      console.error('❌ Detalhes do erro:', {
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined
      });
      toast.error('Erro ao carregar operadoras');
    } finally {
      setLoading(false);
      console.log('🔧 Carregamento de operadoras finalizado');
    }
  };

  // Função para carregar mais operadoras
  const loadMoreOperadoras = () => {
    if (showAll) {
      setShowAll(false);
      setCurrentPage(1);
    } else {
      setCurrentPage(prev => prev + 1);
    }
  };

  // Função para mostrar todas as operadoras
  const showAllOperadoras = () => {
    setShowAll(true);
    setCurrentPage(Math.ceil(filteredOperadoras.length / operadorasPerPage));
  };

  // Função para voltar ao início
  const resetPagination = () => {
    setCurrentPage(1);
    setShowAll(false);
  };

  const handleInputChange = (field: keyof OperadoraCreateInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.nome.trim()) {
      toast.error('Nome da operadora é obrigatório');
      return false;
    }
    
    if (!formData.codigo.trim()) {
      toast.error('Código da operadora é obrigatório');
      return false;
    }
    
    if (formData.cnpj && !OperadoraService.validateCNPJ(formData.cnpj)) {
      toast.error('CNPJ inválido');
      return false;
    }

    if (!editingOperadora) {
      if (!formData.email?.trim()) {
        toast.error('Email de acesso é obrigatório');
        return false;
      }
      
      if (!formData.senha?.trim()) {
        toast.error('Senha de acesso é obrigatória');
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔧 Iniciando envio do formulário...');
    console.log('📋 Dados do formulário:', formData);
    
    if (!validateForm()) {
      console.log('❌ Validação falhou');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Preparar dados para envio
      const dadosParaEnvio = OperadoraService.prepareDataForSubmission(formData);
      console.log('🔧 Dados preparados para envio:', dadosParaEnvio);
      
      if (editingOperadora) {
        // Atualizar operadora existente
        console.log('🔧 Atualizando operadora existente...');
        const operadoraAtualizada = await OperadoraService.updateOperadora(editingOperadora.id!, dadosParaEnvio as OperadoraUpdateInput);
        
        setOperadoras(prev => prev.map(o => 
          o.id === editingOperadora.id ? operadoraAtualizada : o
        ));
        
        toast.success('Operadora atualizada com sucesso!');
      } else {
        // Criar nova operadora
        console.log('🔧 Criando nova operadora...');
        const novaOperadora = await OperadoraService.createOperadora(dadosParaEnvio as OperadoraCreateInput);
        console.log('✅ Nova operadora criada:', novaOperadora);
        
        setOperadoras(prev => [...prev, novaOperadora]);
        toast.success('Operadora cadastrada com sucesso!');
      }
      
      resetForm();
      setIsFormOpen(false);
    } catch (error) {
      console.error('❌ Erro ao salvar operadora:', error);
      console.error('❌ Detalhes do erro:', {
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined
      });
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar operadora');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (operadora: Operadora) => {
    setEditingOperadora(operadora);
    setFormData({
      nome: operadora.nome,
      codigo: operadora.codigo,
      cnpj: operadora.cnpj || '',
      status: operadora.status,
      email: '',
      senha: ''
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta operadora?')) {
      try {
        setLoading(true);
        await OperadoraService.deleteOperadora(id);
        setOperadoras(prev => prev.filter(o => o.id !== id));
        toast.success('Operadora excluída com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir operadora:', error);
        toast.error(error instanceof Error ? error.message : 'Erro ao excluir operadora');
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      codigo: '',
      cnpj: '',
      status: 'ativo',
      email: '',
      senha: ''
    });
    setEditingOperadora(null);
  };

  const filteredOperadoras = operadoras.filter(operadora =>
    operadora.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    operadora.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (operadora.cnpj && operadora.cnpj.includes(searchTerm))
  );

  // Calcular operadoras a serem exibidas
  const totalOperadoras = filteredOperadoras.length;
  const totalPages = Math.ceil(totalOperadoras / operadorasPerPage);
  const startIndex = showAll ? 0 : (currentPage - 1) * operadorasPerPage;
  const endIndex = showAll ? totalOperadoras : Math.min(currentPage * operadorasPerPage, totalOperadoras);
  const displayedOperadoras = filteredOperadoras.slice(startIndex, endIndex);
  const hasMoreOperadoras = !showAll && endIndex < totalOperadoras;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <AnimatedSection>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold">Cadastro de Operadoras</h2>
            <p className="text-muted-foreground">Gerencie as operadoras de planos de saúde cadastradas no sistema</p>
          </div>
          <Button 
            onClick={() => setIsFormOpen(true)} 
            className="flex items-center space-x-2 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Nova Operadora</span>
          </Button>
        </div>
      </AnimatedSection>

      {/* Busca */}
      <AnimatedSection delay={100}>
        <div className="lco-card hover:shadow-lg transition-all duration-300">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por nome, código ou CNPJ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </div>
      </AnimatedSection>

      {/* Lista de Operadoras */}
      <AnimatedSection delay={200}>
        <div className="lco-card hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <span>Operadoras Cadastradas ({totalOperadoras})</span>
            </CardTitle>
            <CardDescription>
              Mostrando {displayedOperadoras.length} de {totalOperadoras} operadoras
              {!showAll && hasMoreOperadoras && ` • Página ${currentPage} de ${totalPages}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredOperadoras.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma operadora encontrada</p>
              </div>
            ) : (
              <div className="space-y-4">
                {displayedOperadoras.map((operadora) => (
                  <div key={operadora.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-all duration-200 hover:shadow-md">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center space-x-2 mb-3">
                          <h3 className="font-semibold text-lg">{operadora.nome}</h3>
                          <Badge variant="outline">{operadora.codigo}</Badge>
                          <Badge 
                            variant={operadora.status === 'ativo' ? 'default' : 'destructive'}
                          >
                            {operadora.status}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          {operadora.cnpj && <p><strong>CNPJ:</strong> {operadora.cnpj}</p>}
                          <p><strong>Data de Cadastro:</strong> {operadora.created_at}</p>
                          {operadora.updated_at && <p><strong>Última Atualização:</strong> {operadora.updated_at}</p>}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 lg:ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(operadora)}
                          className="flex-1 lg:flex-none"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(operadora.id!)}
                          className="text-destructive hover:text-destructive flex-1 lg:flex-none"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Controles de Paginação */}
                {totalOperadoras > operadorasPerPage && (
                  <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t">
                    {!showAll && hasMoreOperadoras && (
                      <Button
                        onClick={loadMoreOperadoras}
                        variant="outline"
                        className="flex items-center space-x-2"
                      >
                        <span>Carregar Mais 8</span>
                      </Button>
                    )}
                    
                    {!showAll && (
                      <Button
                        onClick={showAllOperadoras}
                        variant="outline"
                        className="flex items-center space-x-2"
                      >
                        <Building2 className="h-4 w-4" />
                        <span>Mostrar Todas ({totalOperadoras})</span>
                      </Button>
                    )}
                    
                    {showAll && (
                      <Button
                        onClick={resetPagination}
                        variant="outline"
                        className="flex items-center space-x-2"
                      >
                        <span>Voltar ao Início</span>
                      </Button>
                    )}
                    
                    <div className="text-sm text-muted-foreground">
                      {showAll 
                        ? `Mostrando todas as ${totalOperadoras} operadoras`
                        : `Página ${currentPage} de ${totalPages} • ${displayedOperadoras.length} de ${totalOperadoras}`
                      }
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </div>
      </AnimatedSection>

      {/* Modal de Formulário */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {editingOperadora ? 'Editar Operadora' : 'Nova Operadora'}
                  </CardTitle>
                  <CardDescription>
                    {editingOperadora ? 'Atualize as informações da operadora' : 'Preencha os dados para cadastrar uma nova operadora'}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsFormOpen(false);
                    resetForm();
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Informações Básicas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome da Operadora *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => handleInputChange('nome', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="codigo">Código *</Label>
                    <Input
                      id="codigo"
                      value={formData.codigo}
                      onChange={(e) => handleInputChange('codigo', e.target.value)}
                      required
                    />
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
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Credenciais de Acesso */}
                <div className="space-y-4">
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-medium mb-4">Credenciais de Acesso</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Defina email e senha para que a operadora possa fazer login no sistema
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email de Acesso *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="operadora@exemplo.com"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="senha">Senha *</Label>
                      <Input
                        id="senha"
                        type="password"
                        value={formData.senha}
                        onChange={(e) => handleInputChange('senha', e.target.value)}
                        placeholder="Senha de acesso"
                        required
                      />
                    </div>
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
                    {editingOperadora ? 'Atualizar' : 'Cadastrar'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CadastroOperadoras;
