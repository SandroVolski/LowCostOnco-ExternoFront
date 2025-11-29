import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  Grid3X3,
  List,
  Download,
  Filter,
  Building2,
  DollarSign,
  Hash,
  FileText,
  Loader2,
  Package,
  Pill,
  Info,
} from 'lucide-react';
import TabelaPrecosService, { TabelaPreco, TabelaPrecosFilters } from '@/services/tabelaPrecosService';
import AnimatedSection from '@/components/AnimatedSection';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

type ViewMode = 'grid' | 'list';

const TabelasPrecos = () => {
  const { toast } = useToast();

  // Estados
  const [tabelas, setTabelas] = useState<TabelaPreco[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [operadoras, setOperadoras] = useState<string[]>([]);

  // Filtros
  const [filters, setFilters] = useState<TabelaPrecosFilters>({
    codigo: '',
    descricao: '',
    tabela: '',
    principioAtivo: '',
  });

  // Carregar dados iniciais
  useEffect(() => {
    loadOperadoras();
    loadTabelas();
  }, []);

  const loadOperadoras = async () => {
    try {
      const data = await TabelaPrecosService.getOperadoras();
      setOperadoras(data);
    } catch (error: any) {
      console.error('Erro ao carregar operadoras:', error);
    }
  };

  const loadTabelas = async (customFilters?: TabelaPrecosFilters) => {
    try {
      setLoading(true);
      const filtersToUse = customFilters || filters;

      // Remover filtros vazios
      const cleanFilters: TabelaPrecosFilters = {};
      if (filtersToUse.codigo?.trim()) cleanFilters.codigo = filtersToUse.codigo.trim();
      if (filtersToUse.descricao?.trim()) cleanFilters.descricao = filtersToUse.descricao.trim();
      if (filtersToUse.tabela?.trim()) cleanFilters.tabela = filtersToUse.tabela.trim();
      if (filtersToUse.principioAtivo?.trim()) cleanFilters.principioAtivo = filtersToUse.principioAtivo.trim();

      const data = await TabelaPrecosService.getTabelas(cleanFilters);
      setTabelas(data);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao carregar tabelas de preços',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof TabelaPrecosFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  const handleSearch = () => {
    loadTabelas();
  };

  const handleClearFilters = () => {
    const emptyFilters: TabelaPrecosFilters = {
      codigo: '',
      descricao: '',
      tabela: '',
      principioAtivo: '',
    };
    setFilters(emptyFilters);
    loadTabelas(emptyFilters);
  };

  const handleExportCSV = () => {
    if (tabelas.length === 0) {
      toast({
        title: 'Aviso',
        description: 'Não há dados para exportar',
        variant: 'default',
      });
      return;
    }

    // Criar CSV
    const headers = ['Operadora', 'Código', 'Fator', 'Princípio Ativo', 'Descrição', 'Pagamento', 'Valor'];
    const csvContent = [
      headers.join(';'),
      ...tabelas.map(item =>
        [
          item.Tabela,
          item.Servico_Codigo,
          item.Fator,
          item.Principio_Ativo,
          item.Descrição,
          item.Pagamento,
          item.Valor.toFixed(2).replace('.', ','),
        ].join(';')
      ),
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tabelas_precos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: 'Sucesso',
      description: 'Tabela exportada com sucesso',
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getOperadoraColor = (operadora: string) => {
    const colors = [
      'bg-blue-100 text-blue-800 border-blue-200',
      'bg-purple-100 text-purple-800 border-purple-200',
      'bg-blue-100 text-blue-800 border-blue-200',
      'bg-orange-100 text-orange-800 border-orange-200',
      'bg-pink-100 text-pink-800 border-pink-200',
      'bg-indigo-100 text-indigo-800 border-indigo-200',
    ];
    const index = operadora.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <AnimatedSection>
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/10 p-8">
          <div className="absolute inset-0 bg-grid-white/10" />
          <div className="relative">
            <h1 className="text-3xl font-bold tracking-tighter bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Tabelas de Preços
            </h1>
            <p className="text-muted-foreground text-sm md:text-base max-w-2xl">
              Consulte os preços negociados com as operadoras
            </p>
          </div>
        </div>
      </AnimatedSection>

      {/* Filtros */}
      <AnimatedSection delay={100}>
        <Card className="lco-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary" />
                <CardTitle>Filtros de Pesquisa</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                Limpar Filtros
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Código */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Hash className="h-4 w-4 text-primary" />
                  Código do Serviço
                </label>
                <Input
                  placeholder="Ex: 10101012"
                  value={filters.codigo || ''}
                  onChange={(e) => handleFilterChange('codigo', e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Descrição
                </label>
                <Input
                  placeholder="Ex: Consulta"
                  value={filters.descricao || ''}
                  onChange={(e) => handleFilterChange('descricao', e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>

              {/* Operadora */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  Operadora
                </label>
                <Select
                  value={filters.tabela || 'all'}
                  onValueChange={(value) => handleFilterChange('tabela', value === 'all' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as operadoras" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as operadoras</SelectItem>
                    {operadoras.map((op) => (
                      <SelectItem key={op} value={op}>
                        {op}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Princípio Ativo */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Pill className="h-4 w-4 text-primary" />
                  Princípio Ativo
                </label>
                <Input
                  placeholder="Ex: Dipirona"
                  value={filters.principioAtivo || ''}
                  onChange={(e) => handleFilterChange('principioAtivo', e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <Button onClick={handleSearch} className="gap-2">
                <Search className="h-4 w-4" />
                Pesquisar
              </Button>
            </div>
          </CardContent>
        </Card>
      </AnimatedSection>

      {/* Controles de Visualização */}
      <AnimatedSection delay={200}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">
              {tabelas.length} {tabelas.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={tabelas.length === 0}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
            <div className="flex rounded-lg border border-border overflow-hidden">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-none"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-none"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Visualização em Lista */}
      {!loading && viewMode === 'list' && (
        <AnimatedSection delay={300}>
          <Card className="lco-card">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-bold">Operadora</TableHead>
                      <TableHead className="font-bold">Código</TableHead>
                      <TableHead className="font-bold">Fator</TableHead>
                      <TableHead className="font-bold">Princípio Ativo</TableHead>
                      <TableHead className="font-bold">Descrição</TableHead>
                      <TableHead className="font-bold">Pagamento</TableHead>
                      <TableHead className="font-bold text-right">Valor</TableHead>
                      <TableHead className="font-bold text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tabelas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          Nenhum resultado encontrado. Ajuste os filtros e tente novamente.
                        </TableCell>
                      </TableRow>
                    ) : (
                      tabelas.map((item, index) => (
                        <TableRow key={index} className="hover:bg-muted/50 transition-colors">
                          <TableCell>
                            <Badge className={`${getOperadoraColor(item.Tabela)} border text-xs`}>
                              {item.Tabela}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm font-medium">{item.Servico_Codigo}</TableCell>
                          <TableCell className="text-sm">{item.Fator || '-'}</TableCell>
                          <TableCell className="text-sm">{item.Principio_Ativo || '-'}</TableCell>
                          <TableCell className="max-w-xs truncate text-sm" title={item.Descrição}>
                            {item.Descrição}
                          </TableCell>
                          <TableCell className="text-sm">{item.Pagamento || '-'}</TableCell>
                          <TableCell className="text-right font-bold text-primary">
                            {formatCurrency(item.Valor)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Info className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-2 text-xl">
                                    <Package className="h-5 w-5 text-primary" />
                                    Detalhes do Serviço
                                  </DialogTitle>
                                  <DialogDescription>
                                    Informações completas sobre o código {item.Servico_Codigo}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                                        Operadora
                                      </div>
                                      <Badge className={`${getOperadoraColor(item.Tabela)} border`}>
                                        {item.Tabela}
                                      </Badge>
                                    </div>
                                    <div>
                                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                                        Código do Serviço
                                      </div>
                                      <div className="font-mono text-lg font-bold text-foreground">
                                        {item.Servico_Codigo}
                                      </div>
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                                      Descrição
                                    </div>
                                    <div className="text-base text-foreground leading-relaxed">
                                      {item.Descrição}
                                    </div>
                                  </div>
                                  {item.Principio_Ativo && (
                                    <div>
                                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                                        Princípio Ativo
                                      </div>
                                      <div className="text-base text-foreground">{item.Principio_Ativo}</div>
                                    </div>
                                  )}
                                  <div className="grid grid-cols-2 gap-4">
                                    {item.Fator && (
                                      <div>
                                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                                          Fator
                                        </div>
                                        <div className="text-base font-medium text-foreground">{item.Fator}</div>
                                      </div>
                                    )}
                                    {item.Pagamento && (
                                      <div>
                                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                                          Forma de Pagamento
                                        </div>
                                        <div className="text-base font-medium text-foreground">{item.Pagamento}</div>
                                      </div>
                                    )}
                                  </div>
                                  <div className="p-4 bg-primary/10 rounded-lg border-2 border-primary/30">
                                    <div className="text-xs font-semibold text-primary/70 uppercase tracking-wide mb-1">
                                      Valor Negociado
                                    </div>
                                    <div className="text-3xl font-bold text-primary">
                                      {formatCurrency(item.Valor)}
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </AnimatedSection>
      )}

      {/* Visualização em Grade */}
      {!loading && viewMode === 'grid' && (
        <AnimatedSection delay={300}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tabelas.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                Nenhum resultado encontrado. Ajuste os filtros e tente novamente.
              </div>
            ) : (
              tabelas.map((item, index) => (
                <Card
                  key={index}
                  className="lco-card hover:border-primary/50 transition-all duration-300 hover:shadow-lg"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <Badge className={`${getOperadoraColor(item.Tabela)} border`}>{item.Tabela}</Badge>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Info className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-xl">
                              <Package className="h-5 w-5 text-primary" />
                              Detalhes do Serviço
                            </DialogTitle>
                            <DialogDescription>
                              Informações completas sobre o código {item.Servico_Codigo}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                                  Operadora
                                </div>
                                <Badge className={`${getOperadoraColor(item.Tabela)} border`}>
                                  {item.Tabela}
                                </Badge>
                              </div>
                              <div>
                                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                                  Código do Serviço
                                </div>
                                <div className="font-mono text-lg font-bold text-foreground">
                                  {item.Servico_Codigo}
                                </div>
                              </div>
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                                Descrição
                              </div>
                              <div className="text-base text-foreground leading-relaxed">{item.Descrição}</div>
                            </div>
                            {item.Principio_Ativo && (
                              <div>
                                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                                  Princípio Ativo
                                </div>
                                <div className="text-base text-foreground">{item.Principio_Ativo}</div>
                              </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                              {item.Fator && (
                                <div>
                                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                                    Fator
                                  </div>
                                  <div className="text-base font-medium text-foreground">{item.Fator}</div>
                                </div>
                              )}
                              {item.Pagamento && (
                                <div>
                                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                                    Forma de Pagamento
                                  </div>
                                  <div className="text-base font-medium text-foreground">{item.Pagamento}</div>
                                </div>
                              )}
                            </div>
                            <div className="p-4 bg-primary/10 rounded-lg border-2 border-primary/30">
                              <div className="text-xs font-semibold text-primary/70 uppercase tracking-wide mb-1">
                                Valor Negociado
                              </div>
                              <div className="text-3xl font-bold text-primary">{formatCurrency(item.Valor)}</div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <CardTitle className="text-base font-mono">{item.Servico_Codigo}</CardTitle>
                    <CardDescription className="line-clamp-2 text-xs">{item.Descrição}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {item.Principio_Ativo && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Princípio Ativo</div>
                          <div className="text-sm font-medium text-foreground">{item.Principio_Ativo}</div>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <div className="text-xs text-muted-foreground">Valor Negociado</div>
                        <div className="text-xl font-bold text-primary">{formatCurrency(item.Valor)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </AnimatedSection>
      )}
    </div>
  );
};

export default TabelasPrecos;
