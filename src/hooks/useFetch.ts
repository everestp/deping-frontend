import { useState, useEffect, useRef, useCallback } from 'react';

interface FetchState<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
}

interface FetchOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  retries?: number;
  retryDelay?: number;
}

export function useFetch<T>(url: string | null, options: FetchOptions = {}) {
  const [state, setState] = useState<FetchState<T>>({ data: null, error: null, isLoading: false });
  const abortRef = useRef<AbortController | null>(null);
  const { method = 'GET', headers = {}, body, retries = 2, retryDelay = 500 } = options;

  const execute = useCallback(async () => {
    if (!url) return;

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setState({ data: null, error: null, isLoading: true });

    let attempt = 0;
    while (attempt <= retries) {
      try {
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json', ...headers },
          body: body ? JSON.stringify(body) : undefined,
          signal: abortRef.current.signal,
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const data: T = await res.json();
        setState({ data, error: null, isLoading: false });
        return;
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        attempt++;
        if (attempt > retries) {
          setState({ data: null, error: (err as Error).message, isLoading: false });
        } else {
          await new Promise((r) => setTimeout(r, retryDelay * attempt));
        }
      }
    }
  }, [url, method, body, retries, retryDelay, headers]);

  useEffect(() => {
    execute();
    return () => abortRef.current?.abort();
  }, [execute]);

  return { ...state, refetch: execute };
}
