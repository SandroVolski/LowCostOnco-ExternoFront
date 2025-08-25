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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => UserStore.get());
  
  const navigate = useNavigate();
  
  const login = async (username: string, password: string, skipNavigation = false): Promise<boolean> => {
    try {
      const loggedUser = await AuthService.login(username, password);
      setUser(loggedUser);
      toast.success('Login realizado com sucesso!');
      if (!skipNavigation) navigate('/dashboard');
      return true;
    } catch (err: any) {
      toast.error(err?.message || 'Falha no login');
      return false;
    }
  };

  const navigateToDashboard = () => {
    navigate('/dashboard');
  };

  const logout = async () => {
    await AuthService.logout();
    setUser(null);
    navigate('/');
    toast.success('Logout realizado com sucesso!');
  };

  // Ao iniciar, se tiver refresh/access token, tenta validar perfil
  useEffect(() => {
    const init = async () => {
      if (TokenStore.getAccess() || TokenStore.getRefresh()) {
        try {
          const me = await AuthService.me();
          setUser(me);
        } catch {
          await AuthService.logout();
          setUser(null);
        }
      }
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