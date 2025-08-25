import config from '@/config/environment';

export type AuthRole = 'clinic' | 'operator' | 'healthPlan' | 'admin';

export interface AuthUser {
  id: number;
  username: string;
  role: AuthRole;
  clinica_id?: number | null;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  data?: {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
  };
}

const STORAGE_KEYS = {
  access: 'authAccessToken',
  refresh: 'authRefreshToken',
  user: 'lcoUser',
};

export const TokenStore = {
  getAccess(): string | null { return localStorage.getItem(STORAGE_KEYS.access); },
  getRefresh(): string | null { return localStorage.getItem(STORAGE_KEYS.refresh); },
  set(accessToken: string, refreshToken: string) {
    localStorage.setItem(STORAGE_KEYS.access, accessToken);
    localStorage.setItem(STORAGE_KEYS.refresh, refreshToken);
  },
  clear() {
    localStorage.removeItem(STORAGE_KEYS.access);
    localStorage.removeItem(STORAGE_KEYS.refresh);
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
    const res = await fetch(`${config.API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(text || `Falha no login (HTTP ${res.status})`);
    }
    const json: LoginResponse = await res.json();
    if (!json.success || !json.data) throw new Error(json.message || 'Login inválido');
    const { accessToken, refreshToken, user } = json.data;
    TokenStore.set(accessToken, refreshToken);
    UserStore.set(user);
    return user;
  },

  async refresh(): Promise<string> {
    const refreshToken = TokenStore.getRefresh();
    if (!refreshToken) throw new Error('Sem refresh token');
    const res = await fetch(`${config.API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    if (!res.ok) throw new Error(`Falha ao renovar token (HTTP ${res.status})`);
    const json: { success: boolean; data?: { accessToken: string } } = await res.json();
    if (!json.success || !json.data) throw new Error('Resposta inválida ao renovar');
    const newAccess = json.data.accessToken;
    const currentRefresh = TokenStore.getRefresh() || '';
    TokenStore.set(newAccess, currentRefresh);
    return newAccess;
  },

  async me(): Promise<AuthUser> {
    const res = await fetch(`${config.API_BASE_URL}/auth/me`, { headers: AuthService.authHeader() });
    if (!res.ok) throw new Error(`Falha ao obter perfil (HTTP ${res.status})`);
    const json: { success: boolean; data?: AuthUser } = await res.json();
    if (!json.success || !json.data) throw new Error('Perfil inválido');
    UserStore.set(json.data);
    return json.data;
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

  // Se 401 e é chamada da API, tentar 1x refresh e repetir
  if (shouldAuth) {
    try {
      await AuthService.refresh();
      const retryInit = AuthService.withAuthHeaders(init);
      response = await fetch(input, retryInit);
    } catch (err) {
      await AuthService.logout();
      throw err;
    }
  }

  return response;
}


