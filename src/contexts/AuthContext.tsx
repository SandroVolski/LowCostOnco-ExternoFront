import React, { createContext, useEffect, useState, useContext, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AuthService, TokenStore, UserStore, type AuthUser } from '@/services/authService';

export type UserRole = 'clinic' | 'operator' | 'healthPlan' | 'admin' | null;

type User = AuthUser;

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string, skipNavigation?: boolean) => Promise<boolean>;
  logout: () => void;
  navigateToDashboard: () => void;
  isAuthenticated: boolean;
  initializing: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => UserStore.get());
  const [initializing, setInitializing] = useState<boolean>(true);
  
  const navigate = useNavigate();
  
  const login = async (username: string, password: string, skipNavigation = false): Promise<boolean> => {
    try {
      // Primeiro tentar login real com a API
      try {
        const loggedUser = await AuthService.login(username, password);
        setUser(loggedUser);
        toast.success('Login realizado com sucesso!');
        if (!skipNavigation) navigate('/dashboard');
        return true;
      } catch (apiError) {
        console.warn('API de login falhou, tentando dados mock:', apiError);
        
        // Se API falhar, tentar dados mock como fallback
        const mockUsers = [
          {
            id: 1,
            username: 'admin',
            password: '123456',
            nome: 'Administrador',
            email: 'admin@clinica.com',
            role: 'admin' as const
          },
          {
            id: 2,
            username: 'clinica',
            password: '123456',
            nome: 'Clínica Teste',
            email: 'clinica@teste.com',
            role: 'clinic' as const
          }
        ];

        // Verificar credenciais mock como fallback
        const mockUser = mockUsers.find(u => u.username === username && u.password === password);
        
        if (mockUser) {
          const userData = {
            id: mockUser.id,
            username: mockUser.username,
            nome: mockUser.nome,
            email: mockUser.email,
            role: mockUser.role
          };
          
          // Simular tokens
          const mockToken = `mock_token_${Date.now()}`;
          const mockRefreshToken = `mock_refresh_${Date.now()}`;
          
          localStorage.setItem('access_token', mockToken);
          localStorage.setItem('refresh_token', mockRefreshToken);
          localStorage.setItem('user', JSON.stringify(userData));
          
          setUser(userData);
          toast.success('Login realizado com sucesso! (Modo offline)');
          if (!skipNavigation) navigate('/dashboard');
          return true;
        }

        // Se nem API nem mock funcionaram
        toast.error('Credenciais inválidas');
        return false;
      }
    } catch (err: any) {
      toast.error(err?.message || 'Falha no login');
      return false;
    }
  };

  const navigateToDashboard = () => {
    navigate('/dashboard');
  };

  const logout = async () => {
    try {
      await AuthService.logout();
    } catch (error) {
      console.error('Erro no logout do AuthService:', error);
    }
    
    // Limpeza completa do cache da clínica
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    
    // Limpeza adicional de possíveis dados residuais
    localStorage.removeItem('operadora_access_token');
    localStorage.removeItem('operadora_refresh_token');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    
    // Limpar sessionStorage também
    sessionStorage.clear();
    
    // Resetar estado
    setUser(null);
    
    // Navegar para login
    navigate('/');
    toast.success('Logout realizado com sucesso!');
  };

  // Ao iniciar, se tiver refresh/access token, tenta validar perfil
  useEffect(() => {
    const init = async () => {
      // Verificar se há usuário no localStorage (para operadoras)
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setInitializing(false);
          return;
        } catch (error) {
          console.error('Erro ao parsear usuário do localStorage:', error);
        }
      }
      
      if (TokenStore.getAccess()) {
        try {
          const me = await AuthService.me();
          setUser(me);
        } catch {
          await AuthService.logout();
          setUser(null);
        }
      }
      setInitializing(false);
    };
    init();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        navigateToDashboard,
        isAuthenticated: !!user,
        initializing,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};