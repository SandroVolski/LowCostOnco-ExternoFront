import React, { ReactNode } from 'react';
import { usePageNavigation } from './PageTransitionContext';
import { cn } from '@/lib/utils';

interface TransitionLinkProps {
  to: string;
  children: ReactNode;
  className?: string;
  onClick?: (event: React.MouseEvent) => void;
}

export const TransitionLink: React.FC<TransitionLinkProps> = ({ 
  to, 
  children, 
  className,
  onClick 
}) => {
  const { navigateWithTransition, isTransitioning } = usePageNavigation();

  const handleClick = (event: React.MouseEvent) => {
    if (onClick) {
      onClick(event);
    }
    navigateWithTransition(to, event);
  };

  return (
    <a
      href={to}
      onClick={handleClick}
      className={cn(
        "cursor-pointer transition-all duration-300",
        isTransitioning && "pointer-events-none opacity-50",
        className
      )}
    >
      {children}
    </a>
  );
};