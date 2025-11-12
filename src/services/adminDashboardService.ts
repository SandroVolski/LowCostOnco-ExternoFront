// src/services/adminDashboardService.ts

import config from '@/config/environment';
import { authorizedFetch } from './authService';

const API_BASE_URL = config.API_BASE_URL;

// Função específica para admin que usa o token correto
async function adminAuthorizedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const adminToken = localStorage.getItem('adminToken');
  const operadoraToken = localStorage.getItem('operadora_access_token');
  const clinicToken = localStorage.getItem('authAccessToken');
  
  const token = adminToken || operadoraToken || clinicToken;
  
  const initWithAuth = {
    ...init,
    headers: {
      ...init?.headers,
      'Authorization': `Bearer ${token || ''}`,
    },
  };

  return fetch(input, initWithAuth);
}

// Interfaces para o Dashboard Administrativo
export interface AdminSystemMetrics {
  totalClinicas: number;
  totalOperadoras: number;
  totalProtocolos: number;
  totalPacientes: number;
  totalPrincipiosAtivos: number;
  totalSolicitacoes: number;
  solicitacoesHoje: number;
  solicitacoesSemana: number;
  solicitacoesMes: number;
  taxaAprovacaoGeral: number;
  tempoMedioResposta: number;
  clinicasAtivas: number;
  operadorasAtivas: number;
}

export interface OperadoraInfo {
  id: number;
  nome: string;
  codigo: string;
  totalClinicas: number;
  totalSolicitacoes: number;
  totalPacientes: number;
  taxaAprovacao: number;
  tempoMedioResposta: number;
  status: 'ativa' | 'inativa';
}

export interface ClinicaInfo {
  id: number;
  nome: string;
  operadora_id: number;
  operadora_nome: string;
  totalSolicitacoes: number;
  totalPacientes: number;
  taxaAprovacao: number;
  tempoMedioResposta: number;
  status: 'ativa' | 'inativa';
}

export interface AdminChartData {
  mes: string;
  solicitacoes: number;
  aprovacoes: number;
  rejeicoes: number;
  pendentes: number;
}

export interface AdminStatusData {
  name: string;
  value: number;
  color: string;
}

export interface AdminPerformanceData {
  name: string;
  solicitacoes: number;
  aprovacoes: number;
  taxaAprovacao: number;
  tempoMedio: number;
}

export interface AdminTrendData {
  periodo: string;
  solicitacoes: number;
  aprovacoes: number;
  taxaAprovacao: number;
}

export interface AdminChartsData {
  chartData: AdminChartData[];
  statusData: AdminStatusData[];
  performanceData: AdminPerformanceData[];
  trendData: AdminTrendData[];
}

export class AdminDashboardService {
  // Buscar métricas gerais do sistema
  static async getSystemMetrics(): Promise<AdminSystemMetrics> {
    try {
      let response = await adminAuthorizedFetch(`${API_BASE_URL}/admin/metrics`);
      // Se authorizedFetch retornar null (HTML pelo proxy), tenta fallback direto na API_BASE_URL
      if (!response) {
        const adminToken = localStorage.getItem('admin_access_token');
        const fallbackToken = localStorage.getItem('operadora_access_token');
        response = await fetch(`${API_BASE_URL}/admin/metrics`, {
          headers: {
            'Authorization': `Bearer ${adminToken || fallbackToken || ''}`,
          },
        });
      }

      if (!response || !response.ok) {
        throw new Error(`Erro HTTP: ${response?.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Erro ao buscar métricas');
      }

      return result.data;
    } catch (error) {
      console.error('❌ Erro no AdminDashboardService.getSystemMetrics():', error);
      throw new Error('Erro ao buscar métricas do sistema');
    }
  }

  // Buscar informações das operadoras
  static async getOperadorasInfo(): Promise<OperadoraInfo[]> {
    try {
      let response = await adminAuthorizedFetch(`${API_BASE_URL}/admin/operadoras`);
      if (!response) {
        const adminToken = localStorage.getItem('admin_access_token');
        const fallbackToken = localStorage.getItem('operadora_access_token');
        response = await fetch(`${API_BASE_URL}/admin/operadoras`, {
          headers: {
            'Authorization': `Bearer ${adminToken || fallbackToken || ''}`,
          },
        });
      }

      if (!response || !response.ok) {
        throw new Error(`Erro HTTP: ${response?.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Erro ao buscar operadoras');
      }

      return result.data;
    } catch (error) {
      console.error('❌ Erro no AdminDashboardService.getOperadorasInfo():', error);
      throw new Error('Erro ao buscar informações das operadoras');
    }
  }

  // Buscar informações das clínicas (com paginação)
  static async getClinicasInfo(page: number = 1, limit: number = 100): Promise<{data: ClinicaInfo[], pagination: any}> {
    try {
      let response = await adminAuthorizedFetch(`${API_BASE_URL}/admin/clinicas?page=${page}&limit=${limit}`);
      if (!response) {
        const adminToken = localStorage.getItem('admin_access_token');
        const fallbackToken = localStorage.getItem('operadora_access_token');
        response = await fetch(`${API_BASE_URL}/admin/clinicas?page=${page}&limit=${limit}`, {
          headers: {
            'Authorization': `Bearer ${adminToken || fallbackToken || ''}`,
          },
        });
      }

      if (!response || !response.ok) {
        throw new Error(`Erro HTTP: ${response?.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Erro ao buscar clínicas');
      }

      return {
        data: result.data,
        pagination: result.pagination
      };
    } catch (error) {
      console.error('❌ Erro no AdminDashboardService.getClinicasInfo():', error);
      throw new Error('Erro ao buscar informações das clínicas');
    }
  }

  // Buscar dados dos gráficos
  static async getChartsData(): Promise<AdminChartsData> {
    try {
      let response = await adminAuthorizedFetch(`${API_BASE_URL}/admin/charts`);
      if (!response) {
        const adminToken = localStorage.getItem('admin_access_token');
        const fallbackToken = localStorage.getItem('operadora_access_token');
        response = await fetch(`${API_BASE_URL}/admin/charts`, {
          headers: {
            'Authorization': `Bearer ${adminToken || fallbackToken || ''}`,
          },
        });
      }

      if (!response || !response.ok) {
        throw new Error(`Erro HTTP: ${response?.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Erro ao buscar dados dos gráficos');
      }

      return result.data;
    } catch (error) {
      console.error('❌ Erro no AdminDashboardService.getChartsData():', error);
      throw new Error('Erro ao buscar dados dos gráficos');
    }
  }

  // Buscar todos os dados administrativos
  static async getAllAdminData(): Promise<{
    metrics: AdminSystemMetrics;
    operadoras: OperadoraInfo[];
    clinicas: ClinicaInfo[];
    chartsData: AdminChartsData;
  }> {
    try {
      const [metrics, operadoras, clinicasResult, chartsData] = await Promise.all([
        this.getSystemMetrics(),
        this.getOperadorasInfo(),
        this.getClinicasInfo(1, 100), // Primeira página com 100 clínicas
        this.getChartsData()
      ]);

      const clinicas = clinicasResult.data;

      return {
        metrics,
        operadoras,
        clinicas,
        chartsData
      };
    } catch (error) {
      console.error('❌ Erro no AdminDashboardService.getAllAdminData():', error);
      throw new Error('Erro ao buscar dados administrativos completos');
    }
  }
}
