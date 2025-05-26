import React, { ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { usePageTransition } from './PageTransitionContext';
import { cn } from '@/lib/utils';
import './PageTransition.css';

interface PageTransitionLayoutProps {
  children: ReactNode;
  pageColor?: string;
}

// Mapeamento de cores para as páginas
const pageColors: Record<string, string> = {
  '/dashboard': 'bg-primary-green',
  '/patients': 'bg-support-teal',
  '/reports': 'bg-support-yellow',
  '/analysis': 'bg-highlight-peach',
  '/expenses': 'bg-support-green',
  '/chat': 'bg-primary-gray',
  '/': 'bg-primary-green', // login
};

const PageTransitionLayout: React.FC<PageTransitionLayoutProps> = ({ children, pageColor }) => {
  const location = useLocation();
  const { isTransitioning } = usePageTransition();
  const [showContent, setShowContent] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  // Determina a cor da página baseada na rota
  const currentPageColor = pageColor || pageColors[location.pathname] || 'bg-primary-green';

  useEffect(() => {
    // Quando começar a transição, esconde o conteúdo
    if (isTransitioning) {
      setShowContent(false);
      // Depois de 2.8s, mostra o conteúdo novamente
      const showTimer = setTimeout(() => {
        setShowContent(true);
      }, 2800);
      return () => clearTimeout(showTimer);
    }
  }, [isTransitioning]);

  useEffect(() => {
    // Delay para o fadeIn da página
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div 
      className={cn(
        "page-transition-container",
        currentPageColor,
        isTransitioning && "animate-content",
        isVisible && "fade-in"
      )}
    >
      <div className={cn(
        "page-content",
        !showContent && "opacity-0"
      )}>
        {children}
      </div>
      
      {/* Overlay para efeito visual durante a transição */}
      {isTransitioning && (
        <div className="transition-overlay" />
      )}
    </div>
  );
};

export default PageTransitionLayout;