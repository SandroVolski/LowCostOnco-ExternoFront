// src/hooks/useDataLoader.ts
// Hook personalizado para carregamento de dados com retry e fallback

import { useState, useEffect, useCallback } from 'react';
import { connectionManager } from '@/services/connectionManager';
import { toast } from 'sonner';

interface UseDataLoaderOptions<T> {
  key: string;
  loader: () => Promise<T>;
  fallback?: () => T | null;
  ttl?: number; // Time to live em milissegundos
  retryConfig?: {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
  };
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
}

interface UseDataLoaderResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  isBackendAvailable: boolean;
}

export function useDataLoader<T>({
  key,
  loader,
  fallback,
  ttl = 5 * 60 * 1000, // 5 minutos
  retryConfig,
  onSuccess,
  onError,
  showToast = true
}: UseDataLoaderOptions<T>): UseDataLoaderResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isBackendAvailable, setIsBackendAvailable] = useState<boolean>(true);

  const loadData = useCallback(async (useCache = true) => {
    try {
      setLoading(true);
      setError(null);

      // Verificar disponibilidade do backend
      const backendAvailable = await connectionManager.checkBackendAvailability();
      setIsBackendAvailable(backendAvailable);

      if (!backendAvailable && fallback) {
        // Usar fallback se backend não estiver disponível
        const fallbackData = fallback();
        if (fallbackData) {
          setData(fallbackData);
          if (showToast) {
            toast.info('Modo offline ativo', {
              description: 'Usando dados salvos localmente'
            });
          }
          return;
        }
      }

      // Carregar dados com cache e retry
      const result = await connectionManager.debouncedRequest(
        key,
        loader,
        useCache ? ttl : 0 // Se não usar cache, TTL = 0
      );

      setData(result);
      onSuccess?.(result);

      if (showToast && backendAvailable) {
        toast.success('Conectado ao servidor', {
          description: 'Dados sincronizados com sucesso'
        });
      }

    } catch (err) {
      const error = err as Error;
      setError(error);
      onError?.(error);

      if (showToast) {
        toast.error('Erro ao carregar dados', {
          description: error.message
        });
      }

      // Tentar fallback em caso de erro
      if (fallback) {
        const fallbackData = fallback();
        if (fallbackData) {
          setData(fallbackData);
          if (showToast) {
            toast.info('Usando dados do cache local', {
              description: 'Erro na conexão com o servidor'
            });
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }, [key, loader, fallback, ttl, retryConfig, onSuccess, onError, showToast]);

  const refetch = useCallback(async () => {
    await loadData(false); // Não usar cache no refetch
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    loading,
    error,
    refetch,
    isBackendAvailable
  };
}

// Hook para operações de escrita (POST, PUT, DELETE)
export function useDataMutation<T, R>(
  mutation: (data: T) => Promise<R>,
  options: {
    onSuccess?: (result: R) => void;
    onError?: (error: Error) => void;
    showToast?: boolean;
    invalidateCache?: string[]; // Chaves de cache para invalidar
  } = {}
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async (data: T): Promise<R | null> => {
    try {
      setLoading(true);
      setError(null);

      const result = await connectionManager.withRetry(() => mutation(data));
      
      options.onSuccess?.(result);
      
      if (options.showToast !== false) {
        toast.success('Operação realizada com sucesso');
      }

      // Invalidar cache se especificado
      if (options.invalidateCache) {
        options.invalidateCache.forEach(key => {
          connectionManager.clearCache(key);
        });
      }

      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      options.onError?.(error);

      if (options.showToast !== false) {
        toast.error('Erro na operação', {
          description: error.message
        });
      }

      return null;
    } finally {
      setLoading(false);
    }
  }, [mutation, options]);

  return {
    execute,
    loading,
    error
  };
} 