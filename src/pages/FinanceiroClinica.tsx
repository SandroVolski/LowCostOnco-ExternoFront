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
import { FinanceiroService, LoteFinanceiro, GuiaFinanceira } from '@/services/financeiro';
import AnimatedSection from '@/components/AnimatedSection';
import XMLViewerModal from '@/components/XMLViewerModal';
import XMLTISSDetailedViewer from '@/components/XMLTISSDetailedViewer';

const FinanceiroClinica = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Estados principais
  const [lotes, setLotes] = useState<LoteFinanceiro[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
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
  const [statusRespostaGuias, setStatusRespostaGuias] = useState<Record<number, StatusResposta>>({});
  const [guiasComAnexo, setGuiasComAnexo] = useState<Record<number, File[]>>({});

  // Estados para confirmação de glosa
  const [confirmGlosaDialogOpen, setConfirmGlosaDialogOpen] = useState(false);
  const [guiaParaGlosar, setGuiaParaGlosar] = useState<GuiaFinanceira | null>(null);

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
  
  // Estado para drag & drop
  const [isDragOver, setIsDragOver] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
      loadLotes();
  }, []);

  // Recarregar guias quando a janela ganhar foco (voltando de outra página)
  useEffect(() => {
    const handleFocus = () => {
      if (selectedLote) {
        console.log('🔄 Recarregando guias do lote após voltar para a página');
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

  const loadGuiasDoLote = async (loteId: number) => {
    try {
      const items: any[] = await FinanceiroService.getGuiasByLoteId(loteId);
      console.log('Items carregados do backend:', items); // Debug temporário

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

        console.log(`Guia ${guia.id}:`, {
          procedimentos: procedimentos.length,
          procedimentosData: procedimentos,
          valorTotalGuia: guia.valor_total
        });

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

        console.log(`Valores calculados para guia ${guia.id}:`, {
          procedimentos: guia.valor_procedimentos,
          medicamentos: guia.valor_medicamentos,
          materiais: guia.valor_materiais,
          taxas: guia.valor_taxas,
          valorTotal: guia.valor_total,
          valorRestante: valorRestante
        });
      }

      console.log('Guias convertidas:', guiasConvertidas); // Debug temporário
      setGuiasDoLote(guiasConvertidas);

      // Atualizar statusRespostaGuias com os status do banco
      const novosStatus: Record<number, 'pago' | 'em_analise' | 'glosado'> = {};
      guiasConvertidas.forEach(guia => {
        if (guia.status_pagamento === 'glosado') {
          novosStatus[guia.id] = 'glosado';
        } else if (guia.status_pagamento === 'pago') {
          novosStatus[guia.id] = 'pago';
        } else {
          novosStatus[guia.id] = 'em_analise';
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

  // Função para confirmar glosa e enviar para Recursos de Glosas
  const handleConfirmarGlosa = () => {
    if (!guiaParaGlosar) return;

    // Marcar a guia como glosada
    setStatusRespostaGuias(prev => ({
      ...prev,
      [guiaParaGlosar.id]: 'glosado'
    }));

    // Navegar para Recursos de Glosas com os dados da guia e do lote
    navigate('/recursos-glosas/novo', {
      state: {
        guia: guiaParaGlosar,
        lote: selectedLote
      }
    });

    // Fechar o dialog
    setConfirmGlosaDialogOpen(false);
    setGuiaParaGlosar(null);

    toast({
      title: 'Guia Glosada',
      description: 'A guia foi marcada como glosada e enviada para Recursos de Glosas.',
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

      // Buscar dados completos do lote e todos os itens
      const loteData = await FinanceiroService.getLoteById(loteId);
      const allItems: any[] = await FinanceiroService.getGuiasByLoteId(loteId);

      console.log('=== DEBUG LOTE ===');
      console.log('Dados do lote COMPLETOS:', loteData);
      console.log('Todos os itens:', allItems);
      console.log('Campos do cabeçalho:');
      console.log('  - tipo_transacao:', loteData.tipo_transacao);
      console.log('  - sequencial_transacao:', loteData.sequencial_transacao);
      console.log('  - cnpj_prestador:', loteData.cnpj_prestador);
      console.log('  - operadora_registro_ans:', loteData.operadora_registro_ans);
      console.log('  - numero_lote:', loteData.numero_lote);
      console.log('  - cnes:', loteData.cnes);
      console.log('==================');

      // Separar guias dos itens filhos
      const guiasData = allItems.filter(item => item.tipo_item === 'guia');

      // Para cada guia, buscar seus itens filhos
      const guiasProcessadas = guiasData.map((guia: any) => {
        // Buscar procedimentos, medicamentos, materiais e taxas desta guia
        const procedimentos = allItems.filter(item =>
          item.parent_id === guia.id && item.tipo_item === 'procedimento'
        );

        const medicamentos = allItems.filter(item =>
          item.parent_id === guia.id && item.tipo_item === 'despesa' &&
          (item.codigo_despesa === '02' || item.codigo_item?.startsWith('90'))
        );

        const materiais = allItems.filter(item =>
          item.parent_id === guia.id && item.tipo_item === 'despesa' &&
          (item.codigo_despesa === '03' || item.codigo_item?.startsWith('7'))
        );

        const taxas = allItems.filter(item =>
          item.parent_id === guia.id && item.tipo_item === 'despesa' &&
          (item.codigo_despesa === '07' || item.codigo_item?.startsWith('6'))
        );

        console.log(`Guia ${guia.id}:`, {
          procedimentos: procedimentos.length,
          medicamentos: medicamentos.length,
          materiais: materiais.length,
          taxas: taxas.length
        });

        return {
          cabecalhoGuia: {
            numeroGuiaPrestador: guia.numero_guia_prestador || 'N/A',
          },
          dadosBeneficiario: {
            numeroCarteira: guia.numero_carteira || 'N/A',
          },
          dadosAutorizacao: {
            dataAutorizacao: guia.data_autorizacao || 'N/A',
            senha: guia.senha || guia.numero_guia_prestador || 'N/A',
          },
          dadosSolicitante: {
            profissional: {
              nomeProfissional: guia.profissional_nome || 'N/A',
              conselhoProfissional: guia.profissional_conselho || 'N/A',
              numeroConselhoProfissional: guia.profissional_numero_conselho || 'N/A',
            },
          },
          dadosSolicitacao: {
            indicacaoClinica: guia.indicacao_clinica || 'N/A',
          },
          procedimentos: procedimentos.map((proc: any) => ({
            data_execucao: proc.data_execucao,
            codigo_procedimento: proc.codigo_item,
            descricao_procedimento: proc.descricao_item,
            quantidade_executada: parseFloat(proc.quantidade_executada) || 0,
            unidade_medida: proc.unidade_medida,
            valor_total: parseFloat(proc.valor_total) || 0,
          })),
          medicamentos: medicamentos.map((med: any) => ({
            data_execucao: med.data_execucao,
            codigo_medicamento: med.codigo_item,
            descricao: med.descricao_item,
            quantidade_executada: parseFloat(med.quantidade_executada) || 0,
            unidade_medida: med.unidade_medida,
            valor_total: parseFloat(med.valor_total) || 0,
          })),
          materiais: materiais.map((mat: any) => ({
            data_execucao: mat.data_execucao,
            codigo_material: mat.codigo_item,
            descricao: mat.descricao_item,
            quantidade_executada: parseFloat(mat.quantidade_executada) || 0,
            unidade_medida: mat.unidade_medida,
            valor_total: parseFloat(mat.valor_total) || 0,
          })),
          taxas: taxas.map((taxa: any) => ({
            data_execucao: taxa.data_execucao,
            codigo_taxa: taxa.codigo_item,
            descricao: taxa.descricao_item,
            quantidade_executada: parseFloat(taxa.quantidade_executada) || 0,
            valor_total: parseFloat(taxa.valor_total) || 0,
          })),
          profissionais: guia.executante_nome ? [{
            nome: guia.executante_nome,
            conselho: guia.executante_conselho,
            numero_conselho: guia.executante_numero_conselho,
            uf: guia.executante_uf,
            cbos: guia.executante_cbos,
          }] : [],
          valorTotal: {
            valorProcedimentos: procedimentos.reduce((sum: number, item: any) => sum + (parseFloat(item.valor_total) || 0), 0),
            valorMedicamentos: medicamentos.reduce((sum: number, item: any) => sum + (parseFloat(item.valor_total) || 0), 0),
            valorMateriais: materiais.reduce((sum: number, item: any) => sum + (parseFloat(item.valor_total) || 0), 0),
            valorTaxasAlugueis: taxas.reduce((sum: number, item: any) => sum + (parseFloat(item.valor_total) || 0), 0),
            valorTotalGeral: parseFloat(guia.valor_total) || 0,
          },
        };
      });

      // Calcular totais consolidados de todas as guias
      const totalProcedimentos = guiasProcessadas.reduce((sum, guia) =>
        sum + (guia.valorTotal?.valorProcedimentos || 0), 0
      );
      const totalMedicamentos = guiasProcessadas.reduce((sum, guia) =>
        sum + (guia.valorTotal?.valorMedicamentos || 0), 0
      );
      const totalMateriais = guiasProcessadas.reduce((sum, guia) =>
        sum + (guia.valorTotal?.valorMateriais || 0), 0
      );
      const totalTaxas = guiasProcessadas.reduce((sum, guia) =>
        sum + (guia.valorTotal?.valorTaxasAlugueis || 0), 0
      );

      // Coletar todos os profissionais únicos de todas as guias
      const todosProfissionais: any[] = [];
      guiasProcessadas.forEach((guia: any) => {
        // Buscar dados da guia original do banco (contém UF e CBOS)
        const guiaOriginal = guiasData.find(g => g.numero_guia_prestador === guia.cabecalhoGuia?.numeroGuiaPrestador);

        // Adicionar profissional solicitante
        if (guia.dadosSolicitante?.profissional?.nomeProfissional &&
            guia.dadosSolicitante.profissional.nomeProfissional !== 'N/A') {
          const profExiste = todosProfissionais.find(p =>
            p.nome === guia.dadosSolicitante.profissional.nomeProfissional &&
            p.guia === guia.cabecalhoGuia?.numeroGuiaPrestador
          );
          if (!profExiste) {
            todosProfissionais.push({
              nome: guia.dadosSolicitante.profissional.nomeProfissional,
              conselho: guia.dadosSolicitante.profissional.conselhoProfissional,
              numero_conselho: guia.dadosSolicitante.profissional.numeroConselhoProfissional,
              uf: guiaOriginal?.profissional_uf || 'N/A',
              cbos: guiaOriginal?.profissional_cbos || 'N/A',
              guia: guia.cabecalhoGuia?.numeroGuiaPrestador || 'N/A',  // ✅ Adicionar número da guia
            });
          }
        }

        // Adicionar profissionais executantes dos procedimentos
        const procedimentos = allItems.filter(item =>
          item.parent_id === guiaOriginal?.id && item.tipo_item === 'procedimento'
        );

        procedimentos.forEach((proc: any) => {
          if (proc.executante_nome && proc.executante_nome !== 'N/A') {
            const profExiste = todosProfissionais.find(p =>
              p.nome === proc.executante_nome &&
              p.guia === guia.cabecalhoGuia?.numeroGuiaPrestador
            );
            if (!profExiste) {
              todosProfissionais.push({
                nome: proc.executante_nome,
                conselho: proc.executante_conselho || 'N/A',
                numero_conselho: proc.executante_numero_conselho || 'N/A',
                uf: proc.executante_uf || 'N/A',
                cbos: proc.executante_cbos || 'N/A',
                guia: guia.cabecalhoGuia?.numeroGuiaPrestador || 'N/A',  // ✅ Adicionar número da guia
              });
            }
          }
        });
      });

      // Se o backend já retornou dados estruturados, usar eles diretamente
      // Caso contrário, montar a estrutura manualmente
      const usarDadosBackend = loteData.cabecalho && loteData.lote;

      const processedData = usarDadosBackend ? {
        // Usar dados já estruturados do backend
        cabecalho: {
          ...loteData.cabecalho,
          registroANS: loteData.operadora?.registro_ans || loteData.cabecalho.registroANS,
        },
        lote: loteData.lote,
        guias: guiasProcessadas,  // SEMPRE usar guiasProcessadas (tem estrutura correta)
        totais: {
          totalGuias: guiasData.length,
          totalMedicamentos: totalMedicamentos,
          totalProcedimentos: totalProcedimentos,
          totalMateriais: totalMateriais,
          totalTaxas: totalTaxas,
          valorTotalGeral: parseFloat(loteData.lote?.valor_total || '0'),
          periodoInicio: loteData.lote?.data_envio,
          periodoFim: loteData.lote?.data_envio,
        },
        profissionais: todosProfissionais,
      } : {
        // Montar estrutura manualmente (fallback)
        cabecalho: {
          tipoTransacao: loteData.tipo_transacao || 'ENVIO_LOTE_GUIAS',
          sequencialTransacao: loteData.sequencial_transacao || loteData.numero_lote,
          dataRegistroTransacao: loteData.data_registro_transacao || loteData.data_envio,
          horaRegistroTransacao: loteData.hora_registro_transacao || new Date(loteData.created_at || loteData.data_envio).toLocaleTimeString('pt-BR'),
          cnpjPrestador: loteData.cnpj_prestador || 'Não informado',
          registroANS: loteData.operadora_registro_ans,
          numeroLote: loteData.numero_lote,
          padrao: loteData.padrao_tiss || '4.01.00',
          nomePrestador: loteData.nome_prestador || loteData.operadora_nome || 'Não informado',
          cnes: loteData.cnes || 'Não informado',
          hash: loteData.hash_lote || 'N/A',
        },
        lote: {
          numeroLote: loteData.numero_lote,
        },
        guias: guiasProcessadas,
        totais: {
          totalGuias: guiasData.length,
          totalMedicamentos: totalMedicamentos,
          totalProcedimentos: totalProcedimentos,
          totalMateriais: totalMateriais,
          totalTaxas: totalTaxas,
          valorTotalGeral: loteData.valor_total,
          periodoInicio: loteData.data_envio,
          periodoFim: loteData.data_envio,
        },
        profissionais: todosProfissionais,
      };

      console.log('=== DADOS ENVIADOS PARA VISUALIZAÇÃO ===');
      console.log('Usando dados do backend?', usarDadosBackend);
      console.log('Cabeçalho:', processedData.cabecalho);
      console.log('Totais:', processedData.totais);
      console.log('Quantidade de guias:', processedData.guias?.length);
      if (processedData.guias && processedData.guias.length > 0) {
        console.log('Primeira guia (detalhes COMPLETOS):', JSON.stringify(processedData.guias[0], null, 2));
        console.log('  - Procedimentos:', processedData.guias[0].procedimentos?.length || 0, processedData.guias[0].procedimentos);
        console.log('  - Medicamentos:', processedData.guias[0].medicamentos?.length || 0, processedData.guias[0].medicamentos);
        console.log('  - Materiais:', processedData.guias[0].materiais?.length || 0, processedData.guias[0].materiais);
        console.log('  - Taxas:', processedData.guias[0].taxas?.length || 0, processedData.guias[0].taxas);
        console.log('  - Valor Total:', processedData.guias[0].valorTotal);
      }
      console.log('Profissionais:', processedData.profissionais);
      console.log('========================================');
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

      // Processar o arquivo
      const formData = new FormData();
      formData.append('xml', file);
      formData.append('clinica_id', (user?.id || 0).toString());

      const result = await FinanceiroService.uploadXML(formData);
      
      toast({
        title: 'Sucesso',
        description: `XML processado com sucesso! Lote ${result.numero_lote} criado.`,
      });

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
      case 'pago': return 'bg-green-100 text-green-800';
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
          color: 'bg-green-100 text-green-800 border-green-300',
          icon: <CheckCircle className="h-4 w-4" />,
          buttonColor: 'bg-green-500 hover:bg-green-600'
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
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Financeiro
              </h1>
              <p className="text-muted-foreground text-sm md:text-base max-w-2xl">
                Gerencie lotes financeiros e visualize dados XML TISS
              </p>
            </div>
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
                <Loader2 className="h-8 w-8 animate-spin text-primary-green" />
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
              <div className="grid gap-6">
                {filteredLotes.map((lote) => (
                  <Card key={lote.id} className="group relative overflow-hidden bg-gradient-to-r from-card to-card/50 border border-border/50 hover:border-primary/30 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.02]">
                    {/* Efeito de brilho no hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <CardContent className="relative p-8">
                      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-center">
                        {/* Informações Principais */}
                        <div className="xl:col-span-4 space-y-4">
                          <div className="flex items-start gap-4">
                            <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors duration-300">
                              <Package className="h-6 w-6 text-primary" />
                            </div>
                            <div className="space-y-2">
                              <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                                Lote #{lote.numero_lote}
                              </h3>
                              <p className="text-muted-foreground font-medium">
                                {lote.operadora_nome || `Operadora ANS ${lote.operadora_registro_ans}`}
                              </p>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                                <span>Registro ANS: {lote.operadora_registro_ans}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-6 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span className="font-medium">{formatDate(lote.data_envio)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <FileText className="h-4 w-4" />
                              <span className="font-medium">{lote.quantidade_guias} guias</span>
                            </div>
                          </div>
                        </div>

                        {/* Detalhes Financeiros */}
                        <div className="xl:col-span-3 space-y-4">
                          <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl p-4 border border-primary/10">
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-muted-foreground">Valor Total</span>
                                <span className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                                  {formatCurrency(lote.valor_total)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-muted-foreground">Competência</span>
                                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 font-medium">
                                  {lote.competencia}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Status e Indicadores */}
                        <div className="xl:col-span-2 space-y-4">
                          <div className="flex flex-col items-center space-y-3">
                            <Badge className={`${getStatusColor(lote.status)} flex items-center gap-2 px-4 py-2 text-sm font-medium`}>
                              {getStatusIcon(lote.status)}
                              {lote.status === 'pendente' && 'Pendente'}
                              {lote.status === 'pago' && 'Pago'}
                              {lote.status === 'glosado' && 'Glosado'}
                            </Badge>
                            
                            {lote.status === 'pendente' && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>Aguardando processamento</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Ações */}
                        <div className="xl:col-span-3">
                          <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => processXMLForVisualization(lote.id)}
                              className="flex-1 gap-2 text-primary border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-all duration-300"
                            >
                              <FileText className="h-4 w-4" />
                              Ver XML
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedLote(lote);
                                setDialogOpen(true);
                                loadGuiasDoLote(lote.id);
                              }}
                              className="flex-1 gap-2 text-foreground border-border hover:bg-accent/10 hover:border-accent/30 transition-all duration-300"
                            >
                              <Eye className="h-4 w-4" />
                              Detalhes
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2 text-secondary border-secondary/30 hover:bg-secondary/10 hover:border-secondary/50 transition-all duration-300"
                              onClick={() => {
                                toast({
                                  title: 'Download',
                                  description: 'Funcionalidade de download será implementada.',
                                });
                              }}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Barra de Progresso (se aplicável) */}
                      {lote.status === 'pendente' && (
                        <div className="mt-6 pt-4 border-t border-border/50">
                          <div className="flex justify-between text-sm text-muted-foreground mb-2">
                            <span className="font-medium">Status do Processamento</span>
                            <span className="text-primary">Em análise</span>
                          </div>
                          <div className="w-full bg-muted/50 rounded-full h-2 overflow-hidden">
                            <div className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-300" style={{ width: '60%' }}></div>
                          </div>
                        </div>
                      )}
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
                                        ? 'bg-green-500 text-white shadow-md scale-105'
                                        : 'bg-transparent text-muted-foreground hover:bg-green-100 hover:text-green-700'
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

                            // Adicionar linha de anexos se necessário
                            if (mostrarCamposAnexo) {
                              rows.push(
                                <TableRow key={`guia-${guia.id}-anexos`} className="bg-muted/30">
                                    <TableCell colSpan={12} className="p-6">
                                      <Card className="border-2 border-dashed">
                                        <CardHeader>
                                          <div className="flex items-center justify-between">
                                            <CardTitle className="text-sm flex items-center gap-2">
                                              <Paperclip className="h-4 w-4" />
                                              Anexar Documentos e Enviar Resposta
                                            </CardTitle>
                                            <Badge className={`${configStatus.color}`}>{configStatus.label}</Badge>
                                          </div>
                                          <CardDescription>
                                            Selecione os documentos que deseja anexar à guia
                                          </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                          {/* Input de arquivos */}
                                          <div>
                                            <Label htmlFor={`file-input-${guia.id}`} className="text-sm font-medium">
                                              Selecionar Arquivos
                                            </Label>
                                            <Input
                                              id={`file-input-${guia.id}`}
                                              type="file"
                                              multiple
                                              onChange={(e) => {
                                                const files = Array.from(e.target.files || []);
                                                handleAnexarArquivosGuia(guia.id, files);
                                              }}
                                              className="mt-2"
                                            />
                                          </div>

                                          {/* Lista de arquivos anexados */}
                                          {arquivosAnexados.length > 0 && (
                                            <div className="space-y-2">
                                              <Label className="text-sm font-medium">
                                                Arquivos Anexados ({arquivosAnexados.length})
                                              </Label>
                                              <div className="space-y-2">
                                                {arquivosAnexados.map((arquivo, index) => (
                                                  <div key={index} className="flex items-center justify-between p-2 bg-background rounded border">
                                                    <div className="flex items-center gap-2">
                                                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                                                      <span className="text-sm">{arquivo.name}</span>
                                                      <span className="text-xs text-muted-foreground">
                                                        ({(arquivo.size / 1024).toFixed(2)} KB)
                                                      </span>
                                                    </div>
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      onClick={() => handleRemoverArquivoGuia(guia.id, index)}
                                                      className="text-destructive hover:text-destructive"
                                                    >
                                                      <X className="h-4 w-4" />
                                                    </Button>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}

                                          {/* Botão de enviar */}
                                          <div className="flex justify-end">
                                            <Button
                                              onClick={() => handleEnviarRespostaGuia(guia.id)}
                                              disabled={arquivosAnexados.length === 0}
                                              className="gap-2"
                                            >
                                              <Send className="h-4 w-4" />
                                              Enviar Resposta
                                            </Button>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    </TableCell>
                                  </TableRow>
                              );
                            }

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
              Você está prestes a marcar esta guia como <strong className="text-destructive">GLOSADA</strong>.
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
              </div>

              <Separator />

              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-destructive flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Esta ação irá:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                  <li>Marcar esta guia como <strong>GLOSADA</strong></li>
                  <li>Enviar uma cópia para <strong>Recursos de Glosas</strong></li>
                  <li>Permitir que você anexe documentos e justificativas</li>
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
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmarGlosa}
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
                Visualização Detalhada XML TISS
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Análise completa dos dados do arquivo XML
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-auto">
              <XMLTISSDetailedViewer
          data={xmlData}
          onClose={() => setShowXMLVisualization(false)}
        />
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