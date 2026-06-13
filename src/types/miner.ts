// ─────────────────────────────────────────────
// types/miner.ts
// ─────────────────────────────────────────────

export type MinerView = 'loading' | 'no-wallet' | 'register' | 'activate' | 'stake' | 'dashboard';
export type TxStatus         = 'confirmed' | 'pending';
export type TerminalLineType = 'info' | 'reward' | 'warn';

export interface RunnerNode {
  id: number;
  owner_email: string;
  owner_pubkey: string;
  node_pubkey: string;
  node_pda: string | null;          // null until activate step
  region: string;
  latitude: number;
  longitude: number;
  offchain_accumulated_tokens: number;
  total_earned_tokens_all_time: number;
  pending_solana_sync: boolean;
  is_validator: boolean;
  staked_amount: number;
  last_seen_timestamp: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  unstake_request_at: string | null;
}

// What /runner/me actually returns
export interface MeResponse {
  view: MinerView;
  node: RunnerNode | null; // null when view === 'register'
}

export interface PendingTx {
  id: string;
  timestamp: string;
  amount: number;
  signature: string;
  status: TxStatus;
}

export interface TerminalLine {
  id: string;
  text: string;
  type: TerminalLineType;
}

export interface RegisterPayload {
  owner_pubkey: string;
  node_pubkey: string;
  region: string;
  latitude: string;
  longitude: string;
}

// What /payment/validate actually expects
export interface ValidateStakePayload {
  signature: string;
  expected_amount: number;
  node_pda: string;
  public_key?:string
}
export interface ActiveNode {
  public_key: string;
  node_pda:string
 
}