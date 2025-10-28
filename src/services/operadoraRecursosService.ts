import config from '@/config/environment';

export interface RecursoGlosaOperadora {
  id: number;
  guia_id: number;
  lote_id: number;
  clinica_id: number;
  clinica_nome: string;
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
  auditor_id?: number;
  auditor_nome?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditorInfo {
  id: number;
  nome: string;
  email: string;
  registro_profissional: string;
  especialidade: string;
}

export interface DashboardOperadoraRecursos {
  total_recursos: number;
  aguardando_analise: number;
  em_analise: number;
  com_parecer: number;
  deferidos: number;
  indeferidos: number;
  recursos_recentes: RecursoGlosaOperadora[];
}

export class OperadoraRecursosService {
  private static getAuthHeaders() {
    const token = localStorage.getItem('operadora_access_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  static async getDashboard(): Promise<DashboardOperadoraRecursos> {
    const response = await fetch(`${config.API_BASE_URL}/operadora/recursos-glosas/dashboard`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Erro ao carregar dashboard');
    }

    const result = await response.json();
    return result.data;
  }

  static async listarRecursos(status?: string): Promise<RecursoGlosaOperadora[]> {
    const url = status
      ? `${config.API_BASE_URL}/operadora/recursos-glosas/recursos?status=${status}`
      : `${config.API_BASE_URL}/operadora/recursos-glosas/recursos`;

    const response = await fetch(url, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Erro ao listar recursos');
    }

    const result = await response.json();
    return result.data;
  }

  static async buscarRecurso(id: number) {
    const response = await fetch(`${config.API_BASE_URL}/operadora/recursos-glosas/recursos/${id}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar recurso');
    }

    const result = await response.json();
    return result.data;
  }

  static async receberRecurso(id: number) {
    const response = await fetch(`${config.API_BASE_URL}/operadora/recursos-glosas/recursos/${id}/receber`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao receber recurso');
    }

    return await response.json();
  }

  static async aprovarRecurso(id: number, observacao?: string) {
    const response = await fetch(`${config.API_BASE_URL}/operadora/recursos-glosas/recursos/${id}/aprovar`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ observacao })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao aprovar recurso');
    }

    return await response.json();
  }

  static async negarRecurso(id: number, motivo: string) {
    const response = await fetch(`${config.API_BASE_URL}/operadora/recursos-glosas/recursos/${id}/negar`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ motivo })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao negar recurso');
    }

    return await response.json();
  }

  static async solicitarParecer(id: number, auditorId: number, observacao?: string) {
    const response = await fetch(`${config.API_BASE_URL}/operadora/recursos-glosas/recursos/${id}/solicitar-parecer`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        auditor_id: auditorId,
        observacao
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao solicitar parecer');
    }

    return await response.json();
  }

  static async listarAuditores(): Promise<AuditorInfo[]> {
    const response = await fetch(`${config.API_BASE_URL}/operadora/recursos-glosas/auditores`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Erro ao listar auditores');
    }

    const result = await response.json();
    return result.data;
  }

  static async enviarMensagem(id: number, mensagem: string) {
    const response = await fetch(`${config.API_BASE_URL}/operadora/recursos-glosas/recursos/${id}/chat`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ mensagem })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao enviar mensagem');
    }

    return await response.json();
  }

  static async listarMensagens(id: number) {
    const response = await fetch(`${config.API_BASE_URL}/operadora/recursos-glosas/recursos/${id}/chat`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Erro ao listar mensagens');
    }

    const result = await response.json();
    return result.data;
  }
}
