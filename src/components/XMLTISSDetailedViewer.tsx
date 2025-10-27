import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
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
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Clock,
  MapPin,
  Receipt,
  Package,
  ListChecks
} from 'lucide-react';

interface XMLTISSDetailedViewerProps {
  data: any;
  onClose: () => void;
}

const XMLTISSDetailedViewer: React.FC<XMLTISSDetailedViewerProps> = ({ data, onClose }) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    cabecalho: true,
    totais: true,
    guias: true,
    medicamentos: true,
    materiais: true,
    taxas: true,
    profissionais: true,
    procedimentos: true
  });

  const [showAllItems, setShowAllItems] = useState<Record<string, boolean>>({
    guias: false,
    medicamentos: false,
    materiais: false,
    taxas: false,
    procedimentos: false,
    profissionais: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleShowAll = (section: string) => {
    setShowAllItems(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
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
                        <Hash className="h-4 w-4 text-primary dark:text-primary" />
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Registro ANS</span>
                      </div>
                      <div className="text-sm font-bold text-foreground dark:text-white">{data.cabecalho?.registroANS || 'N/A'}</div>
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

                    <div className="space-y-2 p-3 bg-muted/30 dark:bg-muted/50 rounded-lg border border-border/50">
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Hash</span>
                      </div>
                      <div className="text-xs font-mono text-muted-foreground break-all">
                        {data.cabecalho?.hash || '6317a411727722fd9f17d107c50fa993'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Totais Consolidados */}
            <Card className="lco-card bg-gradient-to-r from-secondary/5 to-muted/5 border-secondary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <DollarSign className="h-5 w-5" />
                    Totais Consolidados
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSection('totais')}
                  >
                    {expandedSections.totais ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
              {expandedSections.totais && (
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/20">
                      <div className="text-2xl font-bold text-primary">{data.guias?.length || 0}</div>
                      <div className="text-sm text-foreground">Total de Guias</div>
                    </div>
                    
                    <div className="text-center p-4 bg-accent/5 rounded-lg border border-accent/20">
                      <div className="text-xl font-bold text-accent">
                        {formatCurrency(data.guias?.reduce((sum, guia) => sum + (guia.valorTotal?.valorMedicamentos || 0), 0) || 0)}
                      </div>
                      <div className="text-sm text-foreground">Total Medicamentos</div>
                    </div>
                    
                    <div className="text-center p-4 bg-secondary/5 rounded-lg border border-secondary/20">
                      <div className="text-xl font-bold text-foreground">
                        {formatCurrency(data.guias?.reduce((sum, guia) => sum + (guia.valorTotal?.valorProcedimentos || 0), 0) || 0)}
                      </div>
                      <div className="text-sm text-foreground">Total Procedimentos</div>
                    </div>
                    
                    <div className="text-center p-4 bg-muted/5 rounded-lg border border-muted/20">
                      <div className="text-xl font-bold text-foreground">
                        {formatCurrency(data.guias?.reduce((sum, guia) => sum + (guia.valorTotal?.valorMateriais || 0), 0) || 0)}
                      </div>
                      <div className="text-sm text-foreground">Total Materiais</div>
                    </div>
                    
                    <div className="text-center p-4 bg-destructive/5 rounded-lg border border-destructive/20">
                      <div className="text-xl font-bold text-destructive">
                        {formatCurrency(data.guias?.reduce((sum, guia) => sum + (guia.valorTotal?.valorTaxasAlugueis || 0), 0) || 0)}
                      </div>
                      <div className="text-sm text-foreground">Total Taxas</div>
                    </div>
                    
                    <div className="text-center p-4 bg-primary/10 rounded-lg border-2 border-primary">
                      <div className="text-2xl font-bold text-primary">
                        {formatCurrency(data.guias?.reduce((sum, guia) => sum + (guia.valorTotal?.valorTotalGeral || 0), 0) || 0)}
                      </div>
                      <div className="text-sm font-medium text-foreground">VALOR TOTAL GERAL</div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Resumo das Guias */}
            <Card className="lco-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-foreground">
                    <FileText className="h-5 w-5 text-primary" />
                    Resumo das Guias ({data.guias?.length || 0} guias)
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSection('guias')}
                  >
                    {expandedSections.guias ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
              {expandedSections.guias && (
                <CardContent>
                  <div className="space-y-4">
                    {(showAllItems.guias ? data.guias : data.guias?.slice(0, 5))?.map((guia: any, index: number) => (
                      <Card key={index} className="bg-gradient-to-r from-card to-muted/20 dark:from-card dark:to-muted/40 border-2 border-primary/20 dark:border-primary/30 shadow-md hover:shadow-lg transition-all">
                        <CardContent className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="p-2 bg-primary/5 dark:bg-primary/20 rounded-lg border border-primary/20 dark:border-primary/30">
                              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Nº Guia</div>
                              <div className="text-lg font-bold text-primary dark:text-primary">{guia.cabecalhoGuia?.numeroGuiaPrestador || 'N/A'}</div>
                              <div className="text-xs text-muted-foreground mt-1">Carteira: {guia.dadosBeneficiario?.numeroCarteira || 'N/A'}</div>
                            </div>
                            
                            <div className="p-2 bg-muted/30 dark:bg-muted/50 rounded-lg border border-border dark:border-border/60">
                              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Data Autorização</div>
                              <div className="text-sm font-bold text-foreground dark:text-white">{formatDate(guia.dadosAutorizacao?.dataAutorizacao)}</div>
                              <div className="text-xs text-muted-foreground mt-1">Senha: {guia.dadosAutorizacao?.senha || 'N/A'}</div>
                            </div>
                            
                            <div className="p-2 bg-accent/5 dark:bg-accent/20 rounded-lg border border-accent/20 dark:border-accent/30">
                              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Profissional</div>
                              <div className="text-sm font-bold text-foreground dark:text-white">{guia.dadosSolicitante?.profissional?.nomeProfissional || 'N/A'}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {guia.dadosSolicitante?.profissional?.conselhoProfissional} {guia.dadosSolicitante?.profissional?.numeroConselhoProfissional}
                              </div>
                            </div>
                            
                            <div className="p-2 bg-green-500/10 dark:bg-green-500/20 rounded-lg border-2 border-green-500/20 dark:border-green-500/30">
                              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Valor Total</div>
                              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                {formatCurrency(guia.valorTotal?.valorTotalGeral || 0)}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{guia.dadosSolicitacao?.indicacaoClinica || 'N/A'}</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    {data.guias?.length > 5 && !showAllItems.guias && (
                      <div className="text-center">
                        <Button 
                          variant="outline" 
                          onClick={() => toggleShowAll('guias')}
                          className="text-foreground border-border hover:bg-accent/10"
                        >
                          <ListChecks className="h-4 w-4 mr-2" />
                          Ver todas as {data.guias.length} guias
                        </Button>
                      </div>
                    )}
                    
                    {showAllItems.guias && data.guias?.length > 5 && (
                      <div className="text-center">
                        <Button 
                          variant="outline" 
                          onClick={() => toggleShowAll('guias')}
                          className="text-foreground border-border hover:bg-accent/10"
                        >
                          <ChevronUp className="h-4 w-4 mr-2" />
                          Mostrar apenas as primeiras 5
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Medicamentos Utilizados */}
            <Card className="lco-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-foreground">
                    <Pill className="h-5 w-5 text-accent" />
                    Medicamentos Utilizados ({data.guias?.reduce((total, guia) => total + (guia.medicamentos?.length || 0), 0) || 0} itens)
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSection('medicamentos')}
                  >
                    {expandedSections.medicamentos ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
              {expandedSections.medicamentos && (
                <CardContent>
                  <div className="space-y-3">
                    {(() => {
                      const medicamentos = data.guias?.flatMap(guia => 
                        guia.medicamentos?.map(med => ({
                          ...med,
                          guia: guia.cabecalhoGuia?.numeroGuiaPrestador || 'N/A'
                        })) || []
                      ) || [];
                      
                      const medicamentosToShow = showAllItems.medicamentos ? medicamentos : medicamentos.slice(0, 5);
                      
                      return medicamentosToShow.map((medicamento: any, index: number) => (
                        <div key={index} className="space-y-2">
                          <div className="text-sm font-medium text-foreground mb-2">
                            Guia {medicamento.guia} - {formatDate(medicamento.data_execucao)}
                          </div>
                          <div className="flex items-center justify-between p-4 bg-accent/10 dark:bg-accent/20 rounded-lg border-2 border-accent/30 dark:border-accent/40 shadow-sm hover:shadow-md transition-all">
                            <div className="flex-1">
                              <div className="font-bold text-base text-foreground dark:text-white mb-2">{medicamento.descricao || 'N/A'}</div>
                              <div className="text-xs text-muted-foreground space-y-1">
                                <div>Código: <span className="font-bold text-foreground dark:text-white">{medicamento.codigo_medicamento || 'N/A'}</span></div>
                                <div>Qtd: <span className="font-bold text-foreground dark:text-white">{medicamento.quantidade_executada || 0} {medicamento.unidade_medida || ''}</span></div>
                              </div>
                            </div>
                            <div className="text-right ml-4 pl-4 border-l-2 border-accent/30 dark:border-accent/50">
                              <div className="font-bold text-lg text-accent dark:text-accent">{formatCurrency(medicamento.valor_total || 0)}</div>
                              <div className="text-xs text-muted-foreground mt-1">{formatDate(medicamento.data_execucao)}</div>
                            </div>
                          </div>
                        </div>
                      ));
                    })()}

                    {!showAllItems.medicamentos && data.guias?.reduce((total, guia) => total + (guia.medicamentos?.length || 0), 0) > 5 && (
                      <div className="text-center">
                        <Button 
                          variant="outline" 
                          onClick={() => toggleShowAll('medicamentos')}
                          className="text-foreground border-border hover:bg-accent/10"
                        >
                          <ListChecks className="h-4 w-4 mr-2" />
                          Ver todos os {data.guias?.reduce((total, guia) => total + (guia.medicamentos?.length || 0), 0)} medicamentos
                        </Button>
                      </div>
                    )}
                    
                    {showAllItems.medicamentos && data.guias?.reduce((total, guia) => total + (guia.medicamentos?.length || 0), 0) > 5 && (
                      <div className="text-center">
                        <Button 
                          variant="outline" 
                          onClick={() => toggleShowAll('medicamentos')}
                          className="text-foreground border-border hover:bg-accent/10"
                        >
                          <ChevronUp className="h-4 w-4 mr-2" />
                          Mostrar apenas os primeiros 5
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Materiais */}
            <Card className="lco-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-foreground">
                    <Wrench className="h-5 w-5 text-secondary" />
                    Materiais ({data.guias?.reduce((total, guia) => total + (guia.materiais?.length || 0), 0) || 0} itens)
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSection('materiais')}
                  >
                    {expandedSections.materiais ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
              {expandedSections.materiais && (
                <CardContent>
                  <div className="space-y-3">
                    {(() => {
                      const materiais = data.guias?.flatMap(guia => 
                        guia.materiais?.map(mat => ({
                          ...mat,
                          guia: guia.cabecalhoGuia?.numeroGuiaPrestador || 'N/A'
                        })) || []
                      ) || [];
                      
                      const materiaisToShow = showAllItems.materiais ? materiais : materiais.slice(0, 5);
                      
                      return materiaisToShow.map((material: any, index: number) => (
                        <div key={index} className="space-y-2">
                          <div className="text-sm font-medium text-foreground mb-2">
                            Guia {material.guia} - {formatDate(material.data_execucao)}
                          </div>
                          <div className="flex items-center justify-between p-4 bg-muted/50 dark:bg-muted/70 rounded-lg border-2 border-border dark:border-border/60 shadow-sm hover:shadow-md transition-all">
                            <div className="flex-1">
                              <div className="font-bold text-base text-foreground dark:text-white mb-2">{material.descricao || 'N/A'}</div>
                              <div className="text-xs text-muted-foreground space-y-1">
                                <div>Código: <span className="font-bold text-foreground dark:text-white">{material.codigo_material || 'N/A'}</span></div>
                                <div>Qtd: <span className="font-bold text-foreground dark:text-white">{material.quantidade_executada || 0}</span></div>
                              </div>
                            </div>
                            <div className="text-right ml-4 pl-4 border-l-2 border-border dark:border-border/60">
                              <div className="font-bold text-lg text-foreground dark:text-white">{formatCurrency(material.valor_total || 0)}</div>
                              <div className="text-xs text-muted-foreground mt-1">{formatDate(material.data_execucao)}</div>
                            </div>
                          </div>
                        </div>
                      ));
                    })()}

                    {!showAllItems.materiais && data.guias?.reduce((total, guia) => total + (guia.materiais?.length || 0), 0) > 5 && (
                      <div className="text-center">
                        <Button 
                          variant="outline" 
                          onClick={() => toggleShowAll('materiais')}
                          className="text-foreground border-border hover:bg-accent/10"
                        >
                          <ListChecks className="h-4 w-4 mr-2" />
                          Ver todos os {data.guias?.reduce((total, guia) => total + (guia.materiais?.length || 0), 0)} materiais
                        </Button>
                      </div>
                    )}
                    
                    {showAllItems.materiais && data.guias?.reduce((total, guia) => total + (guia.materiais?.length || 0), 0) > 5 && (
                      <div className="text-center">
                        <Button 
                          variant="outline" 
                          onClick={() => toggleShowAll('materiais')}
                          className="text-foreground border-border hover:bg-accent/10"
                        >
                          <ChevronUp className="h-4 w-4 mr-2" />
                          Mostrar apenas os primeiros 5
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Taxas e Aluguéis */}
            <Card className="lco-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-foreground">
                    <Receipt className="h-5 w-5 text-destructive" />
                    Taxas e Aluguéis ({data.guias?.reduce((total, guia) => total + (guia.taxas?.length || 0), 0) || 0} itens)
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSection('taxas')}
                  >
                    {expandedSections.taxas ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
              {expandedSections.taxas && (
                <CardContent>
                  <div className="space-y-3">
                    {(() => {
                      const taxas = data.guias?.flatMap(guia => 
                        guia.taxas?.map(taxa => ({
                          ...taxa,
                          guia: guia.cabecalhoGuia?.numeroGuiaPrestador || 'N/A'
                        })) || []
                      ) || [];
                      
                      const taxasToShow = showAllItems.taxas ? taxas : taxas.slice(0, 5);
                      
                      return taxasToShow.map((taxa: any, index: number) => (
                        <div key={index} className="space-y-2">
                          <div className="text-sm font-medium text-foreground mb-2">
                            Guia {taxa.guia} - {formatDate(taxa.data_execucao)}
                          </div>
                          <div className="flex items-center justify-between p-4 bg-destructive/10 dark:bg-destructive/20 rounded-lg border-2 border-destructive/30 dark:border-destructive/40 shadow-sm hover:shadow-md transition-all">
                            <div className="flex-1">
                              <div className="font-bold text-base text-foreground dark:text-white mb-2">{taxa.descricao || 'N/A'}</div>
                              <div className="text-xs text-muted-foreground space-y-1">
                                <div>Código: <span className="font-bold text-foreground dark:text-white">{taxa.codigo_taxa || 'N/A'}</span></div>
                                <div>Qtd: <span className="font-bold text-foreground dark:text-white">{taxa.quantidade_executada || 0} {taxa.unidade_medida || ''}</span></div>
                              </div>
                            </div>
                            <div className="text-right ml-4 pl-4 border-l-2 border-destructive/30 dark:border-destructive/50">
                              <div className="font-bold text-lg text-destructive dark:text-destructive">{formatCurrency(taxa.valor_total || 0)}</div>
                              <div className="text-xs text-muted-foreground mt-1">{formatDate(taxa.data_execucao)}</div>
                            </div>
                          </div>
                        </div>
                      ));
                    })()}

                    {!showAllItems.taxas && data.guias?.reduce((total, guia) => total + (guia.taxas?.length || 0), 0) > 5 && (
                      <div className="text-center">
                        <Button 
                          variant="outline" 
                          onClick={() => toggleShowAll('taxas')}
                          className="text-foreground border-border hover:bg-accent/10"
                        >
                          <ListChecks className="h-4 w-4 mr-2" />
                          Ver todas as {data.guias?.reduce((total, guia) => total + (guia.taxas?.length || 0), 0)} taxas
                        </Button>
                      </div>
                    )}
                    
                    {showAllItems.taxas && data.guias?.reduce((total, guia) => total + (guia.taxas?.length || 0), 0) > 5 && (
                      <div className="text-center">
                        <Button 
                          variant="outline" 
                          onClick={() => toggleShowAll('taxas')}
                          className="text-foreground border-border hover:bg-accent/10"
                        >
                          <ChevronUp className="h-4 w-4 mr-2" />
                          Mostrar apenas as primeiras 5
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Procedimentos Executados */}
            <Card className="lco-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-foreground">
                    <Activity className="h-5 w-5 text-secondary" />
                    Procedimentos Executados ({data.guias?.reduce((total, guia) => total + (guia.procedimentos?.length || 0), 0) || 0} itens)
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSection('procedimentos')}
                  >
                    {expandedSections.procedimentos ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
              {expandedSections.procedimentos && (
                <CardContent>
                  <div className="space-y-3">
                    {(() => {
                      const procedimentos = data.guias?.flatMap(guia => 
                        guia.procedimentos?.map(proc => ({
                          ...proc,
                          guia: guia.cabecalhoGuia?.numeroGuiaPrestador || 'N/A'
                        })) || []
                      ) || [];
                      
                      const procedimentosToShow = showAllItems.procedimentos ? procedimentos : procedimentos.slice(0, 5);
                      
                      return procedimentosToShow.map((procedimento: any, index: number) => (
                        <div key={index} className="space-y-2">
                          <div className="text-sm font-medium text-foreground mb-2">
                            Guia {procedimento.guia} - {formatDate(procedimento.data_execucao)}
                          </div>
                          <div className="flex items-center justify-between p-4 bg-secondary/10 dark:bg-secondary/20 rounded-lg border-2 border-secondary/30 dark:border-secondary/40 shadow-sm hover:shadow-md transition-all">
                            <div className="flex-1">
                              <div className="font-bold text-base text-foreground dark:text-white mb-2">{procedimento.descricao_procedimento || 'N/A'}</div>
                              <div className="text-xs text-muted-foreground space-y-1">
                                <div>Código: <span className="font-bold text-foreground dark:text-white">{procedimento.codigo_procedimento || 'N/A'}</span></div>
                                <div>Qtd: <span className="font-bold text-foreground dark:text-white">{procedimento.quantidade_executada || 0} {procedimento.unidade_medida || ''}</span></div>
                              </div>
                            </div>
                            <div className="text-right ml-4 pl-4 border-l-2 border-secondary/30 dark:border-secondary/50">
                              <div className="font-bold text-lg text-foreground dark:text-white">{formatCurrency(procedimento.valor_total || 0)}</div>
                              <div className="text-xs text-muted-foreground mt-1">{formatDate(procedimento.data_execucao)}</div>
                            </div>
                          </div>
                        </div>
                      ));
                    })()}

                    {!showAllItems.procedimentos && data.guias?.reduce((total, guia) => total + (guia.procedimentos?.length || 0), 0) > 5 && (
                      <div className="text-center">
                        <Button 
                          variant="outline" 
                          onClick={() => toggleShowAll('procedimentos')}
                          className="text-foreground border-border hover:bg-accent/10"
                        >
                          <ListChecks className="h-4 w-4 mr-2" />
                          Ver todos os {data.guias?.reduce((total, guia) => total + (guia.procedimentos?.length || 0), 0)} procedimentos
                        </Button>
                      </div>
                    )}
                    
                    {showAllItems.procedimentos && data.guias?.reduce((total, guia) => total + (guia.procedimentos?.length || 0), 0) > 5 && (
                      <div className="text-center">
                        <Button 
                          variant="outline" 
                          onClick={() => toggleShowAll('procedimentos')}
                          className="text-foreground border-border hover:bg-accent/10"
                        >
                          <ChevronUp className="h-4 w-4 mr-2" />
                          Mostrar apenas os primeiros 5
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Profissionais Envolvidos */}
            <Card className="lco-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-foreground">
                    <Users className="h-5 w-5 text-primary" />
                    Profissionais Envolvidos ({data.profissionais?.length || data.guias?.reduce((total, guia) => total + (guia.profissionais?.length || 0), 0) || 0} profissionais)
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSection('profissionais')}
                  >
                    {expandedSections.profissionais ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
              {expandedSections.profissionais && (
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(() => {
                      // Se tiver profissionais no nível raiz, usar eles; senão buscar das guias
                      const profissionais = data.profissionais || data.guias?.flatMap(guia =>
                        guia.profissionais?.map(prof => ({
                          ...prof,
                          guia: guia.cabecalhoGuia?.numeroGuiaPrestador || 'N/A'
                        })) || []
                      ) || [];

                      const profissionaisToShow = showAllItems.profissionais ? profissionais : profissionais.slice(0, 4);
                      
                      return profissionaisToShow.map((prof: any, index: number) => (
                        <div key={index} className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                          <div className="font-medium text-foreground">{prof.nome || 'N/A'}</div>
                          <div className="text-sm text-foreground">
                            Conselho: {prof.conselho || 'N/A'} | Número: {prof.numero_conselho || 'N/A'}
                          </div>
                          <div className="text-sm text-foreground">
                            UF: {prof.uf || 'N/A'} | CBOS: {prof.cbos || 'N/A'}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Guia: {prof.guia}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>

                  {(() => {
                    const totalProf = data.profissionais?.length || data.guias?.reduce((total, guia) => total + (guia.profissionais?.length || 0), 0) || 0;
                    return (
                      <>
                        {!showAllItems.profissionais && totalProf > 4 && (
                          <div className="text-center mt-4">
                            <Button
                              variant="outline"
                              onClick={() => toggleShowAll('profissionais')}
                              className="text-foreground border-border hover:bg-accent/10"
                            >
                              <ListChecks className="h-4 w-4 mr-2" />
                              Ver todos os {totalProf} profissionais
                            </Button>
                          </div>
                        )}

                        {showAllItems.profissionais && totalProf > 4 && (
                          <div className="text-center mt-4">
                            <Button
                              variant="outline"
                              onClick={() => toggleShowAll('profissionais')}
                              className="text-foreground border-border hover:bg-accent/10"
                            >
                              <ChevronUp className="h-4 w-4 mr-2" />
                              Mostrar apenas os primeiros 4
                            </Button>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </CardContent>
              )}
            </Card>
      </CardContent>
    </div>
  );
};

export default XMLTISSDetailedViewer;