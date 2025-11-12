// src/services/analysisService.ts

import { operadoraAuthService } from './operadoraAuthService';
import { authorizedFetch } from './authService';
import { PacienteService } from '@/services/api';
import config from '@/config/environment';

// Helper para detectar tipo de usuário e usar o serviço correto
function getAuthorizedFetch(): typeof authorizedFetch {
  try {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      // Se é operadora, usar operadoraAuthService
      if (userData.role === 'operator' || userData.role === 'operadora_admin' || userData.role === 'operadora_user') {
        return (url: string) => operadoraAuthService.authorizedFetch(url);
      }
    }
  } catch (error) {
    console.error('Erro ao detectar tipo de usuário:', error);
  }
  // Por padrão, usar authService (clínica)
  return authorizedFetch;
}

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

export interface OperationalKPIs {
  taxaAprovacao: number;
  tempoMedioAprovacao: number;
  custoMedioPorPaciente: number;
  totalSolicitacoes30Dias: number;
  pacientesUnicos30Dias: number;
}

export interface ChartData {
  medicamentos: Array<{ name: string; value: number }>;
  cancerTypes: Array<{ tipo_cancer: string; casos: number }>;
  monthlyData: Array<{ name: string; solicitacoes: number; patients: number }>;
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

// Prefixos de CID para mapeamento mais amplo (aceita sem ponto, e variações)
const CID_PREFIX_TO_ORGAN: Array<{ prefix: string | RegExp; organ: string }> = [
  { prefix: /^C7[01-2]/i, organ: 'brain' }, // C70, C71, C72
  { prefix: /^C34/i, organ: 'lungs' },
  { prefix: /^C78(?:\.[0-6-9])?/i, organ: 'lungs' }, // metástases pulmonares
  { prefix: /^C38/i, organ: 'heart' },
  { prefix: /^C22/i, organ: 'liver' },
  { prefix: /^C16/i, organ: 'stomach' },
  { prefix: /^C6[4-6]/i, organ: 'kidneys' }, // C64, C65, C66
  { prefix: /^C67/i, organ: 'bladder' },
  { prefix: /^C61/i, organ: 'prostate' },
  { prefix: /^C50/i, organ: 'breast' },
];

function normalizeCidCode(input: string): string {
  const raw = (input || '').toUpperCase().replace(/\s+/g, '');
  if (!raw) return '';
  // Inserir ponto após a 3ª posição se vier sem ponto (ex.: C160 -> C16.0)
  if (/^C\d{3}$/.test(raw)) {
    return raw.slice(0, 3) + '.' + raw.slice(3);
  }
  return raw;
}

function detectOrganByCid(cid: string): string | null {
  if (!cid) return null;
  const norm = normalizeCidCode(cid);
  if (CID_TO_ORGAN_MAP[norm]) return CID_TO_ORGAN_MAP[norm];
  // Testar prefixos (sem ponto e com ponto)
  for (const rule of CID_PREFIX_TO_ORGAN) {
    if (typeof rule.prefix === 'string') {
      if (norm.startsWith(rule.prefix)) return rule.organ;
    } else {
      if (rule.prefix.test(norm)) return rule.organ;
    }
  }
  return null;
}

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
      // Montar query string de filtros, se houver
      const params = new URLSearchParams();
      if (filters?.clinicId) params.set('clinicId', String(filters.clinicId));
      if (filters?.sex) params.set('sex', filters.sex);
      if (typeof filters?.ageMin === 'number') params.set('ageMin', String(filters.ageMin));
      if (typeof filters?.ageMax === 'number') params.set('ageMax', String(filters.ageMax));

      const qs = params.toString();
      const url = `${config.API_BASE_URL}/analysis/organs${qs ? `?${qs}` : ''}`;

      // Detectar automaticamente o tipo de usuário e usar o serviço correto
      const fetchFn = getAuthorizedFetch();
      const response = await fetchFn(url);

      if (!response || !response.ok) {
        throw new Error('Erro ao buscar dados de análise');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error('Erro ao buscar dados de análise');
      }

      const analysisData = result.data || [];

      // Se a API retornar dados, utilizar diretamente
      if (Array.isArray(analysisData) && analysisData.length > 0) {
        return analysisData;
      }

      const patientsResult = await PacienteService.listarPacientes({ page: 1, limit: 1000 });
      const patients = patientsResult.data || [];

      const organToData = new Map<string, { patientsSet: Set<string>; cidsSet: Set<string> }>();

      for (const p of patients) {
        const rawCid: any = (p.Cid_Diagnostico ?? (p as any).cid_diagnostico ?? '');
        const codes: string[] = Array.isArray(rawCid)
          ? rawCid
          : String(rawCid)
              .split(',')
              .map(s => s.trim())
              .filter(Boolean);

        const patientId = (p.id ?? p.Codigo ?? p.codigo ?? Math.random().toString()).toString();

        for (const code of codes) {
          const organ = detectOrganByCid(code);
          if (!organ) continue; // Ignorar CIDs não oncológicos ou sem mapeamento

          if (!organToData.has(organ)) {
            organToData.set(organ, { patientsSet: new Set<string>(), cidsSet: new Set<string>() });
          }
          const bucket = organToData.get(organ)!;
          bucket.patientsSet.add(patientId);
          bucket.cidsSet.add(normalizeCidCode(code));
        }
      }

      const built: OrganAnalysisData[] = Array.from(organToData.entries()).map(([organId, bucket]) => ({
        organId,
        organName: ORGAN_NAMES[organId] || organId,
        patients: bucket.patientsSet.size,
        cids: Array.from(bucket.cidsSet),
        protocols: [],
        color: ORGAN_COLORS[organId] || 'primary',
        description: ORGAN_DESCRIPTIONS[organId] || '',
        solicitacoes: [],
      }));

      return built;
    } catch (error) {
      console.error('❌ Erro ao buscar dados de análise:', error);
      throw new Error('Erro ao buscar dados de análise por órgão');
    }
  }
  
  // Buscar métricas gerais de análise
  static async getAnalysisMetrics(filters?: AnalysisFilters): Promise<AnalysisMetrics> {
    try {
      const params = new URLSearchParams();
      if (filters?.clinicId) params.set('clinicId', String(filters.clinicId));
      if (filters?.sex) params.set('sex', filters.sex);
      if (typeof filters?.ageMin === 'number') params.set('ageMin', String(filters.ageMin));
      if (typeof filters?.ageMax === 'number') params.set('ageMax', String(filters.ageMax));
      const qs = params.toString();
      const url = `${config.API_BASE_URL}/analysis/metrics${qs ? `?${qs}` : ''}`;

      // Detectar automaticamente o tipo de usuário e usar o serviço correto
      const fetchFn = getAuthorizedFetch();
      const response = await fetchFn(url);

      if (!response || !response.ok) {
        throw new Error('Erro ao buscar métricas de análise');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error('Erro ao buscar métricas de análise');
      }

      const metrics = result.data;

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

  // Buscar KPIs operacionais
  static async getOperationalKPIs(filters?: AnalysisFilters): Promise<OperationalKPIs> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.clinicId) queryParams.append('clinicId', filters.clinicId.toString());
      if (filters?.sex) queryParams.append('sex', filters.sex);
      if (filters?.ageMin !== undefined) queryParams.append('ageMin', filters.ageMin.toString());
      if (filters?.ageMax !== undefined) queryParams.append('ageMax', filters.ageMax.toString());

      const qs = queryParams.toString();
      const url = `${config.API_BASE_URL}/analysis/kpis${qs ? `?${qs}` : ''}`;

      // Detectar automaticamente o tipo de usuário e usar o serviço correto
      const fetchFn = getAuthorizedFetch();
      const response = await fetchFn(url);

      if (!response || !response.ok) {
        throw new Error(`Erro ao buscar KPIs operacionais: ${response.status}`);
      }

      const data = await response.json();

      return data.data;
    } catch (error) {
      console.error('❌ Erro ao buscar KPIs operacionais:', error);
      throw new Error('Erro ao buscar KPIs operacionais');
    }
  }

  // Buscar dados para gráficos
  static async getChartData(filters?: AnalysisFilters): Promise<ChartData> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.clinicId) queryParams.append('clinicId', filters.clinicId.toString());
      if (filters?.sex) queryParams.append('sex', filters.sex);
      if (filters?.ageMin !== undefined) queryParams.append('ageMin', filters.ageMin.toString());
      if (filters?.ageMax !== undefined) queryParams.append('ageMax', filters.ageMax.toString());

      const qs = queryParams.toString();
      const url = `${config.API_BASE_URL}/analysis/charts${qs ? `?${qs}` : ''}`;

      // Detectar automaticamente o tipo de usuário e usar o serviço correto
      const fetchFn = getAuthorizedFetch();
      const response = await fetchFn(url);

      if (!response || !response.ok) {
        throw new Error(`Erro ao buscar dados de gráficos: ${response.status}`);
      }

      const data = await response.json();

      return data.data;
    } catch (error) {
      console.error('❌ Erro ao buscar dados de gráficos:', error);
      throw new Error('Erro ao buscar dados de gráficos');
    }
  }
}
