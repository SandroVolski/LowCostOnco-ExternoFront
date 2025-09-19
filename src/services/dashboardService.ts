// src/services/dashboardService.ts

import config from '@/config/environment';

const API_BASE_URL = config.API_BASE_URL;

// Interfaces para o Dashboard
export interface SystemMetrics {
  totalClinicas: number;
  totalOperadoras: number;
  totalProtocolos: number;
  totalPacientes: number;
  totalPrincipiosAtivos: number;
  solicitacoesHoje: number;
  solicitacoesSemana: number;
  solicitacoesMes: number;
  taxaAprovacao: number;
  tempoMedioResposta: number;
}

export interface ClinicaPerformance {
  nome: string;
  solicitacoes: number;
  aprovacoes: number;
  taxaAprovacao: number;
  tempoMedio: number;
}

export interface ChartData {
  mes: string;
  solicitacoes: number;
  aprovacoes: number;
  pendentes: number;
}

export interface PerformanceData {
  name: string;
  value: number;
  color: string;
}

export interface StatusData {
  name: string;
  value: number;
  color: string;
}

export interface TrendData {
  periodo: string;
  usuarios: number;
  solicitacoes: number;
}

export interface ChartsData {
  chartData: ChartData[];
  performanceData: PerformanceData[];
  statusData: StatusData[];
  trendData: TrendData[];
}

// Interface para resposta da API
interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Classe de serviço para Dashboard
export class DashboardService {
  
  // Buscar métricas principais do sistema
  static async getMetrics(): Promise<SystemMetrics> {
    try {
      console.log('🔧 DashboardService.getMetrics() iniciado');
      console.log('🔧 URL completa:', `${API_BASE_URL}/dashboard/metrics`);
      
      const response = await fetch(`${API_BASE_URL}/dashboard/metrics`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<SystemMetrics> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao buscar métricas do dashboard');
      }
      
      if (!result.data) {
        throw new Error('Métricas não encontradas');
      }
      
      console.log('✅ Métricas obtidas com sucesso:', result.data);
      return result.data;
    } catch (error) {
      console.error('❌ Erro no DashboardService.getMetrics():', error);
      throw new Error('Erro ao buscar métricas do dashboard');
    }
  }

  // Buscar dados para gráficos
  static async getChartsData(): Promise<ChartsData> {
    try {
      console.log('🔧 DashboardService.getChartsData() iniciado');
      console.log('🔧 URL completa:', `${API_BASE_URL}/dashboard/charts`);
      
      const response = await fetch(`${API_BASE_URL}/dashboard/charts`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<ChartsData> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao buscar dados dos gráficos');
      }
      
      if (!result.data) {
        throw new Error('Dados dos gráficos não encontrados');
      }
      
      console.log('✅ Dados dos gráficos obtidos com sucesso:', result.data);
      return result.data;
    } catch (error) {
      console.error('❌ Erro no DashboardService.getChartsData():', error);
      throw new Error('Erro ao buscar dados dos gráficos');
    }
  }

  // Buscar performance das clínicas
  static async getClinicasPerformance(): Promise<ClinicaPerformance[]> {
    try {
      console.log('🔧 DashboardService.getClinicasPerformance() iniciado');
      console.log('🔧 URL completa:', `${API_BASE_URL}/dashboard/performance`);
      
      const response = await fetch(`${API_BASE_URL}/dashboard/performance`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<ClinicaPerformance[]> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao buscar performance das clínicas');
      }
      
      if (!result.data) {
        throw new Error('Performance das clínicas não encontrada');
      }
      
      console.log('✅ Performance das clínicas obtida com sucesso:', result.data);
      return result.data;
    } catch (error) {
      console.error('❌ Erro no DashboardService.getClinicasPerformance():', error);
      throw new Error('Erro ao buscar performance das clínicas');
    }
  }

  // Buscar todos os dados do dashboard de uma vez
  static async getAllDashboardData(): Promise<{
    metrics: SystemMetrics;
    chartsData: ChartsData;
    performance: ClinicaPerformance[];
  }> {
    try {
      console.log('🔧 DashboardService.getAllDashboardData() iniciado');
      
      const [metrics, chartsData, performance] = await Promise.all([
        this.getMetrics(),
        this.getChartsData(),
        this.getClinicasPerformance()
      ]);
      
      console.log('✅ Todos os dados do dashboard obtidos com sucesso');
      
      return {
        metrics,
        chartsData,
        performance
      };
    } catch (error) {
      console.error('❌ Erro no DashboardService.getAllDashboardData():', error);
      throw new Error('Erro ao buscar dados completos do dashboard');
    }
  }

  // Dados mock para fallback (quando API não estiver disponível)
  static getMockData(): {
    metrics: SystemMetrics;
    chartsData: ChartsData;
    performance: ClinicaPerformance[];
  } {
    return {
      metrics: {
        totalClinicas: 24,
        totalOperadoras: 8,
        totalProtocolos: 156,
        totalPacientes: 1247,
        totalPrincipiosAtivos: 89,
        solicitacoesHoje: 23,
        solicitacoesSemana: 156,
        solicitacoesMes: 642,
        taxaAprovacao: 87.5,
        tempoMedioResposta: 2.3
      },
      chartsData: {
        chartData: [
          { mes: 'Jan', solicitacoes: 120, aprovacoes: 105, pendentes: 15 },
          { mes: 'Fev', solicitacoes: 135, aprovacoes: 118, pendentes: 17 },
          { mes: 'Mar', solicitacoes: 142, aprovacoes: 128, pendentes: 14 },
          { mes: 'Abr', solicitacoes: 156, aprovacoes: 142, pendentes: 14 },
          { mes: 'Mai', solicitacoes: 168, aprovacoes: 155, pendentes: 13 },
          { mes: 'Jun', solicitacoes: 175, aprovacoes: 162, pendentes: 13 }
        ],
        performanceData: [
          { name: 'Aprovadas', value: 87.5, color: '#79d153' },
          { name: 'Em Análise', value: 8.2, color: '#e4a94f' },
          { name: 'Negadas', value: 4.3, color: '#f26b6b' }
        ],
        statusData: [
          { name: 'Aprovadas', value: 87.5, color: '#79d153' },
          { name: 'Em Análise', value: 8.2, color: '#e4a94f' },
          { name: 'Negadas', value: 4.3, color: '#f26b6b' }
        ],
        trendData: [
          { periodo: 'Jan', usuarios: 45, solicitacoes: 120 },
          { periodo: 'Fev', usuarios: 52, solicitacoes: 135 },
          { periodo: 'Mar', usuarios: 48, solicitacoes: 128 },
          { periodo: 'Abr', usuarios: 61, solicitacoes: 142 },
          { periodo: 'Mai', usuarios: 55, solicitacoes: 138 },
          { periodo: 'Jun', usuarios: 67, solicitacoes: 156 }
        ]
      },
      performance: [
        { nome: 'Clínica A', solicitacoes: 45, aprovacoes: 42, taxaAprovacao: 93.3, tempoMedio: 1.8 },
        { nome: 'Clínica B', solicitacoes: 38, aprovacoes: 35, taxaAprovacao: 92.1, tempoMedio: 2.1 },
        { nome: 'Clínica C', solicitacoes: 52, aprovacoes: 48, taxaAprovacao: 92.3, tempoMedio: 2.5 },
        { nome: 'Clínica D', solicitacoes: 29, aprovacoes: 26, taxaAprovacao: 89.7, tempoMedio: 1.9 },
        { nome: 'Clínica E', solicitacoes: 41, aprovacoes: 37, taxaAprovacao: 90.2, tempoMedio: 2.2 }
      ]
    };
  }
}
