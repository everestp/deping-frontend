// ─────────────────────────────────────────────
// types/miner.ts  — shared miner/validator types
// ─────────────────────────────────────────────

export type MinerView =
  | 'loading'
  | 'no-wallet'
  | 'register'
  | 'stake'
  | 'dashboard';

export interface RunnerNode {
  id: number;
  owner_email: string;
  owner_pubkey: string;
  node_pubkey: string;
  region: string;
  latitude: number;
  longitude: number;
  offchain_accumulated_tokens: number;
  total_earned_tokens_all_time: number;
  pending_solana_sync: boolean;
  last_seen_timestamp: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  is_validator: boolean;
  staked_amount: number;
  unstake_request_at: string | null;
}

export interface PendingTx {
  id: string;
  timestamp: string;
  amount: number;
  signature: string;
  status: 'confirmed' | 'pending';
}

export interface TerminalLine {
  id: string;
  text: string;
  type: 'info' | 'reward' | 'warn';
}

export interface RegisterPayload {
  owner_pubkey: string;
  node_pubkey: string;
  region: string;
  latitude: string;
  longitude: string;
}
