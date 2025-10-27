import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  FileText,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  AlertTriangle,
  Calendar,
  DollarSign,
  Loader2,
  Building2
} from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';
import AnimatedSection from '@/components/AnimatedSection';
import { authorizedFetch } from '@/services/authService';
import config from '@/config/environment';

interface RecursoGlosa {
  id: number;
  guia_id: number;
  lote_id: number;
  clinica_id: number;
  justificativa: string;
  status_recurso: 'pendente' | 'em_analise' | 'deferido' | 'indeferido';
  created_at: string;
  updated_at: string;

  // Dados da guia
  numero_guia_prestador: string;
  numero_guia_operadora: string;
  numero_carteira: string;
  valor_guia: number;

  // Dados do lote
  numero_lote: string;
  competencia: string;
  operadora_nome: string;

  // Contadores
  total_documentos: number;
  total_historico: number;
}

const RecursosGlosasList: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [recursos, setRecursos] = useState<RecursoGlosa[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [filterCompetencia, setFilterCompetencia] = useState<string>('todos');

  useEffect(() => {
    carregarRecursos();
  }, []);

  const carregarRecursos = async () => {
    setLoading(true);
    try {
      const clinicaId = user?.prestadorId || user?.clinica_id;

      if (!clinicaId) {
        console.warn('Usuário sem clinica_id/prestadorId definido');
        setRecursos([]);
        setLoading(false);
        return;
      }

      const response = await authorizedFetch(
        `${config.API_BASE_URL}/financeiro/recursos-glosas/clinica/${clinicaId}`
      );

      if (!response.ok) {
        throw new Error('Erro ao carregar recursos');
      }

      const result = await response.json();

      if (result.success && result.data) {
        console.log('📊 Recursos carregados:', result.data);
        console.log('📊 Primeiro recurso:', result.data[0]);
        setRecursos(result.data);
      } else {
        console.warn('⚠️ Nenhum recurso retornado');
        setRecursos([]);
      }

    } catch (error) {
      console.error('Erro ao carregar recursos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os recursos de glosa',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pendente':
        return {
          label: 'Pendente',
          color: 'bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border-amber-200 dark:border-amber-800',
          icon: <Clock className="h-4 w-4 text-amber-700 dark:text-amber-300" />
        };
      case 'em_analise':
        return {
          label: 'Em Análise',
          color: 'bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-200 border-blue-200 dark:border-blue-800',
          icon: <Eye className="h-4 w-4 text-blue-700 dark:text-blue-300" />
        };
      case 'deferido':
        return {
          label: 'Deferido',
          color: 'bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-200 border-green-200 dark:border-green-800',
          icon: <CheckCircle className="h-4 w-4 text-green-700 dark:text-green-300" />
        };
      case 'indeferido':
        return {
          label: 'Indeferido',
          color: 'bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-200 border-red-200 dark:border-red-800',
          icon: <XCircle className="h-4 w-4 text-red-700 dark:text-red-300" />
        };
      default:
        return {
          label: status,
          color: 'bg-gray-100 text-gray-800 border-gray-300',
          icon: <AlertTriangle className="h-4 w-4" />
        };
    }
  };

  const handleVerDetalhes = (recurso: RecursoGlosa) => {
    navigate(`/recursos-glosas/${recurso.id}`, {
      state: { recurso }
    });
  };

  // Filtrar recursos
  const recursosFiltrados = recursos.filter(recurso => {
    const matchSearch =
      recurso.numero_guia_prestador.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recurso.numero_lote.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recurso.operadora_nome.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = filterStatus === 'todos' || recurso.status_recurso === filterStatus;
    const matchCompetencia = filterCompetencia === 'todos' || recurso.competencia === filterCompetencia;

    return matchSearch && matchStatus && matchCompetencia;
  });

  // Extrair competências únicas para o filtro
  const competencias = Array.from(new Set(recursos.map(r => r.competencia))).sort().reverse();

  // Estatísticas
  const stats = {
    total: recursos.length,
    pendente: recursos.filter(r => r.status_recurso === 'pendente').length,
    em_analise: recursos.filter(r => r.status_recurso === 'em_analise').length,
    deferido: recursos.filter(r => r.status_recurso === 'deferido').length,
    indeferido: recursos.filter(r => r.status_recurso === 'indeferido').length,
    valor_total: recursos.reduce((sum, r) => sum + (parseFloat(String(r.valor_guia || 0))), 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <AnimatedSection delay={100}>
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-destructive/10 via-destructive/5 to-transparent border border-destructive/10 p-8">
          <div className="absolute inset-0 bg-grid-white/10" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                  <FileText className="h-8 w-8 text-destructive" />
                  Recursos de Glosas
                </h1>
                <p className="text-muted-foreground mt-2">
                  Acompanhe e gerencie seus recursos de glosa médica
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-2xl font-bold text-destructive">
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pendente</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pendente}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Em Análise</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.em_analise}</p>
                </div>
                <Eye className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Deferido</p>
                  <p className="text-2xl font-bold text-green-600">{stats.deferido}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Indeferido</p>
                  <p className="text-2xl font-bold text-red-600">{stats.indeferido}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </AnimatedSection>

      {/* Filtros e Pesquisa */}
      <AnimatedSection delay={300}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros e Pesquisa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Pesquisa */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar por guia, lote ou operadora..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Filtro por Status */}
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="em_analise">Em Análise</SelectItem>
                  <SelectItem value="deferido">Deferido</SelectItem>
                  <SelectItem value="indeferido">Indeferido</SelectItem>
                </SelectContent>
              </Select>

              {/* Filtro por Competência */}
              <Select value={filterCompetencia} onValueChange={setFilterCompetencia}>
                <SelectTrigger>
                  <SelectValue placeholder="Competência" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as Competências</SelectItem>
                  {competencias.map(comp => (
                    <SelectItem key={comp} value={comp}>{comp}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </AnimatedSection>

      {/* Lista de Recursos */}
      <AnimatedSection delay={400}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : recursosFiltrados.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum recurso encontrado</h3>
              <p className="text-muted-foreground">
                {recursos.length === 0
                  ? 'Você ainda não criou nenhum recurso de glosa'
                  : 'Nenhum recurso corresponde aos filtros selecionados'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recursosFiltrados.map((recurso, index) => {
              const config = getStatusConfig(recurso.status_recurso);

              return (
                <AnimatedSection key={recurso.id} delay={50 * (index + 1)}>
                  <Card
                    className="hover:shadow-xl transition-all duration-300 cursor-pointer group hover:-translate-y-1 border-l-4 h-full flex flex-col"
                    style={{ borderLeftColor: config.color.includes('green') ? '#22c55e' : config.color.includes('red') ? '#ef4444' : config.color.includes('blue') ? '#3b82f6' : '#f59e0b' }}
                    onClick={() => handleVerDetalhes(recurso)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className={`p-2.5 rounded-lg ${config.color.replace('text-', 'bg-').replace('-800', '-100')} group-hover:scale-110 transition-transform`}>
                          {config.icon}
                        </div>
                        <Badge className={`${config.color} flex items-center gap-1 text-xs`}>
                          {config.label}
                        </Badge>
                      </div>
                      <CardTitle className="text-base line-clamp-1">
                        Guia {recurso.numero_guia_prestador}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Lote {recurso.numero_lote} • {recurso.competencia}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-3 flex-1 flex flex-col">
                      {/* Operadora e Valor */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="text-muted-foreground truncate text-xs">{recurso.operadora_nome}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="h-3.5 w-3.5 text-destructive flex-shrink-0" />
                          <span className="font-semibold text-destructive text-sm">
                            {formatCurrency(recurso.valor_guia)}
                          </span>
                        </div>
                      </div>

                      <div className="h-px bg-border" />

                      {/* Justificativa Preview */}
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-1 font-medium">Justificativa:</p>
                        <p className="text-xs text-foreground line-clamp-3 leading-relaxed">
                          {recurso.justificativa}
                        </p>
                      </div>

                      <div className="h-px bg-border" />

                      {/* Footer Info */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(recurso.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {recurso.total_documentos || 0} docs
                        </div>
                      </div>

                      {/* Botão Ver Detalhes */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full mt-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors text-xs h-8"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1.5" />
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
