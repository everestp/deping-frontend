// ─────────────────────────────────────────────
// api/node-api.ts
// ─────────────────────────────────────────────

import type {
  RunnerNode,
  RegisterPayload,
  MeResponse,
  ValidateStakePayload,
} from '../types/miner';

const BASE = "http://localhost:8081";

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
export async function getRunnerMe(pubkey: string): Promise<MeResponse> {
  const res = await fetch(`${BASE}/api/v1/runner/me`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ pubkey }),
  });
  return handleResponse<MeResponse>(res);
}

// ── POST /api/v1/runner/register ──────────────────────────
export async function registerRunner(payload: RegisterPayload): Promise<RunnerNode> {
  const res = await fetch(`${BASE}/api/v1/runner/register`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<RunnerNode>(res);
}

// ── POST /api/v1/runner/activate ──────────────────────────
export async function activateNode(node_pda: string): Promise<RunnerNode> {
  const res = await fetch(`${BASE}/api/v1/runner/activate`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ node_pda }),
  });
  return handleResponse<RunnerNode>(res);
}

// ── POST /api/v1/payment/validate ─────────────────────────
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

// ── POST /api/v1/payment/validate-unstake ─────────────────
// 🔥 FIXED: Directing to the dedicated off-chain unstake route
// Flips is_validator = false, updates staked_amount to 0, maps signature log
export async function validateUnstakePayment(payload: {
  signature: string;
  node_pda: string;
  amount: number; // Raw base units (9 decimals)
}): Promise<{ success: boolean; message: string; timestamp: number }> {
  const res = await fetch(`${BASE}/api/v1/payment/validate-unstake`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

// ── POST /api/v1/runner/heartbeat ─────────────────────────
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