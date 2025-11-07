export interface FinanceiroVisualizationResult {
  processedData: any;
  guiasMap: Map<string, any>;
}

const toNumber = (value: any): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

export function buildFinanceiroVisualization(loteData: any, allItems: any[] = []): FinanceiroVisualizationResult {
  const guiasData = (allItems || []).filter((item) => item?.tipo_item === 'guia');
  const guiasMap = new Map<string, any>();

  guiasData.forEach((guia: any) => {
    const key = String(guia?.numero_guia_prestador || '').trim();
    if (key) {
      guiasMap.set(key, guia);
    }
  });

  const guiasProcessadas = guiasData.map((guia: any) => {
    const procedimentos = allItems.filter(
      (item: any) => item?.parent_id === guia.id && item?.tipo_item === 'procedimento'
    );

    const despesas = allItems.filter(
      (item: any) => item?.parent_id === guia.id && item?.tipo_item === 'despesa'
    );

    const medicamentos = despesas.filter((item: any) => (
      item?.codigo_despesa === '02' || String(item?.codigo_item || '').startsWith('90')
    ));

    const materiais = despesas.filter((item: any) => (
      item?.codigo_despesa === '03' || String(item?.codigo_item || '').startsWith('7')
    ));

    const taxas = despesas.filter((item: any) => (
      item?.codigo_despesa === '07' || String(item?.codigo_item || '').startsWith('6')
    ));

    const numeroGuia = guia?.numero_guia_prestador || 'N/A';

    const procedimentosProcessados = procedimentos.map((proc: any) => ({
      data_execucao: proc?.data_execucao,
      codigo_procedimento: proc?.codigo_item,
      descricao_procedimento: proc?.descricao_item,
      quantidade_executada: toNumber(proc?.quantidade_executada),
      unidade_medida: proc?.unidade_medida,
      valor_total: toNumber(proc?.valor_total),
      status_pagamento: proc?.status_pagamento || 'pendente',
      executante_nome: proc?.executante_nome,
      executante_conselho: proc?.executante_conselho,
      executante_numero_conselho: proc?.executante_numero_conselho,
      executante_uf: proc?.executante_uf,
      executante_cbos: proc?.executante_cbos,
    }));

    const medicamentosProcessados = medicamentos.map((med: any) => ({
      data_execucao: med?.data_execucao,
      codigo_medicamento: med?.codigo_item,
      descricao: med?.descricao_item,
      quantidade_executada: toNumber(med?.quantidade_executada),
      unidade_medida: med?.unidade_medida,
      valor_total: toNumber(med?.valor_total),
      status_pagamento: med?.status_pagamento || 'pendente',
    }));

    const materiaisProcessados = materiais.map((mat: any) => ({
      data_execucao: mat?.data_execucao,
      codigo_material: mat?.codigo_item,
      descricao: mat?.descricao_item,
      quantidade_executada: toNumber(mat?.quantidade_executada),
      unidade_medida: mat?.unidade_medida,
      valor_total: toNumber(mat?.valor_total),
      status_pagamento: mat?.status_pagamento || 'pendente',
    }));

    const taxasProcessadas = taxas.map((taxa: any) => ({
      data_execucao: taxa?.data_execucao,
      codigo_taxa: taxa?.codigo_item,
      descricao: taxa?.descricao_item,
      quantidade_executada: toNumber(taxa?.quantidade_executada),
      valor_total: toNumber(taxa?.valor_total),
      status_pagamento: taxa?.status_pagamento || 'pendente',
    }));

    const valorProcedimentos = procedimentosProcessados.reduce((sum, item) => sum + (item.valor_total || 0), 0);
    const valorMedicamentos = medicamentosProcessados.reduce((sum, item) => sum + (item.valor_total || 0), 0);
    const valorMateriais = materiaisProcessados.reduce((sum, item) => sum + (item.valor_total || 0), 0);
    const valorTaxas = taxasProcessadas.reduce((sum, item) => sum + (item.valor_total || 0), 0);

    return {
      guiaId: guia?.id,
      cabecalhoGuia: {
        numeroGuiaPrestador: numeroGuia,
        registroANS: loteData?.registro_ans || loteData?.cabecalho?.registroANS || 'N/A',
      },
      dadosBeneficiario: {
        numeroCarteira: guia?.numero_carteira || 'N/A',
      },
      dadosAutorizacao: {
        dataAutorizacao: guia?.data_autorizacao || 'N/A',
        senha: guia?.senha || numeroGuia || 'N/A',
      },
      dadosSolicitante: {
        profissional: {
          nomeProfissional: guia?.profissional_nome || 'N/A',
          conselhoProfissional: guia?.profissional_conselho || 'N/A',
          numeroConselhoProfissional: guia?.profissional_numero_conselho || 'N/A',
        },
      },
      dadosSolicitacao: {
        indicacaoClinica: guia?.indicacao_clinica || 'N/A',
      },
      valorTotal: {
        valorProcedimentos,
        valorMedicamentos,
        valorMateriais,
        valorTaxasAlugueis: valorTaxas,
        valorTotalGeral: toNumber(guia?.valor_total),
      },
      procedimentos: procedimentosProcessados,
      medicamentos: medicamentosProcessados,
      materiais: materiaisProcessados,
      taxas: taxasProcessadas,
    };
  });

  const totalProcedimentos = guiasProcessadas.reduce((sum, guia) => sum + (guia.valorTotal?.valorProcedimentos || 0), 0);
  const totalMedicamentos = guiasProcessadas.reduce((sum, guia) => sum + (guia.valorTotal?.valorMedicamentos || 0), 0);
  const totalMateriais = guiasProcessadas.reduce((sum, guia) => sum + (guia.valorTotal?.valorMateriais || 0), 0);
  const totalTaxas = guiasProcessadas.reduce((sum, guia) => sum + (guia.valorTotal?.valorTaxasAlugueis || 0), 0);

  const todosProfissionais: Array<{ nome: string; conselho: string; numero_conselho: string; uf: string; cbos: string; guia: string; }> = [];

  guiasProcessadas.forEach((guia) => {
    const numeroGuia = guia?.cabecalhoGuia?.numeroGuiaPrestador || 'N/A';

    if (guia?.dadosSolicitante?.profissional?.nomeProfissional && guia?.dadosSolicitante?.profissional?.nomeProfissional !== 'N/A') {
      const existe = todosProfissionais.find((p) => p.nome === guia.dadosSolicitante.profissional.nomeProfissional && p.guia === numeroGuia);
      if (!existe) {
        todosProfissionais.push({
          nome: guia.dadosSolicitante.profissional.nomeProfissional,
          conselho: guia.dadosSolicitante.profissional.conselhoProfissional || 'N/A',
          numero_conselho: guia.dadosSolicitante.profissional.numeroConselhoProfissional || 'N/A',
          uf: loteData?.profissional_uf || 'N/A',
          cbos: loteData?.profissional_cbos || 'N/A',
          guia: numeroGuia,
        });
      }
    }

    const guiaOriginal = guiasMap.get(numeroGuia) || guiasData.find((g: any) => g.numero_guia_prestador === numeroGuia);
    const procedimentosOriginais = (allItems || []).filter((item: any) => item?.parent_id === guiaOriginal?.id && item?.tipo_item === 'procedimento');

    procedimentosOriginais.forEach((proc: any) => {
      if (!proc?.executante_nome) return;
      const existe = todosProfissionais.find((p) => p.nome === proc.executante_nome && p.guia === numeroGuia);
      if (!existe) {
        todosProfissionais.push({
          nome: proc.executante_nome,
          conselho: proc.executante_conselho || 'N/A',
          numero_conselho: proc.executante_numero_conselho || 'N/A',
          uf: proc.executante_uf || 'N/A',
          cbos: proc.executante_cbos || 'N/A',
          guia: numeroGuia,
        });
      }
    });
  });

  const cabecalhoBase = {
    tipoTransacao: loteData?.cabecalho?.tipoTransacao || loteData?.tipo_transacao || 'ENVIO_LOTE_GUIAS',
    sequencialTransacao: loteData?.cabecalho?.sequencialTransacao || loteData?.sequencial_transacao || loteData?.numero_lote || 'N/A',
    dataRegistroTransacao: loteData?.cabecalho?.dataRegistroTransacao || loteData?.data_registro_transacao || loteData?.data_envio || null,
    horaRegistroTransacao: loteData?.cabecalho?.horaRegistroTransacao || loteData?.hora_registro_transacao || null,
    cnpjPrestador: loteData?.cabecalho?.cnpjPrestador || loteData?.cnpj_prestador || 'N/A',
    registroANS: loteData?.cabecalho?.registroANS || loteData?.operadora_registro_ans || 'N/A',
    operadoraNome: loteData?.cabecalho?.operadoraNome || loteData?.operadora_nome || 'N/A',
    nomePrestador: loteData?.cabecalho?.nomePrestador || loteData?.nome_prestador || 'N/A',
    cnes: loteData?.cabecalho?.cnes || loteData?.cnes || 'N/A',
    hash: loteData?.cabecalho?.hash || loteData?.hash_lote || loteData?.hash_xml || 'N/A',
  };

  const processedData = {
    cabecalho: cabecalhoBase,
    lote: loteData?.lote
      ? {
          ...loteData.lote,
          numeroLote: loteData.lote.numeroLote || loteData.numero_lote || 'N/A',
          competencia: loteData.lote.competencia || loteData.competencia || 'N/A',
          data_envio: loteData.lote.data_envio || loteData.data_envio || null,
          valor_total: toNumber(loteData.lote.valor_total || loteData.valor_total || 0),
        }
      : {
          numeroLote: loteData?.numero_lote || 'N/A',
          competencia: loteData?.competencia || 'N/A',
          data_envio: loteData?.data_envio || null,
          valor_total: toNumber(loteData?.valor_total || 0),
        },
    operadora: {
      nome: loteData?.operadora_nome || loteData?.operadora?.nome || 'N/A',
      registro_ans: loteData?.operadora_registro_ans || loteData?.operadora?.registro_ans || 'N/A',
    },
    versao_tiss: loteData?.versao_tiss || loteData?.padrao_tiss || '4.01.00',
    hash_xml: loteData?.hash_xml || loteData?.hash_lote || 'N/A',
    guias: guiasProcessadas,
    totais: {
      totalGuias: guiasData.length,
      totalMedicamentos,
      totalProcedimentos,
      totalMateriais,
      totalTaxas,
      valorTotalGeral: toNumber(loteData?.valor_total || loteData?.lote?.valor_total || 0),
      periodoInicio: loteData?.data_envio || loteData?.lote?.data_envio || null,
      periodoFim: loteData?.data_envio || loteData?.lote?.data_envio || null,
    },
    profissionais: todosProfissionais,
  };

  return {
    processedData,
    guiasMap,
  };
}
