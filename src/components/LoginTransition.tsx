import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import './LoginTransition.css';

interface LoginTransitionProps {
  isVisible: boolean;
  onComplete: () => void;
}

const LoginTransition = ({ isVisible, onComplete }: LoginTransitionProps) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    // Inicia a animação após um pequeno delay
    const startTimer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);

    // Completa a transição após a animação terminar
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2500); // 2.5 segundos total

    return () => {
      clearTimeout(startTimer);
      clearTimeout(completeTimer);
    };
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div className={cn(
      "fixed inset-0 z-[9999] bg-background transition-opacity duration-500",
      isLoaded ? 'loaded' : ''
    )}>
      {/* Loader Container */}
      <div className="container">
        <svg className="loader" viewBox="0 0 100 100">
          <g className="core">
            <circle className="path" cx="50" cy="50" r="1" fill="none" />
          </g>
          <g className="spinner">
            <circle className="path" cx="50" cy="50" r="20" fill="none" />
          </g>
          <g className="layer-1">
            <circle className="path" cx="50" cy="50" r="70" fill="none" />
          </g>
          <g className="layer-2">
            <circle className="path" cx="50" cy="50" r="120" fill="none" />
          </g>
          <g className="layer-3">
            <circle className="path" cx="50" cy="50" r="180" fill="none" />
          </g>
          <g className="layer-4">
            <circle className="path" cx="50" cy="50" r="240" fill="none" />
          </g>
          <g className="layer-5">
            <circle className="path" cx="50" cy="50" r="300" fill="none" />
          </g>
          <g className="layer-6">
            <circle className="path" cx="50" cy="50" r="380" fill="none" />
          </g>
          <g className="layer-7">
            <circle className="path" cx="50" cy="50" r="450" fill="none" />
          </g>
          <g className="layer-8">
            <circle className="path" cx="50" cy="50" r="540" fill="none" />
          </g>
        </svg>
      </div>
    </div>
  );
};

export default LoginTransition;