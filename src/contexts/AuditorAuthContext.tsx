import React, { createContext, useEffect, useState, useContext, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AuditorService, type Auditor } from '@/services/auditorService';

interface AuditorAuthContextType {
  auditor: Auditor | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  initializing: boolean;
}

const AuditorAuthContext = createContext<AuditorAuthContextType | undefined>(undefined);

export const AuditorAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [auditor, setAuditor] = useState<Auditor | null>(() => AuditorService.getAuditorData());
  const [initializing, setInitializing] = useState<boolean>(true);

  const navigate = useNavigate();

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const result = await AuditorService.login(username, password);
      setAuditor(result.auditor);
      toast.success('Login realizado com sucesso!');
      navigate('/auditor/dashboard');
      return true;
    } catch (err: any) {
      toast.error(err?.message || 'Falha no login');
      return false;
    }
  };

  const logout = () => {
    AuditorService.logout();
    setAuditor(null);
    navigate('/');
    toast.success('Logout realizado com sucesso!');
  };

  // Ao iniciar, verificar se há token válido
  useEffect(() => {
    const init = async () => {
      if (AuditorService.isAuthenticated()) {
        const auditorData = AuditorService.getAuditorData();
        if (auditorData) {
          setAuditor(auditorData);
        } else {
          // Token existe mas dados não, fazer logout
          AuditorService.logout();
        }
      }
      setInitializing(false);
    };
    init();
  }, []);

  return (
    <AuditorAuthContext.Provider
      value={{
        auditor,
        login,
        logout,
        isAuthenticated: !!auditor,
        initializing,
      }}
    >
      {children}
    </AuditorAuthContext.Provider>
  );
};

export const useAuditorAuth = (): AuditorAuthContextType => {
  const context = useContext(AuditorAuthContext);

  if (context === undefined) {
    throw new Error('useAuditorAuth must be used within an AuditorAuthProvider');
  }

  return context;
};
