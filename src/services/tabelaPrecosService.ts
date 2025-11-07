import axios from 'axios';
import config from '@/config/environment';

const API_URL = config.API_BASE_URL;

// Configurar interceptor do axios para incluir token de autenticação
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authAccessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export interface TabelaPreco {
  Tabela: string;
  Servico_Codigo: string;
  Fator: string;
  Principio_Ativo: string;
  Descricao: string; // sem acento (alias do backend)
  Pagamento: string;
  Valor: number;
}

export interface TabelaPrecosFilters {
  codigo?: string;
  descricao?: string;
  tabela?: string;
  principioAtivo?: string;
}

class TabelaPrecosService {
  /**
   * Buscar todas as tabelas de preços
   */
  static async getTabelas(filters?: TabelaPrecosFilters): Promise<TabelaPreco[]> {
    try {
      const params = new URLSearchParams();

      if (filters?.codigo) params.append('codigo', filters.codigo);
      if (filters?.descricao) params.append('descricao', filters.descricao);
      if (filters?.tabela) params.append('tabela', filters.tabela);
      if (filters?.principioAtivo) params.append('principioAtivo', filters.principioAtivo);

      const queryString = params.toString();
      const url = `${API_URL}/tabelas-precos${queryString ? `?${queryString}` : ''}`;

      const response = await axios.get<TabelaPreco[]>(url);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao buscar tabelas de preços:', error);
      throw new Error(error.response?.data?.message || 'Erro ao buscar tabelas de preços');
    }
  }

  /**
   * Buscar operadoras disponíveis (tabelas distintas)
   */
  static async getOperadoras(): Promise<string[]> {
    try {
      const response = await axios.get<string[]>(`${API_URL}/tabelas-precos/operadoras`);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao buscar operadoras:', error);
      throw new Error(error.response?.data?.message || 'Erro ao buscar operadoras');
    }
  }

  /**
   * Buscar detalhes de um código específico
   */
  static async getDetalheCodigo(codigo: string): Promise<TabelaPreco[]> {
    try {
      const response = await axios.get<TabelaPreco[]>(`${API_URL}/tabelas-precos/codigo/${codigo}`);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao buscar detalhes do código:', error);
      throw new Error(error.response?.data?.message || 'Erro ao buscar detalhes do código');
    }
  }
}

export default TabelaPrecosService;
