import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuditorAuth } from '@/contexts/AuditorAuthContext';
import { AuditorService, RecursoGlosaAuditor } from '@/services/auditorService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FileText,
  Clock,
  CheckCircle,
  Search,
  Filter,
  Eye,
  Building2,
  DollarSign,
  Calendar,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import AnimatedSection from '@/components/AnimatedSection';

const AuditorRecursos = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { auditor } = useAuditorAuth();
  const [recursos, setRecursos] = useState<RecursoGlosaAuditor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'todos');

  useEffect(() => {
    loadRecursos();
  }, [statusFilter]);

  const loadRecursos = async () => {
    try {
      setLoading(true);
      const status = statusFilter === 'todos' ? undefined : statusFilter;
      const data = await AuditorService.listarRecursos(status);
      setRecursos(data);
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao carregar recursos');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; color: string }> = {
      'em_analise_auditor': { label: 'Em Análise', variant: 'default', color: 'bg-blue-500' },
      'parecer_emitido': { label: 'Parecer Emitido', variant: 'secondary', color: 'bg-green-500' },
      'solicitado_parecer': { label: 'Aguardando', variant: 'outline', color: 'bg-yellow-500' }
    };

    const badge = badges[status] || { label: status, variant: 'outline', color: 'bg-gray-500' };
    return badge;
  };

  const filteredRecursos = recursos.filter(recurso => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      recurso.numero_guia_prestador?.toLowerCase().includes(search) ||
      recurso.numero_guia_operadora?.toLowerCase().includes(search) ||
      recurso.clinica_nome?.toLowerCase().includes(search) ||
      recurso.operadora_nome?.toLowerCase().includes(search) ||
      recurso.numero_carteira?.toLowerCase().includes(search)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando recursos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 md:px-6">
      {/* Header */}
      <AnimatedSection delay={0}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Recursos de Glosas
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie e analise recursos de glosas atribuídos
            </p>
          </div>
        </div>
      </AnimatedSection>

      {/* Filters */}
      <AnimatedSection delay={100}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros e Busca
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por guia, clínica, operadora..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  <SelectItem value="em_analise_auditor">Em Análise</SelectItem>
                  <SelectItem value="parecer_emitido">Parecer Emitido</SelectItem>
                  <SelectItem value="solicitado_parecer">Aguardando</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </AnimatedSection>

      {/* Resources List */}
      {filteredRecursos.length === 0 ? (
        <AnimatedSection delay={200}>
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum recurso encontrado</h3>
              <p className="text-muted-foreground">
                {searchTerm
                  ? 'Tente ajustar os filtros de busca'
                  : 'Não há recursos atribuídos para análise'}
              </p>
            </CardContent>
          </Card>
        </AnimatedSection>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecursos.map((recurso, index) => {
            const statusBadge = getStatusBadge(recurso.status_recurso);
            return (
              <AnimatedSection key={recurso.id} delay={200 + index * 50}>
                <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group h-full flex flex-col border-l-4"
                  style={{ borderLeftColor: statusBadge.color }}
                  onClick={() => navigate(`/auditor/recursos/${recurso.id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className={`p-2.5 rounded-lg ${statusBadge.color}/10 group-hover:scale-110 transition-transform`}>
                        <FileText className={`h-5 w-5 ${statusBadge.color.replace('bg-', 'text-')}`} />
                      </div>
                      <Badge variant={statusBadge.variant as any} className="text-xs">
                        {statusBadge.label}
                      </Badge>
                    </div>
                    <CardTitle className="text-base line-clamp-1">
                      Guia {recurso.numero_guia_prestador}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Operadora: {recurso.operadora_nome}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3 flex-1 flex flex-col">
                    {/* Info */}
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground truncate text-xs">
                          {recurso.clinica_nome}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                        <span className="font-semibold text-primary text-sm">
                          R$ {parseFloat(String(recurso.valor_guia)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground text-xs">
                          Carteira: {recurso.numero_carteira}
                        </span>
                      </div>
                    </div>

                    <div className="h-px bg-border" />

                    {/* Action Button */}
                    <Button
                      className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors text-xs h-8 mt-2"
                      variant="outline"
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
    </div>
  );
};

export default AuditorRecursos;
