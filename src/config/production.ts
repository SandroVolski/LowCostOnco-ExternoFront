// Configuração específica para produção na Hostinger

export const PRODUCTION_CONFIG = {
  // URLs da API em produção
  API_BASE_URL: 'https://apisistema.onkhos.com/api', // URL específica da API
  BACKEND_HEALTH_URL: 'https://apisistema.onkhos.com/health', // Endpoint de health
  
  // Configurações de timeout
  REQUEST_TIMEOUT: 30000, // 30 segundos
  
  // Configurações de retry
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 segundo
  
  // Configurações de cache
  CACHE_TTL: 5 * 60 * 1000, // 5 minutos
  
  // Configurações de debug
  DEBUG_MODE: false,
  LOG_LEVEL: 'error', // 'debug', 'info', 'warn', 'error'
};

// Função para obter a URL completa da API
export const getApiUrl = (endpoint: string): string => {
  // Se a URL já for completa (com protocolo), retorna como está
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  // Caso contrário, usa o domínio atual
  const baseUrl = window.location.origin;
  return `${baseUrl}${endpoint}`;
};

// Função para verificar se está em produção
export const isProduction = (): boolean => {
  const hostname = window.location.hostname;
  const port = window.location.port;
  
  // Em desenvolvimento local
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return false;
  }
  
  // Se estiver na porta 8080 (Vite dev server), é desenvolvimento
  if (port === '8080') {
    return false;
  }
  
  // Se não for localhost e não estiver na porta 8080, é produção
  return true;
};

// Função para log condicional (só em desenvolvimento)
export const log = (level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any) => {
  if (!isProduction() || PRODUCTION_CONFIG.DEBUG_MODE) {
    switch (level) {
      case 'debug':
        console.debug(`🔍 ${message}`, data);
        break;
      case 'info':
        console.info(`ℹ️ ${message}`, data);
        break;
      case 'warn':
        console.warn(`⚠️ ${message}`, data);
        break;
      case 'error':
        console.error(`❌ ${message}`, data);
        break;
    }
  }
}; 