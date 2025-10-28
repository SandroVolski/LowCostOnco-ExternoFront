import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuditorAuth } from '@/contexts/AuditorAuthContext';
import { AuditorService, MensagemChat, Parecer } from '@/services/auditorService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
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
  Save
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Form state for parecer
  const [parecerForm, setParecerForm] = useState({
    parecer_tecnico: '',
    recomendacao: '' as 'aprovar' | 'negar' | 'solicitar_documentos' | 'parcial' | '',
    valor_recomendado: '',
    justificativa_tecnica: ''
  });

  useEffect(() => {
    if (id) {
      loadRecursoDetalhes();
      loadMensagens();
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
      const data = await AuditorService.buscarRecurso(Number(id));
      setRecurso(data);
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao carregar recurso');
      navigate('/auditor/recursos');
    } finally {
      setLoading(false);
    }
  };

  const loadMensagens = async () => {
    try {
      const data = await AuditorService.listarMensagens(Number(id));
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/auditor/recursos')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Recurso de Glosa - Guia {recurso.numero_guia_prestador}</h1>
                <p className="text-sm text-muted-foreground">
                  Análise técnica e parecer
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

            {/* Parecer Form - Only if not submitted yet */}
            {!parecerJaEmitido && (
              <Card>
                <CardHeader>
                  <CardTitle>Emitir Parecer Técnico</CardTitle>
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
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="recomendacao">Recomendação *</Label>
                    <Select
                      value={parecerForm.recomendacao}
                      onValueChange={(value: any) => setParecerForm({ ...parecerForm, recomendacao: value })}
                    >
                      <SelectTrigger className="mt-2">
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
                        className="mt-2"
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
                      className="mt-2"
                    />
                  </div>

                  <Button
                    onClick={handleEmitirParecer}
                    disabled={emitindoParecer}
                    className="w-full"
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
              <Card className="border-green-500/50 bg-green-50/50 dark:bg-green-950/20">
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Chat com Operadora
              </CardTitle>
              <CardDescription>
                Comunicação exclusiva auditor-operadora
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Messages */}
              <div className="max-h-[400px] overflow-y-auto space-y-3 p-4 border rounded-lg bg-muted/30">
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
                            {format(new Date(msg.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    ))
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
                />
                <Button
                  onClick={handleEnviarMensagem}
                  disabled={enviandoMensagem || !novaMensagem.trim()}
                  size="icon"
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
