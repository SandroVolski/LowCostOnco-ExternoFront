import config from '@/config/environment';

export type AuthRole = 'clinic' | 'operator' | 'healthPlan' | 'admin';

export interface AuthUser {
  id: number;
  username: string;
  role: AuthRole;
  clinica_id?: number | null;
}

export interface ClinicLoginResponse {
  success: boolean;
  message?: string;
  data?: {
    token: string;
    clinic: { id: number; nome?: string } & Record<string, any>;
  };
}

const STORAGE_KEYS = {
  access: 'authAccessToken',
  user: 'lcoUser',
};

export const TokenStore = {
  getAccess(): string | null { 
    // Verificar primeiro o token padrão, depois o token da operadora
    const defaultToken = localStorage.getItem(STORAGE_KEYS.access);
    if (defaultToken) return defaultToken;
    
    const operadoraToken = localStorage.getItem('operadora_access_token');
    if (operadoraToken) return operadoraToken;
    
    return null;
  },
  set(accessToken: string) {
    localStorage.setItem(STORAGE_KEYS.access, accessToken);
  },
  clear() {
    localStorage.removeItem(STORAGE_KEYS.access);
    localStorage.removeItem('operadora_access_token');
  }
};

export const UserStore = {
  get(): AuthUser | null {
    const raw = localStorage.getItem(STORAGE_KEYS.user);
    try { return raw ? JSON.parse(raw) as AuthUser : null; } catch { return null; }
  },
  set(user: AuthUser) { localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user)); },
  clear() { localStorage.removeItem(STORAGE_KEYS.user); }
};

function isApiUrl(url: string): boolean {
  try {
    const full = new URL(url, window.location.origin).toString();
    const base = new URL(config.API_BASE_URL, window.location.origin).toString();
    return full.startsWith(base);
  } catch {
    return false;
  }
}

export const AuthService = {
  async login(username: string, password: string): Promise<AuthUser> {
    const res = await fetch(`${config.API_BASE_URL}/clinicas/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario: username, senha: password })
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(text || `Falha no login (HTTP ${res.status})`);
    }
    const json: ClinicLoginResponse = await res.json();
    if (!json.success || !json.data) throw new Error(json.message || 'Login inválido');
    const { token, clinic } = json.data;
    TokenStore.set(token);
    const authUser: AuthUser = {
      id: clinic.id,
      username: clinic.nome || username,
      role: 'clinic',
      clinica_id: clinic.id,
    };
    UserStore.set(authUser);
    return authUser;
  },

  async me(): Promise<AuthUser> {
    const res = await fetch(`${config.API_BASE_URL}/clinicas/profile`, { headers: AuthService.authHeader() });
    if (!res.ok) throw new Error(`Falha ao obter perfil (HTTP ${res.status})`);
    const json: { success: boolean; data?: { clinica?: { id: number; nome?: string } } & Record<string, any> } = await res.json();
    if (!json.success || !json.data) throw new Error('Perfil inválido');
    const clinica = (json.data as any).clinica || json.data;
    const authUser: AuthUser = {
      id: clinica.id,
      username: clinica.nome || 'Clínica',
      role: 'clinic',
      clinica_id: clinica.id,
    };
    UserStore.set(authUser);
    return authUser;
  },

  async logout(): Promise<void> {
    try {
      if (TokenStore.getAccess()) {
        await fetch(`${config.API_BASE_URL}/auth/logout`, { method: 'POST', headers: AuthService.authHeader() });
      }
    } catch {}
    TokenStore.clear();
    UserStore.clear();
  },

  authHeader(): HeadersInit {
    const token = TokenStore.getAccess();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },

  // Utilitário: adiciona Authorization quando a URL é da API
  withAuthHeaders(init?: RequestInit): RequestInit {
    const headers = new Headers(init?.headers || {});
    const access = TokenStore.getAccess();
    if (access) headers.set('Authorization', `Bearer ${access}`);
    return { ...init, headers };
  },
};

export async function authorizedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  // Acrescenta Authorization para chamadas da API e tenta um refresh em 401
  const urlStr = typeof input === 'string' ? input : (input as URL).toString();
  const shouldAuth = isApiUrl(urlStr);
  const initWithAuth = shouldAuth ? AuthService.withAuthHeaders(init) : (init || {});

  let response = await fetch(input, initWithAuth);
  if (response.status !== 401) return response;
  // Sem refresh: se 401, efetua logout e redireciona para login
  if (shouldAuth) {
    await AuthService.logout();
    window.location.href = '/';
  }
  return response;
}


