import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface AdminContextType {
	isAdmin: boolean;
	loginAdmin: (secret: string) => boolean;
	logoutAdmin: () => void;
	adminSecret: string | null;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
	const [adminSecret, setAdminSecret] = useState<string | null>(() => localStorage.getItem('onkhosAdminSecret'));
	const isAdmin = !!adminSecret;

	useEffect(() => {
		if (adminSecret) localStorage.setItem('onkhosAdminSecret', adminSecret);
		else localStorage.removeItem('onkhosAdminSecret');
	}, [adminSecret]);

	const loginAdmin = (secret: string) => {
		if (!secret || secret.trim().length < 6) return false;
		setAdminSecret(secret.trim());
		return true;
	};
	const logoutAdmin = () => setAdminSecret(null);

	return (
		<AdminContext.Provider value={{ isAdmin, loginAdmin, logoutAdmin, adminSecret }}>
			{children}
		</AdminContext.Provider>
	);
};

export const useAdmin = (): AdminContextType => {
	const ctx = useContext(AdminContext);
	if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
	return ctx;
}; 