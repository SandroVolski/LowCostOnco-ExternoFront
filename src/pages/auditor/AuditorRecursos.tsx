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
  const [operadoraFilter, setOperadoraFilter] = useState('todas');
  const [clinicaFilter, setClinicaFilter] = useState('todas');
  const [operadorasDisponiveis, setOperadorasDisponiveis] = useState<string[]>([]);
  const [clinicasDisponiveis, setClinicasDisponiveis] = useState<string[]>([]);

  useEffect(() => {
    loadRecursos();
  }, [statusFilter]);

  const loadRecursos = async () => {
    try {
      setLoading(true);
      const status = statusFilter === 'todos' ? undefined : statusFilter;
      const data = await AuditorService.listarRecursos(status);
      setRecursos(data);

      const operadoras = Array.from(new Set(data.map(item => item.operadora_nome).filter(Boolean))) as string[];
      const clinicas = Array.from(new Set(data.map(item => item.clinica_nome).filter(Boolean))) as string[];

      setOperadorasDisponiveis(operadoras.sort((a, b) => a.localeCompare(b)));
      setClinicasDisponiveis(clinicas.sort((a, b) => a.localeCompare(b)));

      if (operadoraFilter !== 'todas' && !operadoras.includes(operadoraFilter)) {
        setOperadoraFilter('todas');
      }

      if (clinicaFilter !== 'todas' && !clinicas.includes(clinicaFilter)) {
        setClinicaFilter('todas');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao carregar recursos');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    // Define paleta coesa para todos os elementos do card
    const badges: Record<string, {
      label: string;
      barHex: string;            // barra lateral
      chipClass: string;         // Badge de status
      iconClass: string;         // cor do ícone
      iconContainerClass: string;// bg do container do ícone
    }> = {
      'em_analise_auditor': {
        label: 'Em Análise',
        barHex: '#3b82f6',
        chipClass: 'bg-blue-500/15 text-blue-600 border border-blue-500/30',
        iconClass: 'text-blue-500',
        iconContainerClass: 'bg-blue-500/10'
      },
      'parecer_emitido': {
        label: 'Parecer Emitido',
        barHex: '#22c55e',
        chipClass: 'bg-[#1f4edd]/15 text-[#1f4edd] border border-[#1f4edd]/30',
        iconClass: 'text-[#1f4edd]',
        iconContainerClass: 'bg-[#1f4edd]/10'
      },
      'solicitado_parecer': {
        label: 'Aguardando',
        barHex: '#f59e0b',
        chipClass: 'bg-amber-500/15 text-amber-600 border border-amber-500/30',
        iconClass: 'text-amber-500',
        iconContainerClass: 'bg-amber-500/10'
      }
    };

    return badges[status] || {
      label: status,
      barHex: '#6b7280',
      chipClass: 'bg-muted text-foreground border border-border',
      iconClass: 'text-muted-foreground',
      iconContainerClass: 'bg-muted/50'
    };
  };

  const filteredRecursos = recursos.filter(recurso => {
    if (operadoraFilter !== 'todas' && recurso.operadora_nome !== operadoraFilter) {
      return false;
    }

    if (clinicaFilter !== 'todas' && recurso.clinica_nome !== clinicaFilter) {
      return false;
    }

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
    <div className="space-y-6 max-w-screen-2xl mx-auto px-4 md:px-6">
      {/* Header */}
      <AnimatedSection delay={0}>
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/10 p-8">
          <div className="absolute inset-0 bg-grid-white/10" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tighter bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent flex items-center gap-3">
                  <FileText className="h-8 w-8 text-primary" />
                  Recursos de Glosas
                </h1>
                <p className="text-muted-foreground mt-2">
                  Gerencie e analise recursos de glosas atribuídos
                </p>
              </div>
            </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
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

              <Select value={operadoraFilter} onValueChange={setOperadoraFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por operadora" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as Operadoras</SelectItem>
                  {operadorasDisponiveis.map((nome) => (
                    <SelectItem key={nome} value={nome}>
                      {nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={clinicaFilter} onValueChange={setClinicaFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por clínica" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as Clínicas</SelectItem>
                  {clinicasDisponiveis.map((nome) => (
                    <SelectItem key={nome} value={nome}>
                      {nome}
                    </SelectItem>
                  ))}
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
                <Card className="relative hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group h-full flex flex-col"
                  onClick={() => navigate(`/auditor/recursos/${recurso.id}`)}
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-md" style={{ backgroundColor: statusBadge.barHex }} />
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className={`p-2.5 rounded-lg ${statusBadge.iconContainerClass} group-hover:scale-110 transition-transform`}>
                        <FileText className={`h-5 w-5 ${statusBadge.iconClass}`} />
                      </div>
                      <Badge className={`text-xs ${statusBadge.chipClass}`}>{statusBadge.label}</Badge>
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
