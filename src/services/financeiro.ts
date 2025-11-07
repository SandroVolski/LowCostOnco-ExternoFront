import axios from 'axios';
import config from '@/config/environment';

const API_URL = config.API_BASE_URL;

// Configurar interceptor do axios para incluir token de autenticação
axios.interceptors.request.use(
  (config) => {
    // Verificar primeiro o token padrão, depois o token da operadora
    const defaultToken = localStorage.getItem('authAccessToken');
    if (defaultToken) {
      config.headers.Authorization = `Bearer ${defaultToken}`;
      return config;
    }
    
    const operadoraToken = localStorage.getItem('operadora_access_token');
    if (operadoraToken) {
      config.headers.Authorization = `Bearer ${operadoraToken}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export interface LoteFinanceiro {
  id: number;
  lote_id?: number;
  clinica_id: number;
  operadora_registro_ans: string;
  operadora_nome: string;
  numero_lote: string;
  competencia: string;
  data_envio: string;
  quantidade_guias: number;
  valor_total: number;
  status: 'pendente' | 'pago' | 'glosado';
  arquivo_xml: string;
  // Campos do cabeçalho TISS
  tipo_transacao?: string;
  sequencial_transacao?: string;
  data_registro_transacao?: string;
  hora_registro_transacao?: string;
  cnpj_prestador?: string;
  nome_prestador?: string;
  registro_ans?: string;
  padrao_tiss?: string;
  hash_lote?: string;
  cnes?: string;
  created_at: string;
}

export interface Operadora {
  id: number;
  nome: string;
  codigo: string;
}

export interface GuiaFinanceira {
  id: number;
  lote_id: number;
  numero_guia_prestador: string;
  numero_guia_operadora: string;
  numero_carteira: string;
  data_autorizacao: string;
  data_execucao: string;
  valor_procedimentos: number;
  valor_taxas: number;
  valor_materiais: number;
  valor_medicamentos: number;
  valor_total: number;
  status_pagamento: 'pendente' | 'pago' | 'glosado';
  documentos_anexos?: string;
}

export interface ProcessarXMLResponse {
  success: boolean;
  lote_id: number;
  numero_lote: string;
  quantidade_guias: number;
  valor_total: number;
  message: string;
}

export const FinanceiroService = {
  /**
   * Buscar operadoras ativas
   */
  async getOperadoras(): Promise<Operadora[]> {
    try {
      const response = await axios.get(`${API_URL}/operadora-auth/operadoras`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao buscar operadoras');
    }
  },

  /**
   * Upload e processamento de arquivo XML TISS
   */
  async uploadXML(formData: FormData): Promise<ProcessarXMLResponse> {
    try {
      const response = await axios.post(`${API_URL}/financeiro/upload-xml`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao processar XML');
    }
  },

  /**
   * Buscar todos os lotes de uma clínica
   */
  async getLotes(clinicaId: number): Promise<LoteFinanceiro[]> {
    try {
      const response = await axios.get(`${API_URL}/financeiro/lotes`, {
        params: { clinica_id: clinicaId },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao buscar lotes');
    }
  },

  /**
   * Buscar lote específico por ID
   */
  async getLoteById(loteId: number): Promise<LoteFinanceiro> {
    try {
      const response = await axios.get(`${API_URL}/financeiro/lotes/${loteId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao buscar lote');
    }
  },

  /**
   * Buscar guias de um lote específico
   */
  async getGuiasPorLote(loteId: number): Promise<GuiaFinanceira[]> {
    try {
      const response = await axios.get(`${API_URL}/financeiro/lotes/${loteId}/guias`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao buscar guias');
    }
  },

  /**
   * Buscar guias de um lote específico (alias)
   */
  async getGuiasByLoteId(loteId: number): Promise<GuiaFinanceira[]> {
    return this.getGuiasPorLote(loteId);
  },

  /**
   * Buscar guia específica por ID
   */
  async getGuiaById(guiaId: number): Promise<GuiaFinanceira> {
    try {
      const response = await axios.get(`${API_URL}/financeiro/guias/${guiaId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao buscar guia');
    }
  },

  /**
   * Atualizar status de um lote
   */
  async updateLoteStatus(loteId: number, status: string): Promise<void> {
    try {
      await axios.patch(`${API_URL}/financeiro/lotes/${loteId}/status`, {
        status,
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao atualizar status do lote');
    }
  },

  /**
   * Atualizar status de uma guia
   */
  async updateGuiaStatus(guiaId: number, status: string): Promise<void> {
    try {
      await axios.patch(`${API_URL}/financeiro/guias/${guiaId}/status`, {
        status,
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao atualizar status da guia');
    }
  },

  /**
   * Atualizar status de uma guia (alias)
   */
  async updateStatusGuia(guiaId: number, status: string): Promise<void> {
    return this.updateGuiaStatus(guiaId, status);
  },

  /**
   * Buscar procedimentos de uma guia
   */
  async getProcedimentosPorGuia(guiaId: number): Promise<any[]> {
    try {
      const response = await axios.get(`${API_URL}/financeiro/guias/${guiaId}/procedimentos`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao buscar procedimentos');
    }
  },

  /**
   * Buscar despesas de uma guia
   */
  async getDespesasPorGuia(guiaId: number): Promise<any[]> {
    try {
      const response = await axios.get(`${API_URL}/financeiro/guias/${guiaId}/despesas`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao buscar despesas');
    }
  },

  /**
   * Buscar documentos de uma guia
   */
  async getDocumentosPorGuia(guiaId: number): Promise<any[]> {
    try {
      const response = await axios.get(`${API_URL}/financeiro/guias/${guiaId}/documentos`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao buscar documentos');
    }
  },

  /**
   * Buscar histórico de uma guia
   */
  async getHistoricoPorGuia(guiaId: number): Promise<any[]> {
    try {
      const response = await axios.get(`${API_URL}/financeiro/guias/${guiaId}/historico`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao buscar histórico');
    }
  },

  /**
   * Anexar documentos a uma guia
   */
  async anexarDocumentos(formData: FormData): Promise<void> {
    try {
      await axios.post(`${API_URL}/financeiro/guias/anexar-documentos`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao anexar documentos');
    }
  },

  /**
   * Anexar documento a uma guia (alias)
   */
  async anexarDocumento(formData: FormData): Promise<void> {
    return this.anexarDocumentos(formData);
  },

  /**
   * Buscar lotes por competência
   */
  async getLotesPorCompetencia(clinicaId: number, competencia: string): Promise<LoteFinanceiro[]> {
    try {
      const response = await axios.get(`${API_URL}/financeiro/lotes/competencia/${competencia}`, {
        params: { clinica_id: clinicaId },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao buscar lotes por competência');
    }
  },

  /**
   * Buscar lotes por operadora
   */
  async getLotesPorOperadora(clinicaId: number, registroANS: string): Promise<LoteFinanceiro[]> {
    try {
      const response = await axios.get(`${API_URL}/financeiro/lotes/operadora/${registroANS}`, {
        params: { clinica_id: clinicaId },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao buscar lotes por operadora');
    }
  },

  /**
   * Buscar estatísticas financeiras
   */
  async getEstatisticas(clinicaId: number): Promise<{
    total_lotes: number;
    total_guias: number;
    valor_total: number;
    valor_pago: number;
    valor_pendente: number;
    valor_glosado: number;
  }> {
    try {
      const response = await axios.get(`${API_URL}/financeiro/estatisticas`, {
        params: { clinica_id: clinicaId },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao buscar estatísticas');
    }
  },

  /**
   * Baixar/Visualizar XML de um lote
   */
  async getXMLLote(loteId: number): Promise<{
    success: boolean;
    fileName: string;
    fileSize: number;
    uploadDate: string;
    rawContent: string;
  }> {
    try {
      const response = await axios.get(`${API_URL}/financeiro/lotes/${loteId}/xml`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao buscar XML do lote');
    }
  },

  /**
   * Download do arquivo XML de um lote
   */
  async downloadXMLLote(loteId: number): Promise<void> {
    try {
      const xmlData = await this.getXMLLote(loteId);
      
      if (!xmlData.success || !xmlData.rawContent) {
        throw new Error('XML não encontrado ou inválido');
      }

      // Criar blob com o conteúdo XML
      const blob = new Blob([xmlData.rawContent], { type: 'application/xml' });
      
      // Criar URL temporária
      const url = window.URL.createObjectURL(blob);
      
      // Criar link de download
      const link = document.createElement('a');
      link.href = url;
      link.download = xmlData.fileName || `lote_${loteId}.xml`;
      
      // Adicionar ao DOM, clicar e remover
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Liberar URL
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Erro ao baixar XML');
    }
  },
};

