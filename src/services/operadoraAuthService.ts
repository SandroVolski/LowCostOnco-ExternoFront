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
};


