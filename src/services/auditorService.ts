import config from '@/config/environment';

export interface Auditor {
  id: number;
  nome: string;
  email: string;
  username: string;
  registro_profissional: string;
  especialidade: string;
}

export interface RecursoGlosaAuditor {
  id: number;
  guia_id: number;
  lote_id: number;
  clinica_id: number;
  clinica_nome: string;
  operadora_registro_ans: string;
  operadora_nome: string;
  numero_guia_prestador: string;
  numero_guia_operadora: string;
  numero_carteira: string;
  justificativa: string;
  motivos_glosa: string;
  valor_guia: number;
  status_recurso: string;
  status_pagamento: string;
  numero_lote: string;
  competencia: string;
  data_envio_clinica: string;
  total_documentos: number;
  total_historico: number;
  created_at: string;
  updated_at: string;
}

export interface Parecer {
  parecer_tecnico: string;
  recomendacao: 'aprovar' | 'negar' | 'solicitar_documentos' | 'parcial';
  valor_recomendado?: number;
  justificativa_tecnica?: string;
  cids_analisados?: string[];
  procedimentos_analisados?: string[];
  tempo_analise_minutos?: number;
}

export interface MensagemChat {
  id: number;
  recurso_glosa_id: number;
  tipo_remetente: 'operadora' | 'auditor';
  remetente_id: number;
  remetente_nome: string;
  mensagem: string;
  anexos?: any;
  lida: boolean;
  data_leitura?: string;
  created_at: string;
}

export class AuditorService {
  private static getAuthHeaders() {
    const token = localStorage.getItem('auditor_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  static async login(username: string, password: string) {
    const response = await fetch(`${config.API_BASE_URL}/auditor/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao fazer login');
    }

    const result = await response.json();

    if (result.success && result.data.token) {
      // Salvar token e dados do auditor
      localStorage.setItem('auditor_token', result.data.token);
      localStorage.setItem('auditor_data', JSON.stringify(result.data.auditor));
      return result.data;
    }

    throw new Error('Resposta inválida do servidor');
  }

  static logout() {
    localStorage.removeItem('auditor_token');
    localStorage.removeItem('auditor_data');
  }

  static getAuditorData(): Auditor | null {
    const data = localStorage.getItem('auditor_data');
    return data ? JSON.parse(data) : null;
  }

  static isAuthenticated(): boolean {
    return !!localStorage.getItem('auditor_token');
  }

  static async getDashboard() {
    const response = await fetch(`${config.API_BASE_URL}/auditor/dashboard`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Erro ao carregar dashboard');
    }

    const result = await response.json();
    return result.data;
  }

  static async listarRecursos(status?: string) {
    const url = status
      ? `${config.API_BASE_URL}/auditor/recursos?status=${status}`
      : `${config.API_BASE_URL}/auditor/recursos`;

    const response = await fetch(url, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Erro ao listar recursos');
    }

    const result = await response.json();
    return result.data as RecursoGlosaAuditor[];
  }

  static async buscarRecurso(id: number) {
    const response = await fetch(`${config.API_BASE_URL}/auditor/recursos/${id}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar recurso');
    }

    const result = await response.json();
    return result.data;
  }

  static async emitirParecer(id: number, parecer: Parecer) {
    const response = await fetch(`${config.API_BASE_URL}/auditor/recursos/${id}/parecer`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(parecer)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao emitir parecer');
    }

    const result = await response.json();
    return result;
  }

  static async listarMensagens(id: number): Promise<MensagemChat[]> {
    const response = await fetch(`${config.API_BASE_URL}/auditor/recursos/${id}/chat`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Erro ao listar mensagens');
    }

    const result = await response.json();
    return result.data;
  }

  static async enviarMensagem(id: number, mensagem: string, anexos?: any) {
    const response = await fetch(`${config.API_BASE_URL}/auditor/recursos/${id}/chat`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ mensagem, anexos })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao enviar mensagem');
    }

    const result = await response.json();
    return result;
  }
}
