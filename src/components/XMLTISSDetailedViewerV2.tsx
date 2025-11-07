import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Checkbox } from './ui/checkbox';
import {
  FileText,
  Calendar,
  Building2,
  User,
  Hash,
  Stethoscope,
  Pill,
  Activity,
  Wrench,
  DollarSign,
  Users,
  ChevronDown,
  ChevronUp,
  Clock,
  Receipt,
  Package,
  ListChecks,
  Check,
  X,
  Info,
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

interface ItemFinanceiro {
  id?: string;
  tipo: 'procedimento' | 'medicamento' | 'material' | 'taxa';
  codigo: string;
  descricao: string;
  quantidade: number;
  unidade_medida?: string;
  valor_unitario?: number;
  valor_total: number;
  data_execucao: string;
  status_pagamento?: 'pago' | 'nao_pago' | 'glosado' | 'pendente';
  observacao_glosa?: string;
}

interface GuiaData {
  numero_guia: string;
  numero_carteira: string;
  data_autorizacao: string;
  senha: string;
  profissional_nome: string;
  profissional_conselho: string;
  profissional_numero_conselho: string;
  indicacao_clinica: string;
  valor_total_guia: number;
  itens: ItemFinanceiro[];
  profissionais_executantes: Array<{
    nome: string;
    conselho: string;
    numero_conselho: string;
    uf: string;
    cbos: string;
  }>;
}

interface XMLTISSDetailedViewerV2Props {
  data: any;
  onClose: () => void;
  onGlosarItem?: (numeroGuia: string, itemId: string, item: ItemFinanceiro, loteId: number) => void;
  loteId?: number;
}

const XMLTISSDetailedViewerV2: React.FC<XMLTISSDetailedViewerV2Props> = ({
  data,
  onClose,
  onGlosarItem,
  loteId
}) => {
  // Processar dados para agrupar por guia
  const processarDadosPorGuia = (): GuiaData[] => {
    if (!data.guias) return [];

    return data.guias.map((guia: any) => {
      const itens: ItemFinanceiro[] = [];

      // Adicionar procedimentos
      guia.procedimentos?.forEach((proc: any) => {
        itens.push({
          id: `proc-${proc.codigo_procedimento}-${proc.data_execucao}`,
          tipo: 'procedimento',
          codigo: proc.codigo_procedimento || 'N/A',
          descricao: proc.descricao_procedimento || 'N/A',
          quantidade: proc.quantidade_executada || 0,
          unidade_medida: proc.unidade_medida || '',
          valor_total: proc.valor_total || 0,
          data_execucao: proc.data_execucao,
          status_pagamento: proc.status_pagamento || 'pendente'
        });
      });

      // Adicionar medicamentos
      guia.medicamentos?.forEach((med: any) => {
        itens.push({
          id: `med-${med.codigo_medicamento}-${med.data_execucao}`,
          tipo: 'medicamento',
          codigo: med.codigo_medicamento || 'N/A',
          descricao: med.descricao || 'N/A',
          quantidade: med.quantidade_executada || 0,
          unidade_medida: med.unidade_medida || '',
          valor_total: med.valor_total || 0,
          data_execucao: med.data_execucao,
          status_pagamento: med.status_pagamento || 'pendente'
        });
      });

      // Adicionar materiais
      guia.materiais?.forEach((mat: any) => {
        itens.push({
          id: `mat-${mat.codigo_material}-${mat.data_execucao}`,
          tipo: 'material',
          codigo: mat.codigo_material || 'N/A',
          descricao: mat.descricao || 'N/A',
          quantidade: mat.quantidade_executada || 0,
          unidade_medida: mat.unidade_medida || '',
          valor_total: mat.valor_total || 0,
          data_execucao: mat.data_execucao,
          status_pagamento: mat.status_pagamento || 'pendente'
        });
      });

      // Adicionar taxas
      guia.taxas?.forEach((taxa: any) => {
        itens.push({
          id: `taxa-${taxa.codigo_taxa}-${taxa.data_execucao}`,
          tipo: 'taxa',
          codigo: taxa.codigo_taxa || 'N/A',
          descricao: taxa.descricao || 'N/A',
          quantidade: taxa.quantidade_executada || 0,
          unidade_medida: taxa.unidade_medida || '',
          valor_total: taxa.valor_total || 0,
          data_execucao: taxa.data_execucao,
          status_pagamento: taxa.status_pagamento || 'pendente'
        });
      });

      return {
        numero_guia: guia.cabecalhoGuia?.numeroGuiaPrestador || 'N/A',
        numero_carteira: guia.dadosBeneficiario?.numeroCarteira || 'N/A',
        data_autorizacao: guia.dadosAutorizacao?.dataAutorizacao || 'N/A',
        senha: guia.dadosAutorizacao?.senha || 'N/A',
        profissional_nome: guia.dadosSolicitante?.profissional?.nomeProfissional || 'N/A',
        profissional_conselho: guia.dadosSolicitante?.profissional?.conselhoProfissional || 'N/A',
        profissional_numero_conselho: guia.dadosSolicitante?.profissional?.numeroConselhoProfissional || 'N/A',
        indicacao_clinica: guia.dadosSolicitacao?.indicacaoClinica || 'N/A',
        valor_total_guia: guia.valorTotal?.valorTotalGeral || 0,
        itens: itens,
        profissionais_executantes: guia.profissionais || []
      };
    });
  };

  const [guiasProcessadas, setGuiasProcessadas] = useState<GuiaData[]>(processarDadosPorGuia());
  const [expandedGuias, setExpandedGuias] = useState<Record<string, boolean>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    cabecalho: true,
    totais: true
  });
  const [glossarioAberto, setGlossarioAberto] = useState<string | null>(null);

  // Reprocessar dados quando o prop data mudar (ex: após confirmar glosa)
  React.useEffect(() => {
    setGuiasProcessadas(processarDadosPorGuia());
  }, [data]);

  const toggleGuia = (numeroGuia: string) => {
    setExpandedGuias(prev => ({
      ...prev,
      [numeroGuia]: !prev[numeroGuia]
    }));
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleStatusChange = (numeroGuia: string, itemId: string, novoStatus: 'pago' | 'nao_pago' | 'glosado', item: ItemFinanceiro) => {
    // Se for glosado e houver callback, apenas chamar o callback (não atualizar estado ainda)
    // O estado será atualizado no handleConfirmarGlosa após a confirmação
    if (novoStatus === 'glosado' && onGlosarItem) {
      if (!loteId) {
        console.error('loteId não está disponível no componente XMLTISSDetailedViewerV2');
      }
      onGlosarItem(numeroGuia, itemId, item, loteId);
      return;
    }

    // Para outros status (pago, nao_pago), atualizar normalmente
    setGuiasProcessadas(prev => prev.map(guia => {
      if (guia.numero_guia === numeroGuia) {
        return {
          ...guia,
          itens: guia.itens.map(i =>
            i.id === itemId
              ? { ...i, status_pagamento: novoStatus }
              : i
          )
        };
      }
      return guia;
    }));
  };

  // Função handleObservacaoGlosa removida - não é mais necessária pois o campo foi substituído por um indicador visual


  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === 'N/A') return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string, timeString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      const time = timeString ? ` ${timeString}` : '';
      return date.toLocaleDateString('pt-BR') + time;
    } catch {
      return dateString + (timeString ? ` ${timeString}` : '');
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'procedimento': return <Activity className="h-4 w-4" />;
      case 'medicamento': return <Pill className="h-4 w-4" />;
      case 'material': return <Wrench className="h-4 w-4" />;
      case 'taxa': return <Receipt className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'procedimento': 
        return 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'medicamento': 
        return 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'material': 
        return 'bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800';
      case 'taxa': 
        return 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
      default: 
        return 'bg-gray-50 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800';
    }
  };

  const getStatusIcon = (status: string | undefined) => {
    switch (status) {
      case 'pago': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'glosado': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'nao_pago': return <X className="h-4 w-4 text-gray-600" />;
      default: return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'pago': 
        return 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800';
      case 'glosado': 
        return 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'nao_pago': 
        return 'bg-gray-50 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800';
      default: 
        return 'bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
    }
  };

  // Calcular totais
  const calcularTotais = () => {
    let totalGeral = 0;
    let totalPago = 0;
    let totalGlosado = 0;
    let totalPendente = 0;
    let totalItens = 0;

    guiasProcessadas.forEach(guia => {
      guia.itens.forEach(item => {
        totalItens++;
        totalGeral += item.valor_total;

        switch (item.status_pagamento) {
          case 'pago':
            totalPago += item.valor_total;
            break;
          case 'glosado':
            totalGlosado += item.valor_total;
            break;
          default:
            totalPendente += item.valor_total;
        }
      });
    });

    return { totalGeral, totalPago, totalGlosado, totalPendente, totalItens };
  };

  const totais = calcularTotais();

  return (
    <div className="w-full h-full">
      <CardContent className="p-6 space-y-8">
        {/* Cabeçalho do XML */}
        <Card className="lco-card bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-primary">
                <Building2 className="h-5 w-5" />
                Informações do Cabeçalho TISS
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSection('cabecalho')}
              >
                {expandedSections.cabecalho ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
          {expandedSections.cabecalho && (
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2 p-3 bg-muted/30 dark:bg-primary/10 rounded-lg border border-border/50 dark:border-primary/20">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-primary dark:text-primary" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tipo de Transação</span>
                  </div>
                  <div className="text-sm font-bold text-primary dark:text-primary">{data.cabecalho?.tipoTransacao || 'N/A'}</div>
                </div>

                <div className="space-y-2 p-3 bg-muted/30 dark:bg-primary/10 rounded-lg border border-border/50 dark:border-primary/20">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-primary dark:text-primary" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sequencial</span>
                  </div>
                  <div className="text-sm font-bold text-foreground dark:text-white">{data.cabecalho?.sequencialTransacao || 'N/A'}</div>
                </div>

                <div className="space-y-2 p-3 bg-muted/30 dark:bg-primary/10 rounded-lg border border-border/50 dark:border-primary/20">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary dark:text-primary" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Data/Hora</span>
                  </div>
                  <div className="text-sm font-bold text-foreground dark:text-white">
                    {formatDateTime(data.cabecalho?.dataRegistroTransacao, data.cabecalho?.horaRegistroTransacao)}
                  </div>
                </div>

                <div className="space-y-2 p-3 bg-muted/30 dark:bg-primary/10 rounded-lg border border-border/50 dark:border-primary/20">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary dark:text-primary" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">CNPJ</span>
                  </div>
                  <div className="text-sm font-bold text-foreground dark:text-white">{data.cabecalho?.cnpjPrestador || 'N/A'}</div>
                </div>

                <div className="space-y-2 p-3 bg-muted/30 dark:bg-primary/10 rounded-lg border border-border/50 dark:border-primary/20">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary dark:text-primary" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Operadora</span>
                  </div>
                  <div className="text-sm font-bold text-foreground dark:text-white">{data.operadora?.nome || data.cabecalho?.operadoraNome || 'N/A'}</div>
                  <div className="text-xs text-muted-foreground">ANS: {data.cabecalho?.registroANS || 'N/A'}</div>
                </div>

                <div className="space-y-2 p-3 bg-muted/30 dark:bg-accent/10 rounded-lg border border-border/50 dark:border-accent/30">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-accent dark:text-accent" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Número do Lote</span>
                  </div>
                  <div className="text-sm font-bold text-accent dark:text-accent">{data.lote?.numeroLote || 'N/A'}</div>
                </div>

                <div className="space-y-2 p-3 bg-muted/30 dark:bg-primary/10 rounded-lg border border-border/50 dark:border-primary/20">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary dark:text-primary" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Padrão TISS</span>
                  </div>
                  <div className="text-sm font-bold text-foreground dark:text-white">{data.cabecalho?.padrao || 'N/A'}</div>
                </div>

                <div className="space-y-2 p-3 bg-muted/30 dark:bg-primary/10 rounded-lg border border-border/50 dark:border-primary/20">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary dark:text-primary" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">CNES</span>
                  </div>
                  <div className="text-sm font-bold text-foreground dark:text-white">{data.cabecalho?.cnes || 'N/A'}</div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Totais Consolidados */}
        <Card className="bg-gradient-to-br from-primary/5 via-background to-accent/5 dark:from-primary/10 dark:via-background dark:to-accent/10 border-2 border-primary/20 dark:border-primary/30 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-foreground">
                <div className="p-2 rounded-lg bg-primary/10 dark:bg-primary/20">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xl">Totais Consolidados</span>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSection('totais')}
                className="hover:bg-primary/10"
              >
                {expandedSections.totais ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
          {expandedSections.totais && (
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Total de Guias */}
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 border-2 border-primary/30 dark:border-primary/40 p-5 shadow-md hover:shadow-lg transition-all duration-300">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 dark:bg-primary/10 rounded-full -mr-10 -mt-10"></div>
                  <div className="relative">
                    <div className="text-xs font-semibold text-primary/70 dark:text-primary/60 uppercase tracking-wider mb-2">
                      Total de Guias
                    </div>
                    <div className="text-3xl font-bold text-primary dark:text-primary">{guiasProcessadas.length}</div>
                  </div>
                </div>

                {/* Total de Itens */}
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/30 border-2 border-blue-200 dark:border-blue-800 p-5 shadow-md hover:shadow-lg transition-all duration-300">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200/20 dark:bg-blue-800/20 rounded-full -mr-10 -mt-10"></div>
                  <div className="relative">
                    <div className="text-xs font-semibold text-blue-700/70 dark:text-blue-300/70 uppercase tracking-wider mb-2">
                      Total de Itens
                    </div>
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{totais.totalItens}</div>
                  </div>
                </div>

                {/* Total Pago */}
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/40 dark:to-green-900/30 border-2 border-green-200 dark:border-green-800 p-5 shadow-md hover:shadow-lg transition-all duration-300">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-green-200/20 dark:bg-green-800/20 rounded-full -mr-10 -mt-10"></div>
                  <div className="relative">
                    <div className="text-xs font-semibold text-green-700/70 dark:text-green-300/70 uppercase tracking-wider mb-2">
                      Total Pago
                    </div>
                    <div className="text-xl font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(totais.totalPago)}
                    </div>
                  </div>
                </div>

                {/* Total Glosado */}
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/40 dark:to-red-900/30 border-2 border-red-200 dark:border-red-800 p-5 shadow-md hover:shadow-lg transition-all duration-300">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-red-200/20 dark:bg-red-800/20 rounded-full -mr-10 -mt-10"></div>
                  <div className="relative">
                    <div className="text-xs font-semibold text-red-700/70 dark:text-red-300/70 uppercase tracking-wider mb-2">
                      Total Glosado
                    </div>
                    <div className="text-xl font-bold text-red-600 dark:text-red-400">
                      {formatCurrency(totais.totalGlosado)}
                    </div>
                  </div>
                </div>

                {/* Valor Total Geral */}
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/20 via-primary/15 to-primary/10 dark:from-primary/30 dark:via-primary/25 dark:to-primary/20 border-2 border-primary dark:border-primary/60 p-5 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 dark:bg-primary/20 rounded-full -mr-12 -mt-12"></div>
                  <div className="relative">
                    <div className="text-xs font-semibold text-primary/80 dark:text-primary/70 uppercase tracking-wider mb-2">
                      Valor Total Geral
                    </div>
                    <div className="text-2xl font-bold text-primary dark:text-primary">
                      {formatCurrency(totais.totalGeral)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Botão de salvar removido - não havia funcionalidade implementada */}
            </CardContent>
          )}
        </Card>

        {/* Guias - Organizado por Guia com todos os itens */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 dark:bg-primary/20">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <span>Guias e Itens</span>
              <Badge variant="secondary" className="ml-2 text-sm px-3 py-1">
                {guiasProcessadas.length} {guiasProcessadas.length === 1 ? 'guia' : 'guias'}
              </Badge>
            </h3>
          </div>

          {guiasProcessadas.map((guia, index) => (
            <Card 
              key={index} 
              className="overflow-hidden border-2 border-primary/20 dark:border-primary/30 hover:border-primary/40 dark:hover:border-primary/50 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              <CardHeader 
                className="cursor-pointer bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 hover:from-primary/10 hover:to-primary/15 dark:hover:from-primary/15 dark:hover:to-primary/25 transition-all duration-300"
                onClick={() => toggleGuia(guia.numero_guia)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/20 dark:bg-primary/30">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <span className="font-bold text-xl text-primary dark:text-primary">Guia {guia.numero_guia}</span>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Carteira: {guia.numero_carteira}
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs px-3 py-1">
                        <ListChecks className="h-3 w-3 mr-1" />
                        {guia.itens.length} {guia.itens.length === 1 ? 'item' : 'itens'}
                      </Badge>
                      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                        <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <span className="text-lg font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(guia.valor_total_guia)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                    {expandedGuias[guia.numero_guia] ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </Button>
                </div>
              </CardHeader>

              {expandedGuias[guia.numero_guia] && (
                <CardContent className="space-y-6 pt-6">
                  {/* Informações da Guia */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-gradient-to-br from-muted/50 to-muted/30 dark:from-muted/30 dark:to-muted/20 rounded-xl border border-border/50 shadow-sm">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Data Autorização</div>
                      </div>
                      <div className="text-sm font-bold text-foreground pl-6">{formatDate(guia.data_autorizacao)}</div>
                      <div className="text-xs text-muted-foreground pl-6">Senha: <span className="font-medium">{guia.senha}</span></div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Profissional Solicitante</div>
                      </div>
                      <div className="text-sm font-bold text-foreground pl-6">{guia.profissional_nome}</div>
                      <div className="text-xs text-muted-foreground pl-6">
                        {guia.profissional_conselho} {guia.profissional_numero_conselho}
                      </div>
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <div className="flex items-center gap-2">
                        <Stethoscope className="h-4 w-4 text-primary" />
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Indicação Clínica</div>
                      </div>
                      <div className="text-sm text-foreground pl-6 bg-background/50 p-3 rounded-lg border border-border/50">{guia.indicacao_clinica}</div>
                    </div>
                  </div>

                  {/* Profissionais Executantes */}
                  {guia.profissionais_executantes.length > 0 && (
                    <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                      <div className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Profissionais Executantes
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {guia.profissionais_executantes.map((prof, idx) => (
                          <div key={idx} className="text-xs text-foreground p-2 bg-background rounded border border-border">
                            <div className="font-medium">{prof.nome}</div>
                            <div className="text-muted-foreground">
                              {prof.conselho} {prof.numero_conselho} - UF: {prof.uf} - CBOS: {prof.cbos}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tabela de Itens */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b-2 border-primary/20">
                      <div className="text-base font-bold text-foreground flex items-center gap-2">
                        <ListChecks className="h-5 w-5 text-primary" />
                        Itens da Guia
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {guia.itens.length} {guia.itens.length === 1 ? 'item cadastrado' : 'itens cadastrados'}
                      </Badge>
                    </div>

                    {guia.itens.map((item, itemIdx) => (
                      <div
                        key={item.id}
                        className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-card to-muted/20 dark:from-card dark:to-muted/30 border-2 border-border hover:border-primary/50 dark:hover:border-primary/40 transition-all duration-300 shadow-sm hover:shadow-md"
                      >
                        <div className="p-5">
                          <div className="flex items-start gap-4">
                            {/* Tipo e Status - Barra Lateral */}
                            <div className="flex flex-col gap-3 items-center min-w-[100px]">
                              <div className={`${getTipoColor(item.tipo)} px-3 py-2 rounded-lg border-2 flex flex-col items-center gap-1.5 shadow-sm w-full`}>
                                {getTipoIcon(item.tipo)}
                                <span className="text-xs font-bold capitalize">{item.tipo}</span>
                              </div>
                              <div className={`${getStatusColor(item.status_pagamento)} px-2 py-1 rounded-md flex items-center gap-1.5 text-xs font-medium w-full justify-center`}>
                                {getStatusIcon(item.status_pagamento)}
                                <span className="capitalize">
                                  {item.status_pagamento === 'pago' ? 'Pago' : 
                                   item.status_pagamento === 'glosado' ? 'Glosado' : 
                                   item.status_pagamento === 'nao_pago' ? 'Não Pago' : 'Pendente'}
                                </span>
                              </div>
                            </div>

                            {/* Informações do Item */}
                            <div className="flex-1 space-y-3">
                              <div>
                                <div className="font-bold text-lg text-foreground mb-2 leading-tight">{item.descricao}</div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  <div className="space-y-1">
                                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Código</div>
                                    <div className="text-sm font-bold text-foreground bg-muted/50 dark:bg-muted/30 px-2 py-1 rounded border border-border inline-block">
                                      {item.codigo}
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Quantidade</div>
                                    <div className="text-sm font-medium text-foreground">
                                      {item.quantidade} {item.unidade_medida && <span className="text-muted-foreground">({item.unidade_medida})</span>}
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Data Execução</div>
                                    <div className="text-sm font-medium text-foreground">{formatDate(item.data_execucao)}</div>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Valor</div>
                                    <div className="text-lg font-bold text-primary dark:text-primary">
                                      {formatCurrency(item.valor_total)}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Controles de Status */}
                              <div className="pt-3 border-t border-border/50">
                                <div className="flex items-center justify-between flex-wrap gap-3">
                                  <div className="flex items-center gap-3">
                                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Alterar Status:</div>
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        variant={item.status_pagamento === 'pago' ? 'default' : 'outline'}
                                        className={`h-8 text-xs font-medium transition-all ${
                                          item.status_pagamento === 'pago' 
                                            ? 'bg-green-600 hover:bg-green-700 text-white shadow-md' 
                                            : 'hover:bg-green-50 dark:hover:bg-green-950/20 hover:border-green-300 dark:hover:border-green-700'
                                        }`}
                                        onClick={() => handleStatusChange(guia.numero_guia, item.id!, 'pago', item)}
                                      >
                                        <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                                        Pago
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant={item.status_pagamento === 'glosado' ? 'default' : 'outline'}
                                        className={`h-8 text-xs font-medium transition-all ${
                                          item.status_pagamento === 'glosado' 
                                            ? 'bg-red-600 hover:bg-red-700 text-white shadow-md' 
                                            : 'hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-300 dark:hover:border-red-700'
                                        }`}
                                        onClick={() => handleStatusChange(guia.numero_guia, item.id!, 'glosado', item)}
                                      >
                                        <XCircle className="h-3.5 w-3.5 mr-1.5" />
                                        Glosado
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant={item.status_pagamento === 'nao_pago' ? 'default' : 'outline'}
                                        className={`h-8 text-xs font-medium transition-all ${
                                          item.status_pagamento === 'nao_pago' 
                                            ? 'bg-gray-600 hover:bg-gray-700 text-white shadow-md' 
                                            : 'hover:bg-gray-50 dark:hover:bg-gray-900/20 hover:border-gray-300 dark:hover:border-gray-700'
                                        }`}
                                        onClick={() => handleStatusChange(guia.numero_guia, item.id!, 'nao_pago', item)}
                                      >
                                        <X className="h-3.5 w-3.5 mr-1.5" />
                                        Não Pago
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Botão de Glossário */}
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 text-xs font-medium hover:bg-primary/10 hover:border-primary/50"
                                      >
                                        <Info className="h-3.5 w-3.5 mr-1.5" />
                                        Glossário
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-3xl">
                                      <DialogHeader className="pb-4 border-b border-border">
                                        <DialogTitle className="flex items-center gap-3 text-2xl">
                                          <div className="p-2 rounded-lg bg-primary/10 dark:bg-primary/20">
                                            <Info className="h-6 w-6 text-primary" />
                                          </div>
                                          <span>Glossário TUSS</span>
                                        </DialogTitle>
                                        <DialogDescription className="text-base mt-2">
                                          Informações detalhadas sobre o código de procedimento
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="space-y-6 py-4">
                                        {/* Código e Descrição Principal */}
                                        <div className="space-y-4">
                                          <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-xl border-2 border-primary/30 dark:border-primary/40">
                                            <div className="flex items-center justify-between mb-3">
                                              <div className="text-xs font-bold text-primary/70 dark:text-primary/60 uppercase tracking-wider">Código TUSS</div>
                                              <Badge className={`${getTipoColor(item.tipo)} text-sm px-3 py-1`}>
                                                {getTipoIcon(item.tipo)}
                                                {item.tipo}
                                              </Badge>
                                            </div>
                                            <div className="text-2xl font-bold text-primary dark:text-primary mb-2">{item.codigo}</div>
                                            <div className="text-sm text-muted-foreground">Descrição do Procedimento</div>
                                            <div className="text-base font-medium text-foreground leading-relaxed">{item.descricao}</div>
                                          </div>
                                        </div>

                                        {/* Informações Detalhadas */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          <div className="p-4 bg-card rounded-xl border border-border/50 shadow-sm">
                                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Quantidade</div>
                                            <div className="text-lg font-bold text-foreground">
                                              {item.quantidade} {item.unidade_medida && <span className="text-sm font-normal text-muted-foreground">({item.unidade_medida})</span>}
                                            </div>
                                          </div>
                                          <div className="p-4 bg-card rounded-xl border border-border/50 shadow-sm">
                                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Valor Unitário</div>
                                            <div className="text-lg font-bold text-primary dark:text-primary">
                                              {item.valor_unitario ? formatCurrency(item.valor_unitario) : formatCurrency(item.valor_total / (item.quantidade || 1))}
                                            </div>
                                          </div>
                                          <div className="p-4 bg-card rounded-xl border border-border/50 shadow-sm">
                                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Data de Execução</div>
                                            <div className="text-lg font-medium text-foreground">{formatDate(item.data_execucao)}</div>
                                          </div>
                                          <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-xl border-2 border-primary/30 dark:border-primary/40 shadow-md">
                                            <div className="text-xs font-semibold text-primary/70 dark:text-primary/60 uppercase tracking-wide mb-2">Valor Total</div>
                                            <div className="text-2xl font-bold text-primary dark:text-primary">
                                              {formatCurrency(item.valor_total)}
                                            </div>
                                          </div>
                                        </div>

                                        {/* Informações Adicionais */}
                                        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                                          <div className="flex items-start gap-3">
                                            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                            <div>
                                              <div className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">Informações Técnicas</div>
                                              <div className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                                                Este código faz parte da tabela TUSS (Terminologia Unificada da Saúde Suplementar). 
                                                Para informações adicionais sobre cobertura, autorização prévia ou outras especificações, 
                                                consulte a tabela TUSS oficial ou entre em contato com a operadora.
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                </div>
                              </div>

                              {/* Indicador visual de item glosado - sem campo de texto editável */}
                              {item.status_pagamento === 'glosado' && (
                                <div className="mt-4 pt-4 border-t-2 border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20 rounded-lg p-4">
                                  <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                                    <AlertCircle className="h-5 w-5" />
                                    <p className="text-sm font-semibold">
                                      Este item foi glosado e encaminhado para recurso.
                                    </p>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-2">
                                    A justificativa completa está disponível no recurso de glosa registrado.
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Resumo de Valores da Guia */}
                  <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/10 via-primary/15 to-primary/10 dark:from-primary/20 dark:via-primary/25 dark:to-primary/20 border-2 border-primary/30 dark:border-primary/40 p-5 shadow-lg">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 dark:bg-primary/10 rounded-full -mr-16 -mt-16"></div>
                    <div className="relative flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-6 w-6 text-primary" />
                        <span className="font-bold text-lg text-foreground">Valor Total da Guia:</span>
                      </div>
                      <span className="text-3xl font-bold text-primary dark:text-primary">{formatCurrency(guia.valor_total_guia)}</span>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </CardContent>
    </div>
  );
};

export default XMLTISSDetailedViewerV2;
