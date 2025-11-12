import config from '@/config/environment';

const API_BASE_URL = config.API_BASE_URL;

export interface AuditorLoginInput {
  username: string;
  password: string;
}

export interface AuditorAuthResponse {
  success: boolean;
  token: string;
  auditor: {
    id: number;
    nome: string;
    email: string;
    username: string;
    especialidade?: string;
  };
}

export interface AuditorRefreshResponse {
  success: boolean;
  token: string;
}

export interface AuditorUserResponse {
  success: boolean;
  auditor: {
    id: number;
    nome: string;
    email: string;
    username: string;
    especialidade?: string;
  };
}

export const auditorAuthService = {
  async login(username: string, password: string): Promise<AuditorAuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auditor/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro no login');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Erro no AuditorAuthService.login():', error);
      throw error;
    }
  },

  async refreshToken(refreshToken: string): Promise<AuditorRefreshResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auditor/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Erro ao renovar token');
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Erro no AuditorAuthService.refreshToken():', error);
      throw error;
    }
  },

  async getCurrentUser(): Promise<AuditorUserResponse['auditor'] | null> {
    try {
      const token = localStorage.getItem('auditor_token');
      if (!token) return null;

      const response = await fetch(`${API_BASE_URL}/auditor/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Token inválido');
      }

      const data = await response.json();
      return data.auditor;
    } catch (error) {
      console.error('❌ Erro no AuditorAuthService.getCurrentUser():', error);
      return null;
    }
  },

  async logout(): Promise<void> {
    try {
      const refreshToken = localStorage.getItem('auditor_refresh_token');
      if (refreshToken) {
        await fetch(`${API_BASE_URL}/auditor/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch (error) {
      console.error('❌ Erro no AuditorAuthService.logout():', error);
    }
  },

  // Método para fazer requisições autenticadas
  async authorizedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const accessToken = localStorage.getItem('auditor_token');

    if (!accessToken) {
      console.error('❌ Token de acesso não encontrado no localStorage');
      throw new Error('Token de acesso não encontrado');
    }

    const headers = new Headers(init?.headers || {});
    headers.set('Authorization', `Bearer ${accessToken}`);

    const response = await fetch(input, {
      ...init,
      headers
    });

    // Verificar se a resposta é HTML em vez de JSON
    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.includes('application/json')) {
      // Retornar null em vez de lançar erro para permitir fallback
      return null;
    }

    // Se receber 500, lançar erro para mostrar mensagem correta
    if (response.status === 500) {
      const errorText = await response.text().catch(() => 'Erro interno do servidor');
      throw new Error(`Erro 500: ${errorText}`);
    }

    // Se receber 401 ou 403, tentar renovar o token
    if (response.status === 401 || response.status === 403) {
      try {
        const refreshSuccess = await this.refreshToken(localStorage.getItem('auditor_refresh_token') || '');
        if (refreshSuccess.success) {
          // ✅ SALVAR O NOVO TOKEN NO LOCALSTORAGE
          localStorage.setItem('auditor_token', refreshSuccess.token);

          // Tentar novamente com o novo token
          const newHeaders = new Headers(init?.headers || {});
          newHeaders.set('Authorization', `Bearer ${refreshSuccess.token}`);

          return fetch(input, {
            ...init,
            headers: newHeaders
          });
        }
      } catch (error) {
        console.error('❌ Erro ao renovar token:', error);
        // Se não conseguir renovar, redirecionar para login
        localStorage.removeItem('auditor_token');
        localStorage.removeItem('auditor_refresh_token');
        localStorage.removeItem('auditor_data');
        window.location.href = '/auditor/login';
      }
    }

    return response;
  }
};
