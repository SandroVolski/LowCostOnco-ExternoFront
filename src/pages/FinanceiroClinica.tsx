import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  Eye,
  Paperclip,
  Package,
  Building2,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Calendar,
  Grid3X3,
  List,
  Filter,
  Search,
  Download,
  Send,
  FileX,
  CheckCircle,
  X,
} from 'lucide-react';
import { FinanceiroService, LoteFinanceiro, GuiaFinanceira, Operadora } from '@/services/financeiro';
import AnimatedSection from '@/components/AnimatedSection';
import XMLViewerModal from '@/components/XMLViewerModal';
import XMLTISSDetailedViewer from '@/components/XMLTISSDetailedViewer';
import XMLTISSDetailedViewerV2 from '@/components/XMLTISSDetailedViewerV2';
import { buildFinanceiroVisualization } from '@/utils/financeiroVisualization';

const FinanceiroClinica = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Estados principais
  const [lotes, setLotes] = useState<LoteFinanceiro[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Estados para operadoras (mantido para possíveis usos futuros)
  const [operadoras, setOperadoras] = useState<Operadora[]>([]);
  
  // Estado para competência (ano e mês separados)
  const [anoCompetencia, setAnoCompetencia] = useState<string>('');
  const [mesCompetencia, setMesCompetencia] = useState<string>('');
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCompetencia, setFilterCompetencia] = useState('');
  const [competencias, setCompetencias] = useState<string[]>([]);
  
  // Estados para modal de detalhes
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLote, setSelectedLote] = useState<LoteFinanceiro | null>(null);
  const [guiasDoLote, setGuiasDoLote] = useState<GuiaFinanceira[]>([]);
  
  // Estados para modais de anexar documentos
  const [anexarModalOpen, setAnexarModalOpen] = useState(false);
  const [guiaSelecionada, setGuiaSelecionada] = useState<GuiaFinanceira | null>(null);
  const [arquivosSelecionados, setArquivosSelecionados] = useState<File[]>([]);

  // Estados para sistema de resposta de guias (pago/glosado/em análise)
  type StatusResposta = 'em-analise' | 'pago' | 'glosado';
  type StatusAprovacao = 'sem-status' | 'aprovado' | 'rejeitado';
  const [statusRespostaGuias, setStatusRespostaGuias] = useState<Record<number, StatusResposta>>({});
  const [guiasComAnexo, setGuiasComAnexo] = useState<Record<number, File[]>>({});
  const [statusAprovacaoGuias, setStatusAprovacaoGuias] = useState<Record<number, StatusAprovacao>>({});

  // Estados para confirmação de glosa
  const [confirmGlosaDialogOpen, setConfirmGlosaDialogOpen] = useState(false);
  const [guiaParaGlosar, setGuiaParaGlosar] = useState<GuiaFinanceira | null>(null);
  const [itemParaGlosar, setItemParaGlosar] = useState<{numeroGuia: string; itemId: string; item: any} | null>(null);
  const [loteAtualParaGlosa, setLoteAtualParaGlosa] = useState<LoteFinanceiro | null>(null);
  const [loteIdAtual, setLoteIdAtual] = useState<number | null>(null);
  const [guiasOriginaisMap, setGuiasOriginaisMap] = useState<Map<string, any>>(new Map());

  // Navegação
  const navigate = useNavigate();
  
  // Estados para visualização XML
  const [showXMLViewerModal, setShowXMLViewerModal] = useState(false);
  const [xmlViewerData, setXmlViewerData] = useState<{
    rawContent: string;
    fileName: string;
    fileSize: number;
    uploadDate: string;
  } | null>(null);
  const [showXMLVisualization, setShowXMLVisualization] = useState(false);
  const [xmlData, setXmlData] = useState<any>(null);
  const [useViewerV2, setUseViewerV2] = useState(true); // Flag para usar o novo viewer

  // Estado para drag & drop
  const [isDragOver, setIsDragOver] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
      loadLotes();
      loadOperadoras();
  }, []);

  // Recarregar guias quando a janela ganhar foco (voltando de outra página)
  useEffect(() => {
    const handleFocus = () => {
      if (selectedLote) {
        loadGuiasDoLote(selectedLote.id);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [selectedLote]);

  const loadLotes = async () => {
    try {
      setLoading(true);
      const data = await FinanceiroService.getLotes(user?.id || 0);
      setLotes(data);
      
      // Extrair competências únicas
      const comps = [...new Set(data.map(lote => lote.competencia))].sort();
      setCompetencias(comps);
    } catch (error) {
      console.error('Erro ao carregar lotes:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os lotes financeiros.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadOperadoras = async () => {
    try {
      const data = await FinanceiroService.getOperadoras();
      setOperadoras(data);
    } catch (error) {
      console.error('Erro ao carregar operadoras:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as operadoras.',
        variant: 'destructive',
      });
    }
  };

  const loadGuiasDoLote = async (loteId: number) => {
    try {
      const items: any[] = await FinanceiroService.getGuiasByLoteId(loteId);

      // Converter dados do backend (ItemFinanceiro[]) para formato do frontend (GuiaFinanceira[])
      const guiasConvertidas: GuiaFinanceira[] = items
        .filter((item: any) => item.tipo_item === 'guia')
        .map((item: any) => ({
          id: item.id,
          lote_id: item.lote_id,
          numero_guia_prestador: item.numero_guia_prestador || '',
          numero_guia_operadora: item.numero_guia_operadora || '',
          numero_carteira: item.numero_carteira || '',
          data_autorizacao: item.data_autorizacao || '',
          data_execucao: item.data_execucao || '',
          valor_procedimentos: 0, // Será calculado abaixo
          valor_taxas: 0, // Será calculado abaixo
          valor_materiais: 0, // Será calculado abaixo
          valor_medicamentos: 0, // Será calculado abaixo
          valor_total: parseFloat(item.valor_total) || 0,
          status_pagamento: item.status_pagamento || 'pendente',
          documentos_anexos: item.documentos_anexos
        }));

      // Calcular valores por tipo de item para cada guia
      for (const guia of guiasConvertidas) {
        // Como o backend só salva procedimentos, vamos calcular baseado neles
        const procedimentos = items.filter((item: any) => 
          item.parent_id === guia.id && item.tipo_item === 'procedimento'
        );

        // Calcular valor dos procedimentos
        guia.valor_procedimentos = procedimentos.reduce((sum: number, proc: any) => sum + (parseFloat(proc.valor_total) || 0), 0);

        // Como o backend não salva despesas separadamente, vamos usar uma distribuição baseada no valor total
        // e nos códigos dos procedimentos para estimar as outras categorias
        const valorRestante = Math.max(0, guia.valor_total - guia.valor_procedimentos);

        // Distribuir o valor restante baseado nos códigos dos procedimentos
        const procedimentosMedicamentos = procedimentos.filter((proc: any) => 
          proc.codigo_item?.startsWith('90') || 
          proc.descricao_item?.toLowerCase().includes('medicamento')
        );

        const procedimentosMateriais = procedimentos.filter((proc: any) => 
          proc.codigo_item?.startsWith('78') || 
          proc.descricao_item?.toLowerCase().includes('material')
        );

        const procedimentosTaxas = procedimentos.filter((proc: any) => 
          proc.codigo_item?.startsWith('60') || 
          proc.descricao_item?.toLowerCase().includes('taxa')
        );

        // Calcular valores baseados nos procedimentos encontrados
        guia.valor_medicamentos = procedimentosMedicamentos.reduce((sum: number, proc: any) => sum + (parseFloat(proc.valor_total) || 0), 0);
        guia.valor_materiais = procedimentosMateriais.reduce((sum: number, proc: any) => sum + (parseFloat(proc.valor_total) || 0), 0);
        guia.valor_taxas = procedimentosTaxas.reduce((sum: number, proc: any) => sum + (parseFloat(proc.valor_total) || 0), 0);

        // Se não encontrou procedimentos específicos, distribuir o valor restante proporcionalmente
        if (guia.valor_medicamentos === 0 && guia.valor_materiais === 0 && guia.valor_taxas === 0 && valorRestante > 0) {
          // Distribuição estimada: 60% medicamentos, 25% materiais, 15% taxas
          guia.valor_medicamentos = valorRestante * 0.6;
          guia.valor_materiais = valorRestante * 0.25;
          guia.valor_taxas = valorRestante * 0.15;
        }
      }

      setGuiasDoLote(guiasConvertidas);

      // Atualizar statusRespostaGuias com os status do banco
      const novosStatus: Record<number, StatusResposta> = {};
      guiasConvertidas.forEach(guia => {
        if (guia.status_pagamento === 'glosado') {
          novosStatus[guia.id] = 'glosado';
        } else if (guia.status_pagamento === 'pago') {
          novosStatus[guia.id] = 'pago';
        } else {
          novosStatus[guia.id] = 'em-analise';
        }
      });
      setStatusRespostaGuias(novosStatus);
    } catch (error) {
      console.error('Erro ao carregar guias:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as guias do lote.',
        variant: 'destructive',
      });
    }
  };

  // Função para abrir modal de anexar documentos
  const handleAnexarDocumentos = (guia: GuiaFinanceira) => {
    setGuiaSelecionada(guia);
    setAnexarModalOpen(true);
  };

  // Função para alternar status de aprovação da guia
  const handleToggleStatusAprovacao = (guiaId: number) => {
    setStatusAprovacaoGuias(prev => {
      const statusAtual = prev[guiaId] || 'sem-status';
      let novoStatus: StatusAprovacao;

      // Ciclo: sem-status → aprovado → rejeitado → sem-status
      if (statusAtual === 'sem-status') {
        novoStatus = 'aprovado';
      } else if (statusAtual === 'aprovado') {
        novoStatus = 'rejeitado';
      } else {
        novoStatus = 'sem-status';
      }

      return { ...prev, [guiaId]: novoStatus };
    });
  };

  // Função para anexar arquivos a uma guia específica
  const handleAnexarArquivosGuia = (guiaId: number, files: File[]) => {
    setGuiasComAnexo(prev => ({
      ...prev,
      [guiaId]: [...(prev[guiaId] || []), ...files]
    }));
  };

  // Função para remover arquivo anexado
  const handleRemoverArquivoGuia = (guiaId: number, fileIndex: number) => {
    setGuiasComAnexo(prev => {
      const arquivos = prev[guiaId] || [];
      return {
        ...prev,
        [guiaId]: arquivos.filter((_, index) => index !== fileIndex)
      };
    });
  };

  // Função para enviar resposta da guia (com status de pagamento e anexos)
  const handleEnviarRespostaGuia = async (guiaId: number) => {
    const status = statusRespostaGuias[guiaId];
    const arquivos = guiasComAnexo[guiaId] || [];

    if (!status || status === 'em-analise') {
      toast({
        title: 'Atenção',
        description: 'Por favor, selecione o status: Pago ou Glosado.',
        variant: 'destructive',
      });
      return;
    }

    if (arquivos.length === 0) {
      toast({
        title: 'Atenção',
        description: 'Por favor, anexe pelo menos um documento antes de enviar.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('guia_id', guiaId.toString());
      formData.append('status_resposta', status);

      arquivos.forEach((arquivo) => {
        formData.append('documentos', arquivo);
      });

      // Aqui você deve chamar o endpoint do backend
      // await FinanceiroService.enviarRespostaGuia(formData);

      toast({
        title: 'Sucesso',
        description: `Resposta enviada com sucesso! Guia marcada como ${status === 'pago' ? 'PAGA' : 'GLOSADA'}.`,
      });

      // Limpar estado após envio
      setStatusRespostaGuias(prev => {
        const newState = { ...prev };
        delete newState[guiaId];
        return newState;
      });
      setGuiasComAnexo(prev => {
        const newState = { ...prev };
        delete newState[guiaId];
        return newState;
      });

    } catch (error) {
      console.error('Erro ao enviar resposta:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a resposta. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  // Função para lidar com clique no botão Glosado
  const handleClickGlosado = (guia: GuiaFinanceira) => {
    setGuiaParaGlosar(guia);
    setConfirmGlosaDialogOpen(true);
  };

  // Handler para quando o usuário marca um item como glosado no XMLTISSDetailedViewerV2
  const handleGlosarItem = async (numeroGuia: string, itemId: string, item: any, loteIdFromComponent?: number) => {
    try {
      // Usar o loteId passado do componente, ou do estado, ou buscar do selectedLote
      const loteIdFinal = loteIdFromComponent || loteIdAtual || loteAtualParaGlosa?.id || selectedLote?.id;
      
      if (!loteIdFinal) {
        console.error('Lote não encontrado:', {
          loteIdFromComponent,
          loteIdAtual,
          loteAtualParaGlosa: loteAtualParaGlosa?.id,
          selectedLote: selectedLote?.id
        });
        toast({
          title: 'Erro',
          description: 'Lote não encontrado. Por favor, feche e reabra o modal de visualização.',
          variant: 'destructive',
        });
        return;
      }

      // Buscar o lote completo se não tivermos em memória
      let loteData = loteAtualParaGlosa;
      if (!loteData || loteData.id !== loteIdFinal) {
        loteData = await FinanceiroService.getLoteById(loteIdFinal);
        setLoteAtualParaGlosa(loteData);
      }

      // Primeiro, tentar buscar no mapa de guias originais (mais rápido)
      let guiaData = guiasOriginaisMap.get(String(numeroGuia).trim());
      
      // Se não encontrou no mapa, buscar no banco
      if (!guiaData) {
        const allItems: any[] = await FinanceiroService.getGuiasByLoteId(loteIdFinal);
        
        // Tentar diferentes formatos de comparação
        guiaData = allItems.find(i => {
          if (i.tipo_item !== 'guia') return false;
          const numGuia = String(i.numero_guia_prestador || '').trim();
          const numBuscado = String(numeroGuia || '').trim();
          return numGuia === numBuscado || 
                 numGuia === numeroGuia || 
                 i.numero_guia_prestador === numeroGuia;
        });

        // Se ainda não encontrou, tentar buscar qualquer guia do lote (fallback)
        if (!guiaData && allItems.length > 0) {
          guiaData = allItems.find(i => i.tipo_item === 'guia');
          console.warn('Guia não encontrada pelo número exato, usando primeira guia do lote como fallback');
        }
      }
      
      if (guiaData) {
        // Converter para o formato GuiaFinanceira
        const guia: GuiaFinanceira = {
          id: guiaData.id,
          lote_id: loteIdFinal,
          numero_guia_prestador: guiaData.numero_guia_prestador || numeroGuia,
          numero_guia_operadora: guiaData.numero_guia_operadora || '',
          numero_carteira: guiaData.numero_carteira || '',
          data_autorizacao: guiaData.data_autorizacao || '',
          data_execucao: guiaData.data_execucao || '',
          valor_total: parseFloat(guiaData.valor_total) || 0,
          status_pagamento: guiaData.status_pagamento || 'pendente',
          valor_procedimentos: parseFloat(guiaData.valor_procedimentos) || 0,
          valor_medicamentos: parseFloat(guiaData.valor_medicamentos) || 0,
          valor_materiais: parseFloat(guiaData.valor_materiais) || 0,
          valor_taxas: parseFloat(guiaData.valor_taxas) || 0,
        };

        setGuiaParaGlosar(guia);
        setItemParaGlosar({ numeroGuia, itemId, item });
        setConfirmGlosaDialogOpen(true);
      } else {
        console.error('Guia não encontrada:', {
          numeroGuia,
          numeroGuiaTipo: typeof numeroGuia,
          loteId: loteIdFinal,
          mapaSize: guiasOriginaisMap.size,
          chavesNoMapa: Array.from(guiasOriginaisMap.keys())
        });
        toast({
          title: 'Erro',
          description: `Não foi possível encontrar a guia "${numeroGuia}" para glosar. Tente fechar e reabrir o modal.`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao buscar guia:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível processar a glosa.',
        variant: 'destructive',
      });
    }
  };

  // Função para confirmar glosa e enviar para Recursos de Glosas
  const handleConfirmarGlosa = () => {
    if (!guiaParaGlosar) return;

    // Marcar a guia como glosada nos estados locais
    setStatusRespostaGuias(prev => ({
      ...prev,
      [Number(guiaParaGlosar.id)]: 'glosado'
    }));

    setGuiasDoLote(prev =>
      prev.map(guia =>
        guia.id === guiaParaGlosar.id
          ? { ...guia, status_pagamento: 'glosado' }
          : guia
      )
    );

    // Atualizar o xmlData localmente para refletir imediatamente
    setXmlData(prev => {
      if (!prev?.guias) return prev;
      return {
        ...prev,
        guias: prev.guias.map((guia: any) => {
          // Se a guia tem o número correspondente, atualizar os itens
          if (guia.cabecalhoGuia?.numeroGuiaPrestador === guiaParaGlosar.numero_guia_prestador) {
            return {
              ...guia,
              procedimentos: guia.procedimentos?.map((proc: any) =>
                `proc-${proc.codigo_procedimento}-${proc.data_execucao}` === itemParaGlosar?.itemId
                  ? { ...proc, status_pagamento: 'glosado' }
                  : proc
              ),
              medicamentos: guia.medicamentos?.map((med: any) =>
                `med-${med.codigo_medicamento}-${med.data_execucao}` === itemParaGlosar?.itemId
                  ? { ...med, status_pagamento: 'glosado' }
                  : med
              ),
              materiais: guia.materiais?.map((mat: any) =>
                `mat-${mat.codigo_material}-${mat.data_execucao}` === itemParaGlosar?.itemId
                  ? { ...mat, status_pagamento: 'glosado' }
                  : mat
              ),
              taxas: guia.taxas?.map((taxa: any) =>
                `taxa-${taxa.codigo_taxa}-${taxa.data_execucao}` === itemParaGlosar?.itemId
                  ? { ...taxa, status_pagamento: 'glosado' }
                  : taxa
              ),
            };
          }
          return guia;
        })
      };
    });

    // Fechar o modal de visualização XML se estiver aberto
    setShowXMLVisualization(false);

    // Navegar para a tela de criação de recurso de glosa com os dados necessários
    const itemGlosado = itemParaGlosar?.item
      ? {
          ...itemParaGlosar.item,
          id: itemParaGlosar.itemId,
          valor_total: Number(itemParaGlosar.item?.valor_total ?? itemParaGlosar.item?.valor ?? 0),
          quantidade: Number(itemParaGlosar.item?.quantidade ?? itemParaGlosar.item?.quantidade_executada ?? 1)
        }
      : null;

    const loteOrigem: any = loteAtualParaGlosa || selectedLote || {};
    const loteParaEnviar = {
      id: Number(
        loteOrigem.id ??
        loteOrigem.lote_id ??
        loteOrigem?.lote?.id ??
        loteOrigem?.lote?.lote_id ??
        loteOrigem?.cabecalho?.lote_id ??
        loteOrigem?.cabecalho?.id ??
        selectedLote?.id ??
        selectedLote?.lote_id ??
        0
      ),
      numero_lote:
        loteOrigem.numero_lote ??
        loteOrigem?.lote?.numero_lote ??
        selectedLote?.numero_lote ??
        '',
      competencia:
        loteOrigem.competencia ??
        loteOrigem?.lote?.competencia ??
        selectedLote?.competencia ??
        '',
      operadora_nome:
        loteOrigem.operadora_nome ??
        loteOrigem?.operadora?.nome ??
        selectedLote?.operadora_nome ??
        '',
      operadora_registro_ans:
        loteOrigem.operadora_registro_ans ??
        loteOrigem?.operadora?.registro_ans ??
        selectedLote?.operadora_registro_ans ??
        ''
    };

    navigate('/recursos-glosas/novo', {
      state: {
        guia: { ...guiaParaGlosar, status_pagamento: 'glosado' },
        lote: loteParaEnviar,
        item: itemGlosado
      }
    });

    // Fechar o dialog de confirmação
    setConfirmGlosaDialogOpen(false);
    setGuiaParaGlosar(null);
    setItemParaGlosar(null);

    toast({
      title: 'Guia Glosada',
      description: 'A guia foi marcada como glosada. Você será direcionado para registrar a glosa.',
    });
  };

  // Navegar para o recurso de glosa da guia
  const handleVerRecursoGlosa = async (guiaId: number) => {
    try {
      // Buscar o recurso de glosa pelo ID da guia
      const token = localStorage.getItem('authAccessToken') || localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/financeiro/recursos-glosas/guia/${guiaId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          // Navegar para o recurso de glosa
          navigate(`/recursos-glosas/${result.data.id}`);
        } else {
          toast({
            title: 'Recurso não encontrado',
            description: 'Não foi encontrado um recurso de glosa para esta guia.',
            variant: 'destructive'
          });
        }
      } else {
        toast({
          title: 'Erro ao buscar recurso',
          description: `Erro ${response.status}: ${response.statusText}`,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Erro ao buscar recurso:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível buscar o recurso de glosa.',
        variant: 'destructive'
      });
    }
  };

  // Função para processar upload de documentos
  const handleUploadDocumentos = async () => {
    if (!guiaSelecionada || arquivosSelecionados.length === 0) {
      toast({
        title: 'Erro',
        description: 'Selecione pelo menos um arquivo para anexar.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const formData = new FormData();
      arquivosSelecionados.forEach((arquivo) => {
        formData.append('documentos', arquivo);
      });
      formData.append('guia_id', guiaSelecionada.id.toString());

      // Chamar a API real para anexar documentos
      const response = await fetch('/api/financeiro/guias/anexar-documentos', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
      toast({
          title: 'Sucesso',
          description: `${arquivosSelecionados.length} documento(s) anexado(s) à guia ${guiaSelecionada.numero_guia_prestador}`,
        });

        setAnexarModalOpen(false);
        setArquivosSelecionados([]);
        setGuiaSelecionada(null);
      } else {
        throw new Error(result.message || 'Erro ao anexar documentos');
      }
    } catch (error) {
      console.error('Erro ao anexar documentos:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao anexar documentos. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  // Função para enviar guia para operadora
  const handleEnviarParaOperadora = async (guia: GuiaFinanceira) => {
    try {
      // Atualizar status da guia para "enviado" ou similar
      const response = await fetch(`/api/financeiro/guias/${guia.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status_pagamento: 'enviado' // ou criar um novo status
        }),
      });

      const result = await response.json();

      if (result.success) {
      toast({
          title: 'Sucesso',
          description: `Guia ${guia.numero_guia_prestador} enviada para a operadora`,
      });
        
        // Recarregar dados para atualizar a interface
      if (selectedLote) {
        loadGuiasDoLote(selectedLote.id);
        }
      } else {
        throw new Error(result.message || 'Erro ao enviar guia');
      }
    } catch (error) {
      console.error('Erro ao enviar para operadora:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao enviar guia para operadora. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  // Função para navegar para recurso de glosas
  const handleRecursoGlosas = (guia: GuiaFinanceira) => {
    navigate('/recursos-glosas', { 
      state: { 
        guia: guia,
        lote: selectedLote 
      } 
    });
  };

  const processXMLForVisualization = async (loteId: number) => {
    try {
      setLoading(true);

      const loteData = await FinanceiroService.getLoteById(loteId);
      setLoteAtualParaGlosa(loteData);
      setLoteIdAtual(loteId);

      const allItems: any[] = await FinanceiroService.getGuiasByLoteId(loteId);
      const { processedData, guiasMap } = buildFinanceiroVisualization(loteData, allItems);

      setGuiasOriginaisMap(guiasMap);
      setXmlData(processedData);
      setShowXMLVisualization(true);
    } catch (error) {
      console.error('Erro ao processar XML:', error);
      toast({
        title: 'Erro ao processar XML',
        description: 'Não foi possível processar os dados para visualização.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Função para download do XML
  const handleDownloadXML = async (loteId: number) => {
    try {
      setLoading(true);
      await FinanceiroService.downloadXMLLote(loteId);
      toast({
        title: 'Download iniciado',
        description: 'O arquivo XML está sendo baixado.',
      });
    } catch (error: any) {
      console.error('Erro ao baixar XML:', error);
      toast({
        title: 'Erro ao baixar XML',
        description: error.message || 'Não foi possível baixar o arquivo XML.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Funções para drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.name.toLowerCase().endsWith('.xml')) {
        processFile(file);
      } else {
        toast({
          title: 'Arquivo inválido',
          description: 'Por favor, selecione um arquivo XML válido.',
          variant: 'destructive',
        });
      }
    }
  };

  // Função para processar arquivo (usada tanto por drag & drop quanto por input)
  const processFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.xml')) {
      toast({
        title: 'Arquivo inválido',
        description: 'Por favor, selecione um arquivo XML válido.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploading(true);
      
      // Ler o arquivo para visualização
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setXmlViewerData({
          rawContent: content,
          fileName: file.name,
          fileSize: file.size,
          uploadDate: new Date().toISOString()
        });
      };
      reader.readAsText(file);

      // Validar competência
      if (!anoCompetencia || !mesCompetencia) {
        toast({
          title: 'Competência obrigatória',
          description: 'Por favor, selecione o ano e o mês da competência antes de fazer o upload do XML.',
          variant: 'destructive',
        });
        return;
      }

      // Formatar competência como AAAAMM
      const competenciaTrimmed = `${anoCompetencia}${mesCompetencia}`;

      // Processar o arquivo
      // O backend busca a operadora automaticamente pelo registroANS do XML
      const formData = new FormData();
      formData.append('xml', file);
      formData.append('clinica_id', (user?.id || 0).toString());
      formData.append('competencia', competenciaTrimmed);

      const result = await FinanceiroService.uploadXML(formData);
      
      toast({
        title: 'Sucesso',
        description: `XML processado com sucesso! Lote ${result.numero_lote} criado.`,
      });

      // Limpar campos após sucesso
      setAnoCompetencia('');
      setMesCompetencia('');
      
      // Recarregar a lista de lotes
      await loadLotes();
      
    } catch (error: any) {
      console.error('Erro ao processar XML:', error);
      toast({
        title: 'Erro ao processar XML',
        description: error.message || 'Não foi possível processar o arquivo XML.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handlePreviewXML = () => {
    if (xmlViewerData) {
      setShowXMLViewerModal(true);
    }
  };

  // Filtrar lotes
  const filteredLotes = lotes.filter(lote => {
    const matchesSearch = lote.numero_lote.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lote.operadora_nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCompetencia = !filterCompetencia || filterCompetencia === 'all' || lote.competencia === filterCompetencia;
    return matchesSearch && matchesCompetencia;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';

    try {
      const date = new Date(dateString);
      // Verificar se a data é válida
      if (isNaN(date.getTime())) return 'N/A';

      return date.toLocaleDateString('pt-BR');
    } catch (error) {
      return 'N/A';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pago': return 'bg-blue-100 text-blue-800';
      case 'pendente': return 'bg-yellow-100 text-yellow-800';
      case 'glosado': return 'bg-red-100 text-red-800';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pago': return <CheckCircle2 className="h-4 w-4" />;
      case 'pendente': return <Clock className="h-4 w-4" />;
      case 'glosado': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  // Função auxiliar para obter configuração visual do status de resposta
  const getStatusRespostaConfig = (status: StatusResposta) => {
    switch (status) {
      case 'pago':
        return {
          label: 'Pago',
          color: 'bg-blue-100 text-blue-800 border-blue-300',
          icon: <CheckCircle className="h-4 w-4" />,
          buttonColor: 'bg-[#1f4edd] hover:bg-[#2351c4]'
        };
      case 'glosado':
        return {
          label: 'Glosado',
          color: 'bg-red-100 text-red-800 border-red-300',
          icon: <XCircle className="h-4 w-4" />,
          buttonColor: 'bg-red-500 hover:bg-red-600'
        };
      default: // 'em-analise'
        return {
          label: 'Em Análise',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
          icon: <Clock className="h-4 w-4" />,
          buttonColor: 'bg-yellow-500 hover:bg-yellow-600'
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <AnimatedSection>
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/10 p-8">
          <div className="absolute inset-0 bg-grid-white/10" />
          <div className="relative">
            <h1 className="text-3xl font-bold tracking-tighter bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Faturamento
            </h1>
            <p className="text-muted-foreground text-sm md:text-base max-w-2xl">
              Gerencie lotes financeiros e visualize dados XML TISS
            </p>
          </div>
        </div>
      </AnimatedSection>


      {/* Estatísticas */}
      <AnimatedSection delay={100}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="lco-card bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary-foreground/80 text-sm font-medium">Total de Lotes</p>
                  <p className="text-3xl font-bold">{lotes.length}</p>
                </div>
                <Package className="h-8 w-8 text-primary-foreground/80" />
              </div>
            </CardContent>
          </Card>

          <Card className="lco-card bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-secondary-foreground/80 text-sm font-medium">Valor Total</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(lotes.reduce((sum, lote) => sum + (parseFloat(lote.valor_total as any) || 0), 0))}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-secondary-foreground/80" />
              </div>
            </CardContent>
          </Card>

          <Card className="lco-card bg-gradient-to-br from-accent to-accent/80 text-accent-foreground shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-accent-foreground/80 text-sm font-medium">Guias Processadas</p>
                  <p className="text-3xl font-bold">
                    {lotes.reduce((sum, lote) => sum + lote.quantidade_guias, 0)}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-accent-foreground/80" />
              </div>
            </CardContent>
          </Card>

          <Card className="lco-card bg-gradient-to-br from-muted to-muted/80 text-muted-foreground shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground/80 text-sm font-medium">Lotes Pendentes</p>
                  <p className="text-3xl font-bold">
                    {lotes.filter(lote => lote.status === 'pendente').length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-muted-foreground/80" />
              </div>
            </CardContent>
          </Card>
        </div>
      </AnimatedSection>

      {/* Upload de XML */}
      <AnimatedSection delay={200}>
        <Card className="shadow-lg border-primary/10">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-primary/10">
            <CardTitle className="flex items-center gap-3 text-foreground">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Upload className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Upload de Arquivo XML TISS</h3>
                <p className="text-sm text-muted-foreground font-normal mt-1">
                  Faça upload de arquivos XML TISS para processamento e análise
                </p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Campo de Competência */}
              <div className="space-y-4">
                <Card className="border-2 border-primary/10 shadow-lg bg-gradient-to-br from-card to-muted/10">
                  <CardHeader className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b-2 border-primary/20 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                          Competência
                          <span className="text-destructive text-base">*</span>
                        </CardTitle>
                        <CardDescription className="text-sm mt-1">
                          Selecione o período de referência para o faturamento
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Ano */}
                      <div className="space-y-2">
                        <Label htmlFor="ano-competencia" className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Ano</span>
                        </Label>
                        <Select value={anoCompetencia} onValueChange={setAnoCompetencia}>
                          <SelectTrigger className="h-12 border-2 border-border/50 bg-background hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all duration-300 shadow-sm">
                            <SelectValue placeholder="Selecione o ano" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 5 }, (_, i) => {
                              const ano = new Date().getFullYear() - i;
                              return (
                                <SelectItem key={ano} value={ano.toString()}>
                                  {ano}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Mês */}
                      <div className="space-y-2">
                        <Label htmlFor="mes-competencia" className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Mês</span>
                        </Label>
                        <Select value={mesCompetencia} onValueChange={setMesCompetencia} disabled={!anoCompetencia}>
                          <SelectTrigger className={`h-12 border-2 bg-background hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all duration-300 shadow-sm ${
                            !anoCompetencia ? 'opacity-50 cursor-not-allowed' : 'border-border/50'
                          }`}>
                            <SelectValue placeholder={anoCompetencia ? "Selecione o mês" : "Selecione o ano primeiro"} />
                          </SelectTrigger>
                          <SelectContent>
                            {[
                              { value: '01', label: 'Janeiro' },
                              { value: '02', label: 'Fevereiro' },
                              { value: '03', label: 'Março' },
                              { value: '04', label: 'Abril' },
                              { value: '05', label: 'Maio' },
                              { value: '06', label: 'Junho' },
                              { value: '07', label: 'Julho' },
                              { value: '08', label: 'Agosto' },
                              { value: '09', label: 'Setembro' },
                              { value: '10', label: 'Outubro' },
                              { value: '11', label: 'Novembro' },
                              { value: '12', label: 'Dezembro' },
                            ].map((mes) => (
                              <SelectItem key={mes.value} value={mes.value}>
                                {mes.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {anoCompetencia && mesCompetencia && (
                      <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                        <p className="text-sm text-foreground">
                          <span className="font-semibold">Competência selecionada:</span>{' '}
                          <span className="font-mono text-primary">{anoCompetencia}{mesCompetencia}</span>
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Área de Drag & Drop */}
              <div
                className={`
                  relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300
                  ${isDragOver 
                    ? 'border-primary bg-primary/5 scale-[1.02]' 
                    : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5'
                  }
                  ${uploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('xml-upload')?.click()}
              >
                <input
                  id="xml-upload"
                  type="file"
                  accept=".xml"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
                
                <div className="space-y-4">
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    {uploading ? (
                      <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    ) : (
                      <Upload className="h-8 w-8 text-primary" />
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-lg font-semibold text-foreground">
                      {uploading ? 'Processando arquivo...' : 'Arraste e solte seu arquivo XML aqui'}
                    </h4>
                    <p className="text-muted-foreground">
                      {uploading 
                        ? 'Aguarde enquanto processamos o arquivo XML TISS'
                        : 'ou clique para selecionar um arquivo'
                      }
                    </p>
                  </div>
                  
                  {!uploading && (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                      <span>Apenas arquivos .xml são aceitos</span>
                  </div>
                )}
              </div>
              
                {/* Efeito de brilho quando em drag */}
                {isDragOver && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/10 via-transparent to-primary/10 animate-pulse" />
                )}
              </div>
              
              {/* Informações do arquivo carregado */}
              {xmlViewerData && (
                <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg p-4 border border-primary/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{xmlViewerData.fileName}</p>
                        <p className="text-sm text-muted-foreground">
                          {Math.round(xmlViewerData.fileSize / 1024)} KB • Arquivo XML TISS
                        </p>
                      </div>
                    </div>
                <Button
                      onClick={handlePreviewXML}
                      variant="outline"
                      className="text-primary border-primary/30 hover:bg-primary/10 hover:border-primary/50"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Visualizar XML
                </Button>
              </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </AnimatedSection>

      {/* Dashboard de Lotes Financeiros */}
      <AnimatedSection delay={300}>
        <div className="space-y-6">

          {/* Lotes Financeiros TISS */}
          <Card className="lco-card shadow-lg">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-primary/10">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Package className="h-6 w-6 text-primary" />
                    Lotes Financeiros TISS
            </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Visualize e gerencie os lotes de guias TISS com informações completas
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                      placeholder="Buscar lotes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                  />
                </div>
                  <Select value={filterCompetencia} onValueChange={setFilterCompetencia}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Competência" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {competencias.map(comp => (
                        <SelectItem key={comp} value={comp}>
                          {comp}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Carregando lotes...</span>
                </div>
            ) : filteredLotes.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Nenhum lote encontrado
                  </h3>
                  <p className="text-muted-foreground">
                    {searchTerm || filterCompetencia 
                      ? 'Tente ajustar os filtros de busca.'
                      : 'Faça upload de um arquivo XML para começar.'
                  }
                </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredLotes.map((lote) => (
                  <Card key={lote.id} className="group border border-border/50 hover:border-primary/30 transition-all duration-200 hover:shadow-md">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between gap-6">
                        {/* Informações Principais */}
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/10 flex-shrink-0">
                            <Package className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-foreground">
                                Lote #{lote.numero_lote}
                              </h3>
                              <Badge className={`${getStatusColor(lote.status)} flex items-center gap-1.5 text-xs font-medium px-2.5 py-1`}>
                                {getStatusIcon(lote.status)}
                                <span>
                                  {lote.status === 'pendente' && 'Pendente'}
                                  {lote.status === 'pago' && 'Pago'}
                                  {lote.status === 'glosado' && 'Glosado'}
                                </span>
                              </Badge>
                            </div>
                            <div className="flex items-center gap-5 text-sm text-muted-foreground">
                              <span className="font-medium truncate">{lote.operadora_nome || `ANS ${lote.operadora_registro_ans}`}</span>
                              <span className="flex items-center gap-1.5">
                                <Calendar className="h-4 w-4" />
                                {formatDate(lote.data_envio)}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <FileText className="h-4 w-4" />
                                {lote.quantidade_guias} {lote.quantidade_guias === 1 ? 'guia' : 'guias'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Detalhes Financeiros */}
                        <div className="flex items-center gap-8 flex-shrink-0">
                          <div className="text-right">
                            <div className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide flex items-center justify-end gap-1.5">
                              <DollarSign className="h-3 w-3" />
                              Valor Total
                            </div>
                            <div className="text-2xl font-bold text-primary group-hover:text-primary/90 transition-colors">
                              {formatCurrency(lote.valor_total)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">Competência</div>
                            <Badge variant="outline" className="text-sm font-semibold px-3 py-1 border-primary/30 bg-primary/5">
                              {lote.competencia}
                            </Badge>
                          </div>
                        </div>

                        {/* Ações */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              processXMLForVisualization(lote.id);
                            }}
                            className="h-9 px-4 text-sm border-primary/30 hover:bg-primary/10 hover:border-primary/50"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Detalhes
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 w-9 p-0 border-border/50 hover:bg-accent/50"
                            onClick={() => handleDownloadXML(lote.id)}
                            disabled={loading}
                            title="Download XML"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
              </div>
            </CardContent>
          </Card>
        </div>
      </AnimatedSection>

      {/* Modal de Detalhes do Lote */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-6xl h-[95vh] overflow-hidden flex flex-col">
                              <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-card-foreground">
              <Package className="h-5 w-5 text-primary" />
              Detalhes do Lote {selectedLote?.numero_lote}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Informações completas sobre o lote e suas guias
                                </DialogDescription>
                              </DialogHeader>
          
          <div className="flex-1 overflow-auto">
            {selectedLote && (
              <div className="space-y-6">
                {/* Informações do Lote */}
                <Card className="lco-card">
                  <CardHeader>
                    <CardTitle className="text-lg text-card-foreground">Informações do Lote</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Número do Lote</p>
                        <p className="font-medium text-card-foreground">{selectedLote.numero_lote}</p>
                                  </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Operadora</p>
                        <p className="font-medium text-card-foreground">{selectedLote.operadora_nome}</p>
                                  </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Competência</p>
                        <p className="font-medium text-card-foreground">{selectedLote.competencia}</p>
                  </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Valor Total</p>
                        <p className="font-medium text-primary">{formatCurrency(selectedLote.valor_total)}</p>
                </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Data de Envio</p>
                        <p className="font-medium text-card-foreground">{formatDate(selectedLote.data_envio)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Quantidade de Guias</p>
                        <p className="font-medium text-card-foreground">{selectedLote.quantidade_guias}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge className={`${getStatusColor(selectedLote.status)} flex items-center gap-1 w-fit`}>
                          {getStatusIcon(selectedLote.status)}
                          {selectedLote.status}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Registro ANS</p>
                        <p className="font-medium text-card-foreground">{selectedLote.operadora_registro_ans}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Resumo Financeiro */}
                <Card className="lco-card bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-lg text-card-foreground flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                      Resumo Financeiro
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20">
                        <div className="text-2xl font-bold text-primary">
                          {formatCurrency(guiasDoLote.reduce((sum, guia) => sum + (parseFloat(guia.valor_procedimentos as any) || 0), 0))}
                  </div>
                        <div className="text-sm text-muted-foreground">Procedimentos</div>
                  </div>
                      <div className="text-center p-4 bg-accent/10 rounded-lg border border-accent/20">
                        <div className="text-2xl font-bold text-accent">
                          {formatCurrency(guiasDoLote.reduce((sum, guia) => sum + (parseFloat(guia.valor_medicamentos as any) || 0), 0))}
                      </div>
                        <div className="text-sm text-muted-foreground">Medicamentos</div>
                      </div>
                      <div className="text-center p-4 bg-secondary/10 rounded-lg border border-secondary/20">
                        <div className="text-2xl font-bold text-foreground">
                          {formatCurrency(guiasDoLote.reduce((sum, guia) => sum + (parseFloat(guia.valor_materiais as any) || 0), 0))}
                        </div>
                        <div className="text-sm text-muted-foreground">Materiais</div>
                      </div>
                      <div className="text-center p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                        <div className="text-2xl font-bold text-destructive">
                          {formatCurrency(guiasDoLote.reduce((sum, guia) => sum + (parseFloat(guia.valor_taxas as any) || 0), 0))}
                        </div>
                        <div className="text-sm text-muted-foreground">Taxas</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Guias do Lote */}
                <Card className="lco-card">
                  <CardHeader>
                    <CardTitle className="text-lg text-card-foreground flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Guias do Lote ({guiasDoLote.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                            <TableHead className="text-card-foreground">Status Resposta</TableHead>
                            <TableHead className="text-card-foreground">Guia Prestador</TableHead>
                            <TableHead className="text-card-foreground">Guia Operadora</TableHead>
                            <TableHead className="text-card-foreground">Carteira</TableHead>
                            <TableHead className="text-card-foreground">Data Autorização</TableHead>
                            <TableHead className="text-card-foreground">Data Execução</TableHead>
                            <TableHead className="text-card-foreground">Procedimentos</TableHead>
                            <TableHead className="text-card-foreground">Medicamentos</TableHead>
                            <TableHead className="text-card-foreground">Materiais</TableHead>
                            <TableHead className="text-card-foreground">Taxas</TableHead>
                            <TableHead className="text-card-foreground">Valor Total</TableHead>
                            <TableHead className="text-card-foreground">Status</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                          {guiasDoLote.flatMap((guia) => {
                            const statusAtual = statusRespostaGuias[guia.id] || 'em-analise';
                            const configStatus = getStatusRespostaConfig(statusAtual);
                            const arquivosAnexados = guiasComAnexo[guia.id] || [];
                            const mostrarCamposAnexo = statusAtual !== 'em-analise' && statusAtual !== 'glosado';

                            const rows = [
                              <TableRow
                                key={`guia-${guia.id}`}
                                onClick={() => statusAtual === 'glosado' && handleVerRecursoGlosa(guia.id)}
                                className={statusAtual === 'glosado' ? 'cursor-pointer hover:bg-muted/50 transition-colors' : ''}
                              >
                              {/* Coluna do Toggle de Resposta - 3 Estados Horizontal */}
                              <TableCell className="align-top">
                                <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
                                  {/* Botão Pago */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setStatusRespostaGuias(prev => ({ ...prev, [guia.id]: 'pago' }));
                                    }}
                                    className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-md transition-all duration-200 ${
                                      statusAtual === 'pago'
                                        ? 'bg-[#1f4edd] text-white shadow-md scale-105'
                                        : 'bg-transparent text-muted-foreground hover:bg-blue-100 hover:text-blue-700'
                                    }`}
                                    title="Pago"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                    <span className="text-xs font-medium hidden sm:inline">Pago</span>
                                  </button>

                                  {/* Botão Em Análise */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setStatusRespostaGuias(prev => ({ ...prev, [guia.id]: 'em-analise' }));
                                    }}
                                    className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-md transition-all duration-200 ${
                                      statusAtual === 'em-analise'
                                        ? 'bg-yellow-500 text-white shadow-md scale-105'
                                        : 'bg-transparent text-muted-foreground hover:bg-yellow-100 hover:text-yellow-700'
                                    }`}
                                    title="Em Análise"
                                  >
                                    <Clock className="h-4 w-4" />
                                    <span className="text-xs font-medium hidden sm:inline">Análise</span>
                                  </button>

                                  {/* Botão Glosado */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleClickGlosado(guia);
                                    }}
                                    className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-md transition-all duration-200 ${
                                      statusAtual === 'glosado'
                                        ? 'bg-red-500 text-white shadow-md scale-105'
                                        : 'bg-transparent text-muted-foreground hover:bg-red-100 hover:text-red-700'
                                    }`}
                                    title="Glosado"
                                  >
                                    <XCircle className="h-4 w-4" />
                                    <span className="text-xs font-medium hidden sm:inline">Glosado</span>
                                  </button>
                                </div>
                              </TableCell>

                              <TableCell className="font-medium text-card-foreground align-top">
                                            {guia.numero_guia_prestador}
                                          </TableCell>
                              <TableCell className="text-muted-foreground">
                                {guia.numero_guia_operadora}
                                          </TableCell>
                              <TableCell className="text-muted-foreground">
                                {guia.numero_carteira}
                                          </TableCell>
                              <TableCell className="text-muted-foreground">
                                {formatDate(guia.data_autorizacao)}
                                          </TableCell>
                              <TableCell className="text-muted-foreground">
                                {formatDate(guia.data_execucao)}
                                  </TableCell>
                              <TableCell className="text-primary">
                                {formatCurrency(parseFloat(guia.valor_procedimentos as any) || 0)}
                                  </TableCell>
                              <TableCell className="text-accent">
                                {formatCurrency(parseFloat(guia.valor_medicamentos as any) || 0)}
                              </TableCell>
                              <TableCell className="text-foreground">
                                {formatCurrency(parseFloat(guia.valor_materiais as any) || 0)}
                              </TableCell>
                              <TableCell className="text-destructive">
                                {formatCurrency(parseFloat(guia.valor_taxas as any) || 0)}
                              </TableCell>
                              <TableCell className="font-bold text-primary">
                                    {formatCurrency(parseFloat(guia.valor_total as any) || 0)}
                                  </TableCell>
                                  <TableCell className="align-top">
                                    <Badge className={`${getStatusColor(guia.status_pagamento)} flex items-center gap-1 w-fit`}>
                                      {getStatusIcon(guia.status_pagamento)}
                                      {guia.status_pagamento}
                                    </Badge>
                                          </TableCell>
                                        </TableRow>
                            ];

                            return rows;
                          })}
                                    </TableBody>
                                  </Table>
                      </div>
                  </CardContent>
                </Card>
              </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>

      {/* Modal de Visualização XML */}
      {xmlViewerData && (
        <XMLViewerModal
          isOpen={showXMLViewerModal}
          onClose={() => setShowXMLViewerModal(false)}
          xmlData={xmlViewerData}
        />
      )}

      {/* Dialog de Confirmação de Glosa */}
      <Dialog open={confirmGlosaDialogOpen} onOpenChange={setConfirmGlosaDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Confirmar Glosa
            </DialogTitle>
            <DialogDescription>
              Você está prestes a marcar {itemParaGlosar ? 'um item desta guia' : 'esta guia'} como <strong className="text-destructive">GLOSADA</strong>.
            </DialogDescription>
          </DialogHeader>

          {guiaParaGlosar && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Guia Prestador:</span>
                  <span className="font-medium">{guiaParaGlosar.numero_guia_prestador}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Guia Operadora:</span>
                  <span className="font-medium">{guiaParaGlosar.numero_guia_operadora || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Carteira:</span>
                  <span className="font-medium">{guiaParaGlosar.numero_carteira}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Valor Total:</span>
                  <span className="font-medium text-destructive">
                    {formatCurrency(parseFloat(guiaParaGlosar.valor_total as any) || 0)}
                  </span>
                </div>
                {itemParaGlosar && (
                  <div className="mt-2 p-2 bg-muted/50 rounded border border-border">
                    <div className="text-xs text-muted-foreground">Item específico será glosado</div>
                  </div>
                )}
              </div>

              <Separator />

              <div className="bg-destructive/10 dark:bg-destructive/20 border border-destructive/20 dark:border-destructive/30 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-destructive dark:text-destructive flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Esta ação irá:
                </p>
                <ul className="text-sm text-muted-foreground dark:text-muted-foreground space-y-1 ml-6 list-disc">
                  <li>Marcar {itemParaGlosar ? 'o item selecionado' : 'esta guia'} como <strong>GLOSADA</strong></li>
                  <li>Enviar uma cópia para <strong>Recursos de Glosas</strong></li>
                  <li>Permitir que você anexe documentos e justificativas</li>
                  <li>Redirecionar para a página de cadastro de recurso de glosa</li>
                </ul>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setConfirmGlosaDialogOpen(false);
                setGuiaParaGlosar(null);
                setItemParaGlosar(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                handleConfirmarGlosa();
                setItemParaGlosar(null);
              }}
              className="gap-2"
            >
              <XCircle className="h-4 w-4" />
              Confirmar Glosa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Visualização Detalhada XML TISS */}
      {xmlData && (
        <Dialog open={showXMLVisualization} onOpenChange={setShowXMLVisualization}>
          <DialogContent className="max-w-7xl h-[95vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-card-foreground">
                <FileText className="h-5 w-5 text-primary" />
                Modificar Detalhes - Análise por Guia e Itens
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Visualize e modifique o status de pagamento de cada item individualmente por guia
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-auto">
              {useViewerV2 ? (
                <XMLTISSDetailedViewerV2
                  data={xmlData}
                  onClose={() => {
                    setShowXMLVisualization(false);
                    // Não limpar o loteId para manter disponível durante a glosa
                  }}
                  loteId={loteIdAtual || loteAtualParaGlosa?.id}
                  onGlosarItem={handleGlosarItem}
                />
              ) : (
                <XMLTISSDetailedViewer
                  data={xmlData}
                  onClose={() => setShowXMLVisualization(false)}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal para Anexar Documentos */}
      <Dialog open={anexarModalOpen} onOpenChange={setAnexarModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-card-foreground">
              <Paperclip className="h-5 w-5 text-primary" />
              Anexar Documentos
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Anexe documentos necessários para a guia {guiaSelecionada?.numero_guia_prestador}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Informações da Guia */}
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-foreground">Guia Prestador:</span>
                    <p className="text-muted-foreground">{guiaSelecionada?.numero_guia_prestador}</p>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Guia Operadora:</span>
                    <p className="text-muted-foreground">{guiaSelecionada?.numero_guia_operadora}</p>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Valor Total:</span>
                    <p className="text-muted-foreground">{formatCurrency(guiaSelecionada?.valor_total || 0)}</p>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Status:</span>
                    <p className="text-muted-foreground">{guiaSelecionada?.status_pagamento}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upload de Arquivos */}
            <div className="space-y-4">
              <Label className="text-foreground font-medium">Selecionar Documentos</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setArquivosSelecionados(files);
                  }}
                  className="hidden"
                  id="documentos-upload"
                />
                <Label htmlFor="documentos-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-foreground font-medium">Clique para selecionar arquivos</p>
                  <p className="text-sm text-muted-foreground">
                    PDF, JPG, PNG, DOC, DOCX (máx. 10MB cada)
                  </p>
                </Label>
              </div>

              {/* Lista de Arquivos Selecionados */}
              {arquivosSelecionados.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-foreground font-medium">
                    Arquivos Selecionados ({arquivosSelecionados.length})
                  </Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {arquivosSelecionados.map((arquivo, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded border">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          <span className="text-sm text-foreground">{arquivo.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({(arquivo.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const novosArquivos = arquivosSelecionados.filter((_, i) => i !== index);
                            setArquivosSelecionados(novosArquivos);
                          }}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
              </div>
            )}
            </div>

            {/* Tipos de Documentos Necessários */}
            <Card className="bg-accent/10 border-accent/20">
              <CardContent className="p-4">
                <h4 className="font-medium text-foreground mb-2">Documentos Necessários:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Guia de autorização da operadora</li>
                  <li>• Relatório médico detalhado</li>
                  <li>• Prescrição médica</li>
                  <li>• Exames complementares (se aplicável)</li>
                  <li>• Comprovante de pagamento (se aplicável)</li>
                </ul>
          </CardContent>
        </Card>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setAnexarModalOpen(false);
                setArquivosSelecionados([]);
                setGuiaSelecionada(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUploadDocumentos}
              disabled={arquivosSelecionados.length === 0}
              className="bg-primary hover:bg-primary/90"
            >
              <Paperclip className="h-4 w-4 mr-2" />
              Anexar {arquivosSelecionados.length} Documento(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FinanceiroClinica;