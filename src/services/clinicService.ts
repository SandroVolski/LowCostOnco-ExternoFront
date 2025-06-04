// src/services/clinicService.ts

const API_BASE_URL = 'http://localhost:3001/api';

// Interfaces para comunicação com a API
interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface ResponsavelTecnico {
  id?: number;
  nome: string;
  crm: string;
  especialidade: string;
  telefone?: string;
  email?: string;
}

export interface ClinicProfile {
  id?: number;
  nome: string;
  codigo: string;
  cnpj?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  telefone?: string;
  email?: string;
  website?: string;
  logo_url?: string;
  observacoes?: string;
}

export interface ClinicaProfileResponse {
  clinica: ClinicProfile;
  responsaveis_tecnicos: ResponsavelTecnico[];
}

export interface UpdateProfileRequest {
  clinica: Partial<ClinicProfile>;
  responsaveis_tecnicos?: {
    create?: Omit<ResponsavelTecnico, 'id'>[];
    update?: Array<{ id: number; data: Partial<ResponsavelTecnico> }>;
    delete?: number[];
  };
}

export class ClinicService {
  
  // Buscar perfil da clínica
  static async getProfile(): Promise<ClinicaProfileResponse> {
    try {
      console.log('🔧 Buscando perfil da clínica...');
      
      const response = await fetch(`${API_BASE_URL}/clinicas/profile`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result: ApiResponse<ClinicaProfileResponse> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao buscar perfil da clínica');
      }
      
      console.log('✅ Perfil da clínica encontrado:', result.data);
      return result.data!;
    } catch (error) {
      console.error('❌ Erro ao buscar perfil da clínica:', error);
      throw error;
    }
  }
  
  // Atualizar perfil da clínica
  static async updateProfile(updateData: UpdateProfileRequest): Promise<ClinicaProfileResponse> {
    try {
      console.log('🔧 Atualizando perfil da clínica...', updateData);
      
      const response = await fetch(`${API_BASE_URL}/clinicas/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result: ApiResponse<ClinicaProfileResponse> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao atualizar perfil da clínica');
      }
      
      console.log('✅ Perfil da clínica atualizado:', result.data);
      return result.data!;
    } catch (error) {
      console.error('❌ Erro ao atualizar perfil da clínica:', error);
      throw error;
    }
  }
  
  // Adicionar responsável técnico
  static async addResponsavel(responsavel: Omit<ResponsavelTecnico, 'id'>): Promise<ResponsavelTecnico> {
    try {
      console.log('🔧 Adicionando responsável técnico...', responsavel);
      
      const response = await fetch(`${API_BASE_URL}/clinicas/responsaveis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(responsavel),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result: ApiResponse<ResponsavelTecnico> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao adicionar responsável técnico');
      }
      
      console.log('✅ Responsável técnico adicionado:', result.data);
      return result.data!;
    } catch (error) {
      console.error('❌ Erro ao adicionar responsável técnico:', error);
      throw error;
    }
  }
  
  // Atualizar responsável técnico
  static async updateResponsavel(id: number, responsavel: Partial<ResponsavelTecnico>): Promise<ResponsavelTecnico> {
    try {
      console.log('🔧 Atualizando responsável técnico...', id, responsavel);
      
      const response = await fetch(`${API_BASE_URL}/clinicas/responsaveis/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(responsavel),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result: ApiResponse<ResponsavelTecnico> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao atualizar responsável técnico');
      }
      
      console.log('✅ Responsável técnico atualizado:', result.data);
      return result.data!;
    } catch (error) {
      console.error('❌ Erro ao atualizar responsável técnico:', error);
      throw error;
    }
  }
  
  // Remover responsável técnico
  static async removeResponsavel(id: number): Promise<void> {
    try {
      console.log('🔧 Removendo responsável técnico...', id);
      
      const response = await fetch(`${API_BASE_URL}/clinicas/responsaveis/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result: ApiResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao remover responsável técnico');
      }
      
      console.log('✅ Responsável técnico removido');
    } catch (error) {
      console.error('❌ Erro ao remover responsável técnico:', error);
      throw error;
    }
  }
  
  // Login da clínica
  static async login(usuario: string, senha: string): Promise<{ clinic: ClinicProfile; token: string }> {
    try {
      console.log('🔧 Fazendo login da clínica...', usuario);
      
      const response = await fetch(`${API_BASE_URL}/clinicas/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ usuario, senha }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result: ApiResponse<{ clinic: ClinicProfile; token: string }> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erro no login');
      }
      
      console.log('✅ Login realizado com sucesso');
      return result.data!;
    } catch (error) {
      console.error('❌ Erro no login:', error);
      throw error;
    }
  }
  
  // Registrar nova clínica
  static async register(clinicData: Partial<ClinicProfile> & { usuario?: string; senha?: string }): Promise<ClinicProfile> {
    try {
      console.log('🔧 Registrando nova clínica...', clinicData);
      
      const response = await fetch(`${API_BASE_URL}/clinicas/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clinicData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result: ApiResponse<ClinicProfile> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao registrar clínica');
      }
      
      console.log('✅ Clínica registrada com sucesso:', result.data);
      return result.data!;
    } catch (error) {
      console.error('❌ Erro ao registrar clínica:', error);
      throw error;
    }
  }
}