// API Service para integração com backend Node.js
const API_BASE_URL = 'http://localhost:3001/api';

// Interfaces para comunicação com a API
interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Interface compatível com seu frontend existente
export interface PatientFromAPI {
  id: number;
  clinica_id: number;
  Paciente_Nome: string;
  Operadora: number;
  Prestador: number;
  Codigo: string;
  Data_Nascimento: string;
  Sexo: string;
  Cid_Diagnostico: string;
  Data_Primeira_Solicitacao: string;
  cpf?: string;
  rg?: string;
  telefone?: string;
  endereco?: string;
  email?: string;
  nome_responsavel?: string;
  telefone_responsavel?: string;
  plano_saude?: string;
  numero_carteirinha?: string;
  status: 'ativo' | 'inativo' | 'alta' | 'obito';
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
  operadora_nome?: string;
  prestador_nome?: string;
}

// Função para converter data DD/MM/YYYY para YYYY-MM-DD
const convertDateToISO = (dateStr: string): string => {
  if (!dateStr) return '';
  
  // Se já está no formato ISO (YYYY-MM-DD), retorna como está
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateStr;
  }
  
  // Se está no formato brasileiro (DD/MM/YYYY)
  if (dateStr.includes('/')) {
    const [day, month, year] = dateStr.split('/');
    if (day && month && year && year.length === 4) {
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }
  
  return '';
};

// Função para converter data YYYY-MM-DD para DD/MM/YYYY
const convertDateFromISO = (dateStr: string): string => {
  if (!dateStr) return '';
  
  // Se já está no formato brasileiro, retorna como está
  if (dateStr.includes('/')) {
    return dateStr;
  }
  
  // Se está no formato ISO (YYYY-MM-DD)
  if (dateStr.includes('-')) {
    try {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    } catch {
      return '';
    }
  }
  
  return dateStr;
};

// Função para converter data do backend para o formato do frontend
const convertAPIPatientToFrontend = (apiPatient: PatientFromAPI): any => {
  // Calcular idade
  const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 0;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Mapear status
  const statusMap: Record<string, string> = {
    'ativo': 'Em tratamento',
    'inativo': 'Inativo',
    'alta': 'Alta',
    'obito': 'Óbito'
  };

  return {
    id: apiPatient.id.toString(),
    name: apiPatient.Paciente_Nome,
    age: calculateAge(apiPatient.Data_Nascimento),
    gender: apiPatient.Sexo,
    diagnosis: apiPatient.Cid_Diagnostico,
    stage: 'II', // Você pode adaptar isso conforme sua necessidade
    treatment: 'Quimioterapia', // Você pode adaptar isso conforme sua necessidade
    startDate: convertDateFromISO(apiPatient.Data_Primeira_Solicitacao), // ✅ CORRIGIDO
    status: statusMap[apiPatient.status] || apiPatient.status,
    authorizations: [], // Você pode adaptar isso quando implementar as autorizações
    
    // Dados adicionais do backend
    Paciente_Nome: apiPatient.Paciente_Nome,
    Codigo: apiPatient.Codigo,
    cpf: apiPatient.cpf || '',
    rg: apiPatient.rg || '',
    Data_Nascimento: apiPatient.Data_Nascimento, // Manter no formato ISO para o backend
    Sexo: apiPatient.Sexo,
    Operadora: apiPatient.operadora_nome || apiPatient.Operadora.toString(),
    Prestador: apiPatient.prestador_nome || apiPatient.Prestador.toString(),
    plano_saude: apiPatient.plano_saude || '',
    numero_carteirinha: apiPatient.numero_carteirinha || '',
    Cid_Diagnostico: apiPatient.Cid_Diagnostico,
    Data_Primeira_Solicitacao: apiPatient.Data_Primeira_Solicitacao,
    telefone: apiPatient.telefone || '',
    email: apiPatient.email || '',
    endereco: apiPatient.endereco || '',
    observacoes: apiPatient.observacoes || '',
  };
};

// Função para converter do frontend para API
const convertFrontendToAPI = (frontendPatient: any): Partial<PatientFromAPI> => {
  console.log('🔧 Dados recebidos do frontend:', frontendPatient);
  
  const converted = {
    clinica_id: frontendPatient.clinica_id || 1, // Valor padrão para testes
    Paciente_Nome: frontendPatient.Paciente_Nome || frontendPatient.name,
    Operadora: parseInt(frontendPatient.Operadora) || 1, // Converter para número
    Prestador: parseInt(frontendPatient.Prestador) || 1, // Converter para número
    Codigo: frontendPatient.Codigo,
    Data_Nascimento: convertDateToISO(frontendPatient.Data_Nascimento), // ✅ CORRIGIDO
    Sexo: frontendPatient.Sexo,
    Cid_Diagnostico: frontendPatient.Cid_Diagnostico,
    Data_Primeira_Solicitacao: convertDateToISO(
      frontendPatient.Data_Primeira_Solicitacao || 
      frontendPatient.startDate ||
      new Date().toISOString().split('T')[0] // Data atual como fallback
    ), // ✅ CORRIGIDO
    cpf: frontendPatient.cpf,
    rg: frontendPatient.rg,
    telefone: frontendPatient.telefone,
    endereco: frontendPatient.endereco,
    email: frontendPatient.email,
    nome_responsavel: frontendPatient.nome_responsavel,
    telefone_responsavel: frontendPatient.telefone_responsavel,
    plano_saude: frontendPatient.plano_saude,
    numero_carteirinha: frontendPatient.numero_carteirinha,
    status: frontendPatient.status || 'ativo',
    observacoes: frontendPatient.observacoes,
  };
  
  console.log('🔧 Dados convertidos para API:', converted);
  return converted;
};

export class PacienteService {
  
  // Listar pacientes
  static async listarPacientes(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ data: any[]; pagination: any }> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString()); 
      if (params?.search) queryParams.append('search', params.search);
      
      const url = `${API_BASE_URL}/pacientes?${queryParams.toString()}`;
      console.log('🔧 Fazendo requisição para:', url);
      
      const response = await fetch(url);
      console.log('📡 Status da resposta:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Resposta não OK:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result: ApiResponse<PaginatedResponse<PatientFromAPI>> = await response.json();
      console.log('📄 Resultado da API:', result);
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao listar pacientes');
      }
      
      // Converter dados da API para formato do frontend
      const convertedData = result.data!.data.map(convertAPIPatientToFrontend);
      console.log('✅ Dados convertidos:', convertedData.length, 'pacientes');
      
      return {
        data: convertedData,
        pagination: result.data!.pagination
      };
    } catch (error) {
      console.error('❌ Erro ao listar pacientes:', error);
      throw error;
    }
  }
  
  // Buscar paciente por ID
  static async buscarPaciente(id: number): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/pacientes/${id}`);
      const result: ApiResponse<PatientFromAPI> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao buscar paciente');
      }
      
      return convertAPIPatientToFrontend(result.data!);
    } catch (error) {
      console.error('Erro ao buscar paciente:', error);
      throw error;
    }
  }
  
  // Criar paciente
  static async criarPaciente(paciente: any): Promise<any> {
    try {
      const apiPatient = convertFrontendToAPI(paciente);
      
      const response = await fetch(`${API_BASE_URL}/pacientes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiPatient),
      });
      
      const result: ApiResponse<PatientFromAPI> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao criar paciente');
      }
      
      return convertAPIPatientToFrontend(result.data!);
    } catch (error) {
      console.error('Erro ao criar paciente:', error);
      throw error;
    }
  }
  
  // Atualizar paciente
  static async atualizarPaciente(id: number, paciente: any): Promise<any> {
    try {
      const apiPatient = convertFrontendToAPI(paciente);
      
      const response = await fetch(`${API_BASE_URL}/pacientes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiPatient),
      });
      
      const result: ApiResponse<PatientFromAPI> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao atualizar paciente');
      }
      
      return convertAPIPatientToFrontend(result.data!);
    } catch (error) {
      console.error('Erro ao atualizar paciente:', error);
      throw error;
    }
  }
  
  // Deletar paciente
  static async deletarPaciente(id: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/pacientes/${id}`, {
        method: 'DELETE',
      });
      
      const result: ApiResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao deletar paciente');
      }
    } catch (error) {
      console.error('Erro ao deletar paciente:', error);
      throw error;
    }
  }
}

// Função para testar se o backend está funcionando
export const testarConexaoBackend = async (): Promise<boolean> => {
  try {
    console.log('🔧 Testando conexão com backend...');
    const response = await fetch('http://localhost:3001/health');
    
    if (!response.ok) {
      console.error('❌ Resposta não OK:', response.status, response.statusText);
      return false;
    }
    
    const result = await response.json();
    console.log('✅ Backend respondeu:', result);
    return result.success;
  } catch (error) {
    console.error('❌ Backend não está respondendo:', error);
    return false;
  }
};


// Função para testar conexão com banco via API
export const testarConexaoBanco = async (): Promise<boolean> => {
  try {
    console.log('🔧 Testando conexão com banco via API...');
    const response = await fetch('http://localhost:3001/api/test-db');
    
    if (!response.ok) {
      console.error('❌ Resposta não OK:', response.status, response.statusText);
      return false;
    }
    
    const result = await response.json();
    console.log('✅ Teste de banco:', result);
    return result.success;
  } catch (error) {
    console.error('❌ Erro ao testar banco:', error);
    return false;
  }
};