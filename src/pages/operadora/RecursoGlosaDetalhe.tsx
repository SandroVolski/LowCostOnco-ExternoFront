import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { OperadoraRecursosService, AuditorInfo } from '@/services/operadoraRecursosService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  AlertCircle
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadRecursoDetalhes = async () => {
    try {
      setLoading(true);
      const data = await OperadoraRecursosService.buscarRecurso(Number(id));
      setRecurso(data);

      // Marcar como recebido se ainda estiver pendente
      if (data.status_recurso === 'pendente') {
        await OperadoraRecursosService.receberRecurso(Number(id));
        // Recarregar para atualizar status
        const updatedData = await OperadoraRecursosService.buscarRecurso(Number(id));
        setRecurso(updatedData);
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

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      'pendente': { label: 'Pendente', variant: 'outline' },
      'em_analise_operadora': { label: 'Em Análise', variant: 'default' },
      'solicitado_parecer': { label: 'Aguardando Parecer', variant: 'secondary' },
      'em_analise_auditor': { label: 'Com Auditor', variant: 'secondary' },
      'parecer_emitido': { label: 'Parecer Recebido', variant: 'default' },
      'deferido': { label: 'Deferido', variant: 'secondary' },
      'indeferido': { label: 'Indeferido', variant: 'destructive' }
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

  const podeAprovarOuNegar = ['em_analise_operadora', 'parecer_emitido'].includes(recurso.status_recurso);
  const podeSolicitarParecer = recurso.status_recurso === 'em_analise_operadora';
  const temParecer = recurso.parecer;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/operadora/recursos-glosas')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Recurso de Glosa - Guia {recurso.numero_guia_prestador}</h1>
                <p className="text-sm text-muted-foreground">
                  Análise e decisão sobre recurso
                </p>
              </div>
            </div>
            {getStatusBadge(recurso.status_recurso)}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Main Content - Vertical Layout */}
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
                      <p className="text-sm">{recurso.motivos_glosa}</p>
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
              <Card className="border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                    <UserCog className="h-5 w-5" />
                    Parecer Técnico do Auditor
                  </CardTitle>
                  <CardDescription>
                    Emitido por {recurso.parecer.auditor_nome} em {format(new Date(recurso.parecer.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
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
                  {recurso.parecer.valor_recomendado && (
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
              <div className="max-h-[400px] overflow-y-auto space-y-3 p-4 border rounded-lg bg-muted/30">
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
                            {format(new Date(msg.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    ))
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
      </div>

      {/* Dialog Aprovar */}
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

      {/* Dialog Negar */}
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

      {/* Dialog Solicitar Parecer */}
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
    </div>
  );
};

export default RecursoGlosaDetalhe;
