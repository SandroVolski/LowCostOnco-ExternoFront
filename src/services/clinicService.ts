// src/services/clinicService.ts

import config from '@/config/environment';
import { authorizedFetch } from '@/services/authService';
import { operadoraAuthService } from '@/services/operadoraAuthService';

const API_BASE_URL = config.API_BASE_URL;

// Interfaces para Clínicas
export interface Clinica {
  id?: number;
  nome: string;
  codigo: string;
  cnpj?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  telefones: string[];
  emails: string[];
  website?: string;
  logo_url?: string;
  observacoes?: string;
  usuario?: string;
  senha?: string;
  status: 'ativo' | 'inativo' | 'pendente';
  created_at?: string;
  updated_at?: string;
}

export interface ClinicaCreateInput {
  nome: string;
  codigo: string;
  cnpj?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  telefones?: string[];
  emails?: string[];
  website?: string;
  logo_url?: string;
  observacoes?: string;
  usuario?: string;
  senha?: string;
  status?: 'ativo' | 'inativo' | 'pendente';
}

export interface ClinicaUpdateInput {
  nome?: string;
  codigo?: string;
  cnpj?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  telefones?: string[];
  emails?: string[];
  website?: string;
  logo_url?: string;
  observacoes?: string;
  usuario?: string;
  senha?: string;
  status?: 'ativo' | 'inativo' | 'pendente';
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
  codigo: string;
  cnpj?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  telefones: string[];
  emails: string[];
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

// Classe de serviço para Clínicas
export class ClinicService {
  
  // Listar todas as clínicas (para admin)
  static async getAllClinicas(): Promise<Clinica[]> {
    try {
      console.log('🔧 ClinicService.getAllClinicas() iniciado');
      console.log('🔧 API_BASE_URL:', API_BASE_URL);
      console.log('🔧 URL completa:', `${API_BASE_URL}/clinicas/admin`);
      
      const response = await fetch(`${API_BASE_URL}/clinicas/admin`);
      
      console.log('🔧 Resposta recebida:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<Clinica[]> = await response.json();
      console.log('🔧 Dados da resposta:', result);
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao buscar clínicas');
      }
      
      console.log('✅ Clínicas obtidas com sucesso:', result.data);
      return result.data || [];
    } catch (error) {
      console.error('❌ Erro no ClinicService.getAllClinicas():', error);
      throw new Error('Erro ao buscar clínicas');
    }
  }

  // Listar clínicas para operadora (com autenticação de operadora)
  static async getAllClinicasForOperadora(): Promise<Clinica[]> {
    try {
      console.log('🔧 ClinicService.getAllClinicasForOperadora() iniciado');
      
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
      console.log('🔧 Dados da resposta:', result);
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao buscar clínicas');
      }
      
      console.log('✅ Clínicas obtidas com sucesso:', result.data);
      return result.data || [];
    } catch (error) {
      console.error('❌ Erro no ClinicService.getAllClinicasForOperadora():', error);
      throw new Error('Erro ao buscar clínicas para operadora');
    }
  }

  // Buscar clínica por ID
  static async getClinicaById(id: number): Promise<Clinica> {
    try {
      const response = await fetch(`${API_BASE_URL}/clinicas/admin/${id}`);
      
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
        headers: {
          'Content-Type': 'application/json',
        },
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
        headers: {
          'Content-Type': 'application/json',
        },
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
          const filteredArray = value.filter(item => item && item.trim() !== '');
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
      console.log('🔧 ClinicService.getProfile() iniciado');
      console.log('🔧 API_BASE_URL:', API_BASE_URL);
      console.log('🔧 URL completa:', `${API_BASE_URL}/clinicas/profile`);
      
      const response = await authorizedFetch(`${API_BASE_URL}/clinicas/profile`);
      
      console.log('🔧 Resposta recebida:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<{ clinica: Clinica; responsaveis_tecnicos: any[] }> = await response.json();
      console.log('🔧 Dados da resposta:', result);
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao buscar perfil da clínica');
      }
      
      console.log('✅ Perfil obtido com sucesso:', result.data);
      return result.data || { clinica: {} as Clinica, responsaveis_tecnicos: [] };
    } catch (error) {
      console.error('❌ Erro no ClinicService.getProfile():', error);
      throw new Error('Erro ao buscar perfil da clínica');
    }
  }

  // Atualizar perfil da clínica
  static async updateProfile(updateData: { clinica: ClinicaUpdateInput }): Promise<{ clinica: Clinica; responsaveis_tecnicos: any[] }> {
    try {
      console.log('🔧 ClinicService.updateProfile() iniciado');
      console.log('🔧 API_BASE_URL:', API_BASE_URL);
      console.log('🔧 URL completa:', `${API_BASE_URL}/clinicas/profile`);
      console.log('🔧 Dados para atualização:', updateData);
      
      const response = await authorizedFetch(`${API_BASE_URL}/clinicas/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      console.log('🔧 Resposta recebida:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<{ clinica: Clinica; responsaveis_tecnicos: any[] }> = await response.json();
      console.log('🔧 Dados da resposta:', result);
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao atualizar perfil da clínica');
      }
      
      console.log('✅ Perfil atualizado com sucesso:', result.data);
      return result.data || { clinica: {} as Clinica, responsaveis_tecnicos: [] };
    } catch (error) {
      console.error('❌ Erro no ClinicService.updateProfile():', error);
      throw new Error('Erro ao atualizar perfil da clínica');
    }
  }

  // Listar operadoras credenciadas
  static async listarOperadorasCredenciadas(params: { clinica_id: number }): Promise<any[]> {
    try {
      console.log('🔧 ClinicService.listarOperadorasCredenciadas() iniciado');
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
      console.log('🔧 ClinicService.listarEspecialidades() iniciado');
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
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
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
}