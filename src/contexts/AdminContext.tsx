import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface AdminUser {
  username: string;
  role: string;
  isSpecialAdmin: boolean;
}

interface AdminContextType {
  isAdmin: boolean;
  isSpecialAdmin: boolean;
  adminUser: AdminUser | null;
  loginAdmin: (username: string, password: string) => boolean;
  logoutAdmin: () => void;
  checkSpecialAdminAccess: () => boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    const stored = localStorage.getItem('adminUser');
    return stored ? JSON.parse(stored) : null;
  });

  const isAdmin = !!adminUser;
  const isSpecialAdmin = adminUser?.isSpecialAdmin || false;

  useEffect(() => {
    if (adminUser) {
      localStorage.setItem('adminUser', JSON.stringify(adminUser));
    } else {
      localStorage.removeItem('adminUser');
    }
  }, [adminUser]);

  const loginAdmin = (username: string, password: string) => {
    if (username === 'OnkhosGlobal' && password === 'Douglas193') {
      const specialAdmin: AdminUser = {
        username: 'OnkhosGlobal',
        role: 'admin',
        isSpecialAdmin: true
      };
      setAdminUser(specialAdmin);
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setAdminUser(null);
    localStorage.removeItem('adminUser');
    localStorage.removeItem('adminToken');
  };

  const checkSpecialAdminAccess = () => {
    const stored = localStorage.getItem('adminUser');
    if (stored) {
      const user = JSON.parse(stored);
      return user.isSpecialAdmin === true;
    }
    return false;
  };

  return (
    <AdminContext.Provider value={{ 
      isAdmin, 
      isSpecialAdmin, 
      adminUser, 
      loginAdmin, 
      logoutAdmin, 
      checkSpecialAdminAccess 
    }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = (): AdminContextType => {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}; 