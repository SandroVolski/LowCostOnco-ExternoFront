
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export type UserRole = 'clinic' | 'operator' | 'healthPlan' | null;

interface User {
  username: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('lcoUser');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  
  const navigate = useNavigate();
  
  // Hardcoded credentials as specified in the requirements
  const validCredentials = [
    { username: 'LCOClínica', password: 'LowCostC2025', role: 'clinic' as UserRole },
    { username: 'LCOOperadora', password: 'LowCostO2025', role: 'operator' as UserRole },
    { username: 'LCOPlanoSaude', password: 'LowCostPS2025', role: 'healthPlan' as UserRole },
  ];

  const login = async (username: string, password: string): Promise<boolean> => {
    const matchedUser = validCredentials.find(
      (cred) => cred.username === username && cred.password === password
    );

    if (matchedUser) {
      const userData = {
        username: matchedUser.username,
        role: matchedUser.role,
      };
      
      setUser(userData);
      localStorage.setItem('lcoUser', JSON.stringify(userData));
      
      toast.success('Login realizado com sucesso!');
      navigate('/dashboard');
      return true;
    } else {
      toast.error('Credenciais inválidas. Por favor tente novamente.');
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('lcoUser');
    navigate('/');
    toast.success('Logout realizado com sucesso!');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
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
