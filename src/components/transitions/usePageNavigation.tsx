import { useCallback } from 'react';
import { usePageTransition } from './PageTransitionContext';

export const usePageNavigation = () => {
  const { startTransition, isTransitioning } = usePageTransition();

  const navigateWithTransition = useCallback((to: string, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
    }
    
    if (!isTransitioning) {
      startTransition(to);
    }
  }, [startTransition, isTransitioning]);

  return {
    navigateWithTransition,
    isTransitioning,
  };
};