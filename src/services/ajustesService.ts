// src/services/ajustesService.ts

import config from '@/config/environment';
import { authorizedFetch } from '@/services/authService';

const API_BASE_URL = config.API_BASE_URL;

// Interfaces para comunicação com a API
interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Anexo {
  id: number;
  solicitacao_id: number;
  arquivo_url: string;
  arquivo_nome: string;
  arquivo_tamanho: number;
  created_at: string;
}

export interface HistoricoItem {
  id: number;
  solicitacao_id: number;
  status: 'pendente' | 'em_analise' | 'aprovado' | 'rejeitado';
  comentario: string;
  created_at: string;
}

export interface SolicitacaoCorpoClinico {
  id?: number;
  clinica_id: number;
  tipo: 'corpo_clinico';
  titulo: string;
  descricao: string;
  status: 'pendente' | 'em_analise' | 'aprovado' | 'rejeitado';
  medico: string;
  especialidade: string;
  prioridade: null;
  categoria: null;
  created_at?: string;
  updated_at?: string;
  anexos?: Anexo[];
  historico?: HistoricoItem[];
}

export interface SolicitacaoNegociacao {
  id?: number;
  clinica_id: number;
  tipo: 'negociacao';
  titulo: string;
  descricao: string;
  status: 'pendente' | 'em_analise' | 'aprovado' | 'rejeitado';
  prioridade: 'baixa' | 'media' | 'alta' | 'critica';
  categoria: 'protocolo' | 'medicamento' | 'procedimento' | 'administrativo';
  medico: null;
  especialidade: null;
  created_at?: string;
  updated_at?: string;
  anexos?: Anexo[];
  historico?: HistoricoItem[];
}

export type SolicitacaoAjuste = SolicitacaoCorpoClinico | SolicitacaoNegociacao;

export interface FiltrosSolicitacao {
  clinica_id: number;
  tipo: 'corpo_clinico';
  status?: 'pendente' | 'em_analise' | 'aprovado' | 'rejeitado';
  search?: string;
  medico?: string;
  especialidade?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
}

export interface FiltrosNegociacao {
  clinica_id: number;
  tipo: 'negociacao';
  status?: 'pendente' | 'em_analise' | 'aprovado' | 'rejeitado';
  prioridade?: 'baixa' | 'media' | 'alta' | 'critica';
  categoria?: 'protocolo' | 'medicamento' | 'procedimento' | 'administrativo';
  search?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
}

export interface NovaSolicitacao {
  clinica_id: number;
  tipo: 'corpo_clinico';
  titulo: string;
  descricao: string;
  medico: string;
  especialidade: string;
}

export interface NovaSolicitacaoNegociacao {
  clinica_id: number;
  tipo: 'negociacao';
  titulo: string;
  descricao: string;
  prioridade: 'baixa' | 'media' | 'alta' | 'critica';
  categoria: 'protocolo' | 'medicamento' | 'procedimento' | 'administrativo';
}

export interface AtualizacaoSolicitacao {
  titulo?: string;
  descricao?: string;
  medico?: string;
  especialidade?: string;
}

export interface AtualizacaoNegociacao {
  titulo?: string;
  descricao?: string;
  prioridade?: 'baixa' | 'media' | 'alta' | 'critica';
  categoria?: 'protocolo' | 'medicamento' | 'procedimento' | 'administrativo';
}

export interface AlteracaoStatus {
  status: 'em_analise' | 'aprovado' | 'rejeitado';
  comentario?: string;
}

export interface EstatisticasNegociacao {
  solicitacoesCriticas: number;
  totalSolicitacoes: number;
  taxaAprovacao: number;
  protocolosAtualizados: number;
  tempoMedioRetorno: number;
  solicitacoesPorStatus: {
    pendente: number;
    em_analise: number;
    aprovado: number;
    rejeitado: number;
  };
  solicitacoesPorPrioridade: {
    baixa: number;
    media: number;
    alta: number;
    critica: number;
  };
  solicitacoesPorCategoria: {
    protocolo: number;
    medicamento: number;
    procedimento: number;
    administrativo: number;
  };
}

export class AjustesService {
  
  // Listar solicitações de corpo clínico
  static async listarSolicitacoes(filtros: FiltrosSolicitacao): Promise<PaginatedResponse<SolicitacaoCorpoClinico>> {
    try {
      const query = new URLSearchParams();
      
      // Parâmetros obrigatórios
      query.append('clinica_id', String(filtros.clinica_id));
      query.append('tipo', filtros.tipo);
      
      // Parâmetros opcionais
      if (filtros.status) query.append('status', filtros.status);
      if (filtros.search) query.append('search', filtros.search);
      if (filtros.medico) query.append('medico', filtros.medico);
      if (filtros.especialidade) query.append('especialidade', filtros.especialidade);
      if (filtros.page) query.append('page', String(filtros.page));
      if (filtros.pageSize) query.append('pageSize', String(filtros.pageSize));
      if (filtros.sort) query.append('sort', filtros.sort);
      
      const response = await authorizedFetch(`${API_BASE_URL}/ajustes/solicitacoes?${query.toString()}`);
      
      if (response.status === 404) {
        // Backend remoto ainda não publicou ajustes: retornar vazio
        return { items: [], total: 0, page: filtros.page || 1, pageSize: filtros.pageSize || 20 };
      }
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result: ApiResponse<PaginatedResponse<SolicitacaoCorpoClinico>> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao listar solicitações');
      }
      
      return result.data!;
    } catch (error) {
      console.error('❌ Erro ao listar solicitações:', error);
      throw error;
    }
  }

  // Obter uma solicitação específica
  static async obterSolicitacao(id: number): Promise<SolicitacaoCorpoClinico> {
    try {
      const response = await fetch(`${API_BASE_URL}/ajustes/solicitacoes/${id}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result: ApiResponse<SolicitacaoCorpoClinico> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao obter solicitação');
      }
      
      return result.data!;
    } catch (error) {
      console.error('❌ Erro ao obter solicitação:', error);
      throw error;
    }
  }

  // Criar nova solicitação
  static async criarSolicitacao(dados: NovaSolicitacao): Promise<SolicitacaoCorpoClinico> {
    try {
      const response = await authorizedFetch(`${API_BASE_URL}/ajustes/solicitacoes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dados),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result: ApiResponse<SolicitacaoCorpoClinico> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao criar solicitação');
      }
      
      return result.data!;
    } catch (error) {
      console.error('❌ Erro ao criar solicitação:', error);
      throw error;
    }
  }

  // Atualizar solicitação
  static async atualizarSolicitacao(id: number, dados: AtualizacaoSolicitacao): Promise<SolicitacaoCorpoClinico> {
    try {
      const response = await authorizedFetch(`${API_BASE_URL}/ajustes/solicitacoes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dados),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result: ApiResponse<SolicitacaoCorpoClinico> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao atualizar solicitação');
      }
      
      return result.data!;
    } catch (error) {
      console.error('❌ Erro ao atualizar solicitação:', error);
      throw error;
    }
  }

  // Alterar status da solicitação
  static async alterarStatus(id: number, dados: AlteracaoStatus): Promise<SolicitacaoCorpoClinico> {
    try {
      const response = await authorizedFetch(`${API_BASE_URL}/ajustes/solicitacoes/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dados),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result: ApiResponse<SolicitacaoCorpoClinico> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao alterar status');
      }
      
      return result.data!;
    } catch (error) {
      console.error('❌ Erro ao alterar status:', error);
      throw error;
    }
  }

  // Excluir solicitação
  static async excluirSolicitacao(id: number): Promise<void> {
    try {
      const response = await authorizedFetch(`${API_BASE_URL}/ajustes/solicitacoes/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result: ApiResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao excluir solicitação');
      }
    } catch (error) {
      console.error('❌ Erro ao excluir solicitação:', error);
      throw error;
    }
  }

  // Upload de anexo
  static async uploadAnexo(solicitacaoId: number, file: File): Promise<Anexo> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await authorizedFetch(`${API_BASE_URL}/ajustes/solicitacoes/${solicitacaoId}/anexos`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result: ApiResponse<Anexo> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao fazer upload do anexo');
      }
      
      return result.data!;
    } catch (error) {
      console.error('❌ Erro ao fazer upload do anexo:', error);
      throw error;
    }
  }

  // Listar anexos de uma solicitação
  static async listarAnexos(solicitacaoId: number): Promise<Anexo[]> {
    try {
      const response = await authorizedFetch(`${API_BASE_URL}/ajustes/solicitacoes/${solicitacaoId}/anexos`);
      
      if (response.status === 404) {
        // Endpoint de anexos ainda não publicado no remoto
        return [];
      }
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result: ApiResponse<Anexo[]> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao listar anexos');
      }
      
      return result.data!;
    } catch (error) {
      console.error('❌ Erro ao listar anexos:', error);
      throw error;
    }
  }

  // Remover anexo
  static async removerAnexo(anexoId: number): Promise<void> {
    try {
      const response = await authorizedFetch(`${API_BASE_URL}/ajustes/anexos/${anexoId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result: ApiResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao remover anexo');
      }
    } catch (error) {
      console.error('❌ Erro ao remover anexo:', error);
      throw error;
    }
  }

  // Obter URL de download do anexo
  static getDownloadUrl(anexoId: number): string {
    return `${API_BASE_URL}/ajustes/anexos/${anexoId}/download`;
  }

  // ===== MÉTODOS PARA NEGOCIAÇÃO =====

  // Listar solicitações de negociação
  static async listarSolicitacoesNegociacao(filtros: FiltrosNegociacao): Promise<PaginatedResponse<SolicitacaoNegociacao>> {
    try {
      const query = new URLSearchParams();
      
      // Parâmetros obrigatórios
      query.append('clinica_id', String(filtros.clinica_id));
      query.append('tipo', filtros.tipo);
      
      // Parâmetros opcionais
      if (filtros.status) query.append('status', filtros.status);
      if (filtros.prioridade) query.append('prioridade', filtros.prioridade);
      if (filtros.categoria) query.append('categoria', filtros.categoria);
      if (filtros.search) query.append('search', filtros.search);
      if (filtros.page) query.append('page', String(filtros.page));
      if (filtros.pageSize) query.append('pageSize', String(filtros.pageSize));
      if (filtros.sort) query.append('sort', filtros.sort);
      
      const response = await authorizedFetch(`${API_BASE_URL}/ajustes/solicitacoes?${query.toString()}`);
      
      if (response.status === 404) {
        // Backend remoto ainda não publicou ajustes/negociação: retornar vazio
        return { items: [], total: 0, page: filtros.page || 1, pageSize: filtros.pageSize || 20 };
      }
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result: ApiResponse<PaginatedResponse<SolicitacaoNegociacao>> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao listar solicitações de negociação');
      }
      
      return result.data!;
    } catch (error) {
      console.error('❌ Erro ao listar solicitações de negociação:', error);
      throw error;
    }
  }

  // Criar solicitação de negociação
  static async criarSolicitacaoNegociacao(dados: NovaSolicitacaoNegociacao): Promise<SolicitacaoNegociacao> {
    try {
      const response = await fetch(`${API_BASE_URL}/ajustes/solicitacoes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dados),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result: ApiResponse<SolicitacaoNegociacao> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao criar solicitação de negociação');
      }
      
      return result.data!;
    } catch (error) {
      console.error('❌ Erro ao criar solicitação de negociação:', error);
      throw error;
    }
  }

  // Atualizar solicitação de negociação
  static async atualizarSolicitacaoNegociacao(id: number, dados: AtualizacaoNegociacao): Promise<SolicitacaoNegociacao> {
    try {
      const response = await fetch(`${API_BASE_URL}/ajustes/solicitacoes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dados),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result: ApiResponse<SolicitacaoNegociacao> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao atualizar solicitação de negociação');
      }
      
      return result.data!;
    } catch (error) {
      console.error('❌ Erro ao atualizar solicitação de negociação:', error);
      throw error;
    }
  }

  // Obter estatísticas de negociação
  static async getEstatisticasNegociacao(clinicaId: number): Promise<EstatisticasNegociacao> {
    try {
      const response = await authorizedFetch(`${API_BASE_URL}/ajustes/estatisticas/negociacao?clinica_id=${clinicaId}`);
      
      if (response.status === 404) {
        // Backend remoto ainda não publicou estatísticas: retornar zeros
        const empty: EstatisticasNegociacao = {
          solicitacoesCriticas: 0,
          totalSolicitacoes: 0,
          taxaAprovacao: 0,
          protocolosAtualizados: 0,
          tempoMedioRetorno: 0,
          solicitacoesPorStatus: { pendente: 0, em_analise: 0, aprovado: 0, rejeitado: 0 },
          solicitacoesPorPrioridade: { baixa: 0, media: 0, alta: 0, critica: 0 },
          solicitacoesPorCategoria: { protocolo: 0, medicamento: 0, procedimento: 0, administrativo: 0 },
        };
        return empty;
      }
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result: ApiResponse<EstatisticasNegociacao> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao obter estatísticas de negociação');
      }
      
      return result.data!;
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas de negociação:', error);
      throw error;
    }
  }
} 