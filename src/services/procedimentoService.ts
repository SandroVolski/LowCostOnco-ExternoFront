// src/services/procedimentoService.ts

import config from '@/config/environment';
import { authorizedFetch } from './authService';

const API_BASE_URL = config.API_BASE_URL;

export type CategoriaProcedimento = 'honorarios' | 'taxas_diarias' | 'materiais_medicamentos';
export type StatusProcedimento = 'ativo' | 'inativo';
export type StatusNegociacao = 'ativo' | 'inativo' | 'vencido';

export interface Procedimento {
  id?: number;
  clinica_id: number;
  codigo: string;
  descricao: string;
  categoria: CategoriaProcedimento;
  unidade_pagamento: string;
  fracionamento: boolean;
  status: StatusProcedimento;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProcedimentoOperadora {
  id?: number;
  procedimento_id: number;
  operadora_id: number;
  clinica_id: number;
  valor: number;
  credenciado: boolean;
  data_inicio: string;
  data_fim?: string | null;
  status: StatusNegociacao;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
  
  // Campos extras para joins
  procedimento_codigo?: string;
  procedimento_descricao?: string;
  operadora_nome?: string;
  operadora_codigo?: string;
}

export interface ProcedimentoComNegociacoes extends Procedimento {
  negociacoes?: ProcedimentoOperadora[];
}

export interface ProcedimentoCreateInput {
  clinica_id: number;
  codigo: string;
  descricao: string;
  categoria: CategoriaProcedimento;
  unidade_pagamento: string;
  fracionamento: boolean;
  status?: StatusProcedimento;
  observacoes?: string;
}

export interface ProcedimentoUpdateInput {
  codigo?: string;
  descricao?: string;
  categoria?: CategoriaProcedimento;
  unidade_pagamento?: string;
  fracionamento?: boolean;
  status?: StatusProcedimento;
  observacoes?: string;
}

export interface NegociacaoCreateInput {
  operadora_id: number;
  clinica_id: number;
  valor: number;
  credenciado: boolean;
  data_inicio: string;
  data_fim?: string | null;
  status?: StatusNegociacao;
  observacoes?: string;
}

export interface NegociacaoUpdateInput {
  valor?: number;
  credenciado?: boolean;
  data_inicio?: string;
  data_fim?: string | null;
  status?: StatusNegociacao;
  observacoes?: string;
}

export class ProcedimentoService {
  
  // ==================== PROCEDIMENTOS ====================
  
  /**
   * Buscar todos os procedimentos de uma clínica
   */
  static async getProcedimentosByClinica(clinicaId: number): Promise<Procedimento[]> {
    try {
      const response = await authorizedFetch(`${API_BASE_URL}/procedimentos?clinica_id=${clinicaId}`);
      const data = await response.json();
      if (data.success) {
        return data.data;
      }
      throw new Error(data.message || 'Erro ao buscar procedimentos');
    } catch (error: any) {
      console.error('Erro ao buscar procedimentos:', error);
      throw new Error(error.message || 'Erro ao buscar procedimentos');
    }
  }
  
  /**
   * Buscar procedimento por ID com suas negociações
   */
  static async getProcedimentoById(id: number): Promise<ProcedimentoComNegociacoes> {
    try {
      const response = await authorizedFetch(`${API_BASE_URL}/procedimentos/${id}`);
      const data = await response.json();
      if (data.success) {
        return data.data;
      }
      throw new Error(data.message || 'Erro ao buscar procedimento');
    } catch (error: any) {
      console.error('Erro ao buscar procedimento:', error);
      throw new Error(error.message || 'Erro ao buscar procedimento');
    }
  }
  
  /**
   * Criar novo procedimento
   */
  static async createProcedimento(data: ProcedimentoCreateInput): Promise<Procedimento> {
    try {
      const response = await authorizedFetch(`${API_BASE_URL}/procedimentos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (result.success) {
        return result.data;
      }
      throw new Error(result.message || 'Erro ao criar procedimento');
    } catch (error: any) {
      console.error('Erro ao criar procedimento:', error);
      throw new Error(error.message || 'Erro ao criar procedimento');
    }
  }
  
  /**
   * Atualizar procedimento
   */
  static async updateProcedimento(id: number, data: ProcedimentoUpdateInput): Promise<Procedimento> {
    try {
      const response = await authorizedFetch(`${API_BASE_URL}/procedimentos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (result.success) {
        return result.data;
      }
      throw new Error(result.message || 'Erro ao atualizar procedimento');
    } catch (error: any) {
      console.error('Erro ao atualizar procedimento:', error);
      throw new Error(error.message || 'Erro ao atualizar procedimento');
    }
  }
  
  /**
   * Deletar procedimento
   */
  static async deleteProcedimento(id: number): Promise<void> {
    try {
      const response = await authorizedFetch(`${API_BASE_URL}/procedimentos/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Erro ao deletar procedimento');
      }
    } catch (error: any) {
      console.error('Erro ao deletar procedimento:', error);
      throw new Error(error.message || 'Erro ao deletar procedimento');
    }
  }
  
  // ==================== NEGOCIAÇÕES ====================
  
  /**
   * Buscar negociações de uma clínica
   */
  static async getNegociacoesByClinica(clinicaId: number): Promise<ProcedimentoOperadora[]> {
    try {
      const response = await authorizedFetch(`${API_BASE_URL}/procedimentos/negociacoes/all?clinica_id=${clinicaId}`);
      const data = await response.json();
      if (data.success) {
        return data.data;
      }
      throw new Error(data.message || 'Erro ao buscar negociações');
    } catch (error: any) {
      console.error('Erro ao buscar negociações:', error);
      throw new Error(error.message || 'Erro ao buscar negociações');
    }
  }
  
  /**
   * Buscar negociações de um procedimento
   */
  static async getNegociacoesByProcedimento(procedimentoId: number): Promise<ProcedimentoOperadora[]> {
    try {
      const response = await authorizedFetch(`${API_BASE_URL}/procedimentos/${procedimentoId}/negociacoes`);
      const data = await response.json();
      if (data.success) {
        return data.data;
      }
      throw new Error(data.message || 'Erro ao buscar negociações do procedimento');
    } catch (error: any) {
      console.error('Erro ao buscar negociações do procedimento:', error);
      throw new Error(error.message || 'Erro ao buscar negociações do procedimento');
    }
  }
  
  /**
   * Buscar negociações vigentes entre clínica e operadora
   */
  static async getNegociacoesVigentes(clinicaId: number, operadoraId: number): Promise<ProcedimentoOperadora[]> {
    try {
      const response = await authorizedFetch(`${API_BASE_URL}/procedimentos/negociacoes/vigentes?clinica_id=${clinicaId}&operadora_id=${operadoraId}`);
      const data = await response.json();
      if (data.success) {
        return data.data;
      }
      throw new Error(data.message || 'Erro ao buscar negociações vigentes');
    } catch (error: any) {
      console.error('Erro ao buscar negociações vigentes:', error);
      throw new Error(error.message || 'Erro ao buscar negociações vigentes');
    }
  }
  
  /**
   * Criar nova negociação
   */
  static async createNegociacao(procedimentoId: number, data: NegociacaoCreateInput): Promise<ProcedimentoOperadora> {
    try {
      const response = await authorizedFetch(`${API_BASE_URL}/procedimentos/${procedimentoId}/negociacoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (result.success) {
        return result.data;
      }
      throw new Error(result.message || 'Erro ao criar negociação');
    } catch (error: any) {
      console.error('Erro ao criar negociação:', error);
      throw new Error(error.message || 'Erro ao criar negociação');
    }
  }
  
  /**
   * Atualizar negociação
   */
  static async updateNegociacao(id: number, data: NegociacaoUpdateInput): Promise<ProcedimentoOperadora> {
    try {
      const response = await authorizedFetch(`${API_BASE_URL}/procedimentos/negociacoes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (result.success) {
        return result.data;
      }
      throw new Error(result.message || 'Erro ao atualizar negociação');
    } catch (error: any) {
      console.error('Erro ao atualizar negociação:', error);
      throw new Error(error.message || 'Erro ao atualizar negociação');
    }
  }
  
  /**
   * Deletar negociação
   */
  static async deleteNegociacao(id: number): Promise<void> {
    try {
      const response = await authorizedFetch(`${API_BASE_URL}/procedimentos/negociacoes/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Erro ao deletar negociação');
      }
    } catch (error: any) {
      console.error('Erro ao deletar negociação:', error);
      throw new Error(error.message || 'Erro ao deletar negociação');
    }
  }
  
  // ==================== HELPERS ====================
  
  /**
   * Formatar categoria para exibição
   */
  static formatCategoria(categoria: CategoriaProcedimento): string {
    const categorias = {
      'honorarios': 'Honorários',
      'taxas_diarias': 'Taxas e Diárias',
      'materiais_medicamentos': 'Materiais e Medicamentos'
    };
    return categorias[categoria] || categoria;
  }
  
  /**
   * Formatar status para exibição
   */
  static formatStatus(status: StatusProcedimento | StatusNegociacao): string {
    const statusMap = {
      'ativo': 'Ativo',
      'inativo': 'Inativo',
      'vencido': 'Vencido'
    };
    return statusMap[status] || status;
  }
  
  /**
   * Formatar valor em moeda brasileira
   */
  static formatValor(valor: number): string {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }
  
  /**
   * Verificar se uma negociação está vigente
   */
  static isNegociacaoVigente(negociacao: ProcedimentoOperadora): boolean {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const dataInicio = new Date(negociacao.data_inicio);
    dataInicio.setHours(0, 0, 0, 0);
    
    if (dataInicio > hoje) return false;
    
    if (negociacao.data_fim) {
      const dataFim = new Date(negociacao.data_fim);
      dataFim.setHours(0, 0, 0, 0);
      if (dataFim < hoje) return false;
    }
    
    return negociacao.status === 'ativo';
  }
}

export default ProcedimentoService;

