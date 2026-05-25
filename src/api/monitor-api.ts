import type { ApiMonitor, ApiMonitorStats } from '../types/monitor';

const BASE_URL = "http://localhost:8080";

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('auth_token') ?? '';
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

// ─── Existing API Methods ───────────────────────────────────────────────────

export async function fetchMonitors(): Promise<ApiMonitor[]> {
  const res = await fetch(`${BASE_URL}/api/v1/monitors`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`fetchMonitors: ${res.status}`);
  return res.json();
}

export async function fetchMonitorStats(monitorId: string): Promise<ApiMonitorStats> {
  const res = await fetch(`${BASE_URL}/api/v1/monitors/${monitorId}/stats`, {
    headers: authHeaders(),
  });

  if (!res.ok) throw new Error(`fetchMonitorStats(${monitorId}): ${res.status}`);

  const data: ApiMonitorStats = await res.json();

  return {
    ...data,
    recent_pings: Array.isArray(data.recent_pings) ? data.recent_pings : [],
    check_interval: data.check_interval ?? 60,
    uptime_pct_24h: data.uptime_pct_24h ?? 0,
    uptime_pct_7d: data.uptime_pct_7d ?? 0,
  };
}

// ─── NEW: Add Monitor (POST) ────────────────────────────────────────────────

export async function createMonitor(params: { target_url: string; interval_seconds: number }): Promise<ApiMonitor> {
  const res = await fetch(`${BASE_URL}/api/v1/monitors`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(params),
  });

  if (!res.ok) throw new Error(`createMonitor failed: ${res.status}`);
  return res.json();
}

// ─── Existing Status/Delete Methods ─────────────────────────────────────────

export async function toggleMonitorStatus(id: string, action: 'pause' | 'resume'): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/v1/monitors/${id}/${action}`, {
    method: 'PUT',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to ${action} monitor`);
}

export async function deleteMonitor(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/v1/monitors/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to delete monitor`);
}
