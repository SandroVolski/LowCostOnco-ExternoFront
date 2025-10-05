import config from '@/config/environment';

const API_BASE_URL = config.API_BASE_URL;

export interface OperadoraLoginInput {
  email: string;
  password: string;
}

export interface OperadoraAuthResponse {
  success: boolean;
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    nome: string;
    email: string;
    username?: string;
    role: 'operadora_admin' | 'operadora_user';
    operadora_id: number;
    operadora: {
      id: number;
      nome: string;
      codigo: string;
    };
  };
}

export interface OperadoraRefreshResponse {
  success: boolean;
  accessToken: string;
}

export interface OperadoraUserResponse {
  success: boolean;
  user: {
    id: number;
    nome: string;
    email: string;
    username?: string;
    role: 'operadora_admin' | 'operadora_user';
    operadora_id: number;
    operadora: {
      id: number;
      nome: string;
      codigo: string;
    };
  };
}

export const operadoraAuthService = {
  async login(email: string, password: string): Promise<OperadoraAuthResponse> {
    try {
      console.log('🔧 OperadoraAuthService.login() iniciado');
      console.log('🔧 API_BASE_URL:', API_BASE_URL);
      
      const response = await fetch(`${API_BASE_URL}/operadora-auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro no login');
      }

      const data = await response.json();
      console.log('✅ Login da operadora realizado com sucesso');
      return data;
    } catch (error) {
      console.error('❌ Erro no OperadoraAuthService.login():', error);
      throw error;
    }
  },

  async refreshToken(refreshToken: string): Promise<OperadoraRefreshResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/operadora-auth/refresh`, {
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
      console.error('❌ Erro no OperadoraAuthService.refreshToken():', error);
      throw error;
    }
  },

  async getCurrentUser(): Promise<OperadoraUserResponse['user'] | null> {
    try {
      const token = localStorage.getItem('operadora_access_token');
      if (!token) return null;

      const response = await fetch(`${API_BASE_URL}/operadora-auth/me`, {
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
      return data.user;
    } catch (error) {
      console.error('❌ Erro no OperadoraAuthService.getCurrentUser():', error);
      return null;
    }
  },

  async logout(): Promise<void> {
    try {
      const refreshToken = localStorage.getItem('operadora_refresh_token');
      if (refreshToken) {
        await fetch(`${API_BASE_URL}/operadora-auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch (error) {
      console.error('❌ Erro no OperadoraAuthService.logout():', error);
    }
  },

  // Método para fazer requisições autenticadas
  async authorizedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const accessToken = localStorage.getItem('operadora_access_token');
    
    if (!accessToken) {
      console.error('❌ Token de acesso não encontrado no localStorage');
      console.log('🔧 localStorage keys:', Object.keys(localStorage));
      throw new Error('Token de acesso não encontrado');
    }

    console.log('🔧 operadoraAuthService.authorizedFetch - Token:', accessToken.substring(0, 20) + '...');
    console.log('🔧 operadoraAuthService.authorizedFetch - URL:', input);

    const headers = new Headers(init?.headers || {});
    headers.set('Authorization', `Bearer ${accessToken}`);

    const response = await fetch(input, {
      ...init,
      headers
    });

    console.log('🔧 operadoraAuthService.authorizedFetch - Status:', response.status);
    
    // Verificar se a resposta é HTML em vez de JSON
    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.includes('application/json')) {
      console.log('ℹ️ Backend retornou HTML, usando fallback');
      // Retornar null em vez de lançar erro para permitir fallback
      return null;
    }

    // Se receber 500, lançar erro para mostrar mensagem correta
    if (response.status === 500) {
      console.log('❌ Backend com erro 500');
      const errorText = await response.text().catch(() => 'Erro interno do servidor');
      throw new Error(`Erro 500: ${errorText}`);
    }

    // Se receber 401 ou 403, tentar renovar o token
    if (response.status === 401 || response.status === 403) {
      console.log('🔧 operadoraAuthService.authorizedFetch - Token expirado, tentando renovar...');
      try {
        const refreshSuccess = await this.refreshToken(localStorage.getItem('operadora_refresh_token') || '');
        if (refreshSuccess.success) {
          console.log('✅ operadoraAuthService.authorizedFetch - Token renovado com sucesso');
          
          // ✅ SALVAR O NOVO TOKEN NO LOCALSTORAGE
          localStorage.setItem('operadora_access_token', refreshSuccess.accessToken);
          
          // Tentar novamente com o novo token
          const newHeaders = new Headers(init?.headers || {});
          newHeaders.set('Authorization', `Bearer ${refreshSuccess.accessToken}`);
          
          return fetch(input, {
            ...init,
            headers: newHeaders
          });
        }
      } catch (error) {
        console.error('❌ Erro ao renovar token:', error);
        // Se não conseguir renovar, redirecionar para login
        localStorage.removeItem('operadora_access_token');
        localStorage.removeItem('operadora_refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/';
      }
    }

    return response;
  }
};


