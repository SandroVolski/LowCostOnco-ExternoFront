// src/services/clinicService.ts

// Importar configuração de ambiente
import config from '@/config/environment';

const API_BASE_URL = config.API_BASE_URL;

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
  especialidade1?: string;
  especialidade2?: string;
  telefone?: string;
  email?: string;
  cnes?: string;
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
  telefones?: string[];
  emails?: string[];
  // Campos antigos para compatibilidade (serão removidos gradualmente)
  telefone?: string;
  email?: string;
  website?: string;
  logo_url?: string;
  observacoes?: string;
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

export interface Documento {
  id?: number;
  clinica_id?: number;
  nome: string;
  tipo: string;
  descricao?: string;
  arquivo_url?: string;
  arquivo_nome?: string;
  arquivo_tamanho?: number;
  data_envio: string;
  data_vencimento?: string;
  status: 'ativo' | 'vencido' | 'vencendo' | 'arquivado';
  created_at?: string;
  updated_at?: string;
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

  // Listar operadoras credenciadas da clínica
  static async listarOperadorasCredenciadas(params?: { clinica_id?: number }): Promise<OperadoraCredenciada[]> {
    try {
      const query = new URLSearchParams();
      if (params?.clinica_id) query.append('clinica_id', String(params.clinica_id));
      const response = await fetch(`${API_BASE_URL}/clinicas/operadoras?${query.toString()}`);
      if (response.status === 404) {
        return [];
      }
      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(errorText || `HTTP ${response.status}: ${response.statusText}`);
      }
      const result: ApiResponse<OperadoraCredenciada[]> = await response.json();
      if (!result.success) throw new Error(result.message || 'Erro ao listar operadoras credenciadas');
      return result.data || [];
    } catch (error) {
      console.error('❌ Erro ao listar operadoras credenciadas:', error);
      return [];
    }
  }

  // Listar especialidades da clínica
  static async listarEspecialidades(params?: { clinica_id?: number }): Promise<Especialidade[]> {
    try {
      const query = new URLSearchParams();
      if (params?.clinica_id) query.append('clinica_id', String(params.clinica_id));
      const response = await fetch(`${API_BASE_URL}/clinicas/especialidades?${query.toString()}`);
      if (response.status === 404) {
        return [];
      }
      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(errorText || `HTTP ${response.status}: ${response.statusText}`);
      }
      const result: ApiResponse<Especialidade[]> = await response.json();
      if (!result.success) throw new Error(result.message || 'Erro ao listar especialidades');
      return result.data || [];
    } catch (error) {
      console.error('❌ Erro ao listar especialidades:', error);
      return [];
    }
  }

  // ============= GESTÃO DE DOCUMENTOS =============

  // Listar documentos da clínica
  static async listarDocumentos(params?: { clinica_id?: number }): Promise<Documento[]> {
    try {
      const query = new URLSearchParams();
      if (params?.clinica_id) query.append('clinica_id', String(params.clinica_id));
      const response = await fetch(`${API_BASE_URL}/clinicas/documentos?${query.toString()}`);
      if (response.status === 404) {
        return [];
      }
      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(errorText || `HTTP ${response.status}: ${response.statusText}`);
      }
      const result: ApiResponse<Documento[]> = await response.json();
      if (!result.success) throw new Error(result.message || 'Erro ao listar documentos');
      return result.data || [];
    } catch (error) {
      console.error('❌ Erro ao listar documentos:', error);
      return [];
    }
  }

  // Adicionar documento
  static async adicionarDocumento(documento: Omit<Documento, 'id' | 'created_at' | 'updated_at'>): Promise<Documento> {
    try {
      const response = await fetch(`${API_BASE_URL}/clinicas/documentos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(documento),
      });
      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(errorText || `HTTP ${response.status}: ${response.statusText}`);
      }
      const result: ApiResponse<Documento> = await response.json();
      if (!result.success) throw new Error(result.message || 'Erro ao adicionar documento');
      return result.data!;
    } catch (error) {
      console.error('❌ Erro ao adicionar documento:', error);
      throw error;
    }
  }

  // Atualizar documento
  static async atualizarDocumento(id: number, documento: Partial<Documento>): Promise<Documento> {
    try {
      const response = await fetch(`${API_BASE_URL}/clinicas/documentos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(documento),
      });
      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(errorText || `HTTP ${response.status}: ${response.statusText}`);
      }
      const result: ApiResponse<Documento> = await response.json();
      if (!result.success) throw new Error(result.message || 'Erro ao atualizar documento');
      return result.data!;
    } catch (error) {
      console.error('❌ Erro ao atualizar documento:', error);
      throw error;
    }
  }

  // Remover documento
  static async removerDocumento(id: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/clinicas/documentos/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(errorText || `HTTP ${response.status}: ${response.statusText}`);
      }
      const result: ApiResponse = await response.json();
      if (!result.success) throw new Error(result.message || 'Erro ao remover documento');
    } catch (error) {
      console.error('❌ Erro ao remover documento:', error);
      throw error;
    }
  }

  // Upload de arquivo
  static async uploadDocumento(file: File, documento: Omit<Documento, 'id' | 'arquivo_url' | 'arquivo_nome' | 'arquivo_tamanho' | 'created_at' | 'updated_at'>): Promise<Documento> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documento', JSON.stringify(documento));

      const response = await fetch(`${API_BASE_URL}/clinicas/documentos/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(errorText || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result: ApiResponse<Documento> = await response.json();
      if (!result.success) throw new Error(result.message || 'Erro ao fazer upload do documento');
      return result.data!;
    } catch (error) {
      console.error('❌ Erro ao fazer upload do documento:', error);
      throw error;
    }
  }
  
  // Registro administrativo de clínicas (requer X-Admin-Secret)
  static async registerAdminClinic(
    clinicData: Partial<ClinicProfile> & {
      usuario?: string;
      senha?: string;
      emails?: string[];
      telefones?: string[];
      email?: string;
      telefone?: string;
      status?: string;
    },
    adminSecret: string
  ): Promise<ClinicProfile> {
    try {
      const response = await fetch(`${API_BASE_URL}/clinicas/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Secret': adminSecret,
        },
        body: JSON.stringify(clinicData),
      });
      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(errorText || `HTTP ${response.status}: ${response.statusText}`);
      }
      const result: ApiResponse<ClinicProfile> = await response.json();
      if (!result.success) throw new Error(result.message || 'Erro ao registrar clínica');
      return result.data!;
    } catch (error) {
      console.error('❌ Erro ao registrar clínica (admin):', error);
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