import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface PageTransitionContextType {
  isTransitioning: boolean;
  currentPage: string;
  nextPage: string | null;
  startTransition: (to: string) => void;
}

const PageTransitionContext = createContext<PageTransitionContextType | undefined>(undefined);

export const usePageTransition = () => {
  const context = useContext(PageTransitionContext);
  if (!context) {
    throw new Error('usePageTransition must be used within PageTransitionProvider');
  }
  return context;
};

interface PageTransitionProviderProps {
  children: ReactNode;
}

export const PageTransitionProvider: React.FC<PageTransitionProviderProps> = ({ children }) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentPage, setCurrentPage] = useState('');
  const [nextPage, setNextPage] = useState<string | null>(null);
  const navigate = useNavigate();

  const startTransition = useCallback((to: string) => {
    if (isTransitioning) return;

    setNextPage(to);
    setIsTransitioning(true);

    // Start animation
    setTimeout(() => {
      // Navigate to new page
      navigate(to);
      setCurrentPage(to);
    }, 1500);

    // End animation
    setTimeout(() => {
      setIsTransitioning(false);
      setNextPage(null);
    }, 3200);
  }, [isTransitioning, navigate]);

  return (
    <PageTransitionContext.Provider
      value={{
        isTransitioning,
        currentPage,
        nextPage,
        startTransition,
      }}
    >
      {children}
    </PageTransitionContext.Provider>
  );
};