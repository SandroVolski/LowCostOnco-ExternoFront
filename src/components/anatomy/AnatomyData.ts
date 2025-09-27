import { OrganAnalysisData } from '@/services/analysisService';

export interface OrganData {
  id: string;
  name: string;
  patients: number;
  cids: string[];
  protocols: string[];
  color: string;
  description: string;
  solicitacoes?: any[]; // Dados das solicitações reais
}

// Dados padrão para fallback quando não há dados reais
export const defaultOrganData: Record<string, OrganData> = {
  brain: {
    id: "brain",
    name: "Cérebro",
    patients: 0,
    cids: ["C71.0", "C71.1", "C71.9"],
    protocols: ["RT + TMZ", "Cirurgia + RT", "TMZ Adjuvante"],
    color: "medical-purple",
    description: "Tumores primários do sistema nervoso central"
  },
  lungs: {
    id: "lungs",
    name: "Pulmões",
    patients: 0,
    cids: ["C78.0", "C34.1", "C34.3"],
    protocols: ["Cisplatina + Etoposido", "Carboplatina + Paclitaxel", "Imunoterapia"],
    color: "medical-blue",
    description: "Carcinomas pulmonares e metástases"
  },
  heart: {
    id: "heart",
    name: "Coração",
    patients: 0,
    cids: ["C38.0", "C76.1"],
    protocols: ["Doxorrubicina", "Cirurgia Cardiotorácica"],
    color: "medical-red",
    description: "Tumores cardíacos raros"
  },
  liver: {
    id: "liver",
    name: "Fígado",
    patients: 0,
    cids: ["C22.0", "C78.7", "C22.1"],
    protocols: ["TACE", "Sorafenibe", "Hepatectomia"],
    color: "medical-orange",
    description: "Hepatocarcinoma e metástases hepáticas"
  },
  colon: {
    id: "colon",
    name: "Intestino",
    patients: 0,
    cids: ["C18.0", "C18.7", "C18.9", "C20"],
    protocols: ["FOLFOX", "FOLFIRI", "Cirurgia"],
    color: "medical-teal",
    description: "Neoplasias do cólon, reto e intestino grosso"
  },
  stomach: {
    id: "stomach",
    name: "Estômago",
    patients: 0,
    cids: ["C16.0", "C16.1", "C16.9"],
    protocols: ["ECF", "Gastrectomia", "FLOT"],
    color: "medical-teal",
    description: "Adenocarcinomas gástricos"
  },
  kidneys: {
    id: "kidneys",
    name: "Rins",
    patients: 0,
    cids: ["C64", "C65", "C66"],
    protocols: ["Sunitinibe", "Nefrectomia", "Pazopanibe"],
    color: "medical-red",
    description: "Carcinomas renais"
  },
  bladder: {
    id: "bladder",
    name: "Bexiga",
    patients: 0,
    cids: ["C67.0", "C67.1", "C67.9"],
    protocols: ["BCG Intravesical", "Cistectomia", "Gemcitabina + Cisplatina"],
    color: "medical-blue",
    description: "Carcinomas uroteliais"
  },
  prostate: {
    id: "prostate",
    name: "Próstata",
    patients: 0,
    cids: ["C61"],
    protocols: ["Hormonioterapia", "Prostatectomia", "Radioterapia"],
    color: "medical-purple",
    description: "Adenocarcinomas prostáticos"
  },
  breast: {
    id: "breast",
    name: "Mama",
    patients: 0,
    cids: ["C50.0", "C50.1", "C50.9"],
    protocols: ["Quimioterapia Adjuvante", "Hormonioterapia", "Mastectomia"],
    color: "medical-pink",
    description: "Carcinomas mamários"
  }
};

// Função para converter dados de análise para formato de órgão
export const convertAnalysisToOrganData = (analysisData: OrganAnalysisData[]): Record<string, OrganData> => {
  const organData: Record<string, OrganData> = {};
  
  analysisData.forEach(data => {
    organData[data.organId] = {
      id: data.organId,
      name: data.organName,
      patients: data.patients,
      cids: data.cids,
      protocols: data.protocols,
      color: data.color,
      description: data.description,
      solicitacoes: data.solicitacoes
    };
  });
  
  return organData;
};

// Exportar dados padrão como organData para compatibilidade
export const organData = defaultOrganData; // usado apenas como base de estrutura (zeros)