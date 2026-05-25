import type { ApiMonitor, ApiMonitorStats } from '../types/monitor';

const BASE_URL ="http://localhost:8080";

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('auth_token') ?? '';
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

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
  return res.json();
}
