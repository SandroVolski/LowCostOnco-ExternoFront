// src/services/analysisService.ts

import { authorizedFetch } from './authService';
import config from '@/config/environment';

export interface OrganAnalysisData {
  organId: string;
  organName: string;
  patients: number;
  cids: string[];
  protocols: string[];
  color: string;
  description: string;
  solicitacoes: SolicitacaoAnalysis[];
}

export interface SolicitacaoAnalysis {
  id: number;
  cliente_nome: string;
  diagnostico_cid: string;
  diagnostico_descricao: string;
  finalidade: string;
  status: string;
  data_solicitacao: string;
  medicamentos_antineoplasticos: string;
  ciclo_atual: number;
  ciclos_previstos: number;
}

export interface AnalysisMetrics {
  totalSolicitacoes: number;
  totalPacientes: number;
  sistemasMonitorados: number;
  protocolosAtivos: number;
  cidsCadastrados: number;
}

export interface AnalysisFilters {
  clinicId?: number;
  sex?: 'M' | 'F' | 'O';
  ageMin?: number;
  ageMax?: number;
}

// Mapeamento de CIDs para órgãos
const CID_TO_ORGAN_MAP: Record<string, string> = {
  // Sistema Nervoso Central
  'C71.0': 'brain',
  'C71.1': 'brain', 
  'C71.9': 'brain',
  'C70.0': 'brain',
  'C70.1': 'brain',
  'C70.9': 'brain',
  'C72.0': 'brain',
  'C72.1': 'brain',
  'C72.2': 'brain',
  'C72.3': 'brain',
  'C72.4': 'brain',
  'C72.5': 'brain',
  'C72.8': 'brain',
  'C72.9': 'brain',
  
  // Sistema Respiratório
  'C78.0': 'lungs',
  'C34.0': 'lungs',
  'C34.1': 'lungs',
  'C34.2': 'lungs',
  'C34.3': 'lungs',
  'C34.8': 'lungs',
  'C34.9': 'lungs',
  'C78.1': 'lungs',
  'C78.2': 'lungs',
  'C78.3': 'lungs',
  'C78.4': 'lungs',
  'C78.5': 'lungs',
  'C78.6': 'lungs',
  'C78.7': 'lungs',
  'C78.8': 'lungs',
  'C78.9': 'lungs',
  
  // Sistema Cardiovascular
  'C38.0': 'heart',
  'C38.1': 'heart',
  'C38.2': 'heart',
  'C38.3': 'heart',
  'C38.4': 'heart',
  'C38.8': 'heart',
  'C76.1': 'heart',
  
  // Sistema Digestivo - Fígado
  'C22.0': 'liver',
  'C22.1': 'liver',
  'C22.2': 'liver',
  'C22.3': 'liver',
  'C22.4': 'liver',
  'C22.7': 'liver',
  'C22.8': 'liver',
  'C22.9': 'liver',
  'C78.7': 'liver',
  
  // Sistema Digestivo - Estômago
  'C16.0': 'stomach',
  'C16.1': 'stomach',
  'C16.2': 'stomach',
  'C16.3': 'stomach',
  'C16.4': 'stomach',
  'C16.5': 'stomach',
  'C16.6': 'stomach',
  'C16.8': 'stomach',
  'C16.9': 'stomach',
  
  // Sistema Urinário - Rins
  'C64': 'kidneys',
  'C65': 'kidneys',
  'C66': 'kidneys',
  'C67.0': 'kidneys',
  'C67.1': 'kidneys',
  'C67.2': 'kidneys',
  'C67.3': 'kidneys',
  'C67.4': 'kidneys',
  'C67.5': 'kidneys',
  'C67.6': 'kidneys',
  'C67.7': 'kidneys',
  'C67.8': 'kidneys',
  'C67.9': 'kidneys',
  
  // Sistema Urinário - Bexiga
  'C67.0': 'bladder',
  'C67.1': 'bladder',
  'C67.2': 'bladder',
  'C67.3': 'bladder',
  'C67.4': 'bladder',
  'C67.5': 'bladder',
  'C67.6': 'bladder',
  'C67.7': 'bladder',
  'C67.8': 'bladder',
  'C67.9': 'bladder',
  
  // Sistema Reprodutor - Próstata
  'C61': 'prostate',
  'C77.5': 'prostate',
  
  // Sistema Reprodutor - Mama
  'C50.0': 'breast',
  'C50.1': 'breast',
  'C50.2': 'breast',
  'C50.3': 'breast',
  'C50.4': 'breast',
  'C50.5': 'breast',
  'C50.6': 'breast',
  'C50.8': 'breast',
  'C50.9': 'breast',
  'C77.2': 'breast',
};

// Mapeamento de órgãos para cores
const ORGAN_COLORS: Record<string, string> = {
  brain: 'medical-purple',
  lungs: 'medical-blue',
  heart: 'medical-red',
  liver: 'medical-orange',
  stomach: 'medical-teal',
  kidneys: 'medical-red',
  bladder: 'medical-blue',
  prostate: 'medical-green',
  breast: 'medical-pink',
};

// Mapeamento de órgãos para nomes
const ORGAN_NAMES: Record<string, string> = {
  brain: 'Cérebro',
  lungs: 'Pulmões',
  heart: 'Coração',
  liver: 'Fígado',
  stomach: 'Estômago',
  kidneys: 'Rins',
  bladder: 'Bexiga',
  prostate: 'Próstata',
  breast: 'Mama',
};

// Mapeamento de órgãos para descrições
const ORGAN_DESCRIPTIONS: Record<string, string> = {
  brain: 'Tumores primários do sistema nervoso central',
  lungs: 'Carcinomas pulmonares e metástases',
  heart: 'Tumores cardíacos raros',
  liver: 'Hepatocarcinoma e metástases hepáticas',
  stomach: 'Adenocarcinomas gástricos',
  kidneys: 'Carcinomas renais',
  bladder: 'Carcinomas uroteliais',
  prostate: 'Adenocarcinoma de próstata',
  breast: 'Carcinomas mamários',
};

export class AnalysisService {
  // Buscar dados de análise por órgão
  static async getOrganAnalysisData(filters?: AnalysisFilters): Promise<OrganAnalysisData[]> {
    try {
      console.log('🔧 Buscando dados de análise por órgão...');
      
      // Montar query string de filtros, se houver
      const params = new URLSearchParams();
      if (filters?.clinicId) params.set('clinicId', String(filters.clinicId));
      if (filters?.sex) params.set('sex', filters.sex);
      if (typeof filters?.ageMin === 'number') params.set('ageMin', String(filters.ageMin));
      if (typeof filters?.ageMax === 'number') params.set('ageMax', String(filters.ageMax));

      const qs = params.toString();
      const url = `${config.API_BASE_URL}/analysis/organs${qs ? `?${qs}` : ''}`;

      // Usar endpoint otimizado de análise
      const response = await authorizedFetch(url);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar dados de análise');
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error('Erro ao buscar dados de análise');
      }
      
      const analysisData = result.data || [];
      console.log('✅ Dados de análise carregados:', analysisData.length, 'órgãos');
      
      return analysisData;
      
    } catch (error) {
      console.error('❌ Erro ao buscar dados de análise:', error);
      throw new Error('Erro ao buscar dados de análise por órgão');
    }
  }
  
  // Buscar métricas gerais de análise
  static async getAnalysisMetrics(filters?: AnalysisFilters): Promise<AnalysisMetrics> {
    try {
      console.log('🔧 Buscando métricas de análise...');
      
      const params = new URLSearchParams();
      if (filters?.clinicId) params.set('clinicId', String(filters.clinicId));
      if (filters?.sex) params.set('sex', filters.sex);
      if (typeof filters?.ageMin === 'number') params.set('ageMin', String(filters.ageMin));
      if (typeof filters?.ageMax === 'number') params.set('ageMax', String(filters.ageMax));
      const qs = params.toString();
      const url = `${config.API_BASE_URL}/analysis/metrics${qs ? `?${qs}` : ''}`;

      // Usar endpoint otimizado de métricas
      const response = await authorizedFetch(url);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar métricas de análise');
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error('Erro ao buscar métricas de análise');
      }
      
      const metrics = result.data;
      console.log('✅ Métricas carregadas:', metrics);
      
      return metrics;
      
    } catch (error) {
      console.error('❌ Erro ao buscar métricas de análise:', error);
      throw new Error('Erro ao buscar métricas de análise');
    }
  }
  
  // Buscar dados de análise para um órgão específico
  static async getOrganAnalysisDataById(organId: string): Promise<OrganAnalysisData | null> {
    try {
      const allData = await this.getOrganAnalysisData();
      return allData.find(data => data.organId === organId) || null;
    } catch (error) {
      console.error('❌ Erro ao buscar dados do órgão:', error);
      return null;
    }
  }
}
