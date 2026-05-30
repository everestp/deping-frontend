// ─────────────────────────────────────────────
// api/node-api.ts
// ─────────────────────────────────────────────

import type { RunnerNode, RegisterPayload } from '../types/miner';

const BASE = "http://localhost:8080";

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('auth_token') ?? '';
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new ApiError(body.error ?? 'Request failed', res.status);
  }
  return res.json();
}

// ── GET /api/v1/runner/me ────────────────────────────────────
// Returns 404 ApiError when no runner exists for this pubkey
export async function getRunnerMe(pubkey: string): Promise<RunnerNode> {
  const res = await fetch(`${BASE}/api/v1/runner/me`, {
    method: 'GET',
    headers: authHeaders(),
    body: JSON.stringify({ pubkey }),
  });
  return handleResponse<RunnerNode>(res);
}

// ── POST /api/v1/runner/register ─────────────────────────────
// Inserts runner with is_validator = false
export async function registerRunner(
  payload: RegisterPayload,
): Promise<RunnerNode> {
  const res = await fetch(`${BASE}/api/v1/runner/register`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<RunnerNode>(res);
}

// ── POST /api/v1/payment/validate ────────────────────────────
// Called after on-chain tx is confirmed.
// Backend finds and verifies the tx, flips is_validator=true + staked_amount.
export async function validateStakePayment(
  amount: number,
  tx_signature: string,
): Promise<RunnerNode> {
  const res = await fetch(`${BASE}/api/v1/payment/validate`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ amount, tx_signature }),
  });
  return handleResponse<RunnerNode>(res);
}

// ── POST /api/v1/runner/heartbeat ────────────────────────────
// Fire-and-forget — keeps node marked as live
export async function sendHeartbeat(nodePubkey: string): Promise<void> {
  try {
    await fetch(
      `${BASE}/api/v1/runner/heartbeat?pubkey=${encodeURIComponent(nodePubkey)}`,
      { method: 'POST', headers: authHeaders() },
    );
  } catch {
    // best-effort, swallow silently
  }
}
