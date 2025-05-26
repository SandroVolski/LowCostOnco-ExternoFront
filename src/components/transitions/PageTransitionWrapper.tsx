import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { usePageTransition } from '@/components/transitions/PageTransitionContext';
import { cn } from '@/lib/utils';
import './PageTransition.css';

interface PageTransitionWrapperProps {
  children: React.ReactNode;
}

const getPageColorClass = (pathname: string): string => {
  const pathMap: Record<string, string> = {
    '/dashboard': 'page-transition-dashboard',
    '/patients': 'page-transition-patients',
    '/reports': 'page-transition-reports',
    '/recursos-glosas': 'page-transition-recursos-glosas',
    '/analysis': 'page-transition-analysis',
    '/expenses': 'page-transition-expenses',
    '/chat': 'page-transition-chat',
  };
  
  return pathMap[pathname] || 'page-transition-dashboard';
};

export const PageTransitionWrapper: React.FC<PageTransitionWrapperProps> = ({ children }) => {
  const location = useLocation();
  const { isTransitioning } = usePageTransition();
  const [showContent, setShowContent] = useState(true);
  const [currentColorClass, setCurrentColorClass] = useState(getPageColorClass(location.pathname));
  
  useEffect(() => {
    if (isTransitioning) {
      // Hide content at the start of transition
      setShowContent(false);
      
      // Show content after animation midpoint
      const showTimer = setTimeout(() => {
        setShowContent(true);
        setCurrentColorClass(getPageColorClass(location.pathname));
      }, 750);
      
      return () => clearTimeout(showTimer);
    } else {
      setShowContent(true);
    }
  }, [isTransitioning, location.pathname]);
  
  // Don't apply transition wrapper to login page
  if (location.pathname === '/') {
    return <>{children}</>;
  }
  
  return (
    <div 
      className={cn(
        'page-transition-wrapper',
        currentColorClass,
        isTransitioning && 'page-transition-animate'
      )}
    >
      <div 
        className={cn(
          'page-transition-content',
          !showContent && 'page-transition-fadeOut',
          showContent && 'page-transition-fadeIn'
        )}
      >
        {children}
      </div>
    </div>
  );
};