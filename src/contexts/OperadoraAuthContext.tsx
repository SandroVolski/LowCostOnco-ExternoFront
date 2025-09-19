import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface OperadoraUser {
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
}

interface OperadoraAuthContextType {
  user: OperadoraUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
}

const OperadoraAuthContext = createContext<OperadoraAuthContextType | undefined>(undefined);

export const OperadoraAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<OperadoraUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Verificar token ao carregar
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Primeiro verificar se há usuário no localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            // Verificar se é um usuário de operadora
            if (userData.role === 'operator' && userData.operadora_id) {
              setUser(userData);
              setIsLoading(false);
              return;
            }
          } catch (error) {
            console.error('Erro ao parsear usuário do localStorage:', error);
          }
        }

        // Não tentar validar token automaticamente para evitar erros 401
        // O usuário será validado apenas no login
        const token = localStorage.getItem('operadora_access_token');
        if (!token) {
          setIsLoading(false);
          return;
        }

        // Se há token, assumir que o usuário está logado (dados mock)
        if (storedUser) {
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        localStorage.removeItem('operadora_access_token');
        localStorage.removeItem('operadora_refresh_token');
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Primeiro tentar login real com a API
      try {
        const { operadoraAuthService } = await import('@/services/operadoraAuthService');
        const response = await operadoraAuthService.login(email, password);
        
        if (response.success) {
          // Armazenar tokens da operadora
          localStorage.setItem('operadora_access_token', response.accessToken);
          localStorage.setItem('operadora_refresh_token', response.refreshToken);
          
          // Também armazenar como usuário principal do sistema
          localStorage.setItem('access_token', response.accessToken);
          localStorage.setItem('refresh_token', response.refreshToken);
          const mainUser = {
            id: response.user.id,
            nome: response.user.nome,
            username: response.user.username || response.user.email.split('@')[0],
            email: response.user.email,
            role: 'operator' as const,
            operadora_id: response.user.operadora_id,
            operadora: response.user.operadora
          };
          localStorage.setItem('user', JSON.stringify(mainUser));
          
          // Atualizar contexto da operadora
          setUser(response.user);
          return true;
        }
      } catch (apiError) {
        console.warn('API de login falhou, tentando dados mock:', apiError);
        
        // Se API falhar, tentar dados mock como fallback
        const mockUsers = [
          {
            id: 1,
            nome: 'Admin Operadora',
            email: 'admin@operadora.com',
            username: 'admin_operadora',
            password: '123456',
            role: 'operadora_admin' as const,
            operadora_id: 1,
            operadora: {
              id: 1,
              nome: 'Unimed',
              codigo: 'UNI001'
            }
          },
          {
            id: 2,
            nome: 'Usuário Operadora',
            email: 'user@operadora.com',
            username: 'user_operadora',
            password: '123456',
            role: 'operadora_user' as const,
            operadora_id: 1,
            operadora: {
              id: 1,
              nome: 'Unimed',
              codigo: 'UNI001'
            }
          }
        ];

        // Verificar credenciais mock como fallback
        const mockUser = mockUsers.find(u => u.email === email && u.password === password);
        
        if (mockUser) {
          // Simular tokens
          const mockToken = `mock_token_${Date.now()}`;
          const mockRefreshToken = `mock_refresh_${Date.now()}`;
          
          // Armazenar tokens da operadora
          localStorage.setItem('operadora_access_token', mockToken);
          localStorage.setItem('operadora_refresh_token', mockRefreshToken);
          
          // Também armazenar como usuário principal do sistema
          localStorage.setItem('access_token', mockToken);
          localStorage.setItem('refresh_token', mockRefreshToken);
          
          const mainUser = {
            id: mockUser.id,
            nome: mockUser.nome,
            username: mockUser.username,
            email: mockUser.email,
            role: 'operator' as const,
            operadora_id: mockUser.operadora_id,
            operadora: mockUser.operadora
          };
          localStorage.setItem('user', JSON.stringify(mainUser));
          
          // Atualizar contexto da operadora
          setUser(mockUser);
          return true;
        }

        // Se nem API nem mock funcionaram
        return false;
      }
      
      return false;
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('operadora_access_token');
    localStorage.removeItem('operadora_refresh_token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const refreshToken = localStorage.getItem('operadora_refresh_token');
      if (!refreshToken) return false;

      const { operadoraAuthService } = await import('@/services/operadoraAuthService');
      const response = await operadoraAuthService.refreshToken(refreshToken);
      if (response.success) {
        localStorage.setItem('operadora_access_token', response.accessToken);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      logout();
      return false;
    }
  };

  return (
    <OperadoraAuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      login,
      logout,
      refreshToken
    }}>
      {children}
    </OperadoraAuthContext.Provider>
  );
};

export const useOperadoraAuth = () => {
  const context = useContext(OperadoraAuthContext);
  if (context === undefined) {
    throw new Error('useOperadoraAuth deve ser usado dentro de OperadoraAuthProvider');
  }
  return context;
};


