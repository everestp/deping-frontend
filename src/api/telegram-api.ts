// All Telegram-related API client logic.
const BASE_URL = "http://localhost:8081";

// ── Shared API Fetcher ─────────────────────────────────────────────────────
async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await res.json();

  // FIX: This will show you exactly what the server says
  if (!res.ok) {
    throw new Error(data.message || data.error || `Server Error ${res.status}`);
  }

  return data as T;
}

// ── Types ────────────────────────────────────────────────────────────────
export interface LinkTelegramResponse {
  verification_code: string;
  bot_username: string;
  message: string;
}

export interface TelegramCreditStatus {
  total_credits_left: number;
  free_credits_used: number;
  free_credits_left: number;
  free_reset_date: string;
}

export interface AddCreditsPayload {
  amount: number;
  tx_signature: string;
}

// ── API Functions ────────────────────────────────────────────────────────
export const initiateTelegramLink = (username: string) =>
  apiFetch<LinkTelegramResponse>("/api/telegram/link", {
    method: "POST",
    body: JSON.stringify({ telegram_username: username }),
  });

export const fetchCreditStatus = () =>
  apiFetch<TelegramCreditStatus>("/api/telegram/credits");

export const addPurchasedCredits = (payload: AddCreditsPayload) =>
  apiFetch("/api/telegram/credits/add", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const toggleMonitorNotification = (monitorId: string, enabled: boolean) =>
  apiFetch(`/api/monitors/${monitorId}/notifications`, {
    method: "PUT",
    body: JSON.stringify({ is_notifications_enabled: enabled }),
  });

// ── Hooks ────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";

export function useCreditStatus() {
  const [data, setData] = useState<TelegramCreditStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const status = await fetchCreditStatus();
      setData(status);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  return { data, loading, error, refetch };
}
