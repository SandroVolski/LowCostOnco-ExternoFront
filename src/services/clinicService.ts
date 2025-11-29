// src/services/clinicService.ts

import config from '@/config/environment';
import { authorizedFetch } from '@/services/authService';
import { operadoraAuthService } from '@/services/operadoraAuthService';

const API_BASE_URL = config.API_BASE_URL;

// ===== Tipos de Documentos da Clínica =====
export interface Documento {
  id?: number;
  clinica_id: number;
  nome: string;
  tipo: string;
  descricao?: string;
  data_envio: string; // yyyy-mm-dd
  data_vencimento?: string;
  status: 'ativo' | 'vencendo' | 'vencido' | 'arquivado';
  arquivo_nome?: string;
  arquivo_tamanho?: number;
  arquivo_url?: string;
  created_at?: string;
  updated_at?: string;
}

// Interfaces para Clínicas
export interface Clinica {
  id?: number;
  nome: string;
  razao_social?: string;
  codigo: string;
  cnpj?: string;
  // Endereço (campo legado)
  endereco?: string;
  // Novos campos de endereço desmembrados
  endereco_rua?: string;
  endereco_numero?: string;
  endereco_bairro?: string;
  endereco_complemento?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  telefones: string[];
  emails: string[];
  // Contatos organizados por setor
  contatos_pacientes?: { telefones?: string[]; emails?: string[] };
  contatos_administrativos?: { telefones?: string[]; emails?: string[] };
  contatos_legais?: { telefones?: string[]; emails?: string[] };
  contatos_faturamento?: { telefones?: string[]; emails?: string[] };
  contatos_financeiro?: { telefones?: string[]; emails?: string[] };
  website?: string;
  logo_url?: string;
  observacoes?: string;
  usuario?: string;
  senha?: string;
  status: 'ativo' | 'inativo' | 'pendente';
  // Relacionamento com operadoras (N:N)
  operadora_id?: number; // Operadora principal (compatibilidade)
  operadora_ids?: number[]; // Lista de IDs das operadoras vinculadas
  operadoras?: Array<{ id: number; nome: string; codigo?: string }>; // Dados completos
  created_at?: string;
  updated_at?: string;
}

export interface ClinicaCreateInput {
  nome: string;
  razao_social?: string;
  codigo: string;
  cnpj?: string;
  endereco?: string;
  endereco_rua?: string;
  endereco_numero?: string;
  endereco_bairro?: string;
  endereco_complemento?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  telefones?: string[];
  emails?: string[];
  contatos_pacientes?: { telefones?: string[]; emails?: string[] };
  contatos_administrativos?: { telefones?: string[]; emails?: string[] };
  contatos_legais?: { telefones?: string[]; emails?: string[] };
  contatos_faturamento?: { telefones?: string[]; emails?: string[] };
  contatos_financeiro?: { telefones?: string[]; emails?: string[] };
  website?: string;
  logo_url?: string;
  observacoes?: string;
  usuario?: string;
  senha?: string;
  status?: 'ativo' | 'inativo' | 'pendente';
  operadora_id?: number;
  operadora_ids?: number[];
}

export interface ClinicaUpdateInput {
  nome?: string;
  razao_social?: string;
  codigo?: string;
  cnpj?: string;
  endereco?: string;
  endereco_rua?: string;
  endereco_numero?: string;
  endereco_bairro?: string;
  endereco_complemento?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  telefones?: string[];
  emails?: string[];
  contatos_pacientes?: { telefones?: string[]; emails?: string[] };
  contatos_administrativos?: { telefones?: string[]; emails?: string[] };
  contatos_legais?: { telefones?: string[]; emails?: string[] };
  contatos_faturamento?: { telefones?: string[]; emails?: string[] };
  contatos_financeiro?: { telefones?: string[]; emails?: string[] };
  website?: string;
  logo_url?: string;
  observacoes?: string;
  usuario?: string;
  senha?: string;
  status?: 'ativo' | 'inativo' | 'pendente';
  operadora_id?: number;
  operadora_ids?: number[];
}

// Interface para resposta da API
interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Interfaces para perfil da clínica
export interface ClinicProfile {
  nome: string;
  razao_social?: string;
  codigo: string;
  cnpj?: string;
  endereco?: string;
  endereco_rua?: string;
  endereco_numero?: string;
  endereco_bairro?: string;
  endereco_complemento?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  telefones: string[];
  emails: string[];
  contatos_pacientes?: { telefones?: string[]; emails?: string[] };
  contatos_administrativos?: { telefones?: string[]; emails?: string[] };
  contatos_legais?: { telefones?: string[]; emails?: string[] };
  contatos_faturamento?: { telefones?: string[]; emails?: string[] };
  contatos_financeiro?: { telefones?: string[]; emails?: string[] };
  website?: string;
  logo_url?: string;
  observacoes?: string;
}

export interface UpdateProfileRequest {
  clinica: ClinicProfile;
}

export interface OperadoraCredenciada {
  id?: number;
  nome: string;
  codigo?: string;
}

export interface Especialidade {
  id?: number;
  nome: string;
  cbo?: string;
}

// Interface para Responsáveis Técnicos/Profissionais
export interface ResponsavelTecnico {
  id?: number;
  nome: string;
  tipo_profissional: 'medico' | 'nutricionista' | 'enfermeiro' | 'farmaceutico' | 'terapeuta_ocupacional';
  registro_conselho: string; // Substitui CRM
  uf_registro: string;
  especialidade_principal: string;
  rqe_principal?: string;
  especialidade_secundaria?: string;
  rqe_secundaria?: string;
  cnes: string;
  telefone?: string;
  email?: string;
  responsavel_tecnico: boolean;
  operadoras_habilitadas?: number[]; // IDs das operadoras
  documentos?: {
    carteira_conselho?: string;
    diploma?: string;
    comprovante_especializacao?: string;
  };
  status: 'ativo' | 'inativo';
  created_at?: string;
  updated_at?: string;
}

// Classe de serviço para Clínicas
export class ClinicService {
  
  // Helper para obter headers com token de admin se disponível
  private static getAdminHeaders(): HeadersInit {
    const adminToken = localStorage.getItem('adminToken');
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    if (adminToken) {
      headers['Authorization'] = `Bearer ${adminToken}`;
    }
    
    return headers;
  }
  
  // Listar todas as clínicas (para admin) com paginação e busca
  static async getAllClinicas(page: number = 1, limit: number = 50, search: string = ''): Promise<{data: Clinica[], pagination: any}> {
    try {
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
      const timestamp = new Date().getTime();
      const response = await fetch(`${API_BASE_URL}/clinicas/admin?page=${page}&limit=${limit}${searchParam}&_t=${timestamp}`, {
        headers: {
          ...this.getAdminHeaders(),
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: any = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Erro ao buscar clínicas');
      }

      return {
        data: result.data || [],
        pagination: result.pagination
      };
    } catch (error) {
      console.error('❌ Erro no ClinicService.getAllClinicas():', error);
      throw new Error('Erro ao buscar clínicas');
    }
  }

  // Listar clínicas para operadora (com autenticação de operadora)
  static async getAllClinicasForOperadora(): Promise<Clinica[]> {
    try {
      let response = await operadoraAuthService.authorizedFetch('/api/clinicas/por-operadora');
      // Fallback quando authorizedFetch retorna null (proxy devolveu HTML)
      if (!response) {
        const token = localStorage.getItem('operadora_access_token') || '';
        const apiUrl = `${API_BASE_URL}/clinicas/por-operadora`;
        response = await fetch(apiUrl, { headers: { Authorization: `Bearer ${token}` } });
      }

      if (!response || !response.ok) {
        throw new Error(`HTTP error! status: ${response?.status}`);
      }

      const result: ApiResponse<Clinica[]> = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Erro ao buscar clínicas');
      }

      return result.data || [];
    } catch (error) {
      console.error('❌ Erro no ClinicService.getAllClinicasForOperadora():', error);
      throw new Error('Erro ao buscar clínicas para operadora');
    }
  }

  // Buscar clínica por ID
  static async getClinicaById(id: number): Promise<Clinica> {
    try {
      // Adicionar timestamp para evitar cache
      const timestamp = new Date().getTime();
      const response = await fetch(`${API_BASE_URL}/clinicas/admin/${id}?_t=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<Clinica> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao buscar clínica');
      }
      
      if (!result.data) {
        throw new Error('Clínica não encontrada');
      }
      
      return result.data;
    } catch (error) {
      console.error('Erro ao buscar clínica:', error);
      throw new Error('Erro ao buscar clínica');
    }
  }

  // Criar nova clínica
  static async createClinica(clinicaData: ClinicaCreateInput): Promise<Clinica> {
    try {
      const response = await fetch(`${API_BASE_URL}/clinicas/admin`, {
        method: 'POST',
        headers: this.getAdminHeaders(),
        body: JSON.stringify(clinicaData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<Clinica> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao criar clínica');
      }
      
      if (!result.data) {
        throw new Error('Erro ao criar clínica');
      }
      
      return result.data;
    } catch (error) {
      console.error('Erro ao criar clínica:', error);
      throw new Error('Erro ao criar clínica');
    }
  }

  // Atualizar clínica
  static async updateClinica(id: number, clinicaData: ClinicaUpdateInput): Promise<Clinica> {
    try {
      const response = await fetch(`${API_BASE_URL}/clinicas/admin/${id}`, {
        method: 'PUT',
        headers: this.getAdminHeaders(),
        body: JSON.stringify(clinicaData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<Clinica> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao atualizar clínica');
      }
      
      if (!result.data) {
        throw new Error('Erro ao atualizar clínica');
      }
      
      return result.data;
    } catch (error) {
      console.error('Erro ao atualizar clínica:', error);
      throw new Error('Erro ao atualizar clínica');
    }
  }

  // Deletar clínica
  static async deleteClinica(id: number): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/clinicas/admin/${id}`, {
        method: 'DELETE',
        headers: this.getAdminHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao deletar clínica');
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao deletar clínica:', error);
      throw new Error('Erro ao deletar clínica');
    }
  }

  // Validar CNPJ (formato básico)
  static validateCNPJ(cnpj: string): boolean {
    const cnpjClean = cnpj.replace(/[^\d]/g, '');
    return cnpjClean.length === 14;
  }

  // Validar CEP (formato brasileiro)
  static validateCEP(cep: string): boolean {
    const cepClean = cep.replace(/[^\d]/g, '');
    return cepClean.length === 8;
  }

  // Validar telefone (formato brasileiro)
  static validatePhone(phone: string): boolean {
    const phoneClean = phone.replace(/[^\d]/g, '');
    return phoneClean.length >= 10 && phoneClean.length <= 11;
  }

  // Validar email
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Preparar dados para envio (remover campos vazios)
  static prepareDataForSubmission(data: ClinicaCreateInput | ClinicaUpdateInput): any {
    const prepared: any = {};
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          // Filtrar arrays vazios
          // operadora_ids é array de números, não strings
          const filteredArray = value.filter(item => {
            if (typeof item === 'number') return true;
            if (typeof item === 'string') return item.trim() !== '';
            return item !== null && item !== undefined;
          });
          if (filteredArray.length > 0) {
            prepared[key] = filteredArray;
          }
        } else {
          prepared[key] = value;
        }
      }
    });
    
    return prepared;
  }

  // Buscar perfil da clínica (com responsáveis técnicos)
  static async getProfile(): Promise<{ clinica: Clinica; responsaveis_tecnicos: any[] }> {
    try {
      const response = await authorizedFetch(`${API_BASE_URL}/clinicas/profile`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<{ clinica: Clinica; responsaveis_tecnicos: any[] }> = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Erro ao buscar perfil da clínica');
      }

      return result.data || { clinica: {} as Clinica, responsaveis_tecnicos: [] };
    } catch (error) {
      console.error('❌ Erro no ClinicService.getProfile():', error);
      throw new Error('Erro ao buscar perfil da clínica');
    }
  }

  // Atualizar perfil da clínica
  static async updateProfile(updateData: { clinica: ClinicaUpdateInput }): Promise<{ clinica: Clinica; responsaveis_tecnicos: any[] }> {
    try {
      const response = await authorizedFetch(`${API_BASE_URL}/clinicas/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<{ clinica: Clinica; responsaveis_tecnicos: any[] }> = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Erro ao atualizar perfil da clínica');
      }

      return result.data || { clinica: {} as Clinica, responsaveis_tecnicos: [] };
    } catch (error) {
      console.error('❌ Erro no ClinicService.updateProfile():', error);
      throw new Error('Erro ao atualizar perfil da clínica');
    }
  }

  // Listar operadoras credenciadas
  static async listarOperadorasCredenciadas(params: { clinica_id: number }): Promise<any[]> {
    try {
      const response = await authorizedFetch(`${API_BASE_URL}/operadoras/credenciadas?clinica_id=${params.clinica_id}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<any[]> = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Erro ao buscar operadoras credenciadas');
      }

      return result.data || [];
    } catch (error) {
      console.error('❌ Erro no ClinicService.listarOperadorasCredenciadas():', error);
      return [];
    }
  }

  // Listar especialidades
  static async listarEspecialidades(params: { clinica_id: number }): Promise<any[]> {
    try {
      const response = await authorizedFetch(`${API_BASE_URL}/especialidades?clinica_id=${params.clinica_id}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<any[]> = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Erro ao buscar especialidades');
      }

      return result.data || [];
    } catch (error) {
      console.error('❌ Erro no ClinicService.listarEspecialidades():', error);
      return [];
    }
  }

  // ===== Corpo Clínico (Responsáveis Técnicos) =====
  static async addResponsavel(data: any): Promise<any> {
    try {
      const response = await authorizedFetch(`${API_BASE_URL}/clinicas/responsaveis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        let errMsg = `HTTP ${response.status}`;
        try {
          const errBody = await response.json();
          if (errBody?.message) errMsg = errBody.message;
        } catch {}
        throw new Error(errMsg);
      }
      const result: ApiResponse<any> = await response.json();
      if (!result.success) throw new Error(result.message || 'Erro ao adicionar responsável');
      return result.data;
    } catch (error) {
      console.error('❌ Erro no ClinicService.addResponsavel():', error);
      throw error;
    }
  }

  static async updateResponsavel(id: number, data: any): Promise<any> {
    try {
      const response = await authorizedFetch(`${API_BASE_URL}/clinicas/responsaveis/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result: ApiResponse<any> = await response.json();
      if (!result.success) throw new Error(result.message || 'Erro ao atualizar responsável');
      return result.data;
    } catch (error) {
      console.error('❌ Erro no ClinicService.updateResponsavel():', error);
      throw error;
    }
  }

  static async removeResponsavel(id: number): Promise<void> {
    try {
      const response = await authorizedFetch(`${API_BASE_URL}/clinicas/responsaveis/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      console.error('❌ Erro no ClinicService.removeResponsavel():', error);
      throw error;
    }
  }

  // ===== Documentos da Clínica =====
  static async listarDocumentos(params: { clinica_id: number }): Promise<Documento[]> {
    try {
      const response = await authorizedFetch(`${API_BASE_URL}/clinicas/documentos?clinica_id=${params.clinica_id}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result: ApiResponse<Documento[] | { documentos: Documento[] }> = await response.json();
      if (!result.success) throw new Error(result.message || 'Erro ao listar documentos');
      const data = (result.data as any) || [];
      return Array.isArray(data) ? data : (data.documentos || []);
    } catch (error) {
      // Evita tela de "Sem Conexão": retorna fallback silencioso
      try {
        const saved = localStorage.getItem('clinic_documentos');
        return saved ? (JSON.parse(saved) as Documento[]) : [];
      } catch {
        return [];
      }
    }
  }

  static async uploadDocumento(file: File, data: Omit<Documento, 'id' | 'arquivo_url' | 'arquivo_nome' | 'arquivo_tamanho' | 'created_at' | 'updated_at'>): Promise<Documento> {
    const form = new FormData();
    form.append('file', file);
    
    // Adicionar cada campo individualmente ao FormData
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        form.append(key, String(value));
      }
    });

    const response = await authorizedFetch(`${API_BASE_URL}/clinicas/documentos/upload`, {
      method: 'POST',
      body: form,
    } as RequestInit);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result: ApiResponse<Documento> = await response.json();
    if (!result.success || !result.data) throw new Error(result.message || 'Erro ao enviar documento');
    return result.data;
  }

  static async atualizarDocumento(id: number, data: Partial<Documento>): Promise<Documento> {
    const response = await authorizedFetch(`${API_BASE_URL}/clinicas/documentos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result: ApiResponse<Documento> = await response.json();
    if (!result.success || !result.data) throw new Error(result.message || 'Erro ao atualizar documento');
    return result.data;
  }

  static async removerDocumento(id: number): Promise<void> {
    const response = await authorizedFetch(`${API_BASE_URL}/clinicas/documentos/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
  }
}