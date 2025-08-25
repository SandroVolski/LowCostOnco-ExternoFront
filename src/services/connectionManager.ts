// src/services/connectionManager.ts
// Gerenciador de conexão com retry automático, cache e fallback
import React from 'react';
import config from '@/config/environment';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live em milissegundos
}

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

class ConnectionManager {
  private cache = new Map<string, CacheItem<any>>();
  private pendingRequests = new Map<string, Promise<any>>();
  private isBackendAvailable: boolean | null = null;
  private lastBackendCheck = 0;
  private backendCheckInterval = 30000; // 30 segundos

  private defaultRetryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
  };

  // Verificar se o backend está disponível
  async checkBackendAvailability(): Promise<boolean> {
    const now = Date.now();
    
    // Se já verificamos recentemente, retorna o resultado em cache
    if (this.isBackendAvailable !== null && (now - this.lastBackendCheck) < this.backendCheckInterval) {
      return this.isBackendAvailable;
    }

    try {
      // Usar o endpoint de health configurado (funciona no proxy e em produção)
      const response = await fetch(`${config.BACKEND_HEALTH_URL}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000) // 5 segundos timeout
      });

      this.isBackendAvailable = response.ok;
      this.lastBackendCheck = now;
      
      console.log(`🔍 Backend ${this.isBackendAvailable ? 'disponível' : 'indisponível'}`);
      return this.isBackendAvailable;
    } catch (error) {
      // Não logar erro se for a primeira verificação ou se já sabemos que está indisponível
      if (this.isBackendAvailable === null) {
        console.log('🔍 Verificando conectividade com o backend...');
      }
      this.isBackendAvailable = false;
      this.lastBackendCheck = now;
      return false;
    }
  }

  // Função com retry automático
  async withRetry<T>(
    operation: () => Promise<T>,
    retryConfig: Partial<RetryConfig> = {}
  ): Promise<T> {
    const config = { ...this.defaultRetryConfig, ...retryConfig };
    let lastError: Error;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === config.maxRetries) {
          console.error(`❌ Falha após ${config.maxRetries + 1} tentativas:`, error);
          throw lastError;
        }

        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffMultiplier, attempt),
          config.maxDelay
        );

        console.warn(`⚠️ Tentativa ${attempt + 1} falhou, tentando novamente em ${delay}ms...`);
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  // Cache com TTL
  getFromCache<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  setCache<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void { // 5 minutos padrão
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  // Debounce de requisições
  async debouncedRequest<T>(
    key: string,
    operation: () => Promise<T>,
    ttl: number = 5 * 60 * 1000
  ): Promise<T> {
    // Verificar cache primeiro
    const cached = this.getFromCache<T>(key);
    if (cached) {
      console.log(`📦 Dados carregados do cache: ${key}`);
      return cached;
    }

    // Verificar se já há uma requisição pendente
    if (this.pendingRequests.has(key)) {
      console.log(`⏳ Aguardando requisição pendente: ${key}`);
      return this.pendingRequests.get(key)!;
    }

    // Criar nova requisição
    const requestPromise = this.withRetry(async () => {
      const result = await operation();
      this.setCache(key, result, ttl);
      return result;
    });

    this.pendingRequests.set(key, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      this.pendingRequests.delete(key);
    }
  }

  // Limpar cache
  clearCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  // Sleep utility
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Obter status da conexão
  getConnectionStatus(): { isBackendAvailable: boolean | null; lastCheck: number } {
    return {
      isBackendAvailable: this.isBackendAvailable,
      lastCheck: this.lastBackendCheck
    };
  }
}

// Instância singleton
export const connectionManager = new ConnectionManager();

// Hooks para React
export const useConnectionStatus = () => {
  const [status, setStatus] = React.useState(connectionManager.getConnectionStatus());

  React.useEffect(() => {
    const checkStatus = async () => {
      await connectionManager.checkBackendAvailability();
      setStatus(connectionManager.getConnectionStatus());
    };

    checkStatus();
    
    // Verificar periodicamente
    const interval = setInterval(checkStatus, 30000); // 30 segundos
    
    return () => clearInterval(interval);
  }, []);

  return status;
}; 