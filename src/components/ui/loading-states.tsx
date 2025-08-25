// src/components/ui/loading-states.tsx
// Componentes de loading melhorados com diferentes estados

import React from 'react';
import { Loader2, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <Loader2 
      className={cn(
        'animate-spin text-primary',
        sizeClasses[size],
        className
      )} 
    />
  );
};

interface LoadingStateProps {
  loading: boolean;
  error: Error | null;
  isBackendAvailable: boolean;
  onRetry?: () => void;
  children: React.ReactNode;
  loadingText?: string;
  errorText?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  loading,
  error,
  isBackendAvailable,
  onRetry,
  children,
  loadingText = 'Carregando...',
  errorText = 'Erro ao carregar dados',
  className
}) => {
  if (loading) {
    return (
      <div className={cn(
        'flex flex-col items-center justify-center py-12 space-y-4',
        className
      )}>
        <LoadingSpinner size="lg" />
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground">
            {loadingText}
          </p>
          {!isBackendAvailable && (
            <p className="text-xs text-orange-600 mt-1">
              Modo offline - usando dados locais
            </p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(
        'flex flex-col items-center justify-center py-12 space-y-4',
        className
      )}>
        <div className="flex items-center gap-2 text-destructive">
          <WifiOff className="h-8 w-8" />
          <span className="text-lg font-medium">Sem Conexão</span>
        </div>
        <div className="text-center max-w-md">
          <p className="text-sm text-muted-foreground mb-4">
            Não foi possível conectar ao servidor. Verifique sua conexão ou tente novamente.
          </p>
          {onRetry && (
            <Button 
              onClick={onRetry}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar Novamente
            </Button>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

interface ConnectionStatusProps {
  isBackendAvailable: boolean;
  lastCheck: number;
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isBackendAvailable,
  lastCheck,
  className
}) => {
  const getStatusText = () => {
    if (isBackendAvailable === null) return 'Verificando conexão...';
    if (isBackendAvailable) return 'Conectado';
    return 'Desconectado';
  };

  const getStatusColor = () => {
    if (isBackendAvailable === null) return 'text-yellow-600';
    if (isBackendAvailable) return 'text-green-600';
    return 'text-red-600';
  };

  return (
    <div className={cn(
      'flex items-center gap-2 text-xs',
      className
    )}>
      <div className={cn(
        'flex items-center gap-1',
        getStatusColor()
      )}>
        {isBackendAvailable === null && <LoadingSpinner size="sm" />}
        {isBackendAvailable === true && <Wifi className="h-3 w-3" />}
        {isBackendAvailable === false && <WifiOff className="h-3 w-3" />}
        <span>{getStatusText()}</span>
      </div>
    </div>
  );
};

interface SkeletonProps {
  className?: string;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className, 
  count = 1 
}) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'animate-pulse bg-muted rounded-md',
            className || 'h-4 w-full'
          )}
        />
      ))}
    </div>
  );
};

interface CardSkeletonProps {
  className?: string;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({ className }) => {
  return (
    <div className={cn(
      'border border-border rounded-lg p-6 space-y-4',
      className
    )}>
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-muted rounded-full animate-pulse" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-muted rounded animate-pulse" />
          <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-muted rounded animate-pulse" />
        <div className="h-3 bg-muted rounded animate-pulse w-4/5" />
        <div className="h-3 bg-muted rounded animate-pulse w-3/5" />
      </div>
    </div>
  );
}; 