import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import './LoginTransition.css';

interface LoginTransitionProps {
  isVisible: boolean;
  onComplete: () => void;
}

const LoginTransition = ({ isVisible, onComplete }: LoginTransitionProps) => {
  const [phase, setPhase] = useState<'loading' | 'loaded' | 'new-page'>('loading');

  useEffect(() => {
    if (!isVisible) return;

    const timers: NodeJS.Timeout[] = [];

    // Phase 1: Loading (1.7s)
    timers.push(setTimeout(() => {
      setPhase('loaded');
    }, 1700));

    // Phase 2: New page transition (250ms after loaded)
    timers.push(setTimeout(() => {
      setPhase('new-page');
    }, 1950));

    // Phase 3: Complete (500ms after new-page)
    timers.push(setTimeout(() => {
      onComplete();
    }, 2450));

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div className={cn(
      "transition-wrapper",
      phase === 'loaded' && 'loaded',
      phase === 'new-page' && 'loaded new-page'
    )}>

      {/* Loader Container */}
      <div className="container">
        <svg className="loader" viewBox="0 0 100 100" overflow="visible">
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