import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeft,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Upload,
  X,
  Send,
  Check,
  XCircle,
  Loader2,
  Paperclip,
  Eye
} from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';
import AnimatedSection from '@/components/AnimatedSection';
import confetti from 'canvas-confetti';
import { authorizedFetch } from '@/services/authService';
import config from '@/config/environment';
import TimelineCard from '@/components/TimelineCard';

interface GuiaData {
  id: number;
  numero_guia_prestador: string;
  numero_guia_operadora: string;
  numero_carteira: string;
  data_autorizacao: string;
  data_execucao: string;
  valor_total: number;
  status_pagamento: string;
}

interface LoteData {
  id: number;
  numero_lote: string;
  competencia: string;
  operadora_nome: string;
  operadora_registro_ans: string;
}

interface RecursoGlosa {
  id: number;
  status: 'pendente' | 'em_analise' | 'deferido' | 'indeferido';
  justificativa: string;
  created_at: string;
  updated_at: string;
  documentos: Array<{
    id: number;
    nome_original: string;
    caminho_arquivo: string;
    tamanho_arquivo: number;
  }>;
  historico: Array<{
    status: string;
    data: string;
    observacao?: string;
  }>;
}

const RecursosGlosas: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { user } = useAuth();

  const [guia, setGuia] = useState<GuiaData | null>(null);
  const [lote, setLote] = useState<LoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Estados do recurso
  const [recursoExistente, setRecursoExistente] = useState<RecursoGlosa | null>(null);
  const [modoVisualizacao, setModoVisualizacao] = useState(false);

  // Estados do formulário
  const [justificativa, setJustificativa] = useState('');
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [motivosGlosa, setMotivosGlosa] = useState<string[]>([]);

  useEffect(() => {
    const carregarDados = async () => {
      setLoading(true);

      // Se há um ID na URL, carregar o recurso existente
      if (id) {
        await carregarRecursoPorId(parseInt(id));
      }
      // Senão, verificar se há dados no state (criação de novo recurso)
      else if (location.state?.guia && location.state?.lote) {
        setGuia(location.state.guia);
        setLote(location.state.lote);

        // Verificar se já existe um recurso para esta guia
        await verificarRecursoExistente(location.state.guia.id);
      }

      setLoading(false);
    };

    carregarDados();
  }, [id, location.state]);

  // Carregar recurso por ID (quando vem da URL)
  const carregarRecursoPorId = async (recursoId: number) => {
    try {
      const response = await authorizedFetch(`${config.API_BASE_URL}/financeiro/recursos-glosas/${recursoId}`);

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const recursoData = result.data;
          setRecursoExistente(recursoData);
          setModoVisualizacao(true);

          // Extrair dados da guia e do lote da view vw_recursos_glosas_completo
          const guiaData: GuiaData = {
            id: recursoData.guia_id,
            numero_guia_prestador: recursoData.numero_guia_prestador || '',
            numero_guia_operadora: recursoData.numero_guia_operadora || '',
            numero_carteira: recursoData.numero_carteira || '',
            valor_total: recursoData.valor_guia || 0,
            data_autorizacao: recursoData.data_autorizacao || '',
            data_execucao: recursoData.data_execucao || ''
          };

          const loteData: LoteData = {
            id: recursoData.lote_id,
            numero_lote: recursoData.numero_lote || '',
            competencia: recursoData.competencia || '',
            operadora_nome: recursoData.operadora_nome || '',
            operadora_registro_ans: recursoData.operadora_registro_ans || ''
          };

          setGuia(guiaData);
          setLote(loteData);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar recurso por ID:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o recurso de glosa',
        variant: 'destructive'
      });
    }
  };

  // Verificar se já existe recurso
  const verificarRecursoExistente = async (guiaId: number) => {
    try {
      const response = await authorizedFetch(`${config.API_BASE_URL}/financeiro/recursos-glosas/guia/${guiaId}`);

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setRecursoExistente(result.data);
          setModoVisualizacao(true);
          return;
        }
      }

      // Nenhum recurso encontrado
      setRecursoExistente(null);
      setModoVisualizacao(false);
    } catch (error) {
      console.error('Erro ao verificar recurso existente:', error);
      setRecursoExistente(null);
      setModoVisualizacao(false);
    }
  };

  // Lançar confete quando recurso for deferido
  useEffect(() => {
    if (recursoExistente?.status === 'deferido') {
      launchConfetti();
    }
  }, [recursoExistente?.status]);

  const launchConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
  };

  const handleVoltar = () => {
    // Se estamos visualizando um recurso existente (veio da lista), volta para a lista
    // Se estamos criando um novo (veio do financeiro), volta para o financeiro
    if (id || modoVisualizacao) {
      navigate('/recursos-glosas');
    } else {
      navigate('/financeiro');
    }
  };

  const handleMotivoChange = (motivo: string, checked: boolean) => {
    if (checked) {
      setMotivosGlosa([...motivosGlosa, motivo]);
    } else {
      setMotivosGlosa(motivosGlosa.filter(m => m !== motivo));
    }
  };

  const handleAnexarArquivos = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const novosArquivos = Array.from(e.target.files);

      // Validar tamanho (5MB por arquivo)
      const arquivosValidos = novosArquivos.filter(file => {
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: 'Arquivo muito grande',
            description: `${file.name} excede o tamanho máximo de 5MB`,
            variant: 'destructive'
          });
          return false;
        }
        return true;
      });

      setArquivos([...arquivos, ...arquivosValidos]);
    }
  };

  const handleRemoverArquivo = (index: number) => {
    setArquivos(arquivos.filter((_, i) => i !== index));
  };

  const handleCriarRecurso = async () => {
    // Validações
    if (!guia || !lote) {
      toast({
        title: 'Erro',
        description: 'Dados da guia ou lote não encontrados. Por favor, volte e tente novamente.',
        variant: 'destructive'
      });
      console.error('Guia ou Lote ausentes:', { guia, lote });
      return;
    }

    if (!justificativa.trim()) {
      toast({
        title: 'Atenção',
        description: 'Por favor, preencha a justificativa do recurso',
        variant: 'destructive'
      });
      return;
    }

    const clinicaId = user?.prestadorId || user?.clinica_id;

    if (!clinicaId) {
      toast({
        title: 'Erro',
        description: 'ID da clínica não encontrado. Faça login novamente.',
        variant: 'destructive'
      });
      console.error('clinica_id/prestadorId ausente:', user);
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('guia_id', guia.id.toString());
      formData.append('lote_id', lote.id.toString());
      formData.append('clinica_id', clinicaId.toString());
      formData.append('justificativa', justificativa);
      formData.append('motivos_glosa', JSON.stringify(motivosGlosa));

      // Log para debug
      console.log('📤 Enviando recurso de glosa:', {
        guia_id: guia.id,
        lote_id: lote.id,
        clinica_id: clinicaId,
        justificativa: justificativa.substring(0, 50) + '...',
        motivos_glosa: motivosGlosa,
        arquivos_count: arquivos.length
      });

      // Anexar arquivos
      arquivos.forEach(arquivo => {
        formData.append('documentos', arquivo);
      });

      // Enviar para o backend
      const response = await authorizedFetch(`${config.API_BASE_URL}/financeiro/recursos-glosas`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao criar recurso: ${errorText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Erro ao criar recurso');
      }

      toast({
        title: 'Recurso Criado!',
        description: 'Seu recurso de glosa foi enviado com sucesso e está aguardando análise.',
      });

      // Atualizar com os dados do backend
      setRecursoExistente(result.data);
      setModoVisualizacao(true);

    } catch (error: any) {
      console.error('Erro ao criar recurso:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível criar o recurso. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pendente':
        return {
          label: 'Pendente',
          color: 'bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border-amber-200 dark:border-amber-800',
          icon: <Clock className="h-4 w-4 text-amber-700 dark:text-amber-300" />,
          description: 'Aguardando análise da operadora'
        };
      case 'em_analise':
        return {
          label: 'Em Análise',
          color: 'bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-200 border-blue-200 dark:border-blue-800',
          icon: <Eye className="h-4 w-4 text-blue-700 dark:text-blue-300" />,
          description: 'Recurso em análise pela operadora'
        };
      case 'deferido':
        return {
          label: 'Deferido',
          color: 'bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-200 border-green-200 dark:border-green-800',
          icon: <CheckCircle className="h-4 w-4 text-green-700 dark:text-green-300" />,
          description: 'Recurso aceito! Valor será pago'
        };
      case 'indeferido':
        return {
          label: 'Indeferido',
          color: 'bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-200 border-red-200 dark:border-red-800',
          icon: <XCircle className="h-4 w-4 text-red-700 dark:text-red-300" />,
          description: 'Recurso negado pela operadora'
        };
      default:
        return {
          label: status,
          color: 'bg-gray-100 text-gray-800 border-gray-300',
          icon: <AlertTriangle className="h-4 w-4" />,
          description: ''
        };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!guia || !lote) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Dados não encontrados
          </h2>
          <p className="text-muted-foreground mb-4">
            Não foi possível carregar os dados da guia para criar o recurso de glosa.
          </p>
          <Button onClick={handleVoltar} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Financeiro
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <AnimatedSection delay={100}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleVoltar}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  {modoVisualizacao ? 'Acompanhamento' : 'Criar'} Recurso de Glosa
                </h1>
                <p className="text-muted-foreground">
                  Guia: {guia.numero_guia_prestador}
                </p>
              </div>
            </div>
            {recursoExistente && (
              <Badge className={`${getStatusConfig(recursoExistente.status).color} flex items-center gap-1`}>
                {getStatusConfig(recursoExistente.status).icon}
                {getStatusConfig(recursoExistente.status).label}
              </Badge>
            )}
          </div>
        </AnimatedSection>

        {/* Timeline - Somente em modo visualização */}
        {modoVisualizacao && recursoExistente && (
          <AnimatedSection delay={200}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Linha do Tempo
                </CardTitle>
                <CardDescription>
                  Acompanhe o andamento do seu recurso de glosa
                </CardDescription>
              </CardHeader>
              <CardContent className="bg-background">
                <TimelineCard
                  items={recursoExistente.historico}
                  getStatusConfig={getStatusConfig}
                />
              </CardContent>
            </Card>
          </AnimatedSection>
        )}

        {/* Informações da Guia */}
        <AnimatedSection delay={modoVisualizacao ? 300 : 200}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Informações da Guia Glosada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-muted-foreground">Guia Prestador</Label>
                  <p className="font-medium">{guia.numero_guia_prestador}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Guia Operadora</Label>
                  <p className="font-medium">{guia.numero_guia_operadora || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Carteira</Label>
                  <p className="font-medium">{guia.numero_carteira}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Valor Total</Label>
                  <p className="font-semibold text-lg text-primary">
                    {formatCurrency(guia.valor_total)}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Operadora</Label>
                  <p className="font-medium">{lote.operadora_nome}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Lote</Label>
                  <p className="font-medium">{lote.numero_lote}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </AnimatedSection>

        {/* Formulário ou Visualização */}
        {!modoVisualizacao ? (
          <>
            {/* Justificativa */}
            <AnimatedSection delay={300}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-accent" />
                    Justificativa do Recurso
                  </CardTitle>
                  <CardDescription>
                    Explique detalhadamente por que o procedimento não deveria ter sido glosado
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="justificativa">Justificativa *</Label>
                    <Textarea
                      id="justificativa"
                      value={justificativa}
                      onChange={(e) => setJustificativa(e.target.value)}
                      placeholder="Descreva os motivos técnicos e clínicos que justificam a reversão da glosa..."
                      rows={6}
                      className="mt-2"
                    />
                  </div>

                  {/* Motivos comuns */}
                  <div>
                    <Label>Motivos Alegados (opcional)</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                      {[
                        'Documentação completa apresentada',
                        'Procedimento coberto pelo plano',
                        'Autorização prévia emitida',
                        'Necessidade médica comprovada',
                        'Prazo de atendimento cumprido',
                        'CID compatível com procedimento'
                      ].map(motivo => (
                        <label key={motivo} className="flex items-center space-x-2 text-sm">
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={motivosGlosa.includes(motivo)}
                            onChange={(e) => handleMotivoChange(motivo, e.target.checked)}
                          />
                          <span>{motivo}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AnimatedSection>

            {/* Upload de Documentos */}
            <AnimatedSection delay={400}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Paperclip className="h-5 w-5 text-secondary" />
                    Documentos Comprobatórios
                  </CardTitle>
                  <CardDescription>
                    Anexe prontuários, exames, laudos, autorizações e outros documentos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Área de upload */}
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                    <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm font-medium mb-1">
                      Arraste arquivos aqui ou clique para selecionar
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">
                      PDF, PNG, JPG, JPEG - Máximo 5MB por arquivo
                    </p>
                    <Input
                      type="file"
                      multiple
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleAnexarArquivos}
                      className="hidden"
                      id="file-upload"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('file-upload')?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Selecionar Arquivos
                    </Button>
                  </div>

                  {/* Lista de arquivos */}
                  {arquivos.length > 0 && (
                    <div className="space-y-2">
                      <Label>Arquivos Anexados ({arquivos.length})</Label>
                      {arquivos.map((arquivo, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-muted rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{arquivo.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(arquivo.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoverArquivo(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </AnimatedSection>

            {/* Ações */}
            <AnimatedSection delay={500}>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      <p>Ao enviar, seu recurso será encaminhado para análise da operadora</p>
                      <p className="text-xs mt-1">Você poderá acompanhar o status em tempo real</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={handleVoltar} disabled={submitting}>
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleCriarRecurso}
                        disabled={submitting}
                        className="gap-2"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            Enviar Recurso
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AnimatedSection>
          </>
        ) : (
          /* Visualização do Recurso Criado */
          <>
            <AnimatedSection delay={400}>
              <Card>
                <CardHeader>
                  <CardTitle>Justificativa Apresentada</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{recursoExistente?.justificativa}</p>
                </CardContent>
              </Card>
            </AnimatedSection>

            {recursoExistente && recursoExistente.documentos.length > 0 && (
              <AnimatedSection delay={500}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Paperclip className="h-5 w-5" />
                      Documentos Anexados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {recursoExistente.documentos.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 bg-muted rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{doc.nome_original}</p>
                              <p className="text-xs text-muted-foreground">
                                {(doc.tamanho_arquivo / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </AnimatedSection>
            )}
          </>
        )}
    </div>
  );
};

export default RecursosGlosas;
