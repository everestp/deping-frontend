// ─────────────────────────────────────────────
// api/node-api.ts
// ─────────────────────────────────────────────

import type {
  RunnerNode,
  RegisterPayload,
  MeResponse,
  ValidateStakePayload,
} from '../types/miner';

const BASE ="http://localhost:8080";

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

// ── GET /api/v1/runner/me ─────────────────────────────────
// Returns { view, node }
// view: 'register' | 'activate' | 'stake' | 'dashboard'
// node: null when view === 'register'
export async function getRunnerMe(pubkey: string): Promise<MeResponse> {
  const res = await fetch(`${BASE}/api/v1/runner/me`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ pubkey }),
  });
  return handleResponse<MeResponse>(res);
}

// ── POST /api/v1/runner/register ──────────────────────────
// Creates DB row — node_pda = null, is_validator = false
export async function registerRunner(payload: RegisterPayload): Promise<RunnerNode> {
  const res = await fetch(`${BASE}/api/v1/runner/register`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<RunnerNode>(res);
}

// ── POST /api/v1/runner/activate ──────────────────────────
// Called after initNode succeeds on-chain.
// Saves the node_pda address to DB so /runner/me returns 'stake' next time.
export async function activateNode(node_pda: string): Promise<RunnerNode> {
  const res = await fetch(`${BASE}/api/v1/runner/activate`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ node_pda }),
  });
  return handleResponse<RunnerNode>(res);
}

// ── POST /api/v1/payment/validate ─────────────────────────
// Called after stakeTokens tx is confirmed on-chain.
// Backend fetches tx from Solana by signature, verifies receiver + amount,
// then flips is_validator = true and sets staked_amount.
//
// expected_amount is RAW (9 decimals): e.g. 20 DPNG = 20_000_000_000
export async function validateStakePayment(
  payload: ValidateStakePayload,
): Promise<{ success: boolean; amount: number; receiver: string; timestamp: number }> {
  const res = await fetch(`${BASE}/api/v1/payment/validate`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

// ── POST /api/v1/runner/heartbeat ─────────────────────────
// Fire-and-forget — keeps node marked as live
export async function sendHeartbeat(nodePubkey: string): Promise<void> {
  try {
    await fetch(
      `${BASE}/api/v1/runner/heartbeat?pubkey=${encodeURIComponent(nodePubkey)}`,
      { method: 'POST', headers: authHeaders() },
    );
  } catch {
    // best-effort
  }
}
