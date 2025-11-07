import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { OperadoraRecursosService, RecursoGlosaOperadora } from '@/services/operadoraRecursosService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Eye,
  AlertTriangle,
  Calendar,
  DollarSign,
  Building2,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AnimatedSection from '@/components/AnimatedSection';
import { formatCurrency } from '@/utils/formatCurrency';

const RecursosGlosasList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [recursos, setRecursos] = useState<RecursoGlosaOperadora[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'todos');
  const [clinicaFilter, setClinicaFilter] = useState<string>('todos');

  useEffect(() => {
    loadRecursos();
  }, [statusFilter]);

  const loadRecursos = async () => {
    try {
      setLoading(true);
      const status = statusFilter === 'todos' ? undefined : statusFilter;
      const data = await OperadoraRecursosService.listarRecursos(status);
      setRecursos(data);
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao carregar recursos');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const badges: Record<string, { label: string; color: string; icon: JSX.Element }> = {
      'pendente': { 
        label: 'Pendente', 
        color: 'bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border-amber-200 dark:border-amber-800',
        icon: <Clock className="h-4 w-4 text-amber-700 dark:text-amber-300" />
      },
      'em_analise_operadora': { 
        label: 'Em Análise', 
        color: 'bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-200 border-blue-200 dark:border-blue-800',
        icon: <Eye className="h-4 w-4 text-blue-700 dark:text-blue-300" />
      },
      'solicitado_parecer': { 
        label: 'Aguardando Parecer', 
        color: 'bg-purple-50 text-purple-900 dark:bg-purple-950 dark:text-purple-200 border-purple-200 dark:border-purple-800',
        icon: <Clock className="h-4 w-4 text-purple-700 dark:text-purple-300" />
      },
      'em_analise_auditor': { 
        label: 'Com Auditor', 
        color: 'bg-purple-50 text-purple-900 dark:bg-purple-950 dark:text-purple-200 border-purple-200 dark:border-purple-800',
        icon: <Clock className="h-4 w-4 text-purple-700 dark:text-purple-300" />
      },
      'parecer_emitido': { 
        label: 'Parecer Recebido', 
        color: 'bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-200 border-blue-200 dark:border-blue-800',
        icon: <FileText className="h-4 w-4 text-blue-700 dark:text-blue-300" />
      },
      'deferido': { 
        label: 'Deferido', 
        color: 'bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-200 border-green-200 dark:border-green-800',
        icon: <CheckCircle className="h-4 w-4 text-green-700 dark:text-green-300" />
      },
      'indeferido': { 
        label: 'Indeferido', 
        color: 'bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-200 border-red-200 dark:border-red-800',
        icon: <XCircle className="h-4 w-4 text-red-700 dark:text-red-300" />
      }
    };

    return badges[status] || { label: status, color: 'bg-gray-100 text-gray-800 border-gray-300', icon: <AlertTriangle className="h-4 w-4" /> };
  };

  const filteredRecursos = recursos.filter(recurso => {
    // Filtro de busca
    const matchSearch = !searchTerm || (() => {
      const search = searchTerm.toLowerCase();
      return (
        recurso.numero_guia_prestador?.toLowerCase().includes(search) ||
        recurso.numero_guia_operadora?.toLowerCase().includes(search) ||
        recurso.clinica_nome?.toLowerCase().includes(search) ||
        recurso.numero_carteira?.toLowerCase().includes(search)
      );
    })();

    // Filtro por clínica
    const matchClinica = clinicaFilter === 'todos' || recurso.clinica_nome === clinicaFilter;

    return matchSearch && matchClinica;
  });

  // Extrair clínicas únicas para o filtro
  const clinicas = Array.from(new Set(recursos.map(r => r.clinica_nome).filter(Boolean))).sort();

  const stats = {
    total: recursos.length,
    pendente: recursos.filter(r => r.status_recurso === 'pendente').length,
    em_analise: recursos.filter(r => ['em_analise_operadora','em_analise_auditor','solicitado_parecer','parecer_emitido'].includes(r.status_recurso as any)).length,
    solicitado_parecer: recursos.filter(r => r.status_recurso === 'solicitado_parecer').length,
    parecer_emitido: recursos.filter(r => r.status_recurso === 'parecer_emitido').length,
    deferido: recursos.filter(r => r.status_recurso === 'deferido').length,
    indeferido: recursos.filter(r => r.status_recurso === 'indeferido').length,
    valor_total: recursos.reduce((sum, r) => sum + (parseFloat(String(r.valor_guia || 0))), 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Carregando recursos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <AnimatedSection delay={100}>
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/10 p-8">
          <div className="absolute inset-0 bg-grid-white/10" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                  <FileText className="h-8 w-8 text-primary" />
                  Recursos de Glosas
                </h1>
                <p className="text-muted-foreground mt-2">
                  Gerencie os recursos de glosas recebidos das clínicas
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(stats.valor_total)}
                  </p>
                  <p className="text-sm text-muted-foreground">Valor Total em Recursos</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Estatísticas */}
      <AnimatedSection delay={200}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-2 border-border hover:border-primary/30 cursor-pointer group">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Total</p>
                  <p className="text-2xl font-bold group-hover:scale-110 transition-transform">{stats.total}</p>
                </div>
                <FileText className="h-8 w-8 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-2 border-border hover:border-yellow-500/30 cursor-pointer group" onClick={() => setStatusFilter('pendente')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Pendente</p>
                  <p className="text-2xl font-bold text-yellow-600 group-hover:scale-110 transition-transform">{stats.pendente}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600 group-hover:scale-110 transition-all" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-2 border-border hover:border-blue-500/30 cursor-pointer group" onClick={() => setStatusFilter('em_analise_operadora')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Em Análise</p>
                  <p className="text-2xl font-bold text-blue-600 group-hover:scale-110 transition-transform">{stats.em_analise}</p>
                </div>
                <Eye className="h-8 w-8 text-blue-600 group-hover:scale-110 transition-all" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-2 border-border hover:border-green-500/30 cursor-pointer group" onClick={() => setStatusFilter('deferido')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Deferido</p>
                  <p className="text-2xl font-bold text-green-600 group-hover:scale-110 transition-transform">{stats.deferido}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600 group-hover:scale-110 transition-all" />
              </div>
            </CardContent>
          </Card>
        </div>
      </AnimatedSection>

      {/* Filtros e Pesquisa */}
      <AnimatedSection delay={300}>
        <Card className="hover:shadow-lg transition-all duration-300 border-2 border-border hover:border-primary/30 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Filter className="h-5 w-5 text-primary" />
                Filtros e Pesquisa
              </CardTitle>
              {filteredRecursos.length !== recursos.length && (
                <Badge variant="secondary" className="font-medium">
                  {filteredRecursos.length} {filteredRecursos.length === 1 ? 'recurso' : 'recursos'} encontrado(s)
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Pesquisa */}
              <div className="relative group">
                <label className="block text-sm font-semibold mb-2 text-foreground flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Buscar Recursos
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                  <Input
                    type="text"
                    placeholder="Guia, clínica, carteira ou operadora..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-11 border-2 focus:border-primary transition-all duration-300 hover:border-primary/50 group"
                  />
                </div>
                {searchTerm && (
                  <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                    <Search className="h-3 w-3" />
                    {filteredRecursos.length} resultado(s) correspondente(s)
                  </p>
                )}
              </div>

              {/* Filtro de Status */}
              <div className="group">
                <label className="block text-sm font-semibold mb-2 text-foreground flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Status do Recurso
                </label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-11 border-2 group-hover:border-primary/50 transition-all duration-300">
                    <SelectValue placeholder="Selecione um status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os status</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="em_analise_operadora">Em Análise</SelectItem>
                    <SelectItem value="solicitado_parecer">Aguardando Parecer</SelectItem>
                    <SelectItem value="em_analise_auditor">Com Auditor</SelectItem>
                    <SelectItem value="parecer_emitido">Parecer Recebido</SelectItem>
                    <SelectItem value="deferido">Deferido</SelectItem>
                    <SelectItem value="indeferido">Indeferido</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por Clínica */}
              <div className="group">
                <label className="block text-sm font-semibold mb-2 text-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Clínica
                </label>
                <Select value={clinicaFilter} onValueChange={setClinicaFilter}>
                  <SelectTrigger className="h-11 border-2 group-hover:border-primary/50 transition-all duration-300">
                    <SelectValue placeholder="Selecione uma clínica" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas as Clínicas</SelectItem>
                    {clinicas.map(clinica => (
                      <SelectItem key={clinica} value={clinica}>{clinica}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </AnimatedSection>

      {/* Lista de Recursos */}
      <AnimatedSection delay={400}>
        {filteredRecursos.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">
                {searchTerm ? 'Nenhum recurso encontrado com os filtros aplicados' : 'Nenhum recurso disponível'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecursos.map((recurso, index) => {
              const config = getStatusConfig(recurso.status_recurso);

              return (
                <AnimatedSection key={recurso.id} delay={50 * (index + 1)}>
                  <Card
                    className="hover:shadow-xl transition-all duration-300 cursor-pointer group hover:-translate-y-1 border-l-4 h-full flex flex-col border-2 hover:border-primary/30"
                    style={{ borderLeftColor: config.color.includes('green') ? '#22c55e' : config.color.includes('red') ? '#ef4444' : config.color.includes('blue') ? '#3b82f6' : config.color.includes('purple') ? '#a855f7' : '#f59e0b' }}
                    onClick={() => navigate(`/operadora/recursos-glosas/${recurso.id}`)}
                  >
                    <CardHeader className="pb-3 group-hover:bg-primary/5 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className={`p-2.5 rounded-lg ${config.color} group-hover:scale-110 group-hover:shadow-md transition-all`}>
                          {config.icon}
                        </div>
                        <Badge className={`${config.color} flex items-center gap-1 text-xs group-hover:shadow-sm transition-all`}>
                          {config.label}
                        </Badge>
                      </div>
                      <CardTitle className="text-base line-clamp-1 group-hover:text-primary transition-colors">
                        Guia {recurso.numero_guia_prestador}
                      </CardTitle>
                      <CardDescription className="text-xs group-hover:text-foreground transition-colors">
                        {recurso.clinica_nome}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-3 flex-1 flex flex-col">
                      {/* Clínica e Valor */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm group-hover:translate-x-1 transition-transform duration-300">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary flex-shrink-0 transition-colors" />
                          <span className="text-muted-foreground group-hover:text-foreground truncate text-xs transition-colors">Clínica</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm group-hover:translate-x-1 transition-transform duration-300">
                          <DollarSign className="h-3.5 w-3.5 text-primary group-hover:scale-125 flex-shrink-0 transition-all" />
                          <span className="font-semibold text-primary group-hover:scale-105 text-sm transition-all">
                            {formatCurrency(recurso.valor_guia)}
                          </span>
                        </div>

                        {recurso.auditor_nome && (
                          <div className="flex items-center gap-2 text-sm group-hover:translate-x-1 transition-transform duration-300">
                            <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary flex-shrink-0 transition-colors" />
                            <span className="text-xs text-muted-foreground group-hover:text-foreground truncate transition-colors">
                              Auditor: {recurso.auditor_nome}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="h-px bg-border group-hover:bg-primary/30 transition-colors" />

                      {/* Info Footer */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1 group-hover:text-foreground transition-colors">
                          <Calendar className="h-3 w-3 group-hover:scale-110 transition-all" />
                          {format(new Date(recurso.data_envio_clinica), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                        <div className="flex items-center gap-1 group-hover:text-foreground transition-colors">
                          <FileText className="h-3 w-3 group-hover:scale-110 transition-all" />
                          {recurso.total_documentos || 0} docs
                        </div>
                      </div>

                      {/* Botão Ver Detalhes */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full mt-2 group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-md transition-all text-xs h-8 group-hover:-translate-y-0.5"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1.5 group-hover:scale-110 transition-transform" />
                        Ver Detalhes
                      </Button>
                    </CardContent>
                  </Card>
                </AnimatedSection>
              );
            })}
          </div>
        )}
      </AnimatedSection>
    </div>
  );
};

export default RecursosGlosasList;
