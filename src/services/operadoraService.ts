// src/services/operadoraService.ts

import config from '@/config/environment';
import { authorizedFetch } from './authService';

const API_BASE_URL = config.API_BASE_URL;

// Interfaces para Operadoras
export interface Operadora {
  id?: number;
  nome: string;
  codigo: string;
  cnpj?: string;
  status: 'ativo' | 'inativo';
  created_at?: string;
  updated_at?: string;
}

export interface OperadoraCreateInput {
  nome: string;
  codigo: string;
  cnpj?: string;
  status?: 'ativo' | 'inativo';
  email?: string;
  senha?: string;
}

export interface OperadoraUpdateInput {
  nome?: string;
  codigo?: string;
  cnpj?: string;
  status?: 'ativo' | 'inativo';
}

// Interface para resposta da API
interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Classe de serviço para Operadoras
export class OperadoraService {
  
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
  
  // Listar todas as operadoras
  static async getAllOperadoras(): Promise<Operadora[]> {
    try {
      console.log('🔧 OperadoraService.getAllOperadoras() iniciado');
      console.log('🔧 API_BASE_URL:', API_BASE_URL);
      console.log('🔧 URL completa:', `${API_BASE_URL}/operadoras`);
      
      const response = await fetch(`${API_BASE_URL}/operadoras`, {
        headers: this.getAdminHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<Operadora[]> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao buscar operadoras');
      }
      
      console.log('✅ Operadoras obtidas com sucesso:', result.data);
      return result.data || [];
    } catch (error) {
      console.error('❌ Erro no OperadoraService.getAllOperadoras():', error);
      throw new Error('Erro ao buscar operadoras');
    }
  }

  // Buscar operadora por ID
  static async getOperadoraById(id: number): Promise<Operadora> {
    try {
      const response = await fetch(`${API_BASE_URL}/operadoras/admin/${id}`, {
        headers: this.getAdminHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<Operadora> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao buscar operadora');
      }
      
      if (!result.data) {
        throw new Error('Operadora não encontrada');
      }
      
      return result.data;
    } catch (error) {
      console.error('Erro ao buscar operadora:', error);
      throw new Error('Erro ao buscar operadora');
    }
  }

  // Criar nova operadora
  static async createOperadora(operadoraData: OperadoraCreateInput): Promise<Operadora> {
    try {
      const response = await fetch(`${API_BASE_URL}/operadoras/admin`, {
        method: 'POST',
        headers: this.getAdminHeaders(),
        body: JSON.stringify(operadoraData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<Operadora> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao criar operadora');
      }
      
      if (!result.data) {
        throw new Error('Erro ao criar operadora');
      }
      
      return result.data;
    } catch (error) {
      console.error('Erro ao criar operadora:', error);
      throw new Error('Erro ao criar operadora');
    }
  }

  // Atualizar operadora
  static async updateOperadora(id: number, operadoraData: OperadoraUpdateInput): Promise<Operadora> {
    try {
      const response = await fetch(`${API_BASE_URL}/operadoras/admin/${id}`, {
        method: 'PUT',
        headers: this.getAdminHeaders(),
        body: JSON.stringify(operadoraData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<Operadora> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao atualizar operadora');
      }
      
      if (!result.data) {
        throw new Error('Erro ao atualizar operadora');
      }
      
      return result.data;
    } catch (error) {
      console.error('Erro ao atualizar operadora:', error);
      throw new Error('Erro ao atualizar operadora');
    }
  }

  // Deletar operadora
  static async deleteOperadora(id: number): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/operadoras/admin/${id}`, {
        method: 'DELETE',
        headers: this.getAdminHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao deletar operadora');
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao deletar operadora:', error);
      throw new Error('Erro ao deletar operadora');
    }
  }

  // Validar CNPJ (formato básico)
  static validateCNPJ(cnpj: string): boolean {
    const cnpjClean = cnpj.replace(/[^\d]/g, '');
    return cnpjClean.length === 14;
  }

  // Preparar dados para envio (remover campos vazios)
  static prepareDataForSubmission(data: OperadoraCreateInput | OperadoraUpdateInput): any {
    const prepared: any = {};
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        prepared[key] = value;
      }
    });
    
    return prepared;
  }

  // Buscar operadora de uma clínica específica
  static async getOperadoraByClinica(clinicaId: number): Promise<Operadora | null> {
    try {
      console.log('🔧 OperadoraService.getOperadoraByClinica() iniciado para clínica:', clinicaId);
      
      const response = await authorizedFetch(`${API_BASE_URL}/operadoras/clinica/${clinicaId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('⚠️ Operadora não encontrada para esta clínica');
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<Operadora> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao buscar operadora da clínica');
      }
      
      console.log('✅ Operadora da clínica encontrada:', result.data);
      return result.data || null;
    } catch (error) {
      console.error('❌ Erro no OperadoraService.getOperadoraByClinica():', error);
      return null;
    }
  }
}
