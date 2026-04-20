import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import client from '../api/client';
import { LoginCredentials, LoginResponse, loginRestaurant } from '../api/authApi';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  outletId?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  accessTokenExpiresAt: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const ACCESS_TOKEN_KEY = 'hivago_access_token';
const REFRESH_TOKEN_KEY = 'hivago_refresh_token';
const USER_KEY = 'hivago_user';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [accessTokenExpiresAt, setAccessTokenExpiresAt] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const savedAccessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const savedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const savedExpiresAt = localStorage.getItem(`${ACCESS_TOKEN_KEY}_expires_at`);
    const savedUser = localStorage.getItem(USER_KEY);

    if (savedAccessToken) {
      console.log('[Auth] Restoring session from localStorage...');
      setAccessToken(savedAccessToken);
      client.defaults.headers.common.Authorization = `Bearer ${savedAccessToken}`;
    }
    if (savedRefreshToken) {
      setRefreshToken(savedRefreshToken);
    }
    if (savedExpiresAt) {
      setAccessTokenExpiresAt(savedExpiresAt);
    }
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        setUser(null);
      }
    }
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
      sessionStorage.setItem('hivago_session_expired', 'true');
    };

    window.addEventListener('hivago-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('hivago-unauthorized', handleUnauthorized);
  }, []);

  const login = async (credentials: LoginCredentials) => {
    console.log(`[Auth] Attempting login for ${credentials.email}...`);
    const response: LoginResponse = await loginRestaurant(credentials);
    console.log('[Auth] Login successful, saving tokens and user info...');
    setAccessToken(response.accessToken);
    setRefreshToken(response.refreshToken);
    setAccessTokenExpiresAt(response.accessTokenExpiresAt);
    setUser({
      id: response.restaurantId,
      name: response.name,
      email: credentials.email
    });

    localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
    localStorage.setItem(`${ACCESS_TOKEN_KEY}_expires_at`, response.accessTokenExpiresAt);
    localStorage.setItem(USER_KEY, JSON.stringify({
      id: response.restaurantId,
      name: response.name,
      email: credentials.email
    }));

    client.defaults.headers.common.Authorization = `Bearer ${response.accessToken}`;
  };

  const logout = () => {
    console.log('[Auth] Logging out user and clearing session...');
    setAccessToken(null);
    setRefreshToken(null);
    setAccessTokenExpiresAt(null);
    setUser(null);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(`${ACCESS_TOKEN_KEY}_expires_at`);
    localStorage.removeItem(USER_KEY);
    delete client.defaults.headers.common.Authorization;
  };

  const value = useMemo(
    () => ({
      user,
      accessToken,
      refreshToken,
      accessTokenExpiresAt,
      isAuthenticated: Boolean(accessToken),
      login,
      logout
    }),
    [user, accessToken, refreshToken, accessTokenExpiresAt]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
