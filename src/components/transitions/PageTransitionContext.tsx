import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface PageTransitionContextType {
  isTransitioning: boolean;
  nextPath: string | null;
  startTransition: (path: string) => void;
  completeTransition: () => void;
}

const PageTransitionContext = createContext<PageTransitionContextType | undefined>(undefined);

export const usePageTransition = () => {
  const context = useContext(PageTransitionContext);
  if (!context) {
    throw new Error('usePageTransition must be used within PageTransitionProvider');
  }
  return context;
};

export const PageTransitionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [nextPath, setNextPath] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const startTransition = useCallback((path: string) => {
    // Don't transition if we're already on the same path
    if (path === location.pathname) return;
    
    // Don't transition from login page
    if (location.pathname === '/') return;
    
    // Add class to body to prevent scrolling
    document.body.classList.add('page-transitioning');
    
    setIsTransitioning(true);
    setNextPath(path);
    
    // Start the transition
    setTimeout(() => {
      navigate(path);
    }, 750); // Navigate halfway through the animation
    
    // Complete the transition
    setTimeout(() => {
      setIsTransitioning(false);
      setNextPath(null);
      document.body.classList.remove('page-transitioning');
    }, 1500);
  }, [navigate, location.pathname]);

  const completeTransition = useCallback(() => {
    setIsTransitioning(false);
    setNextPath(null);
    document.body.classList.remove('page-transitioning');
  }, []);

  return (
    <PageTransitionContext.Provider value={{ isTransitioning, nextPath, startTransition, completeTransition }}>
      {children}
    </PageTransitionContext.Provider>
  );
};

// Hook to use page navigation with transition
export const usePageNavigation = () => {
  const { startTransition, isTransitioning } = usePageTransition();
  const navigate = useNavigate();
  const location = useLocation();

  const navigateWithTransition = useCallback((path: string, event?: React.MouseEvent) => {
    // Prevent default if event is provided (for anchor tags)
    if (event) {
      event.preventDefault();
    }
    
    // Use regular navigation for login page or if already on the same page
    if (location.pathname === '/' || location.pathname === path) {
      navigate(path);
    } else {
      startTransition(path);
    }
  }, [navigate, startTransition, location.pathname]);

  return { navigateWithTransition, isTransitioning };
};