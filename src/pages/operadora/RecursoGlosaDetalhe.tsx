import { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { OperadoraRecursosService, AuditorInfo } from '@/services/operadoraRecursosService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import TimelineCard from '@/components/TimelineCard';
import AnimatedSection from '@/components/AnimatedSection';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  ArrowLeft,
  FileText,
  MessageSquare,
  Send,
  Download,
  CheckCircle,
  XCircle,
  UserCog,
  AlertCircle,
  AlertTriangle,
  Clock,
  Eye,
  Inbox
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const RecursoGlosaDetalhe = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [recurso, setRecurso] = useState<any>(null);
  const [mensagens, setMensagens] = useState<any[]>([]);
  const [auditores, setAuditores] = useState<AuditorInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [enviandoMensagem, setEnviandoMensagem] = useState(false);
  const [ultimaMensagemId, setUltimaMensagemId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Dialog states
  const [showAprovarDialog, setShowAprovarDialog] = useState(false);
  const [showNegarDialog, setShowNegarDialog] = useState(false);
  const [showSolicitarParecerDialog, setShowSolicitarParecerDialog] = useState(false);

  // Form states
  const [observacaoAprovacao, setObservacaoAprovacao] = useState('');
  const [motivoNegacao, setMotivoNegacao] = useState('');
  const [auditorSelecionado, setAuditorSelecionado] = useState('');
  const [observacaoParecer, setObservacaoParecer] = useState('');
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    if (id) {
      loadRecursoDetalhes();
      loadMensagens();
      loadAuditores();
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
      const data = await OperadoraRecursosService.buscarRecurso(Number(id));
      // Normalizar estrutura: alguns endpoints retornam array de pareceres
      const normalized = {
        ...data,
        parecer: data?.parecer || (Array.isArray(data?.pareceres) && data.pareceres.length > 0 ? data.pareceres[0] : undefined)
      };
      setRecurso(normalized);

      // Marcar como recebido se ainda estiver pendente
      if (data.status_recurso === 'pendente') {
        await OperadoraRecursosService.receberRecurso(Number(id));
        // Recarregar para atualizar status
        const updatedData = await OperadoraRecursosService.buscarRecurso(Number(id));
        setRecurso({
          ...updatedData,
          parecer: updatedData?.parecer || (Array.isArray(updatedData?.pareceres) && updatedData.pareceres.length > 0 ? updatedData.pareceres[0] : undefined)
        });
      }
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao carregar recurso');
      navigate('/operadora/recursos-glosas');
    } finally {
      setLoading(false);
    }
  };

  const loadMensagens = async () => {
    try {
      const data = await OperadoraRecursosService.listarMensagens(Number(id));
      
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

  const loadAuditores = async () => {
    try {
      const data = await OperadoraRecursosService.listarAuditores();
      setAuditores(data);
    } catch (error: any) {
      console.error('Erro ao carregar auditores:', error);
    }
  };

  const handleEnviarMensagem = async () => {
    if (!novaMensagem.trim()) return;

    try {
      setEnviandoMensagem(true);
      await OperadoraRecursosService.enviarMensagem(Number(id), novaMensagem.trim());
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

  const handleAprovar = async () => {
    try {
      setProcessando(true);
      await OperadoraRecursosService.aprovarRecurso(Number(id), observacaoAprovacao);
      toast.success('Recurso aprovado com sucesso');
      setShowAprovarDialog(false);
      await loadRecursoDetalhes();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao aprovar recurso');
    } finally {
      setProcessando(false);
    }
  };

  const handleNegar = async () => {
    if (!motivoNegacao.trim()) {
      toast.error('Informe o motivo da negação');
      return;
    }

    try {
      setProcessando(true);
      await OperadoraRecursosService.negarRecurso(Number(id), motivoNegacao);
      toast.success('Recurso negado');
      setShowNegarDialog(false);
      await loadRecursoDetalhes();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao negar recurso');
    } finally {
      setProcessando(false);
    }
  };

  const handleSolicitarParecer = async () => {
    if (!auditorSelecionado) {
      toast.error('Selecione um auditor');
      return;
    }

    try {
      setProcessando(true);
      await OperadoraRecursosService.solicitarParecer(
        Number(id),
        Number(auditorSelecionado),
        observacaoParecer
      );
      toast.success('Parecer solicitado com sucesso');
      setShowSolicitarParecerDialog(false);
      await loadRecursoDetalhes();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao solicitar parecer');
    } finally {
      setProcessando(false);
    }
  };

  const timelineItems = useMemo(() => {
    if (!Array.isArray(recurso?.historico)) {
      return [] as any[];
    }

    const parseDateToMillis = (value: any) => {
      if (!value) return 0;
      if (value instanceof Date) return value.getTime();
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const cleaned = value.replace(' ', 'T');
        const date = new Date(cleaned);
        if (!Number.isNaN(date.getTime())) {
          return date.getTime();
        }
        const match = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
        if (match) {
          const [, y, mo, d, h, mi, s] = match;
          return Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s || '0'));
        }
      }
      return 0;
    };

    const normalizados = recurso.historico
      .map((item: any) => ({
        ...item,
        data: item?.data || item?.created_at || item?.updated_at || null,
        status: item?.status || item?.acao || 'registro',
        observacao: item?.observacao || item?.descricao || item?.detalhes || '',
      }))
      .filter((item: any) => item.data && item.status)
      .sort((a: any, b: any) => parseDateToMillis(a.data) - parseDateToMillis(b.data));

    const seen = new Set<string>();
    const deduped = [] as any[];
    for (const item of normalizados) {
      const key = `${item.status}-${item.data}-${item.observacao}`;
      if (!seen.has(key)) {
        deduped.push(item);
        seen.add(key);
      }
    }

    return deduped;
  }, [recurso?.historico]);

  const getStatusBadge = (status: string) => {
    const badges = {
      'pendente': { label: 'Pendente', variant: 'outline' },
      'em_analise_operadora': { label: 'Em Análise', variant: 'default' },
      'solicitado_parecer': { label: 'Aguardando Parecer', variant: 'secondary' },
      'em_analise_auditor': { label: 'Com Auditor', variant: 'secondary' },
      'parecer_emitido': { label: 'Parecer Recebido', variant: 'default' },
      'deferido': { label: 'Deferido', variant: 'secondary' },
      'indeferido': { label: 'Indeferido', variant: 'destructive' }
    };

    const badge = badges[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={badge.variant}>{badge.label}</Badge>;
  };

  const getTimelineStatusConfig = (status: string) => {
    switch (status) {
      case 'recebido':
      case 'recebido_operadora':
        return {
          label: 'Recurso Recebido',
          color: 'bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-200 border-slate-200 dark:border-slate-800',
          icon: <Inbox className="h-4 w-4 text-slate-700 dark:text-slate-300" />,
          description: 'O recurso foi recebido e registrado pela operadora para início da triagem técnica.'
        };
      case 'pendente':
        return {
          label: 'Pendente',
          color: 'bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border-amber-200 dark:border-amber-800',
          icon: <Clock className="h-4 w-4 text-amber-700 dark:text-amber-300" />,
          description: 'Seu recurso foi enviado e está aguardando a triagem inicial da operadora. Assim que a análise começar, você verá a atualização automaticamente nesta linha do tempo.'
        };
      case 'em_analise':
        return {
          label: 'Em Análise',
          color: 'bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-200 border-blue-200 dark:border-blue-800',
          icon: <Eye className="h-4 w-4 text-blue-700 dark:text-blue-300" />,
          description: 'A operadora está avaliando os documentos e as justificativas apresentadas. Caso necessário, poderemos solicitar complementação de informações antes da decisão final.'
        };
      case 'em_analise_operadora':
        return {
          label: 'Em Análise (Operadora)',
          color: 'bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-200 border-blue-200 dark:border-blue-800',
          icon: <Eye className="h-4 w-4 text-blue-700 dark:text-blue-300" />,
          description: 'A operadora iniciou a análise técnica do recurso. Aguarde a emissão do parecer ou eventuais solicitações de complementação.'
        };
      case 'solicitado_parecer':
        return {
          label: 'Aguardando Parecer',
          color: 'bg-purple-50 text-purple-900 dark:bg-purple-950 dark:text-purple-200 border-purple-200 dark:border-purple-800',
          icon: <Clock className="h-4 w-4 text-purple-700 dark:text-purple-300" />,
          description: 'Parecer solicitado ao auditor técnico.'
        };
      case 'em_analise_auditor':
        return {
          label: 'Em Análise (Auditor)',
          color: 'bg-cyan-50 text-cyan-900 dark:bg-cyan-950 dark:text-cyan-200 border-cyan-200 dark:border-cyan-800',
          icon: <Eye className="h-4 w-4 text-cyan-700 dark:text-cyan-300" />,
          description: 'O caso está com o auditor técnico para emissão de parecer. Você será notificado quando houver atualização.'
        };
      case 'parecer_emitido':
        return {
          label: 'Parecer Emitido',
          color: 'bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-200 border-green-200 dark:border-green-800',
          icon: <CheckCircle className="h-4 w-4 text-green-700 dark:text-green-300" />,
          description: 'O parecer técnico foi emitido. Em breve a operadora finalizará o fluxo com a decisão e próximos passos.'
        };
      case 'deferido':
        return {
          label: 'Deferido',
          color: 'bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-200 border-green-200 dark:border-green-800',
          icon: <CheckCircle className="h-4 w-4 text-green-700 dark:text-green-300" />,
          description: 'Recurso aceito pela operadora. Os valores deferidos serão programados para pagamento conforme as regras contratuais.'
        };
      case 'indeferido':
        return {
          label: 'Indeferido',
          color: 'bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-200 border-red-200 dark:border-red-800',
          icon: <XCircle className="h-4 w-4 text-red-700 dark:text-red-300" />,
          description: 'Recurso negado pela operadora. Verifique as observações para entender o motivo do indeferimento e avaliar reenvio ou contestação.'
        };
      case 'complemento_solicitado':
        return {
          label: 'Complemento Solicitado',
          color: 'bg-orange-50 text-orange-900 dark:bg-orange-950 dark:text-orange-200 border-orange-200 dark:border-orange-800',
          icon: <AlertCircle className="h-4 w-4 text-orange-700 dark:text-orange-300" />,
          description: 'Foi solicitada documentação complementar para continuidade da análise técnica.'
        };
      case 'complemento_recebido':
        return {
          label: 'Complemento Recebido',
          color: 'bg-teal-50 text-teal-900 dark:bg-teal-950 dark:text-teal-200 border-teal-200 dark:border-teal-800',
          icon: <Inbox className="h-4 w-4 text-teal-700 dark:text-teal-300" />,
          description: 'A documentação complementar foi recebida e anexada ao processo.'
        };
      case 'finalizado':
        return {
          label: 'Fluxo Finalizado',
          color: 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800',
          icon: <CheckCircle className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />,
          description: 'O recurso foi finalizado pela operadora. Os encaminhamentos financeiros serão executados conforme decisão.'
        };
      case 'enviado':
        return {
          label: 'Recurso Enviado',
          color: 'bg-sky-50 text-sky-900 dark:bg-sky-950 dark:text-sky-200 border-sky-200 dark:border-sky-800',
          icon: <Send className="h-4 w-4 text-sky-700 dark:text-sky-300" />,
          description: 'O recurso foi encaminhado para a operadora e inicia o fluxo de triagem.'
        };
      default:
        return {
          label: status
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (match) => match.toUpperCase()),
          color: 'bg-muted text-muted-foreground border-border',
          icon: <AlertCircle className="h-4 w-4 text-muted-foreground" />,
          description: 'Atualização registrada no histórico do recurso.'
        };
    }
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

  const podeAprovarOuNegar = ['em_analise_operadora', 'parecer_emitido'].includes(recurso.status_recurso);
  const podeSolicitarParecer = recurso.status_recurso === 'em_analise_operadora';
  // Exibir o bloco de parecer sempre que o status indicar que já foi emitido,
  // mesmo que o objeto ainda não esteja populado (backend pode enviar depois)
  const temParecer = Boolean(recurso.parecer) || recurso.status_recurso === 'parecer_emitido';

  // Trata strings vindas do MySQL ("YYYY-MM-DD HH:mm:ss") como UTC
  const parseToUTCDate = (value: string): Date => {
    if (!value) return new Date();
    // Se já vier com timezone/"Z", delega para o Date nativo
    if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(value)) {
      return new Date(value);
    }
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
    if (match) {
      const [, y, mo, d, h, mi, s] = match;
      return new Date(Date.UTC(
        Number(y),
        Number(mo) - 1,
        Number(d),
        Number(h),
        Number(mi),
        Number(s || '0')
      ));
    }
    return new Date(value);
  };

  const formatTimeBR = (dateString: string) => {
    const d = parseToUTCDate(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'America/Sao_Paulo',
    }).format(d);
  };

  return (
    <>
    <div className="space-y-6 max-w-screen-2xl mx-auto px-4 md:px-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl border-2 border-border/60 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 shadow-sm">
        {/* Decor */}
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="absolute -left-10 -top-10 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
        <div className="absolute -right-10 -bottom-10 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />

        <div className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/operadora/recursos-glosas')}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    Recurso de Glosa
                  </h1>
                </div>
                <p className="text-sm md:text-base text-muted-foreground">
                  Guia {recurso.numero_guia_prestador} • Análise e decisão sobre recurso
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge(recurso.status_recurso)}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* Action Buttons */}
        {podeAprovarOuNegar && (
              <Card>
                <CardHeader>
                  <CardTitle>Ações</CardTitle>
                  <CardDescription>Escolha uma ação para este recurso</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => setShowAprovarDialog(true)}
                    className="flex-1 min-w-[150px]"
                    variant="default"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Aprovar / Deferir
                  </Button>
                  <Button
                    onClick={() => setShowNegarDialog(true)}
                    className="flex-1 min-w-[150px]"
                    variant="destructive"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Negar / Indeferir
                  </Button>
                  {podeSolicitarParecer && (
                    <Button
                      onClick={() => setShowSolicitarParecerDialog(true)}
                      className="flex-1 min-w-[150px]"
                      variant="outline"
                    >
                      <UserCog className="h-4 w-4 mr-2" />
                      Solicitar Parecer
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Resource Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informações do Recurso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Clínica</Label>
                    <p className="font-medium">{recurso.clinica_nome}</p>
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
                            if (Array.isArray(arr)) itens = arr.map((v) => String(v));
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
                              <span
                                key={`${motivo}-${idx}`}
                                className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-foreground"
                              >
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Documentos Anexados ({recurso.documentos.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {recurso.documentos.map((doc: any) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium text-sm">{doc.nome_arquivo}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(doc.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Parecer do Auditor */}
            {temParecer && (
              <Card className="border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20 hover:shadow-lg transition-all">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                    <UserCog className="h-5 w-5" />
                    Parecer Técnico do Auditor
                  </CardTitle>
                  <CardDescription>
                    {recurso?.parecer?.auditor_nome
                      ? <>Emitido por {recurso.parecer.auditor_nome} em {format(new Date(recurso.parecer.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</>
                      : 'Parecer recebido. Detalhes técnicos abaixo.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground">Parecer Técnico</Label>
                    <div className="mt-2 p-3 bg-background rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">
                        {recurso?.parecer?.parecer_tecnico || 'O parecer técnico foi emitido pelo auditor. Caso os detalhes ainda não apareçam, aguarde alguns instantes ou atualize os dados do recurso.'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Recomendação</Label>
                    <div className="mt-2">
                      <Badge variant="secondary" className="text-base">
                        {recurso?.parecer?.recomendacao || '—'}
                      </Badge>
                    </div>
                  </div>
                  {recurso?.parecer?.justificativa_tecnica && (
                    <div>
                      <Label className="text-muted-foreground">Justificativa Técnica</Label>
                      <div className="mt-2 p-3 bg-background rounded-lg">
                        <p className="text-sm whitespace-pre-wrap">{recurso.parecer.justificativa_tecnica}</p>
                      </div>
                    </div>
                  )}
                  {recurso?.parecer?.valor_recomendado && (
                    <div>
                      <Label className="text-muted-foreground">Valor Recomendado</Label>
                      <p className="font-medium text-lg mt-1">
                        R$ {parseFloat(recurso.parecer.valor_recomendado).toFixed(2)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Linha do Tempo */}
            {timelineItems.length > 0 && (
              <AnimatedSection delay={220}>
                <Card className="overflow-hidden border-2 border-primary/10 shadow-lg">
                  <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-primary/10">
                    <CardHeader className="pb-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <CardTitle className="flex items-center gap-2 text-primary">
                            <Clock className="h-5 w-5" />
                            Linha do Tempo do Recurso
                          </CardTitle>
                          <CardDescription className="mt-1 text-muted-foreground">
                            Acompanhe cada etapa registrada no fluxo técnico e decisório
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-md border border-border">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                          Eventos em ordem cronológica real
                        </div>
                      </div>
                    </CardHeader>
                  </div>
                  <CardContent className="bg-background p-6">
                    <TimelineCard
                      items={timelineItems}
                      getStatusConfig={getTimelineStatusConfig}
                    />
                  </CardContent>
                </Card>
              </AnimatedSection>
            )}
          </div>

          {/* Chat Section - Moved to bottom */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Chat com Auditor
              </CardTitle>
              <CardDescription>
                {recurso.auditor_nome ? `Comunicação com ${recurso.auditor_nome}` : 'Solicite um parecer para iniciar chat'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Messages */}
              <div ref={chatContainerRef} className="max-h-[400px] overflow-y-auto space-y-3 p-4 border rounded-lg bg-muted/30">
                  {mensagens.length === 0 ? (
                    <div className="text-center text-muted-foreground text-sm py-8">
                      {recurso.auditor_nome ? 'Nenhuma mensagem ainda' : 'Chat disponível após solicitar parecer'}
                    </div>
                  ) : (
                    mensagens.map((msg: any) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.tipo_remetente === 'operadora' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-3 py-2 ${
                            msg.tipo_remetente === 'operadora'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-xs font-medium mb-1">{msg.remetente_nome}</p>
                          <p className="text-sm whitespace-pre-wrap">{msg.mensagem}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {format(new Date(msg.created_at), 'dd/MM', { locale: ptBR })} {formatTimeBR(msg.created_at)}
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
              {recurso.auditor_nome && (
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
                  />
                  <Button
                    onClick={handleEnviarMensagem}
                    disabled={enviandoMensagem || !novaMensagem.trim()}
                    size="icon"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Dialog open={showAprovarDialog} onOpenChange={setShowAprovarDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovar / Deferir Recurso</DialogTitle>
            <DialogDescription>
              Confirme a aprovação do recurso. A guia será marcada como paga.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="observacao-aprovacao">Observação (opcional)</Label>
              <Textarea
                id="observacao-aprovacao"
                placeholder="Adicione observações sobre a aprovação..."
                rows={4}
                value={observacaoAprovacao}
                onChange={(e) => setObservacaoAprovacao(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAprovarDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAprovar} disabled={processando}>
              {processando ? 'Processando...' : 'Confirmar Aprovação'}
            </Button>
          </DialogFooter>
        </DialogContent>
        </Dialog>

        <Dialog open={showNegarDialog} onOpenChange={setShowNegarDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Negar / Indeferir Recurso</DialogTitle>
            <DialogDescription>
              Informe o motivo da negação do recurso.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="motivo-negacao">Motivo da Negação *</Label>
              <Textarea
                id="motivo-negacao"
                placeholder="Descreva detalhadamente o motivo da negação..."
                rows={4}
                value={motivoNegacao}
                onChange={(e) => setMotivoNegacao(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNegarDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleNegar} disabled={processando || !motivoNegacao.trim()}>
              {processando ? 'Processando...' : 'Confirmar Negação'}
            </Button>
          </DialogFooter>
        </DialogContent>
        </Dialog>

        <Dialog open={showSolicitarParecerDialog} onOpenChange={setShowSolicitarParecerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar Parecer Técnico</DialogTitle>
            <DialogDescription>
              Selecione um auditor para emitir parecer técnico sobre este recurso.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="auditor-select">Auditor *</Label>
              <Select value={auditorSelecionado} onValueChange={setAuditorSelecionado}>
                <SelectTrigger id="auditor-select">
                  <SelectValue placeholder="Selecione um auditor" />
                </SelectTrigger>
                <SelectContent>
                  {auditores.map((auditor) => (
                    <SelectItem key={auditor.id} value={auditor.id.toString()}>
                      {auditor.nome} - {auditor.registro_profissional}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="observacao-parecer">Observação (opcional)</Label>
              <Textarea
                id="observacao-parecer"
                placeholder="Adicione observações para o auditor..."
                rows={4}
                value={observacaoParecer}
                onChange={(e) => setObservacaoParecer(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSolicitarParecerDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSolicitarParecer} disabled={processando || !auditorSelecionado}>
              {processando ? 'Processando...' : 'Solicitar Parecer'}
            </Button>
          </DialogFooter>
        </DialogContent>
        </Dialog>
    </>
  );
};

export default RecursoGlosaDetalhe;
