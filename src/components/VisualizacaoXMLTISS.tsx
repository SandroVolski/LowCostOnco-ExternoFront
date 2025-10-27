import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  Info,
  Clock,
  MapPin,
  CreditCard,
  UserCheck
} from 'lucide-react';

interface XMLTISSData {
  cabecalho: {
    tipoTransacao: string;
    sequencialTransacao: string;
    dataRegistroTransacao: string;
    horaRegistroTransacao: string;
    cnpjPrestador: string;
    registroANS: string;
    numeroLote: string;
    padrao: string;
    nomePrestador: string;
    cnes: string;
  };
  guias: Array<{
    numeroGuiaPrestador: string;
    numeroGuiaOperadora?: string;
    numeroCarteira?: string;
    dataAutorizacao?: string;
    dataSolicitacao?: string;
    senha?: string;
    dataValidadeSenha?: string;
    profissionalSolicitante?: {
      nome: string;
      conselho: string;
      numeroConselho: string;
      uf: string;
      cbos: string;
    };
    indicacaoClinica?: string;
    tipoAtendimento?: string;
    procedimentos: Array<{
      dataExecucao?: string;
      codigoProcedimento: string;
      descricaoProcedimento: string;
      quantidadeExecutada: number;
      valorTotal: number;
    }>;
    medicamentos: Array<{
      dataExecucao?: string;
      codigoProcedimento: string;
      descricaoProcedimento: string;
      quantidadeExecutada: number;
      unidadeMedida?: string;
      valorTotal: number;
    }>;
    materiais: Array<{
      dataExecucao?: string;
      codigoProcedimento: string;
      descricaoProcedimento: string;
      quantidadeExecutada: number;
      valorTotal: number;
    }>;
    taxas: Array<{
      dataExecucao?: string;
      codigoProcedimento: string;
      descricaoProcedimento: string;
      valorTotal: number;
    }>;
    totais: {
      valorProcedimentos: number;
      valorMedicamentos: number;
      valorMateriais: number;
      valorTaxas: number;
      valorTotalGeral: number;
    };
  }>;
  totais: {
    totalGuias: number;
    totalMedicamentos: number;
    totalProcedimentos: number;
    totalMateriais: number;
    totalTaxas: number;
    valorTotalGeral: number;
    periodoInicio: string;
    periodoFim: string;
  };
  profissionais: Array<{
    nome: string;
    conselho: string;
    numeroConselho: string;
    uf: string;
    cbos: string;
  }>;
}

interface VisualizacaoXMLTISSProps {
  data: XMLTISSData;
  onClose: () => void;
}

const VisualizacaoXMLTISS: React.FC<VisualizacaoXMLTISSProps> = ({ data, onClose }) => {
  const [expandedGuias, setExpandedGuias] = useState<Set<string>>(new Set());

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const formatCNPJ = (cnpj: string) => {
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  };

  const toggleGuia = (numeroGuia: string) => {
    const newExpanded = new Set(expandedGuias);
    if (newExpanded.has(numeroGuia)) {
      newExpanded.delete(numeroGuia);
    } else {
      newExpanded.add(numeroGuia);
    }
    setExpandedGuias(newExpanded);
  };

  const isGuiaExpanded = (numeroGuia: string) => expandedGuias.has(numeroGuia);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <FileText className="h-8 w-8" />
                Análise de Arquivo TISS XML
              </h1>
              <p className="text-blue-100 mt-2">{data.cabecalho.nomePrestador}</p>
            </div>
            <Button
              variant="secondary"
              onClick={onClose}
              className="gap-2"
            >
              Fechar
            </Button>
          </div>
        </div>

        {/* Cards de Resumo Executivo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
            <CardContent className="p-6 text-center">
              <FileText className="h-8 w-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">{data.totais.totalGuias}</div>
              <div className="text-blue-100 text-sm">Guias</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
            <CardContent className="p-6 text-center">
              <DollarSign className="h-8 w-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">{formatCurrency(data.totais.valorTotalGeral)}</div>
              <div className="text-green-100 text-sm">Total</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
            <CardContent className="p-6 text-center">
              <Pill className="h-8 w-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">{formatCurrency(data.totais.totalMedicamentos)}</div>
              <div className="text-purple-100 text-sm">Medicamentos</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg">
            <CardContent className="p-6 text-center">
              <Stethoscope className="h-8 w-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">{formatCurrency(data.totais.totalProcedimentos)}</div>
              <div className="text-orange-100 text-sm">Procedimentos</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg">
            <CardContent className="p-6 text-center">
              <Calendar className="h-8 w-8 mx-auto mb-2" />
              <div className="text-lg font-bold">
                {formatDate(data.totais.periodoInicio)} - {formatDate(data.totais.periodoFim)}
              </div>
              <div className="text-indigo-100 text-sm">Período</div>
            </CardContent>
          </Card>
        </div>

        {/* Informações do Lote */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Info className="h-5 w-5" />
              Informações do Lote
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Tipo de Transação</label>
                  <p className="text-lg font-semibold text-gray-900">{data.cabecalho.tipoTransacao}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Sequencial</label>
                  <p className="text-lg font-semibold text-gray-900">{data.cabecalho.sequencialTransacao}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Data/Hora Registro</label>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatDate(data.cabecalho.dataRegistroTransacao)} {data.cabecalho.horaRegistroTransacao}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">CNPJ Prestador</label>
                  <p className="text-lg font-semibold text-gray-900">{formatCNPJ(data.cabecalho.cnpjPrestador)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Registro ANS</label>
                  <p className="text-lg font-semibold text-gray-900">{data.cabecalho.registroANS}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Número do Lote</label>
                  <p className="text-lg font-semibold text-gray-900">{data.cabecalho.numeroLote}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Nome do Prestador</label>
                  <p className="text-lg font-semibold text-gray-900">{data.cabecalho.nomePrestador}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">CNES</label>
                  <p className="text-lg font-semibold text-gray-900">{data.cabecalho.cnes}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Padrão TISS</label>
                  <p className="text-lg font-semibold text-gray-900">{data.cabecalho.padrao}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Guias */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <FileText className="h-5 w-5" />
              Lista de Guias ({data.guias.length} guias)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.guias.map((guia) => (
              <Card key={guia.numeroGuiaPrestador} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  {/* Estado Colapsado */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Guia #{guia.numeroGuiaPrestador}
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleGuia(guia.numeroGuiaPrestador)}
                          className="gap-1"
                        >
                          {isGuiaExpanded(guia.numeroGuiaPrestador) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                          {isGuiaExpanded(guia.numeroGuiaPrestador) ? 'Colapsar' : 'Expandir'}
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{guia.profissionalSolicitante?.nome || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          <span>{guia.indicacaoClinica || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          <span>Carteira: {guia.numeroCarteira || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(guia.dataAutorizacao || '')}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(guia.totais.valorTotalGeral)}
                      </div>
                    </div>
                  </div>

                  {/* Estado Expandido */}
                  {isGuiaExpanded(guia.numeroGuiaPrestador) && (
                    <div className="mt-6 space-y-6 border-t pt-6">
                      {/* Informações Gerais */}
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Info className="h-5 w-5" />
                          Informações Gerais
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                          <div>
                            <label className="text-sm font-medium text-gray-600">Profissional</label>
                            <p className="font-semibold">{guia.profissionalSolicitante?.nome || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">CRM</label>
                            <p className="font-semibold">
                              {guia.profissionalSolicitante?.numeroConselho || 'N/A'} - {guia.profissionalSolicitante?.uf || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Carteira</label>
                            <p className="font-semibold">{guia.numeroCarteira || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Data Autorização</label>
                            <p className="font-semibold">{formatDate(guia.dataAutorizacao || '')}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Data Solicitação</label>
                            <p className="font-semibold">{formatDate(guia.dataSolicitacao || '')}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Senha</label>
                            <p className="font-semibold">{guia.senha || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Validade Senha</label>
                            <p className="font-semibold">{formatDate(guia.dataValidadeSenha || '')}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Indicação Clínica</label>
                            <p className="font-semibold">{guia.indicacaoClinica || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Tipo Atendimento</label>
                            <p className="font-semibold">{guia.tipoAtendimento || 'N/A'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Medicamentos */}
                      {guia.medicamentos.length > 0 && (
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Pill className="h-5 w-5" />
                            Medicamentos ({guia.medicamentos.length} itens)
                          </h4>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr className="bg-blue-50">
                                  <th className="p-3 text-left font-semibold text-gray-700">Data</th>
                                  <th className="p-3 text-left font-semibold text-gray-700">Código</th>
                                  <th className="p-3 text-left font-semibold text-gray-700">Medicamento</th>
                                  <th className="p-3 text-center font-semibold text-gray-700">Qtd</th>
                                  <th className="p-3 text-center font-semibold text-gray-700">Unidade</th>
                                  <th className="p-3 text-right font-semibold text-gray-700">Valor</th>
                                </tr>
                              </thead>
                              <tbody>
                                {guia.medicamentos.map((med, index) => (
                                  <tr key={index} className="border-b hover:bg-gray-50">
                                    <td className="p-3">{formatDate(med.dataExecucao || '')}</td>
                                    <td className="p-3 font-mono text-sm">{med.codigoProcedimento}</td>
                                    <td className="p-3">{med.descricaoProcedimento}</td>
                                    <td className="p-3 text-center">{med.quantidadeExecutada}</td>
                                    <td className="p-3 text-center">{med.unidadeMedida || 'N/A'}</td>
                                    <td className="p-3 text-right font-semibold text-green-600">
                                      {formatCurrency(med.valorTotal)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr className="bg-blue-50 font-bold">
                                  <td colSpan={5} className="p-3 text-right">SUBTOTAL:</td>
                                  <td className="p-3 text-right text-green-600">
                                    {formatCurrency(guia.totais.valorMedicamentos)}
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Procedimentos */}
                      {guia.procedimentos.length > 0 && (
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Stethoscope className="h-5 w-5" />
                            Procedimentos ({guia.procedimentos.length} itens)
                          </h4>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr className="bg-green-50">
                                  <th className="p-3 text-left font-semibold text-gray-700">Data</th>
                                  <th className="p-3 text-left font-semibold text-gray-700">Código</th>
                                  <th className="p-3 text-left font-semibold text-gray-700">Descrição</th>
                                  <th className="p-3 text-center font-semibold text-gray-700">Qtd</th>
                                  <th className="p-3 text-right font-semibold text-gray-700">Valor</th>
                                </tr>
                              </thead>
                              <tbody>
                                {guia.procedimentos.map((proc, index) => (
                                  <tr key={index} className="border-b hover:bg-gray-50">
                                    <td className="p-3">{formatDate(proc.dataExecucao || '')}</td>
                                    <td className="p-3 font-mono text-sm">{proc.codigoProcedimento}</td>
                                    <td className="p-3">{proc.descricaoProcedimento}</td>
                                    <td className="p-3 text-center">{proc.quantidadeExecutada}</td>
                                    <td className="p-3 text-right font-semibold text-green-600">
                                      {formatCurrency(proc.valorTotal)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr className="bg-green-50 font-bold">
                                  <td colSpan={4} className="p-3 text-right">SUBTOTAL:</td>
                                  <td className="p-3 text-right text-green-600">
                                    {formatCurrency(guia.totais.valorProcedimentos)}
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Materiais */}
                      {guia.materiais.length > 0 && (
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Wrench className="h-5 w-5" />
                            Materiais ({guia.materiais.length} itens)
                          </h4>
                          <div className="space-y-2">
                            {guia.materiais.map((mat, index) => (
                              <div key={index} className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-400">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-semibold">{mat.descricaoProcedimento}</p>
                                    <p className="text-sm text-gray-600">
                                      Quantidade: {mat.quantidadeExecutada} | Código: {mat.codigoProcedimento}
                                    </p>
                                  </div>
                                  <p className="font-bold text-green-600">
                                    {formatCurrency(mat.valorTotal)}
                                  </p>
                                </div>
                              </div>
                            ))}
                            <div className="bg-orange-100 p-3 rounded-lg font-bold text-right">
                              SUBTOTAL: {formatCurrency(guia.totais.valorMateriais)}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Taxas */}
                      {guia.taxas.length > 0 && (
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <DollarSign className="h-5 w-5" />
                            Taxas e Aluguéis ({guia.taxas.length} itens)
                          </h4>
                          <div className="space-y-2">
                            {guia.taxas.map((taxa, index) => (
                              <div key={index} className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-400">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-semibold">{taxa.descricaoProcedimento}</p>
                                    <p className="text-sm text-gray-600">Código: {taxa.codigoProcedimento}</p>
                                  </div>
                                  <p className="font-bold text-green-600">
                                    {formatCurrency(taxa.valorTotal)}
                                  </p>
                                </div>
                              </div>
                            ))}
                            <div className="bg-purple-100 p-3 rounded-lg font-bold text-right">
                              SUBTOTAL: {formatCurrency(guia.totais.valorTaxas)}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Resumo Financeiro */}
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <TrendingUp className="h-5 w-5" />
                          Resumo Financeiro
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-green-50 p-4 rounded-lg text-center">
                            <div className="text-sm text-gray-600">Procedimentos</div>
                            <div className="text-lg font-bold text-green-600">
                              {formatCurrency(guia.totais.valorProcedimentos)}
                            </div>
                          </div>
                          <div className="bg-blue-50 p-4 rounded-lg text-center">
                            <div className="text-sm text-gray-600">Medicamentos</div>
                            <div className="text-lg font-bold text-blue-600">
                              {formatCurrency(guia.totais.valorMedicamentos)}
                            </div>
                          </div>
                          <div className="bg-orange-50 p-4 rounded-lg text-center">
                            <div className="text-sm text-gray-600">Materiais</div>
                            <div className="text-lg font-bold text-orange-600">
                              {formatCurrency(guia.totais.valorMateriais)}
                            </div>
                          </div>
                          <div className="bg-purple-50 p-4 rounded-lg text-center">
                            <div className="text-sm text-gray-600">Taxas</div>
                            <div className="text-lg font-bold text-purple-600">
                              {formatCurrency(guia.totais.valorTaxas)}
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg text-center">
                          <div className="text-2xl font-bold">TOTAL GERAL: {formatCurrency(guia.totais.valorTotalGeral)}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        {/* Totalizadores Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
            <CardContent className="p-6 text-center">
              <Pill className="h-8 w-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">{formatCurrency(data.totais.totalMedicamentos)}</div>
              <div className="text-blue-100 text-sm">Medicamentos</div>
              <div className="text-blue-200 text-xs mt-1">22 itens</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
            <CardContent className="p-6 text-center">
              <Stethoscope className="h-8 w-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">{formatCurrency(data.totais.totalProcedimentos)}</div>
              <div className="text-green-100 text-sm">Procedimentos</div>
              <div className="text-green-200 text-xs mt-1">8 itens</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg">
            <CardContent className="p-6 text-center">
              <Wrench className="h-8 w-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">{formatCurrency(data.totais.totalMateriais)}</div>
              <div className="text-orange-100 text-sm">Materiais</div>
              <div className="text-orange-200 text-xs mt-1">3 itens</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
            <CardContent className="p-6 text-center">
              <DollarSign className="h-8 w-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">{formatCurrency(data.totais.totalTaxas)}</div>
              <div className="text-purple-100 text-sm">Taxas</div>
              <div className="text-purple-200 text-xs mt-1">13 itens</div>
            </CardContent>
          </Card>
        </div>

        {/* Valor Total Geral */}
        <Card className="bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="text-4xl font-bold mb-2">VALOR TOTAL GERAL</div>
            <div className="text-6xl font-bold mb-4">{formatCurrency(data.totais.valorTotalGeral)}</div>
            <div className="text-xl text-green-100">{data.totais.totalGuias} guias processadas</div>
          </CardContent>
        </Card>

        {/* Profissionais Envolvidos */}
        {data.profissionais.length > 0 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-700">
                <Users className="h-5 w-5" />
                Profissionais Envolvidos ({data.profissionais.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.profissionais.map((profissional, index) => (
                  <div key={index} className="bg-gradient-to-br from-indigo-50 to-blue-100 p-4 rounded-lg border-l-4 border-indigo-500">
                    <div className="font-semibold text-gray-900 mb-2">{profissional.nome}</div>
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                      {profissional.conselho} {profissional.numeroConselho} - {profissional.uf}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default VisualizacaoXMLTISS;
