// src/services/api.ts - VERSÃO ATUALIZADA

// Importar configuração de ambiente
import config from '@/config/environment';
import { authorizedFetch } from '@/services/authService';

// API Service para integração com backend Node.js
const API_BASE_URL = config.API_BASE_URL;

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

// Interface para Solicitação de Autorização
export interface SolicitacaoFromAPI {
  id?: number;
  clinica_id: number;
  paciente_id?: number;
  hospital_nome: string;
  hospital_codigo: string;
  cliente_nome: string;
  cliente_codigo: string;
  sexo: 'M' | 'F';
  data_nascimento: string;
  idade: number;
  data_solicitacao: string;
  diagnostico_cid: string;
  diagnostico_descricao: string;
  local_metastases?: string;
  estagio_t?: string;
  estagio_n?: string;
  estagio_m?: string;
  estagio_clinico?: string;
  tratamento_cirurgia_radio?: string;
  tratamento_quimio_adjuvante?: string;
  tratamento_quimio_primeira_linha?: string;
  tratamento_quimio_segunda_linha?: string;
  finalidade: 'neoadjuvante' | 'adjuvante' | 'curativo' | 'controle' | 'radioterapia' | 'paliativo';
  performance_status: string;
  siglas?: string;
  ciclos_previstos: number;
  ciclo_atual: number;
  superficie_corporal: number;
  peso: number;
  altura: number;
  medicamentos_antineoplasticos: string;
  dose_por_m2: string;
  dose_total: string;
  via_administracao: string;
  dias_aplicacao_intervalo: string;
  medicacoes_associadas?: string;
  medico_assinatura_crm: string;
  numero_autorizacao?: string;
  status?: 'pendente' | 'aprovada' | 'rejeitada' | 'em_analise';
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
}

// Interface compatível com seu frontend existente
export interface PatientFromAPI {
  id: number;
  clinica_id: number;
  // Campos do modelo antigo
  Paciente_Nome?: string;
  Operadora?: number;
  Prestador?: number;
  Codigo?: string;
  Data_Nascimento?: string;
  Sexo?: string;
  Cid_Diagnostico?: string;
  Data_Primeira_Solicitacao?: string;
  // Campos do modelo novo
  nome?: string;
  codigo?: string;
  data_nascimento?: string;
  sexo?: string;
  cid_diagnostico?: string;
  data_primeira_solicitacao?: string;
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

// Função para converter data YYYY-MM-DD para DD/MM/YYYY
const convertDateFromISO = (dateStr: string | null | undefined): string => {
  if (!dateStr || dateStr === null || dateStr === undefined) return '';
  
  // Se já está no formato brasileiro, retorna como está
  if (dateStr.includes('/') && !dateStr.includes('T')) {
    return dateStr;
  }
  
  // Se contém 'T' (formato ISO completo), extrai apenas a data
  if (dateStr.includes('T')) {
    dateStr = dateStr.split('T')[0];
  }
  
  // Se está no formato ISO (YYYY-MM-DD)
  if (dateStr.includes('-') && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    try {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    } catch {
      return '';
    }
  }
  
  return dateStr;
};

// Função para converter data DD/MM/YYYY para YYYY-MM-DD
const convertDateToISO = (dateStr: string | null | undefined): string => {
  if (!dateStr || dateStr === null || dateStr === undefined) return '';
  
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

// Função para converter data do backend para o formato do frontend
const convertAPIPatientToFrontend = (apiPatient: PatientFromAPI): any => {
  // Calcular idade
  const calculateAge = (birthDate: string | null | undefined): number => {
    if (!birthDate || birthDate === null || birthDate === undefined) return 0;
    
    // Garantir que temos apenas a data (YYYY-MM-DD)
    let cleanDate = birthDate;
    if (birthDate.includes('T')) {
      cleanDate = birthDate.split('T')[0];
    }
    
    const birth = new Date(cleanDate);
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

  // Fallbacks para suportar ambos os esquemas
  const name = (apiPatient.Paciente_Nome || (apiPatient as any).nome || '').toString();
  const code = (apiPatient.Codigo || (apiPatient as any).codigo || '').toString();
  const sexo = apiPatient.Sexo || (apiPatient as any).sexo || '';
  const nasc = apiPatient.Data_Nascimento || (apiPatient as any).data_nascimento || '';
  const cid = apiPatient.Cid_Diagnostico || (apiPatient as any).cid_diagnostico || '';
  const dataPrimeira = apiPatient.Data_Primeira_Solicitacao || (apiPatient as any).data_primeira_solicitacao || '';

  // Extrair contatos/endereço (novo schema) se existirem
  const parseJson = (v: any) => {
    try { return typeof v === 'string' ? JSON.parse(v) : v; } catch { return undefined; }
  };
  const contatos = parseJson((apiPatient as any).contatos) || {};
  const enderecoJson = parseJson((apiPatient as any).endereco) || {};
  const contatoEmergenciaJson = parseJson((apiPatient as any).contato_emergencia) || {};

  // Médico assistente (se backend enviar em algum dos formatos abaixo)
  const medicoAssistenteNome = (apiPatient as any).medico_nome || (apiPatient as any).medicoAssistenteNome || (apiPatient as any).medico_assistente_nome || '';
  const medicoAssistenteEmail = (apiPatient as any).medico_email || (apiPatient as any).medicoAssistenteEmail || (apiPatient as any).medico_assistente_email || '';
  const medicoAssistenteTelefone = (apiPatient as any).medico_telefone || (apiPatient as any).medicoAssistenteTelefone || (apiPatient as any).medico_assistente_telefone || '';
  const medicoAssistenteEspecialidade = (apiPatient as any).medico_especialidade || (apiPatient as any).medicoAssistenteEspecialidade || (apiPatient as any).medico_assistente_especialidade || '';
  
  // Debug: Log dos campos do médico assistente
  console.log('🔧 Debug médico assistente para paciente:', apiPatient.nome || apiPatient.Paciente_Nome);
  console.log('🔧 medico_assistente_nome:', (apiPatient as any).medico_assistente_nome);
  console.log('🔧 medicoAssistenteNome final:', medicoAssistenteNome);
  console.log('🔧 prestador_id:', (apiPatient as any).prestador_id);

  return {
    id: apiPatient.id ? apiPatient.id.toString() : '',
    name,
    age: calculateAge(nasc || null),
    gender: sexo,
    diagnosis: cid,
    stage: 'II', // Você pode adaptar isso conforme sua necessidade
    treatment: 'Quimioterapia', // Você pode adaptar isso conforme sua necessidade
    startDate: convertDateFromISO(dataPrimeira || null),
    status: statusMap[apiPatient.status] || apiPatient.status,
    authorizations: [], // Você pode adaptar isso quando implementar as autorizações
    
    // Dados adicionais do backend
    Paciente_Nome: name,
    Codigo: code,
    cpf: apiPatient.cpf || '',
    rg: apiPatient.rg || '',
    Data_Nascimento: convertDateFromISO(nasc || null), // Converter para exibição
    Sexo: sexo,
    Operadora: apiPatient.operadora_nome || (apiPatient.Operadora ? apiPatient.Operadora.toString() : ''),
    Prestador: medicoAssistenteNome || apiPatient.prestador_nome || (apiPatient.Prestador ? apiPatient.Prestador.toString() : ''),
    plano_saude: apiPatient.plano_saude || '',
    numero_carteirinha: apiPatient.numero_carteirinha || '',
    Cid_Diagnostico: cid.includes(',') ? cid.split(',').map(c => c.trim()).filter(c => c) : cid,
    Data_Primeira_Solicitacao: convertDateFromISO(dataPrimeira || null), // Converter para exibição
    telefone: apiPatient.telefone || '',
    email: apiPatient.email || '',
    endereco: apiPatient.endereco || '',
    observacoes: apiPatient.observacoes || '',

    // Dados de contato (novos campos JSON)
    contato_telefone: contatos.telefone || contatos.celular || apiPatient.telefone || '',
    contato_celular: contatos.celular || '',
    contato_email: contatos.email || apiPatient.email || '',

    // Endereço detalhado se disponível
    endereco_rua: enderecoJson.rua || enderecoJson.logradouro || (apiPatient as any).endereco_rua || '',
    endereco_numero: enderecoJson.numero || (apiPatient as any).endereco_numero || '',
    endereco_bairro: enderecoJson.bairro || (apiPatient as any).endereco_bairro || '',
    endereco_cidade: enderecoJson.cidade || (apiPatient as any).endereco_cidade || '',
    endereco_estado: enderecoJson.estado || enderecoJson.uf || (apiPatient as any).endereco_estado || '',
    endereco_cep: enderecoJson.cep || (apiPatient as any).endereco_cep || '',

    // Médico assistente (fallbacks)
    medico_assistente_nome: medicoAssistenteNome,
    medico_assistente_email: medicoAssistenteEmail,
    medico_assistente_telefone: medicoAssistenteTelefone,
    medico_assistente_especialidade: medicoAssistenteEspecialidade,

    // Peso e altura (convertendo para string para exibição)
    peso: (apiPatient as any).peso ? String((apiPatient as any).peso) : (apiPatient as any).weight || '',
    altura: (apiPatient as any).altura ? String((apiPatient as any).altura) : (apiPatient as any).height || '',

    // Contato de emergência (do JSON do banco)
    contato_emergencia_nome: contatoEmergenciaJson.nome || 
                           (apiPatient as any).contato_emergencia_nome || 
                           (apiPatient as any).nome_responsavel || '',
    contato_emergencia_telefone: contatoEmergenciaJson.telefone || 
                                (apiPatient as any).contato_emergencia_telefone || 
                                (apiPatient as any).telefone_responsavel || '',
  };
};

// Função para converter do frontend para API
const convertFrontendToAPI = (frontendPatient: any): Partial<PatientFromAPI> => {
  console.log('🔧 Dados recebidos do frontend:', frontendPatient);
  
  const converted = {
    // clinica_id definido no backend a partir do token
    Paciente_Nome: frontendPatient.Paciente_Nome || frontendPatient.name,
    Operadora: frontendPatient.Operadora ? parseInt(frontendPatient.Operadora) || 1 : 1, // Converter para número
    Prestador: frontendPatient.Prestador || '', // Manter como string para resolução por nome
    Codigo: frontendPatient.Codigo,
    Data_Nascimento: convertDateToISO(frontendPatient.Data_Nascimento || null), // ✅ CORRIGIDO
    Sexo: frontendPatient.Sexo,
    Cid_Diagnostico: Array.isArray(frontendPatient.Cid_Diagnostico) 
      ? frontendPatient.Cid_Diagnostico.join(', ') 
      : frontendPatient.Cid_Diagnostico,
    Data_Primeira_Solicitacao: convertDateToISO(
      frontendPatient.Data_Primeira_Solicitacao || 
      frontendPatient.startDate ||
      new Date().toISOString().split('T')[0] // Data atual como fallback
    ) || new Date().toISOString().split('T')[0], // ✅ CORRIGIDO
    // Enviar também Data_Inicio_Tratamento para compatibilidade
    Data_Inicio_Tratamento: convertDateToISO(
      frontendPatient.startDate || frontendPatient.Data_Primeira_Solicitacao
    ),
    // Campos pessoais/contato
    cpf: frontendPatient.cpf,
    rg: frontendPatient.rg,
    telefone: frontendPatient.telefone,
    endereco: frontendPatient.endereco,
    email: frontendPatient.email,
    nome_responsavel: frontendPatient.nome_responsavel,
    telefone_responsavel: frontendPatient.telefone_responsavel,
    observacoes: frontendPatient.observacoes,
    status: frontendPatient.status || 'ativo',
    
    // Autorização
    plano_saude: frontendPatient.plano_saude,
    abrangencia: frontendPatient.abrangencia,
    numero_carteirinha: frontendPatient.numero_carteirinha,

    // Saúde
    stage: frontendPatient.stage,
    treatment: frontendPatient.treatment,

    // Contato do prestador
    setor_prestador: frontendPatient.setor_prestador,

    // Contato de emergência
    contato_emergencia_nome: frontendPatient.contato_emergencia_nome,
    contato_emergencia_telefone: frontendPatient.contato_emergencia_telefone,

    // Endereço desmembrado
    endereco_rua: frontendPatient.endereco_rua,
    endereco_numero: frontendPatient.endereco_numero,
    endereco_complemento: frontendPatient.endereco_complemento,
    endereco_bairro: frontendPatient.endereco_bairro,
    endereco_cidade: frontendPatient.endereco_cidade,
    endereco_estado: frontendPatient.endereco_estado,
    endereco_cep: frontendPatient.endereco_cep,

    // Medidas (normalizar para número)
    peso: frontendPatient.peso ? parseFloat(String(frontendPatient.peso).replace(',', '.')) : undefined,
    altura: frontendPatient.altura ? parseFloat(String(frontendPatient.altura).replace(',', '.')) : undefined,
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
    sortBy?: string;
    statusFilter?: string;
    cidFilter?: string;
    protocoloFilter?: string;
    operadoraFilter?: string;
  }): Promise<{ data: any[]; pagination: any }> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString()); 
      if (params?.search) queryParams.append('search', params.search);
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.statusFilter) queryParams.append('statusFilter', params.statusFilter);
      if (params?.cidFilter) queryParams.append('cidFilter', params.cidFilter);
      if (params?.protocoloFilter) queryParams.append('protocoloFilter', params.protocoloFilter);
      if (params?.operadoraFilter) queryParams.append('operadoraFilter', params.operadoraFilter);
      
      const url = `${API_BASE_URL}/pacientes?${queryParams.toString()}`;
      console.log('🔧 Fazendo requisição para:', url);
      
      const response = await authorizedFetch(url);
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
      const response = await authorizedFetch(`${API_BASE_URL}/pacientes/${id}`);
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
      
      const response = await authorizedFetch(`${API_BASE_URL}/pacientes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiPatient),
      });
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.error('❌ Resposta não OK ao criar paciente:', response.status, response.statusText, errorText);
        throw new Error(errorText || `HTTP ${response.status}: ${response.statusText}`);
      }

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
      
      const response = await authorizedFetch(`${API_BASE_URL}/pacientes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiPatient),
      });
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.error('❌ Resposta não OK ao atualizar paciente:', response.status, response.statusText, errorText);
        throw new Error(errorText || `HTTP ${response.status}: ${response.statusText}`);
      }

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

// ============= NOVO: SERVIÇO DE SOLICITAÇÕES =============

export class SolicitacaoService {
  
  // Criar nova solicitação
  static async criarSolicitacao(solicitacao: Partial<SolicitacaoFromAPI>): Promise<SolicitacaoFromAPI> {
    try {
      console.log('🔧 Criando solicitação:', solicitacao);
      
      const response = await authorizedFetch(`${API_BASE_URL}/solicitacoes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(solicitacao),
      });
      
      console.log('🔧 Response status:', response.status);
      console.log('🔧 Response headers:', response.headers);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro HTTP:', response.status, response.statusText);
        console.error('❌ Response body:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }
      
      const result: ApiResponse<SolicitacaoFromAPI> = await response.json();
      
      if (!result.success) {
        console.error('❌ Erro na resposta da API:', result);
        throw new Error(result.message || 'Erro ao criar solicitação');
      }
      
      console.log('✅ Solicitação criada:', result.data);
      return result.data!;
    } catch (error) {
      console.error('❌ Erro ao criar solicitação:', error);
      throw error;
    }
  }
  
  // Listar solicitações
  static async listarSolicitacoes(params?: {
    page?: number;
    limit?: number;
    clinica_id?: number;
  }): Promise<{ data: SolicitacaoFromAPI[]; pagination: any }> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.clinica_id) queryParams.append('clinica_id', params.clinica_id.toString());
      
      const url = `${API_BASE_URL}/solicitacoes?${queryParams.toString()}`;
      console.log('🔧 Listando solicitações:', url);
      
      const response = await authorizedFetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result: ApiResponse<PaginatedResponse<SolicitacaoFromAPI>> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao listar solicitações');
      }
      
      return {
        data: result.data!.data,
        pagination: result.data!.pagination
      };
    } catch (error) {
      console.error('❌ Erro ao listar solicitações:', error);
      throw error;
    }
  }
  
  // Buscar solicitação por ID
  static async buscarSolicitacao(id: number): Promise<SolicitacaoFromAPI> {
    try {
      const response = await authorizedFetch(`${API_BASE_URL}/solicitacoes/${id}`);
      const result: ApiResponse<SolicitacaoFromAPI> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao buscar solicitação');
      }
      
      return result.data!;
    } catch (error) {
      console.error('❌ Erro ao buscar solicitação:', error);
      throw error;
    }
  }
  
  // Gerar PDF da solicitação
  static async gerarPDF(id: number): Promise<Blob> {
    try {
      console.log('🔧 Gerando PDF para solicitação:', id);
      
      const response = await authorizedFetch(`${API_BASE_URL}/solicitacoes/${id}/pdf`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      console.log('✅ PDF gerado com sucesso');
      return blob;
    } catch (error) {
      console.error('❌ Erro ao gerar PDF:', error);
      throw error;
    }
  }
  
  // 🆕 NOVA FUNÇÃO: Visualizar PDF em nova aba (método mais compatível)
  static async viewPDF(id: number): Promise<void> {
    try {
      console.log('🔧 Abrindo PDF para visualização:', id);
      
      // Primeiro tentar gerar o blob e abrir
      try {
        const blob = await this.gerarPDF(id);
        const blobUrl = URL.createObjectURL(blob);
        
        const newWindow = window.open(blobUrl, '_blank');
        
        if (!newWindow) {
          throw new Error('Pop-up bloqueado. Permita pop-ups para visualizar o PDF.');
        }
        
        // Cleanup após um tempo
        setTimeout(() => {
          URL.revokeObjectURL(blobUrl);
        }, 60000); // 1 minuto
        
        console.log('✅ PDF aberto via blob');
        return;
      } catch (blobError) {
        console.warn('⚠️  Erro com blob, tentando URL direta:', blobError);
        
        // Fallback para URL direta
        const pdfUrl = `${API_BASE_URL}/solicitacoes/${id}/pdf?view=true`;
        const newWindow = window.open(pdfUrl, '_blank');
        
        if (!newWindow) {
          throw new Error('Pop-up bloqueado. Permita pop-ups para visualizar o PDF.');
        }
        
        console.log('✅ PDF aberto via URL direta');
      }
    } catch (error) {
      console.error('❌ Erro ao visualizar PDF:', error);
      throw error;
    }
  }

  // 🆕 FUNÇÃO MELHORADA: Obter URL do PDF com fallback
  static getPDFViewUrl(id: number): string {
    return `${API_BASE_URL}/solicitacoes/${id}/pdf?view=true&inline=true&t=${Date.now()}`;
  }

  // 🆕 NOVA FUNÇÃO: Verificar se PDF existe
  static async checkPDFExists(id: number): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/solicitacoes/${id}`, {
        method: 'HEAD'
      });
      return response.ok;
    } catch (error) {
      console.error('Erro ao verificar se PDF existe:', error);
      return false;
    }
  }

  // Fazer download do PDF
  static async downloadPDF(id: number, nomeArquivo?: string): Promise<void> {
    try {
      const blob = await this.gerarPDF(id);
      
      // Criar URL temporária para o blob
      const url = window.URL.createObjectURL(blob);
      
      // Criar elemento de link temporário para download
      const link = document.createElement('a');
      link.href = url;
      link.download = nomeArquivo || `solicitacao_${id}.pdf`;
      
      // Adicionar ao DOM, clicar e remover
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpar URL temporária
      window.URL.revokeObjectURL(url);
      
      console.log('✅ Download do PDF iniciado');
    } catch (error) {
      console.error('❌ Erro ao fazer download do PDF:', error);
      throw error;
    }
  }
  
  // Atualizar status da solicitação
  static async atualizarStatus(id: number, status: string, observacoes?: string): Promise<SolicitacaoFromAPI> {
    try {
      const response = await authorizedFetch(`${API_BASE_URL}/solicitacoes/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, observacoes }),
      });
      
      const result: ApiResponse<SolicitacaoFromAPI> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao atualizar status');
      }
      
      return result.data!;
    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error);
      throw error;
    }
  }
  
  // Deletar solicitação
  static async deletarSolicitacao(id: number): Promise<void> {
    try {
      const response = await authorizedFetch(`${API_BASE_URL}/solicitacoes/${id}`, {
        method: 'DELETE',
      });
      
      const result: ApiResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao deletar solicitação');
      }
    } catch (error) {
      console.error('❌ Erro ao deletar solicitação:', error);
      throw error;
    }
  }
}

// ============= SERVIÇO DE PROTOCOLOS =============

// Interfaces para Protocolos
export interface ProtocoloFromAPI {
  id: number;
  clinica_id: number;
  nome: string;
  descricao?: string;
  cid?: string;
  intervalo_ciclos?: number;
  ciclos_previstos?: number;
  linha?: number;
  status: 'ativo' | 'inativo';
  medicamentos: MedicamentoFromAPI[];
  created_at?: string;
  updated_at?: string;
  clinica_nome?: string;
}

export interface MedicamentoFromAPI {
  id: number;
  protocolo_id: number;
  nome: string;
  dose?: string;
  unidade_medida?: string;
  via_adm?: string;
  dias_adm?: string;
  frequencia?: string;
  observacoes?: string;
  ordem?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProtocoloCreateInput {
  clinica_id: number;
  nome: string;
  descricao?: string;
  cid?: string;
  intervalo_ciclos?: number;
  ciclos_previstos?: number;
  linha?: number;
  status?: 'ativo' | 'inativo';
  medicamentos?: Omit<MedicamentoFromAPI, 'id' | 'protocolo_id' | 'created_at' | 'updated_at'>[];
}

export interface ProtocoloUpdateInput {
  nome?: string;
  descricao?: string;
  cid?: string;
  intervalo_ciclos?: number;
  ciclos_previstos?: number;
  linha?: number;
  status?: 'ativo' | 'inativo';
  medicamentos?: Omit<MedicamentoFromAPI, 'id' | 'protocolo_id' | 'created_at' | 'updated_at'>[];
}

export class ProtocoloService {
  
  // Listar protocolos
  static async listarProtocolos(params?: {
    page?: number;
    limit?: number;
    clinica_id?: number;
  }): Promise<{ data: ProtocoloFromAPI[]; pagination: any }> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.clinica_id) queryParams.append('clinica_id', params.clinica_id.toString());
      
      const url = `${API_BASE_URL}/protocolos?${queryParams.toString()}`;
      console.log('🔧 Listando protocolos:', url);
      
      const response = await authorizedFetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result: ApiResponse<PaginatedResponse<ProtocoloFromAPI>> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao listar protocolos');
      }
      
      return {
        data: result.data!.data,
        pagination: result.data!.pagination
      };
    } catch (error) {
      console.error('❌ Erro ao listar protocolos:', error);
      throw error;
    }
  }
  
  // Buscar protocolo por ID
  static async buscarProtocoloPorId(id: number): Promise<ProtocoloFromAPI> {
    try {
      const response = await authorizedFetch(`${API_BASE_URL}/protocolos/${id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result: ApiResponse<ProtocoloFromAPI> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao buscar protocolo');
      }
      
      return result.data!;
    } catch (error) {
      console.error('❌ Erro ao buscar protocolo:', error);
      throw error;
    }
  }
  
  // Criar protocolo
  static async criarProtocolo(protocolo: ProtocoloCreateInput): Promise<ProtocoloFromAPI> {
    try {
      console.log('🔧 Criando protocolo:', protocolo);
      
      const response = await authorizedFetch(`${API_BASE_URL}/protocolos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(protocolo),
      });
      
      const result: ApiResponse<ProtocoloFromAPI> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao criar protocolo');
      }
      
      console.log('✅ Protocolo criado:', result.data);
      return result.data!;
    } catch (error) {
      console.error('❌ Erro ao criar protocolo:', error);
      throw error;
    }
  }
  
  // Atualizar protocolo
  static async atualizarProtocolo(id: number, protocolo: ProtocoloUpdateInput): Promise<ProtocoloFromAPI> {
    try {
      console.log('🔧 Atualizando protocolo:', id, protocolo);
      
      const response = await authorizedFetch(`${API_BASE_URL}/protocolos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(protocolo),
      });
      
      const result: ApiResponse<ProtocoloFromAPI> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao atualizar protocolo');
      }
      
      console.log('✅ Protocolo atualizado:', result.data);
      return result.data!;
    } catch (error) {
      console.error('❌ Erro ao atualizar protocolo:', error);
      throw error;
    }
  }
  
  // Deletar protocolo
  static async deletarProtocolo(id: number): Promise<void> {
    try {
      console.log('🔧 Deletando protocolo:', id);
      
      const response = await authorizedFetch(`${API_BASE_URL}/protocolos/${id}`, {
        method: 'DELETE',
      });
      
      const result: ApiResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao deletar protocolo');
      }
      
      console.log('✅ Protocolo deletado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao deletar protocolo:', error);
      throw error;
    }
  }
  
  // Buscar protocolos por status
  static async buscarPorStatus(status: 'ativo' | 'inativo'): Promise<ProtocoloFromAPI[]> {
    try {
      const response = await authorizedFetch(`${API_BASE_URL}/protocolos/status/${status}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result: ApiResponse<ProtocoloFromAPI[]> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao buscar protocolos por status');
      }
      
      return result.data!;
    } catch (error) {
      console.error('❌ Erro ao buscar protocolos por status:', error);
      throw error;
    }
  }
  
  // Buscar protocolos por CID
  static async buscarPorCID(cid: string): Promise<ProtocoloFromAPI[]> {
    try {
      const response = await authorizedFetch(`${API_BASE_URL}/protocolos/cid/${encodeURIComponent(cid)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result: ApiResponse<ProtocoloFromAPI[]> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao buscar protocolos por CID');
      }
      
      return result.data!;
    } catch (error) {
      console.error('❌ Erro ao buscar protocolos por CID:', error);
      throw error;
    }
  }
}

// Função para testar se o backend está funcionando
export const testarConexaoBackend = async (): Promise<boolean> => {
  try {
    console.log('🔧 Testando conexão com backend...');
    
    // Se estiver em desenvolvimento e configurado para usar dados locais, retorna false
    if (config.IS_DEVELOPMENT && config.USE_LOCAL_DATA_IN_DEV) {
      console.log('ℹ️ Modo desenvolvimento: usando dados locais (backend não testado)');
      return false;
    }
    
    console.log('📍 URL de teste:', config.BACKEND_HEALTH_URL);
    
    const response = await fetch(config.BACKEND_HEALTH_URL);
    
    if (!response.ok) {
      console.log('ℹ️ Backend não disponível:', response.status, response.statusText);
      return false;
    }
    
    const result = await response.json();
    console.log('✅ Backend respondeu:', result);
    return result.success;
  } catch (error) {
    console.log('ℹ️ Backend não está respondendo, usando dados mockados:', error);
    return false;
  }
};


// Função para testar conexão com banco via API
export const testarConexaoBanco = async (): Promise<boolean> => {
  try {
    console.log('🔧 Testando conexão com banco via API...');
    console.log('📍 URL de teste:', `${config.API_BASE_URL}/test-db`);
    
    const response = await fetch(`${config.API_BASE_URL}/test-db`);
    
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

export class AuthService {
  static async recuperarSenha(email: string): Promise<boolean> {
    try {
      if (!email || !email.includes('@')) {
        throw new Error('E-mail inválido');
      }
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }
      const result: ApiResponse = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Não foi possível enviar o e-mail de recuperação');
      }
      return true;
    } catch (error) {
      console.error('❌ Erro ao recuperar senha:', error);
      throw error;
    }
  }
}

export interface NotificationItem {
  id: number;
  clinica_id: number;
  tipo: 'auth_created' | 'auth_status' | 'patient_created' | 'message' | 'system';
  titulo: string;
  mensagem: string;
  lida: boolean;
  created_at: string;
  // Metadados para navegação contextual
  paciente_id?: number;
  solicitacao_id?: number;
}

export class NotificationService {
  static async listar(params?: { clinica_id?: number; limit?: number }): Promise<NotificationItem[]> {
    try {
      const query = new URLSearchParams();
      if (params?.clinica_id) query.append('clinica_id', String(params.clinica_id));
      if (params?.limit) query.append('limit', String(params.limit));
      const response = await authorizedFetch(`${API_BASE_URL}/notificacoes?${query.toString()}`);
      if (response.status === 404) {
        // Backend remoto ainda não publicou notificações: retornar vazio
        return [];
      }
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(text || `HTTP ${response.status}: ${response.statusText}`);
      }
      const result: ApiResponse<NotificationItem[]> = await response.json();
      if (!result.success) throw new Error(result.message || 'Erro ao listar notificações');
      return result.data || [];
    } catch (err) {
      console.warn('⚠️ Falha ao listar notificações:', err);
      return [];
    }
  }

  static async marcarComoLida(id: number): Promise<boolean> {
    try {
      const response = await authorizedFetch(`${API_BASE_URL}/notificacoes/${id}/lida`, { method: 'POST' });
      if (!response.ok) return false;
      const result: ApiResponse = await response.json();
      return !!result.success;
    } catch {
      return false;
    }
  }

  static async marcarTodasComoLidas(params?: { clinica_id?: number }): Promise<boolean> {
    try {
      const response = await authorizedFetch(`${API_BASE_URL}/notificacoes/lidas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params || {}),
      });
      if (!response.ok) return false;
      const result: ApiResponse = await response.json();
      return !!result.success;
    } catch {
      return false;
    }
  }
}

export interface CatalogCidItem {
  codigo: string;
  descricao: string;
}

export interface CatalogPrincipioAtivoItem {
  nome: string;
}

export const CatalogService = {
  async searchCid10(search: string, limit: number = 50): Promise<CatalogCidItem[]> {
    try {
      const url = new URL(`${API_BASE_URL}/catalog/cid10`, window.location.origin);
      if (search) url.searchParams.set('search', search);
      url.searchParams.set('limit', String(limit));
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result: ApiResponse<CatalogCidItem[]> = await res.json();
      return result.data || [];
    } catch (e) {
      console.warn('⚠️ Falha ao buscar CID-10:', e);
      return [];
    }
  },
  async searchPrincipiosAtivos(search: string, limit: number = 50): Promise<CatalogPrincipioAtivoItem[]> {
    try {
      const url = new URL(`${API_BASE_URL}/catalog/principios-ativos`, window.location.origin);
      if (search) url.searchParams.set('search', search);
      url.searchParams.set('limit', String(limit));
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result: ApiResponse<any> = await res.json();
      // Backend retorna array de strings, converter para objetos com propriedade 'nome'
      const data = result.data || [];
      if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'string') {
        return data.map((nome: string) => ({ nome }));
      }
      return data;
    } catch (e) {
      console.warn('⚠️ Falha ao buscar Princípios Ativos:', e);
      return [];
    }
  },
  async searchCid10Paged(params: { search: string; limit: number; offset: number }): Promise<{ items: CatalogCidItem[]; total: number; }> {
    try {
      const url = new URL(`${API_BASE_URL}/catalog/cid10`, window.location.origin);
      if (params.search) url.searchParams.set('search', params.search);
      url.searchParams.set('limit', String(params.limit));
      url.searchParams.set('offset', String(params.offset));
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result: any = await res.json();
      return { items: result.data || [], total: result.total || 0 };
    } catch (e) {
      console.warn('⚠️ Falha ao buscar CID-10 (paged):', e);
      return { items: [], total: 0 };
    }
  },
  async searchPrincipiosAtivosPaged(params: { search: string; limit: number; offset: number }): Promise<{ items: CatalogPrincipioAtivoItem[]; total: number; }> {
    try {
      const queryParams = new URLSearchParams();
      if (params.search) queryParams.set('search', params.search);
      queryParams.set('limit', String(params.limit));
      queryParams.set('offset', String(params.offset));
      
      const url = `${API_BASE_URL}/catalog/principios-ativos?${queryParams.toString()}`;
      console.log('🔧 Buscando princípios ativos:', url);
      
      const res = await fetch(url);
      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ Erro HTTP:', res.status, errorText);
        throw new Error(`HTTP ${res.status}`);
      }
      
      const result: any = await res.json();
      console.log('✅ Princípios ativos recebidos:', result.total, 'total');
      
      // Backend retorna array de strings, converter para objetos com propriedade 'nome'
      const data = result.data || [];
      let items: CatalogPrincipioAtivoItem[] = [];
      if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'string') {
        items = data.map((nome: string) => ({ nome }));
      } else {
        items = data;
      }
      return { items, total: result.total || data.length };
    } catch (e) {
      console.warn('⚠️ Falha ao buscar Princípios Ativos (paged):', e);
      return { items: [], total: 0 };
    }
  }
};