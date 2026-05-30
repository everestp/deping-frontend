export interface RunnerResponse {
  id: number;
  owner_pubkey: string;
  node_pubkey: string;
  region: string;
  latitude: number;
  longitude: number;
  offchain_accumulated_tokens: number;
  total_earned_tokens_all_time: number;
  pending_solana_sync: boolean;
}
