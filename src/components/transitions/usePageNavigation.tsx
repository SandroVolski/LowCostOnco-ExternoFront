import { usePageNavigation } from '@/components/transitions/PageTransitionContext';

const MyComponent = () => {
  const { navigateWithTransition, isTransitioning } = usePageNavigation();
  
  const handleClick = () => {
    navigateWithTransition('/patients');
  };
  
  return (
    <button onClick={handleClick} disabled={isTransitioning}>
      Ir para Pacientes
    </button>
  );
};