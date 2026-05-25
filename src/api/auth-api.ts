// lib/auth-api.ts
// Authentication API client — register, login, logout, session management.

const BASE_URL =  "http://localhost:8080";

// ══════════════════════════════════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════════════════════════════════

export interface UserInfo {
  id: number;
  email: string;
  wallet_pubkey: string;
}

export interface AuthResponse {
  token: string;
  user: UserInfo;
}

export interface RegisterPayload {
  email: string;
  password: string;
  wallet_pubkey: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ApiError {
  error: string;
}

// ══════════════════════════════════════════════════════════════════════════
// Token helpers  (localStorage — swap to cookies if you prefer SSR)
// ══════════════════════════════════════════════════════════════════════════

const TOKEN_KEY = "auth_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

export function isLoggedIn(): boolean {
  const token = getToken();
  if (!token) return false;
  try {
    // Decode the JWT payload (no signature verification — server does that)
    const payload = JSON.parse(atob(token.split(".")[1]));
    // exp is Unix seconds
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      removeToken();
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// ══════════════════════════════════════════════════════════════════════════
// Core fetch wrapper
// ══════════════════════════════════════════════════════════════════════════

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  withAuth = false
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (withAuth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    const message = (data as ApiError)?.error ?? `HTTP ${res.status}`;
    throw new Error(message);
  }

  return data as T;
}

// ══════════════════════════════════════════════════════════════════════════
// Auth API Functions
// ══════════════════════════════════════════════════════════════════════════

/**
 * Register a new account.
 * Stores the JWT in localStorage on success.
 */
export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  setToken(data.token);
  return data;
}

/**
 * Log in with email + password.
 * Stores the JWT in localStorage on success.
 */
export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  setToken(data.token);
  return data;
}

/**
 * Fetch the currently authenticated user's profile.
 * Requires a valid JWT in localStorage.
 */
export async function getMe(): Promise<UserInfo> {
  return apiFetch<UserInfo>("/api/v1/auth/me", { method: "GET" }, true);
}

/**
 * Log out — clears the stored token.
 * No server call needed (JWT is stateless).
 */
export function logout(): void {
  removeToken();
}

// ══════════════════════════════════════════════════════════════════════════
// React Hooks
// ══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";

// ── useAuth ───────────────────────────────────────────────────────────────
// Central auth state hook. Use this at the top of your app or in a context.
//
// Usage:
//   const { user, loading, loggedIn, doLogin, doRegister, doLogout } = useAuth();

export function useAuth() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // On mount: if token exists and is not expired, fetch the user profile
  useEffect(() => {
    if (!isLoggedIn()) {
      setLoading(false);
      return;
    }
    getMe()
      .then(setUser)
      .catch(() => {
        removeToken(); // token invalid/expired on server side
      })
      .finally(() => setLoading(false));
  }, []);

  const doLogin = useCallback(async (payload: LoginPayload) => {
    setError(null);
    setLoading(true);
    try {
      const res = await login(payload);
      setUser(res.user);
      return res;
    } catch (e) {
      const msg = (e as Error).message;
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const doRegister = useCallback(async (payload: RegisterPayload) => {
    setError(null);
    setLoading(true);
    try {
      const res = await register(payload);
      setUser(res.user);
      return res;
    } catch (e) {
      const msg = (e as Error).message;
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const doLogout = useCallback(() => {
    logout();
    setUser(null);
  }, []);

  return {
    user,
    loading,
    error,
    loggedIn: !!user,
    doLogin,
    doRegister,
    doLogout,
  };
}

// ── useMe ─────────────────────────────────────────────────────────────────
// Lightweight hook for reading the current user anywhere without re-fetching.
// Useful in child components that just need to read the user profile.
//
// Usage:
//   const { user, loading } = useMe();

export function useMe() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) {
      setLoading(false);
      return;
    }
    getMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return { user, loading };
}
