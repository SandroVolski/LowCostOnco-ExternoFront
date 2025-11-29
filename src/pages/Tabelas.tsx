import React, { useState, useEffect, useRef } from 'react';
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
  Filter,
  Building2,
  DollarSign,
  Hash,
  FileText,
  Loader2,
  Package,
  Pill,
  Info,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from 'lucide-react';
import TabelaPrecosService, { TabelaPreco, TabelaPrecosFilters } from '@/services/tabelaPrecosService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

type ViewMode = 'grid' | 'list';

const Tabelas = () => {
  const { toast } = useToast();

  // Estados
  const [tabelas, setTabelas] = useState<TabelaPreco[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [operadoras, setOperadoras] = useState<string[]>([]);
  const [visibleListCount, setVisibleListCount] = useState<number>(50);
  const [visibleGridCount, setVisibleGridCount] = useState<number>(20);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  
  // Ordenação
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Seleção no modo grade - usando chave única (Servico_Codigo + Tabela)
  const [selectedItemKey, setSelectedItemKey] = useState<string | null>(null);

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
      // resetar janelas visíveis a cada busca
      setVisibleListCount(50);
      setVisibleGridCount(20);
      // limpar seleção e ordenação
      setSelectedItemKey(null);
      setSortColumn(null);
      setSortDirection('asc');
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
    setVisibleListCount(50);
    setVisibleGridCount(20);
  };

  // Scroll infinito - carregar mais itens automaticamente
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const currentVisible = viewMode === 'list' ? visibleListCount : visibleGridCount;
        const increment = viewMode === 'list' ? 50 : 20;
        if (entries[0].isIntersecting && !loadingMore && currentVisible < tabelas.length) {
          setLoadingMore(true);
          // Simular um pequeno delay para melhor UX
          setTimeout(() => {
            if (viewMode === 'list') {
              setVisibleListCount((prev) => Math.min(prev + increment, tabelas.length));
            } else {
              setVisibleGridCount((prev) => Math.min(prev + increment, tabelas.length));
            }
            setLoadingMore(false);
          }, 300);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [loadingMore, visibleListCount, visibleGridCount, tabelas.length, viewMode]);

  // Exportação CSV removida a pedido do usuário

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

  // Função para lidar com ordenação
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Se já está ordenando por esta coluna, alterna a direção
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Nova coluna, começa com ascendente
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Função para obter ícone de ordenação
  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground/50" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4 text-primary" />
      : <ArrowDown className="h-4 w-4 text-primary" />;
  };

  // Função para ordenar os dados
  const sortedTabelas = React.useMemo(() => {
    if (!sortColumn) return tabelas;

    const sorted = [...tabelas].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortColumn) {
        case 'Tabela':
          aValue = a.Tabela || '';
          bValue = b.Tabela || '';
          break;
        case 'Servico_Codigo':
          aValue = a.Servico_Codigo || '';
          bValue = b.Servico_Codigo || '';
          break;
        case 'Fator':
          aValue = a.Fator || '';
          bValue = b.Fator || '';
          break;
        case 'Principio_Ativo':
          aValue = a.Principio_Ativo || '';
          bValue = b.Principio_Ativo || '';
          break;
        case 'Descricao':
          aValue = a.Descricao || '';
          bValue = b.Descricao || '';
          break;
        case 'Pagamento':
          aValue = a.Pagamento || '';
          bValue = b.Pagamento || '';
          break;
        case 'Valor':
          aValue = a.Valor || 0;
          bValue = b.Valor || 0;
          break;
        default:
          return 0;
      }

      // Comparação
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue, 'pt-BR', { sensitivity: 'base' });
        return sortDirection === 'asc' ? comparison : -comparison;
      } else {
        // Números
        const comparison = aValue - bValue;
        return sortDirection === 'asc' ? comparison : -comparison;
      }
    });

    return sorted;
  }, [tabelas, sortColumn, sortDirection]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
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
      </div>

      {/* Filtros */}
      <div>
        <Card className="lco-card border-2 border-primary/10 shadow-lg bg-gradient-to-br from-card to-muted/10">
          <CardHeader className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b-2 border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Filter className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-xl font-bold">Filtros de Pesquisa</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={handleClearFilters} className="hover:bg-primary/10">
                Limpar Filtros
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Código */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2 uppercase tracking-wide">
                  <div className="p-1.5 rounded-md bg-primary/10">
                    <Hash className="h-3.5 w-3.5 text-primary" />
                  </div>
                  Código do Serviço
                </label>
                <Input
                  placeholder="Ex: 10101012"
                  value={filters.codigo || ''}
                  onChange={(e) => handleFilterChange('codigo', e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="border-2 focus:border-primary/50 transition-colors h-11"
                />
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2 uppercase tracking-wide">
                  <div className="p-1.5 rounded-md bg-primary/10">
                    <FileText className="h-3.5 w-3.5 text-primary" />
                  </div>
                  Descrição
                </label>
                <Input
                  placeholder="Ex: Consulta"
                  value={filters.descricao || ''}
                  onChange={(e) => handleFilterChange('descricao', e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="border-2 focus:border-primary/50 transition-colors h-11"
                />
              </div>

              {/* Operadora */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2 uppercase tracking-wide">
                  <div className="p-1.5 rounded-md bg-primary/10">
                    <Building2 className="h-3.5 w-3.5 text-primary" />
                  </div>
                  Operadora
                </label>
                <Select
                  value={filters.tabela || 'all'}
                  onValueChange={(value) => handleFilterChange('tabela', value === 'all' ? '' : value)}
                >
                  <SelectTrigger className="border-2 focus:border-primary/50 transition-colors h-11">
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
                <label className="text-sm font-semibold text-foreground flex items-center gap-2 uppercase tracking-wide">
                  <div className="p-1.5 rounded-md bg-primary/10">
                    <Pill className="h-3.5 w-3.5 text-primary" />
                  </div>
                  Princípio Ativo
                </label>
                <Input
                  placeholder="Ex: Dipirona"
                  value={filters.principioAtivo || ''}
                  onChange={(e) => handleFilterChange('principioAtivo', e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="border-2 focus:border-primary/50 transition-colors h-11"
                />
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <Button onClick={handleSearch} className="gap-2 bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all duration-300 px-8 h-11">
                <Search className="h-4 w-4" />
                Pesquisar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles de Visualização */}
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">
              {tabelas.length} {tabelas.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-border overflow-hidden">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  setViewMode('list');
                  setSelectedItemKey(null); // limpar seleção ao mudar de modo
                }}
                className="rounded-none"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  setViewMode('grid');
                  setSelectedItemKey(null); // limpar seleção ao mudar de modo
                }}
                className="rounded-none"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Prévia removida */}

      {/* Visualização em Lista */}
      {!loading && viewMode === 'list' && (
        <div>
          <Card className="lco-card border-2 border-primary/10 shadow-xl bg-gradient-to-br from-card to-muted/5">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-b-2 border-primary/20">
                      <TableHead 
                        className="font-bold text-sm uppercase tracking-wide text-foreground py-4 cursor-pointer hover:bg-primary/10 transition-colors select-none"
                        onClick={() => handleSort('Tabela')}
                      >
                        <div className="flex items-center gap-2">
                          Operadora
                          {getSortIcon('Tabela')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="font-bold text-sm uppercase tracking-wide text-foreground py-4 cursor-pointer hover:bg-primary/10 transition-colors select-none"
                        onClick={() => handleSort('Servico_Codigo')}
                      >
                        <div className="flex items-center gap-2">
                          Código
                          {getSortIcon('Servico_Codigo')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="font-bold text-sm uppercase tracking-wide text-foreground py-4 cursor-pointer hover:bg-primary/10 transition-colors select-none"
                        onClick={() => handleSort('Fator')}
                      >
                        <div className="flex items-center gap-2">
                          Fator
                          {getSortIcon('Fator')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="font-bold text-sm uppercase tracking-wide text-foreground py-4 cursor-pointer hover:bg-primary/10 transition-colors select-none"
                        onClick={() => handleSort('Principio_Ativo')}
                      >
                        <div className="flex items-center gap-2">
                          Princípio Ativo
                          {getSortIcon('Principio_Ativo')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="font-bold text-sm uppercase tracking-wide text-foreground py-4 cursor-pointer hover:bg-primary/10 transition-colors select-none"
                        onClick={() => handleSort('Descricao')}
                      >
                        <div className="flex items-center gap-2">
                          Descrição
                          {getSortIcon('Descricao')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="font-bold text-sm uppercase tracking-wide text-foreground py-4 cursor-pointer hover:bg-primary/10 transition-colors select-none"
                        onClick={() => handleSort('Pagamento')}
                      >
                        <div className="flex items-center gap-2">
                          Pagamento
                          {getSortIcon('Pagamento')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="font-bold text-sm uppercase tracking-wide text-foreground text-right py-4 cursor-pointer hover:bg-primary/10 transition-colors select-none"
                        onClick={() => handleSort('Valor')}
                      >
                        <div className="flex items-center justify-end gap-2">
                          Valor
                          {getSortIcon('Valor')}
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedTabelas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                          Nenhum resultado encontrado. Ajuste os filtros e tente novamente.
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedTabelas.slice(0, visibleListCount).map((item, index) => (
                        <TableRow 
                          key={index} 
                          className="border-b border-border/50 hover:bg-gradient-to-r hover:from-primary/5 hover:via-primary/10 hover:to-primary/5 transition-all duration-200 cursor-pointer"
                        >
                          <TableCell className="py-5">
                            <Badge className={`${getOperadoraColor(item.Tabela)} border text-xs font-semibold shadow-sm`}>
                              {item.Tabela}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm font-bold text-foreground py-5">{item.Servico_Codigo}</TableCell>
                          <TableCell className="text-sm text-muted-foreground py-5">{item.Fator || <span className="text-muted-foreground/50">-</span>}</TableCell>
                          <TableCell className="text-sm text-muted-foreground py-5 max-w-xs truncate" title={item.Principio_Ativo || undefined}>
                            {item.Principio_Ativo || <span className="text-muted-foreground/50">-</span>}
                          </TableCell>
                          <TableCell className="max-w-xs truncate text-sm text-foreground py-5 font-medium" title={item.Descricao}>
                            {item.Descricao}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground py-5">{item.Pagamento || <span className="text-muted-foreground/50">-</span>}</TableCell>
                          <TableCell className="text-right font-bold text-xl text-primary py-5">
                            {formatCurrency(item.Valor)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          {/* Sentinel para scroll infinito */}
          {sortedTabelas.length > visibleListCount && (
            <div ref={observerTarget} className="flex justify-center items-center py-8">
              {loadingMore && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-sm">Carregando mais itens...</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Visualização em Grade */}
      {!loading && viewMode === 'grid' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tabelas.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                Nenhum resultado encontrado. Ajuste os filtros e tente novamente.
              </div>
            ) : (
              tabelas.slice(0, visibleGridCount).map((item, index) => {
                const itemKey = `${item.Servico_Codigo}-${item.Tabela}`;
                const isSelected = selectedItemKey === itemKey;
                return (
                <Card
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedItemKey(isSelected ? null : itemKey);
                  }}
                  className={`group relative overflow-hidden border-2 transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? 'border-primary shadow-xl shadow-primary/20 bg-gradient-to-br from-primary/5 via-card to-primary/5 dark:from-primary/10 dark:via-card dark:to-primary/10 scale-[1.02]'
                      : 'border-border/50 hover:border-primary/50 bg-gradient-to-br from-card via-card to-muted/20 dark:from-card dark:via-card dark:to-muted/30 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1'
                  }`}
                >
                  {/* Decorative gradient overlay */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors duration-300" />
                  
                  <CardHeader className="pb-4 relative">
                    <div className="flex items-start justify-between mb-3">
                      <Badge className={`${getOperadoraColor(item.Tabela)} border text-xs font-semibold shadow-sm`}>
                        {item.Tabela}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg font-mono font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {item.Servico_Codigo}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 text-sm text-muted-foreground leading-relaxed">
                      {item.Descricao}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4 relative">
                    {item.Principio_Ativo && (
                      <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1">
                          <Pill className="h-3 w-3" />
                          Princípio Ativo
                        </div>
                        <div className="text-sm font-medium text-foreground leading-relaxed">{item.Principio_Ativo}</div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-3">
                      {item.Fator && (
                        <div className="p-2.5 rounded-lg bg-muted/20 border border-border/30">
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Fator</div>
                          <div className="text-sm font-medium text-foreground">{item.Fator}</div>
                        </div>
                      )}
                      <div className={`p-2.5 rounded-lg bg-muted/20 border border-border/30 ${!item.Fator ? 'col-span-2' : ''}`}>
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Pagamento</div>
                        <div className="text-sm font-medium text-foreground">{item.Pagamento || <span className="text-muted-foreground/50">-</span>}</div>
                      </div>
                    </div>
                    
                    <div className="pt-4 mt-4 border-t-2 border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 dark:from-primary/10 dark:via-primary/20 dark:to-primary/10 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                          <DollarSign className="h-3.5 w-3.5" />
                          Valor Negociado
                        </div>
                        <div className="text-2xl font-bold text-primary group-hover:scale-105 transition-transform">
                          {formatCurrency(item.Valor)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                );
              })
            )}
          </div>
          
          {/* Sentinel para scroll infinito */}
          {tabelas.length > visibleGridCount && (
            <div ref={observerTarget} className="flex justify-center items-center py-8 mt-6">
              {loadingMore && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-sm">Carregando mais itens...</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Tabelas;
