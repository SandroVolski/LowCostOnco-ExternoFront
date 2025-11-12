// src/services/prestadorService.ts

import config from '@/config/environment';
import { authorizedFetch } from './authService';

const API_BASE_URL = config.API_BASE_URL;

// Interfaces para Prestadores
export interface Prestador {
  id: number;
  clinica_id: number;
  nome: string;
  tipo_profissional?: 'medico' | 'nutricionista' | 'enfermeiro' | 'farmaceutico' | 'terapeuta_ocupacional';
  registro_conselho?: string;
  uf_registro?: string;
  especialidade_principal?: string;
  rqe_principal?: string;
  especialidade_secundaria?: string;
  rqe_secundaria?: string;
  responsavel_tecnico?: boolean;
  operadoras_habilitadas?: any;
  documentos?: any;
  cnes?: string;
  crm?: string;
  especialidade?: string;
  telefone?: string;
  email?: string;
  status?: 'ativo' | 'inativo';
  created_at?: string;
  updated_at?: string;
}

// Interface para resposta da API
interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Classe de serviço para Prestadores
export class PrestadorService {
  
  // Listar prestadores por clínica
  static async getPrestadoresByClinica(clinicaId: number): Promise<Prestador[]> {
    try {
      const response = await authorizedFetch(`${API_BASE_URL}/prestadores?clinica_id=${clinicaId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<Prestador[]> = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Erro ao buscar prestadores');
      }

      return result.data || [];
    } catch (error) {
      console.error('❌ Erro no PrestadorService.getPrestadoresByClinica():', error);
      // Retornar dados mock em caso de erro
      return [
        { id: 1, clinica_id: clinicaId, nome: 'Dr. Carlos Santos', especialidade_principal: 'Oncologia', crm: '12345', tipo_profissional: 'medico' },
        { id: 2, clinica_id: clinicaId, nome: 'Dra. Maria Silva', especialidade_principal: 'Hematologia', crm: '67890', tipo_profissional: 'medico' },
        { id: 3, clinica_id: clinicaId, nome: 'Dr. João Oliveira', especialidade_principal: 'Oncologia', crm: '54321', tipo_profissional: 'medico' },
        { id: 4, clinica_id: clinicaId, nome: 'Dra. Ana Costa', especialidade_principal: 'Radioterapia', crm: '98765', tipo_profissional: 'medico' },
        { id: 5, clinica_id: clinicaId, nome: 'Dr. Pedro Lima', especialidade_principal: 'Cirurgia Oncológica', crm: '13579', tipo_profissional: 'medico' }
      ];
    }
  }

  // Listar todos os prestadores (para admin)
  static async getAllPrestadores(): Promise<Prestador[]> {
    try {
      const response = await authorizedFetch(`${API_BASE_URL}/prestadores`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<Prestador[]> = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Erro ao buscar prestadores');
      }

      return result.data || [];
    } catch (error) {
      console.error('❌ Erro no PrestadorService.getAllPrestadores():', error);
      throw new Error('Erro ao buscar prestadores');
    }
  }

  // Buscar prestador por ID
  static async getPrestadorById(id: number): Promise<Prestador> {
    try {
      const response = await authorizedFetch(`${API_BASE_URL}/prestadores/${id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<Prestador> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao buscar prestador');
      }
      
      if (!result.data) {
        throw new Error('Prestador não encontrado');
      }
      
      return result.data;
    } catch (error) {
      console.error('Erro ao buscar prestador:', error);
      throw new Error('Erro ao buscar prestador');
    }
  }
}
