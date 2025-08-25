// Configuração de ambiente para detectar automaticamente se está em desenvolvimento ou produção

import { PRODUCTION_CONFIG, getApiUrl, isProduction, log } from './production';

interface EnvironmentConfig {
  API_BASE_URL: string;
  BACKEND_HEALTH_URL: string;
  IS_PRODUCTION: boolean;
  IS_DEVELOPMENT: boolean;
  USE_LOCAL_DATA_IN_DEV: boolean;
}

// Detectar o ambiente
const isProd = isProduction();
const isDev = !isProd;

// Configuração baseada no ambiente
const config: EnvironmentConfig = {
  API_BASE_URL: isProd 
    ? getApiUrl(PRODUCTION_CONFIG.API_BASE_URL) // Produção: usa URL da API
    : '/api', // Desenvolvimento: usar proxy do Vite
  
  BACKEND_HEALTH_URL: isProd
    ? getApiUrl(PRODUCTION_CONFIG.BACKEND_HEALTH_URL) // Produção: health endpoint
    : '/health', // Desenvolvimento: usar proxy do Vite
  
  IS_PRODUCTION: isProd,
  IS_DEVELOPMENT: isDev,
  
  // Em desenvolvimento, você pode forçar o uso de dados locais
  // para evitar tentativas de conexão com backend inexistente
  USE_LOCAL_DATA_IN_DEV: false, // Alterado para false para usar backend local
};

// Log da configuração para debug
log('info', 'Configuração de ambiente carregada', {
  hostname: window.location.hostname,
  protocol: window.location.protocol,
  port: window.location.port,
  isProduction: config.IS_PRODUCTION,
  isDevelopment: config.IS_DEVELOPMENT,
  useLocalDataInDev: config.USE_LOCAL_DATA_IN_DEV,
  apiUrl: config.API_BASE_URL,
  healthUrl: config.BACKEND_HEALTH_URL,
});

export default config; 