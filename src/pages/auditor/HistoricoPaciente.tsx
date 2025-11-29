import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuditorAuth } from '@/contexts/AuditorAuthContext';
import { AuditorService, PacienteAuditorResumo } from '@/services/auditorService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  FileText,
  Search,
  Copy,
  Calendar,
  Building2,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Loader2,
  User,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AnimatedSection from '@/components/AnimatedSection';

interface RecursoHistorico {
  id: number;
  numero_guia_prestador: string;
  numero_guia_operadora: string;
  clinica_nome: string;
  operadora_nome: string;
  valor_guia: number;
  status_recurso: string;
  data_envio_clinica: string;
  parecer?: {
    parecer_tecnico: string;
    recomendacao: string;
    valor_recomendado?: number;
    justificativa_tecnica?: string;
    data_emissao: string;
  };
}

const HistoricoPaciente = () => {
  const navigate = useNavigate();
  const { auditor } = useAuditorAuth();
  const location = useLocation();
  const [carteira, setCarteira] = useState('');
  const [loading, setLoading] = useState(false);
  const [recursos, setRecursos] = useState<RecursoHistorico[]>([]);
  const [recursosAnteriores, setRecursosAnteriores] = useState<RecursoHistorico[]>([]);
  const [pacientesAtendidos, setPacientesAtendidos] = useState<PacienteAuditorResumo[]>([]);
  const [pacientesVisiveis, setPacientesVisiveis] = useState<PacienteAuditorResumo[]>([]);
  const [loadingPacientes, setLoadingPacientes] = useState(true);
  const [carregandoMaisPacientes, setCarregandoMaisPacientes] = useState(false);
  const [pacienteSelecionado, setPacienteSelecionado] = useState<PacienteAuditorResumo | null>(null);
  const pacientesOffsetRef = useRef(0);
  const recursosEncontradosRef = useRef<HTMLDivElement>(null);

  const PACIENTES_POR_LOTE = 15;

  const buscarHistorico = async (carteiraBusca?: string, paciente?: PacienteAuditorResumo) => {
    const carteiraValor = carteiraBusca !== undefined ? carteiraBusca : carteira;

    if (!carteiraValor.trim()) {
      toast.error('Por favor, informe o número da carteira');
      return;
    }

    try {
      setLoading(true);
      
      // Definir paciente selecionado se fornecido
      if (paciente) {
        setPacienteSelecionado(paciente);
      }
      // Buscar histórico por carteira
      const recursosEncontrados = await AuditorService.buscarHistoricoPorCarteira(carteiraValor);
      
      // Ordenar por data (mais recente primeiro)
      const ordenados = recursosEncontrados.sort((a, b) => 
        new Date(b.data_envio_clinica).getTime() - new Date(a.data_envio_clinica).getTime()
      );
      
      // Os recursos já vêm com parecer_anterior do backend
      setRecursos(ordenados);
      
      if (ordenados.length === 0) {
        toast.info('Nenhum recurso encontrado para esta carteira');
      } else {
        toast.success(`${ordenados.length} recurso(s) encontrado(s)`);
        
        // Scroll suave até a seção de recursos após um pequeno delay
        setTimeout(() => {
          recursosEncontradosRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }, 300);
      }
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao buscar histórico');
      setRecursos([]);
    } finally {
      setLoading(false);
    }
  };

  const copiarParecer = (parecer: any) => {
    if (!parecer) {
      toast.error('Nenhum parecer encontrado para copiar');
      return;
    }

    const textoParecer = `
PARECER TÉCNICO:
${parecer.parecer_tecnico || ''}

RECOMENDAÇÃO: ${parecer.recomendacao || ''}
${parecer.valor_recomendado ? `VALOR RECOMENDADO: R$ ${parseFloat(String(parecer.valor_recomendado)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}

JUSTIFICATIVA TÉCNICA:
${parecer.justificativa_tecnica || ''}
`.trim();

    navigator.clipboard.writeText(textoParecer).then(() => {
      toast.success('Parecer copiado para a área de transferência!');
    }).catch(() => {
      toast.error('Erro ao copiar parecer');
    });
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; variant: any; color: string }> = {
      'deferido': { label: 'Deferido', variant: 'default', color: 'bg-[#1f4edd]/15 text-[#1f4edd] border-[#1f4edd]/30' },
      'indeferido': { label: 'Indeferido', variant: 'destructive', color: 'bg-red-500/15 text-red-600 border-red-500/30' },
      'parecer_emitido': { label: 'Parecer Emitido', variant: 'secondary', color: 'bg-blue-500/15 text-blue-600 border-blue-500/30' },
      'em_analise_auditor': { label: 'Em Análise', variant: 'default', color: 'bg-amber-500/15 text-amber-600 border-amber-500/30' },
      'pendente': { label: 'Pendente', variant: 'outline', color: 'bg-gray-500/15 text-gray-600 border-gray-500/30' }
    };

    return badges[status] || { label: status, variant: 'outline', color: 'bg-muted text-foreground border-border' };
  };

  useEffect(() => {
    const carregarPacientes = async () => {
      try {
        setLoadingPacientes(true);
        const lista = await AuditorService.listarPacientes();
        setPacientesAtendidos(lista);
        pacientesOffsetRef.current = PACIENTES_POR_LOTE;
        setPacientesVisiveis(lista.slice(0, PACIENTES_POR_LOTE));
      } catch (error: any) {
        console.error('Erro ao listar pacientes:', error);
      } finally {
        setLoadingPacientes(false);
      }
    };

    carregarPacientes();

    const stateCarteira = (location.state as any)?.carteira;
    if (stateCarteira) {
      setCarteira(stateCarteira);
      buscarHistorico(stateCarteira);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const carregarMaisPacientes = () => {
    if (carregandoMaisPacientes) return;
    setCarregandoMaisPacientes(true);
    const start = pacientesOffsetRef.current;
    const end = start + PACIENTES_POR_LOTE;
    const novos = pacientesAtendidos.slice(start, end);
    setPacientesVisiveis(prev => [...prev, ...novos]);
    pacientesOffsetRef.current = end;
    setCarregandoMaisPacientes(false);
  };

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
                  <User className="h-8 w-8 text-primary" />
                  Histórico do Paciente
                </h1>
                <p className="text-muted-foreground mt-2">
                  Busque recursos anteriores de um paciente usando o número da carteira
                </p>
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Busca */}
      <AnimatedSection delay={100}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Buscar por Carteira
            </CardTitle>
            <CardDescription>
              Informe o número da carteira do paciente para visualizar todos os recursos anteriores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Digite o número da carteira..."
                  value={carteira}
                  onChange={(e) => {
                    setCarteira(e.target.value);
                    // Limpar seleção ao editar manualmente
                    if (pacienteSelecionado) {
                      setPacienteSelecionado(null);
                    }
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      buscarHistorico();
                    }
                  }}
                  className="text-lg"
                />
              </div>
              <Button
                onClick={() => {
                  setPacienteSelecionado(null);
                  buscarHistorico();
                }}
                disabled={loading || !carteira.trim()}
                className="min-w-[120px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Buscar
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </AnimatedSection>

      {/* Pacientes atendidos recentemente */}
      <AnimatedSection delay={150}>
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Pacientes já atendidos
                </CardTitle>
                <CardDescription>
                  Selecione um paciente para carregar automaticamente o histórico
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingPacientes ? (
              <div className="flex items-center justify-center py-10">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="text-sm">Carregando pacientes atendidos...</span>
                </div>
              </div>
            ) : pacientesVisiveis.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum paciente encontrado. Os pacientes que você analisar aparecerão aqui automaticamente.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {pacientesVisiveis.map((paciente) => {
                  const isSelected = pacienteSelecionado?.numero_carteira === paciente.numero_carteira;
                  return (
                  <Card
                    key={`${paciente.numero_carteira}-${paciente.ultimo_recurso}`}
                    className={`border-2 transition-all duration-300 cursor-pointer relative ${
                      isSelected 
                        ? 'border-primary bg-primary/5 shadow-lg scale-[1.02]' 
                        : 'hover:border-primary/40 hover:shadow-md'
                    }`}
                    onClick={() => {
                      setCarteira(paciente.numero_carteira);
                      buscarHistorico(paciente.numero_carteira, paciente);
                    }}
                  >
                    {/* Indicador de seleção com linha conectora */}
                    {isSelected && (
                      <>
                        {/* Linha vertical que se estende para baixo */}
                        <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 z-10">
                          <div className="flex flex-col items-center">
                            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg animate-bounce">
                              <svg className="w-4 h-4 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                              </svg>
                            </div>
                          </div>
                        </div>
                        {/* Linha conectora que vai até os recursos */}
                        <div 
                          className="absolute left-1/2 transform -translate-x-1/2 pointer-events-none"
                          style={{
                            top: '100%',
                            height: 'calc(100vh)',
                            zIndex: 5
                          }}
                        >
                          <div className="w-0.5 h-full bg-gradient-to-b from-primary via-primary/60 to-transparent animate-pulse"></div>
                        </div>
                      </>
                    )}
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {paciente.beneficiario_nome || 'Paciente sem nome informado'}
                          </p>
                          <p className="text-xs text-muted-foreground">Carteira: {paciente.numero_carteira}</p>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs text-muted-foreground">
                        {paciente.clinica_nome && (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-3 w-3" />
                            <span>{paciente.clinica_nome}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <FileText className="h-3 w-3" />
                          <span>{paciente.total_recursos} recurso(s) analisado(s)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          <span>
                            Último: {format(new Date(paciente.ultimo_recurso), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                      </div>

                      <Button 
                        variant={isSelected ? "default" : "outline"} 
                        size="sm" 
                        className="w-full text-xs"
                      >
                        {isSelected ? (
                          <>
                            <Eye className="h-3 w-3 mr-1" />
                            Visualizando
                          </>
                        ) : (
                          'Visualizar histórico'
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                  );
                })}
              </div>
            )}

            {pacientesVisiveis.length < pacientesAtendidos.length && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={carregandoMaisPacientes}
                  onClick={carregarMaisPacientes}
                >
                  {carregandoMaisPacientes ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Carregando...
                    </>
                  ) : (
                    'Carregar mais pacientes'
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </AnimatedSection>

      {/* Resultados */}
      {recursos.length > 0 && (
        <AnimatedSection delay={200}>
          <div ref={recursosEncontradosRef} className="scroll-mt-6 relative">
            <Card className="border-2 border-primary shadow-xl relative overflow-hidden">
              {/* Barra superior animada */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/70 to-primary animate-pulse"></div>
              
              <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b">
                {pacienteSelecionado && (
                  <div className="mb-4 flex items-center gap-3 p-3 bg-white dark:bg-gray-900 rounded-lg border border-primary/20">
                    <div className="p-2 rounded-full bg-primary/20">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">
                        {pacienteSelecionado.beneficiario_nome || 'Paciente sem nome'}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>Carteira: {pacienteSelecionado.numero_carteira}</span>
                        {pacienteSelecionado.clinica_nome && (
                          <>
                            <span>•</span>
                            <span>{pacienteSelecionado.clinica_nome}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      {pacienteSelecionado.total_recursos} recurso(s)
                    </Badge>
                  </div>
                )}
                
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Recursos Encontrados ({recursos.length})
                </CardTitle>
                <CardDescription>
                  Histórico completo de recursos para a carteira: <strong>{carteira}</strong>
                </CardDescription>
              </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recursos.map((recurso, index) => {
                  const statusBadge = getStatusBadge(recurso.status_recurso);
                  return (
                    <Card
                      key={recurso.id}
                      className="border-2 hover:border-primary/50 transition-all duration-300"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="p-2 bg-primary/10 rounded-lg">
                                <FileText className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <h3 className="text-lg font-bold">
                                  Guia {recurso.numero_guia_prestador}
                                </h3>
                                {recurso.numero_guia_operadora && (
                                  <p className="text-sm text-muted-foreground">
                                    Guia Operadora: {recurso.numero_guia_operadora}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          <Badge className={statusBadge.color}>
                            {statusBadge.label}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Clínica</p>
                              <p className="text-sm font-medium">{recurso.clinica_nome}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Operadora</p>
                              <p className="text-sm font-medium">{recurso.operadora_nome}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-primary" />
                            <div>
                              <p className="text-xs text-muted-foreground">Valor</p>
                              <p className="text-sm font-semibold text-primary">
                                R$ {parseFloat(String(recurso.valor_guia)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mb-4">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            Enviado em: {format(new Date(recurso.data_envio_clinica), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </span>
                        </div>

                        {recurso.parecer && (
                          <div className="border-t pt-4 mt-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Parecer Técnico Anterior
                              </h4>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copiarParecer(recurso.parecer)}
                                className="gap-2"
                              >
                                <Copy className="h-3.5 w-3.5" />
                                Copiar Parecer
                              </Button>
                            </div>
                            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground mb-1">Recomendação:</p>
                                <Badge variant={recurso.parecer.recomendacao === 'aprovar' ? 'default' : 'destructive'}>
                                  {recurso.parecer.recomendacao === 'aprovar' ? 'Aprovar' :
                                   recurso.parecer.recomendacao === 'negar' ? 'Negar' :
                                   recurso.parecer.recomendacao === 'parcial' ? 'Parcial' :
                                   recurso.parecer.recomendacao}
                                </Badge>
                              </div>
                              {recurso.parecer.valor_recomendado && (
                                <div>
                                  <p className="text-xs font-semibold text-muted-foreground mb-1">Valor Recomendado:</p>
                                  <p className="text-sm font-semibold">
                                    R$ {parseFloat(String(recurso.parecer.valor_recomendado)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </p>
                                </div>
                              )}
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground mb-1">Parecer Técnico:</p>
                                <p className="text-sm whitespace-pre-wrap line-clamp-3">
                                  {recurso.parecer.parecer_tecnico}
                                </p>
                              </div>
                              {recurso.parecer.justificativa_tecnica && (
                                <div>
                                  <p className="text-xs font-semibold text-muted-foreground mb-1">Justificativa:</p>
                                  <p className="text-sm whitespace-pre-wrap line-clamp-2">
                                    {recurso.parecer.justificativa_tecnica}
                                  </p>
                                </div>
                              )}
                              <p className="text-xs text-muted-foreground mt-2">
                                Emitido em: {format(new Date(recurso.parecer.data_emissao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/auditor/recursos/${recurso.id}`)}
                            className="flex-1"
                          >
                            <Eye className="h-3.5 w-3.5 mr-2" />
                            Ver Detalhes
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
            </Card>
          </div>
        </AnimatedSection>
      )}

      {recursos.length === 0 && !loading && carteira && (
        <AnimatedSection delay={200}>
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum recurso encontrado</h3>
              <p className="text-muted-foreground">
                Não foram encontrados recursos para a carteira informada
              </p>
            </CardContent>
          </Card>
        </AnimatedSection>
      )}
    </div>
  );
};

export default HistoricoPaciente;

