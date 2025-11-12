import { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuditorAuth } from '@/contexts/AuditorAuthContext';
import { AuditorService, MensagemChat, Parecer } from '@/services/auditorService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  ArrowLeft,
  FileText,
  MessageSquare,
  Send,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Save,
  User,
  Copy,
  History,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import XMLTISSDetailedViewerV2 from '@/components/XMLTISSDetailedViewerV2';
import { buildFinanceiroVisualization } from '@/utils/financeiroVisualization';
import AnimatedSection from '@/components/AnimatedSection';
import { formatCurrency } from '@/utils/formatCurrency';

const AuditorRecursoDetalhe = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { auditor } = useAuditorAuth();
  const [recurso, setRecurso] = useState<any>(null);
  const [mensagens, setMensagens] = useState<MensagemChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [enviandoMensagem, setEnviandoMensagem] = useState(false);
  const [emitindoParecer, setEmitindoParecer] = useState(false);
  const [ultimaMensagemId, setUltimaMensagemId] = useState<number | null>(null);
  const [historicoPaciente, setHistoricoPaciente] = useState<any[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  const [historicoAberto, setHistoricoAberto] = useState(false);
  const [guiaVisualizacao, setGuiaVisualizacao] = useState<any | null>(null);
  const [loadingGuia, setLoadingGuia] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Form state for parecer
  const [parecerForm, setParecerForm] = useState({
    parecer_tecnico: '',
    recomendacao: '' as 'aprovar' | 'negar' | 'solicitar_documentos' | 'parcial' | '',
    valor_recomendado: '',
    justificativa_tecnica: ''
  });

  const itensGlosadosBrutos = useMemo(() => {
    const raw = recurso?.itens_glosados;
    if (!raw) return [] as any[];

    if (Array.isArray(raw)) return raw;

    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch (err) {
        console.warn('Não foi possível parsear itens_glosados do recurso', err);
        return [];
      }
    }

    if (typeof raw === 'object') {
      return [raw];
    }

    return [] as any[];
  }, [recurso]);

  const itensGlosadosNormalizados = useMemo(() => {
    return itensGlosadosBrutos.map((item, index) => {
      // Extrair código - tentar múltiplas fontes
      const codigo = item?.codigo ?? item?.codigo_item ?? item?.codigo_procedimento ?? '';
      const codigoStr = codigo ? String(codigo).trim() : '';
      
      // Extrair descrição - tentar múltiplas fontes
      const descricao = item?.descricao ?? item?.descricao_item ?? item?.descricao_procedimento ?? '';
      const descricaoStr = descricao ? String(descricao).trim() : '';
      
      // Extrair tipo
      const tipo = (item?.tipo ?? item?.tipo_item ?? 'item').toLowerCase().trim();
      
      // Extrair ID - usar código como fallback se não tiver ID
      const idBase = item?.id ?? item?.item_id ?? (codigoStr || `glosado-${index}`);
      
      const quantidadeRaw = item?.quantidade ?? item?.quantidade_executada ?? 1;
      const valorRaw = item?.valor_total ?? item?.valor ?? 0;

      return {
        id: String(idBase),
        item_id: item?.item_id ? String(item.item_id) : undefined,
        codigo: codigoStr || undefined,
        descricao: descricaoStr,
        tipo: tipo,
        quantidade: Number.isFinite(Number(quantidadeRaw)) ? Number(quantidadeRaw) : 1,
        valor_total: Number.isFinite(Number(valorRaw)) ? Number(valorRaw) : 0,
        observacao: item?.observacao_glosa ?? item?.observacao ?? '',
      };
    });
  }, [itensGlosadosBrutos]);

  useEffect(() => {
    if (id) {
      loadRecursoDetalhes();
      loadMensagens();
    }
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [mensagens]);

  // Polling para atualizar mensagens em tempo real
  useEffect(() => {
    if (!id) return;

    const interval = setInterval(() => {
      loadMensagens();
    }, 3000); // Atualiza a cada 3 segundos

    return () => clearInterval(interval);
  }, [id]);

  const scrollToBottom = () => {
    const el = chatContainerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  };

  const loadRecursoDetalhes = async () => {
    try {
      setLoading(true);
      setGuiaVisualizacao(null);
      const data = await AuditorService.buscarRecurso(Number(id));
      setRecurso(data);
      
      // Carregar histórico do paciente se houver carteira
      if (data?.numero_carteira) {
        loadHistoricoPaciente(data.numero_carteira, data.id);
      }

      await carregarGuiaCompleta(data);
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao carregar recurso');
      navigate('/auditor/recursos');
    } finally {
      setLoading(false);
    }
  };

  const carregarGuiaCompleta = async (recursoData: any) => {
    if (!recursoData?.id || !recursoData?.lote_id) {
      setGuiaVisualizacao(null);
      return;
    }

    try {
      setLoadingGuia(true);
      const resultado = await AuditorService.getGuiaCompleta(Number(recursoData.id));

      if (!resultado || !resultado.lote || !resultado.itens) {
        setGuiaVisualizacao(null);
        return;
      }

      const { processedData } = buildFinanceiroVisualization(resultado.lote, resultado.itens);

      if (resultado.lote) {
        processedData.cabecalho = {
          ...processedData.cabecalho,
          padrao: resultado.lote.padrao_tiss || processedData.cabecalho?.padrao,
          cnes: resultado.lote.cnes || processedData.cabecalho?.cnes,
          registroANS: resultado.lote.registro_ans || processedData.cabecalho?.registroANS,
          nomePrestador: resultado.lote.nome_prestador || processedData.cabecalho?.nomePrestador,
        };

        processedData.lote = {
          ...processedData.lote,
          numeroLote: resultado.lote.numero_lote || processedData.lote?.numeroLote,
          competencia: resultado.lote.competencia || processedData.lote?.competencia,
          data_envio: resultado.lote.data_envio || processedData.lote?.data_envio,
          valor_total: resultado.lote.valor_total ?? processedData.lote?.valor_total,
        };
      }

      const numeroGuia = recursoData.numero_guia_prestador || resultado.recurso?.numero_guia_prestador;

      let guiasFiltradas = processedData.guias || [];
      if (numeroGuia) {
        const filtradasPorNumero = guiasFiltradas.filter((guia: any) => guia?.cabecalhoGuia?.numeroGuiaPrestador === numeroGuia);
        if (filtradasPorNumero.length > 0) {
          guiasFiltradas = filtradasPorNumero;
        } else if (recursoData.guia_id) {
          const filtradasPorId = guiasFiltradas.filter((guia: any) => guia?.guiaId === recursoData.guia_id);
          if (filtradasPorId.length > 0) {
            guiasFiltradas = filtradasPorId;
          }
        }
      }

      setGuiaVisualizacao({
        ...processedData,
        guias: guiasFiltradas,
      });
    } catch (error) {
      console.error('Erro ao carregar guia completa:', error);
      setGuiaVisualizacao(null);
    } finally {
      setLoadingGuia(false);
    }
  };

  const loadHistoricoPaciente = async (carteira: string, recursoAtualId: number) => {
    try {
      setLoadingHistorico(true);
      const recursos = await AuditorService.buscarHistoricoPorCarteira(carteira);
      
      // Filtrar o recurso atual e ordenar por data (mais recente primeiro)
      const historico = recursos
        .filter((r: any) => r.id !== recursoAtualId)
        .sort((a: any, b: any) => 
          new Date(b.data_envio_clinica).getTime() - new Date(a.data_envio_clinica).getTime()
        );
      
      setHistoricoPaciente(historico);
      
      // Abrir automaticamente se houver histórico
      if (historico.length > 0) {
        setHistoricoAberto(true);
      }
    } catch (error: any) {
      console.error('Erro ao carregar histórico do paciente:', error);
      // Não mostrar erro, apenas não carregar histórico
    } finally {
      setLoadingHistorico(false);
    }
  };

  const copiarParecerParaFormulario = (parecer: any) => {
    if (!parecer) {
      toast.error('Nenhum parecer encontrado para copiar');
      return;
    }

    setParecerForm({
      parecer_tecnico: parecer.parecer_tecnico || '',
      recomendacao: parecer.recomendacao || '',
      valor_recomendado: parecer.valor_recomendado ? String(parecer.valor_recomendado) : '',
      justificativa_tecnica: parecer.justificativa_tecnica || ''
    });

    toast.success('Parecer copiado para o formulário!');
    
    // Scroll para o formulário
    setTimeout(() => {
      const formElement = document.getElementById('parecer-form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const copiarParecerTexto = (parecer: any) => {
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

  const handleVerHistoricoPaciente = () => {
    if (recurso?.numero_carteira) {
      navigate('/auditor/historico-paciente', { state: { carteira: recurso.numero_carteira } });
    } else {
      navigate('/auditor/historico-paciente');
    }
  };

  const loadMensagens = async () => {
    try {
      const data = await AuditorService.listarMensagens(Number(id));
      
      // Detecta se há novas mensagens
      if (data.length > 0) {
        const ultimaMensagem = data[data.length - 1];
        if (ultimaMensagemId && ultimaMensagem.id > ultimaMensagemId) {
          // Há uma nova mensagem, scroll automático
          setTimeout(() => scrollToBottom(), 100);
        }
        setUltimaMensagemId(ultimaMensagem.id);
      }
      
      setMensagens(data);
    } catch (error: any) {
      console.error('Erro ao carregar mensagens:', error);
    }
  };

  const handleEnviarMensagem = async () => {
    if (!novaMensagem.trim()) return;

    try {
      setEnviandoMensagem(true);
      await AuditorService.enviarMensagem(Number(id), novaMensagem.trim());
      setNovaMensagem('');
      // Recarrega mensagens imediatamente após enviar
      await loadMensagens();
      toast.success('Mensagem enviada com sucesso');
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao enviar mensagem');
    } finally {
      setEnviandoMensagem(false);
    }
  };

  const handleEmitirParecer = async () => {
    if (!parecerForm.parecer_tecnico || !parecerForm.recomendacao) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setEmitindoParecer(true);

      const parecer: Parecer = {
        parecer_tecnico: parecerForm.parecer_tecnico,
        recomendacao: parecerForm.recomendacao,
        justificativa_tecnica: parecerForm.justificativa_tecnica || undefined,
        valor_recomendado: parecerForm.valor_recomendado ? parseFloat(parecerForm.valor_recomendado) : undefined
      };

      await AuditorService.emitirParecer(Number(id), parecer);
      toast.success('Parecer emitido com sucesso');
      await loadRecursoDetalhes();

      // Clear form
      setParecerForm({
        parecer_tecnico: '',
        recomendacao: '',
        valor_recomendado: '',
        justificativa_tecnica: ''
      });
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao emitir parecer');
    } finally {
      setEmitindoParecer(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      'em_analise_auditor': { label: 'Em Análise', variant: 'default' },
      'parecer_emitido': { label: 'Parecer Emitido', variant: 'secondary' }
    };

    const badge = badges[status] || { label: status, variant: 'outline' };
    return <Badge variant={badge.variant}>{badge.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Carregando detalhes...</p>
        </div>
      </div>
    );
  }

  if (!recurso) {
    return null;
  }

  const parecerJaEmitido = recurso.status_recurso === 'parecer_emitido';

  return (
    <div className="space-y-6 max-w-screen-2xl mx-auto px-4 md:px-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/10 p-6">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/auditor/recursos')}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                  <FileText className="h-8 w-8 text-primary" />
                  Recurso de Glosa
                </h1>
                <p className="text-muted-foreground mt-2">
                  Guia {recurso.numero_guia_prestador} - Análise técnica e parecer
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleVerHistoricoPaciente}
                className="flex items-center gap-2"
              >
                <History className="h-4 w-4" />
                Histórico do Paciente
              </Button>
              {getStatusBadge(recurso.status_recurso)}
            </div>
          </div>
        </div>
      </div>
      {/* Content */}
      <div className="space-y-6">
        <div className="space-y-6">
          {/* Main Content - Vertical Layout */}
          <div className="space-y-6">
            {/* Resource Info */}
            <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-2 border-border hover:border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Informações do Recurso
                </CardTitle>
                <CardDescription>Dados principais do recurso de glosa</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Clínica</Label>
                    <p className="font-medium">{recurso.clinica_nome}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Operadora</Label>
                    <p className="font-medium">{recurso.operadora_nome}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Número da Guia (Prestador)</Label>
                    <p className="font-medium">{recurso.numero_guia_prestador}</p>
                  </div>
                  {recurso.numero_guia_operadora && (
                    <div>
                      <Label className="text-muted-foreground">Número da Guia (Operadora)</Label>
                      <p className="font-medium">{recurso.numero_guia_operadora}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-muted-foreground">Carteira do Beneficiário</Label>
                    <p className="font-medium">{recurso.numero_carteira}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Valor da Guia</Label>
                    <p className="font-medium text-primary text-lg">
                      R$ {parseFloat(recurso.valor_guia).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Data de Envio</Label>
                    <p className="font-medium">
                      {format(new Date(recurso.data_envio_clinica), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </p>
                  </div>
                </div>

                {recurso.motivos_glosa && (
                  <div className="mt-4">
                    <Label className="text-muted-foreground">Motivos da Glosa</Label>
                    <div className="mt-2 p-3 bg-muted rounded-lg">
                      {(() => {
                        const raw = String(recurso.motivos_glosa || '').trim();
                        let itens: string[] = [];
                        try {
                          if (raw.startsWith('[')) {
                            const arr = JSON.parse(raw);
                            if (Array.isArray(arr)) itens = arr.map((v: any) => String(v));
                          }
                        } catch {}
                        if (itens.length === 0) {
                          itens = raw.split(/[\n;,]+/).map((s) => s.trim()).filter(Boolean);
                        }

                        if (itens.length === 0) {
                          return <p className="text-sm text-muted-foreground">Nenhum motivo informado.</p>;
                        }

                        return (
                          <div className="flex flex-wrap gap-2">
                            {itens.map((motivo, idx) => (
                              <span key={`${motivo}-${idx}`} className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-foreground">
                                <CheckCircle className="h-3.5 w-3.5 text-primary" />
                                {motivo}
                              </span>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {recurso.justificativa && (
                  <div className="mt-4">
                    <Label className="text-muted-foreground">Justificativa da Clínica</Label>
                    <div className="mt-2 p-3 bg-muted rounded-lg">
                      <p className="text-sm">{recurso.justificativa}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Documents */}
            {recurso.documentos && recurso.documentos.length > 0 && (
              <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-2 border-border hover:border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Documentos Anexados ({recurso.documentos.length})
                  </CardTitle>
                  <CardDescription>Arquivos enviados pela clínica</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {recurso.documentos.map((doc: any) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent hover:border-primary/30 hover:shadow-md transition-all duration-300 group"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-primary group-hover:scale-110 transition-transform duration-300" />
                          <div>
                            <p className="font-medium text-sm">{doc.nome_arquivo}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(doc.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="hover:bg-primary/10 hover:text-primary transition-all duration-300"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Guia Completa para Auditoria */}
            <AnimatedSection delay={180}>
              <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-2 border-border hover:border-primary/30">
                <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <CardTitle>Guia Completa para Auditoria</CardTitle>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Visualize todos os procedimentos e despesas da guia selecionada</span>
                    <Button variant="ghost" size="sm" onClick={() => recurso && carregarGuiaCompleta(recurso)}>
                      Atualizar Dados
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loadingGuia ? (
                    <div className="flex items-center justify-center py-10">
                      <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <div className="animate-spin rounded-full h-8 w-8 border-3 border-primary border-t-transparent" />
                        <span className="text-sm">Carregando dados completos da guia...</span>
                      </div>
                    </div>
                  ) : guiaVisualizacao && guiaVisualizacao.guias && guiaVisualizacao.guias.length > 0 ? (
                    <div className="rounded-xl border border-border overflow-hidden">
                      {(() => {
                        return (
                          <XMLTISSDetailedViewerV2 
                            data={guiaVisualizacao} 
                            onClose={() => {}} 
                            allowStatusActions={false} 
                            highlightedItems={itensGlosadosNormalizados} 
                          />
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground py-6 text-center">
                      Não foi possível carregar os detalhes completos da guia.
                    </div>
                  )}
                </CardContent>
              </Card>
            </AnimatedSection>

            {/* Histórico do Paciente */}
            {recurso.numero_carteira && (
              <Collapsible open={historicoAberto} onOpenChange={setHistoricoAberto}>
                <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-2 border-border hover:border-primary/30">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <History className="h-5 w-5 text-primary" />
                          <CardTitle>Histórico do Paciente</CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                          {historicoPaciente.length > 0 && (
                            <Badge variant="secondary">{historicoPaciente.length} recurso(s) anterior(es)</Badge>
                          )}
                          {historicoAberto ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                      <CardDescription>
                        Carteira: {recurso.numero_carteira} - Recursos anteriores do mesmo paciente
                      </CardDescription>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                      {loadingHistorico ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="flex flex-col items-center gap-2">
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
                            <p className="text-sm text-muted-foreground">Carregando histórico...</p>
                          </div>
                        </div>
                      ) : historicoPaciente.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Nenhum recurso anterior encontrado para este paciente</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {historicoPaciente.map((recursoAnterior) => {
                            const statusBadge = getStatusBadge(recursoAnterior.status_recurso);
                            return (
                              <div
                                key={recursoAnterior.id}
                                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <FileText className="h-4 w-4 text-primary" />
                                      <span className="font-semibold">Guia {recursoAnterior.numero_guia_prestador}</span>
                                      {statusBadge}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-2">
                                      <div>
                                        <span className="font-medium">Operadora:</span> {recursoAnterior.operadora_nome}
                                      </div>
                                      <div>
                                        <span className="font-medium">Valor:</span>{' '}
                                        <span className="text-primary font-semibold">
                                          R$ {parseFloat(String(recursoAnterior.valor_guia)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </span>
                                      </div>
                                      <div className="col-span-2">
                                        <span className="font-medium">Data:</span>{' '}
                                        {format(new Date(recursoAnterior.data_envio_clinica), "dd/MM/yyyy", { locale: ptBR })}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {recursoAnterior.parecer && (
                                  <div className="mt-3 pt-3 border-t">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                        <span className="text-sm font-semibold">Parecer Anterior</span>
                                        <Badge variant="outline" className="text-xs">
                                          {recursoAnterior.parecer.recomendacao === 'aprovar' ? 'Aprovado' :
                                           recursoAnterior.parecer.recomendacao === 'negar' ? 'Negado' :
                                           recursoAnterior.parecer.recomendacao === 'parcial' ? 'Parcial' :
                                           recursoAnterior.parecer.recomendacao}
                                        </Badge>
                                      </div>
                                      <div className="flex gap-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => copiarParecerParaFormulario(recursoAnterior.parecer)}
                                          className="text-xs h-7"
                                        >
                                          <Copy className="h-3 w-3 mr-1" />
                                          Usar no Formulário
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => copiarParecerTexto(recursoAnterior.parecer)}
                                          className="text-xs h-7"
                                        >
                                          <Copy className="h-3 w-3 mr-1" />
                                          Copiar Texto
                                        </Button>
                                      </div>
                                    </div>
                                    <div className="bg-muted/50 rounded p-3 space-y-2">
                                      <div>
                                        <p className="text-xs font-semibold text-muted-foreground mb-1">Parecer Técnico:</p>
                                        <p className="text-sm line-clamp-2 whitespace-pre-wrap">
                                          {recursoAnterior.parecer.parecer_tecnico}
                                        </p>
                                      </div>
                                      {recursoAnterior.parecer.valor_recomendado && (
                                        <div>
                                          <p className="text-xs font-semibold text-muted-foreground mb-1">Valor Recomendado:</p>
                                          <p className="text-sm font-semibold">
                                            R$ {parseFloat(String(recursoAnterior.parecer.valor_recomendado)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                          </p>
                                        </div>
                                      )}
                                      {recursoAnterior.parecer.justificativa_tecnica && (
                                        <div>
                                          <p className="text-xs font-semibold text-muted-foreground mb-1">Justificativa:</p>
                                          <p className="text-sm line-clamp-2 whitespace-pre-wrap">
                                            {recursoAnterior.parecer.justificativa_tecnica}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            )}

            {/* Parecer Form - Only if not submitted yet */}
            {!parecerJaEmitido && (
              <Card id="parecer-form" className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-2 border-border hover:border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    Emitir Parecer Técnico
                  </CardTitle>
                  <CardDescription>
                    Análise técnica do recurso de glosa
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="parecer_tecnico">Parecer Técnico *</Label>
                    <Textarea
                      id="parecer_tecnico"
                      placeholder="Descreva sua análise técnica detalhada do caso..."
                      rows={6}
                      value={parecerForm.parecer_tecnico}
                      onChange={(e) => setParecerForm({ ...parecerForm, parecer_tecnico: e.target.value })}
                      className="mt-2 border-2 hover:border-primary/50 transition-all duration-300 focus:border-primary"
                    />
                  </div>

                  <div>
                    <Label htmlFor="recomendacao">Recomendação *</Label>
                    <Select
                      value={parecerForm.recomendacao}
                      onValueChange={(value: any) => setParecerForm({ ...parecerForm, recomendacao: value })}
                    >
                      <SelectTrigger className="mt-2 border-2 hover:border-primary/50 transition-all duration-300 focus:border-primary">
                        <SelectValue placeholder="Selecione sua recomendação" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aprovar">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            Aprovar
                          </div>
                        </SelectItem>
                        <SelectItem value="negar">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-600" />
                            Negar
                          </div>
                        </SelectItem>
                        <SelectItem value="parcial">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                            Aprovação Parcial
                          </div>
                        </SelectItem>
                        <SelectItem value="solicitar_documentos">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-600" />
                            Solicitar Documentos
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {parecerForm.recomendacao === 'parcial' && (
                    <div>
                      <Label htmlFor="valor_recomendado">Valor Recomendado</Label>
                      <Input
                        id="valor_recomendado"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={parecerForm.valor_recomendado}
                        onChange={(e) => setParecerForm({ ...parecerForm, valor_recomendado: e.target.value })}
                        className="mt-2 border-2 hover:border-primary/50 transition-all duration-300 focus:border-primary"
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="justificativa_tecnica">Justificativa Técnica</Label>
                    <Textarea
                      id="justificativa_tecnica"
                      placeholder="Justifique tecnicamente sua recomendação..."
                      rows={4}
                      value={parecerForm.justificativa_tecnica}
                      onChange={(e) => setParecerForm({ ...parecerForm, justificativa_tecnica: e.target.value })}
                      className="mt-2 border-2 hover:border-primary/50 transition-all duration-300 focus:border-primary"
                    />
                  </div>

                  <Button
                    onClick={handleEmitirParecer}
                    disabled={emitindoParecer}
                    className="w-full hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                    size="lg"
                  >
                    {emitindoParecer ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent mr-2" />
                        Emitindo Parecer...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Emitir Parecer
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Parecer já emitido */}
            {parecerJaEmitido && recurso.parecer && (
              <Card className="border-green-500/50 bg-green-50/50 dark:bg-green-950/20 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-2 hover:border-green-500/70">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <CheckCircle className="h-5 w-5" />
                    Parecer Técnico Emitido
                  </CardTitle>
                  <CardDescription>
                    Emitido em {format(new Date(recurso.parecer.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground">Parecer Técnico</Label>
                    <div className="mt-2 p-3 bg-background rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{recurso.parecer.parecer_tecnico}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Recomendação</Label>
                    <div className="mt-2">
                      <Badge variant="secondary" className="text-base">
                        {recurso.parecer.recomendacao}
                      </Badge>
                    </div>
                  </div>
                  {recurso.parecer.justificativa_tecnica && (
                    <div>
                      <Label className="text-muted-foreground">Justificativa Técnica</Label>
                      <div className="mt-2 p-3 bg-background rounded-lg">
                        <p className="text-sm whitespace-pre-wrap">{recurso.parecer.justificativa_tecnica}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Chat Section - Moved to bottom */}
          <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-2 border-border hover:border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Chat com Operadora
              </CardTitle>
              <CardDescription>
                Comunicação exclusiva auditor-operadora
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Messages */}
              <div ref={chatContainerRef} className="max-h-[400px] overflow-y-auto space-y-3 p-4 border rounded-lg bg-muted/30">
                  {mensagens.length === 0 ? (
                    <div className="text-center text-muted-foreground text-sm py-8">
                      Nenhuma mensagem ainda
                    </div>
                  ) : (
                    mensagens.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.tipo_remetente === 'auditor' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-3 py-2 ${
                            msg.tipo_remetente === 'auditor'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-xs font-medium mb-1">{msg.remetente_nome}</p>
                          <p className="text-sm whitespace-pre-wrap">{msg.mensagem}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {format(new Date(msg.created_at), 'dd/MM', { locale: ptBR })} {(() => {
                              const v = msg.created_at as string;
                              const parseToUTCDate = (value: string): Date => {
                                if (!value) return new Date();
                                if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(value)) return new Date(value);
                                const m = value.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
                                if (m) {
                                  const [, y, mo, d, h, mi, s] = m;
                                  return new Date(Date.UTC(Number(y), Number(mo)-1, Number(d), Number(h), Number(mi), Number(s||'0')));
                                }
                                return new Date(value);
                              };
                              return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Sao_Paulo' }).format(parseToUTCDate(v));
                            })()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  
                  {/* Indicador de envio */}
                  {enviandoMensagem && (
                    <div className="flex justify-end">
                      <div className="bg-primary/20 text-primary rounded-lg px-3 py-2 flex items-center gap-2">
                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-primary border-t-transparent" />
                        <span className="text-xs">Enviando...</span>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Digite sua mensagem..."
                  value={novaMensagem}
                  onChange={(e) => setNovaMensagem(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleEnviarMensagem();
                    }
                  }}
                  disabled={enviandoMensagem}
                  className="border-2 hover:border-primary/50 transition-all duration-300 focus:border-primary"
                />
                <Button
                  onClick={handleEnviarMensagem}
                  disabled={enviandoMensagem || !novaMensagem.trim()}
                  size="icon"
                  className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AuditorRecursoDetalhe;
