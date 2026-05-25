// ─── Raw API shapes ───────────────────────────────────────────────────────────

export interface ApiMonitor {
  id: string;
  target_url: string;
  interval_seconds: number;
  credit_balance_checks: number;
  total_spent_tokens: number;
  is_active: boolean;
}

export interface ApiPing {
  ID: number;
  MonitorID: string;
  RunnerPubkey: string;
  DnsUs: number;
  TcpUs: number;
  TlsUs: number;
  TtfbUs: number;
  TotalUs: number;
  LatencyMs: number;
  StatusCode: number;
  Success: boolean;
  ErrorKind: string | null;
  GeoRegion: string;
  Latitude: number;
  Longitude: number;
  Timestamp: string; // ISO string
}

export interface ApiMonitorStats {
  monitor_id: string;
  check_interval: number;
  uptime_pct_24h: number;
  uptime_pct_7d: number;
  recent_pings: ApiPing[];
}

// ─── WebSocket packet (from RabbitMQ fanout via bridge.go) ────────────────────

export interface WsResultPacket {
  runner_pubkey: string;
  signature: string;
  results: WsPingResult[]; // Match lowercase 'results' tag
}

export interface WsPingResult {
  job_id: string;        // Match snake_case tags
  batch_id: string;
  node_id: string;
  target_url: string;
  success: boolean;      // Match lowercase 'success'
  status_code: number;
  dns_us: number;
  tcp_us: number;
  tls_us: number;
  ttfb_us: number;
  total_us: number;
  latency_ms: number;
  error_kind: string;
  error_msg: string;
  timestamp_ms: number;
  geo_region: string;
  latitude: number;
  longitude: number;
}
// ─── Frontend view models ─────────────────────────────────────────────────────

export type BarStatus = 'green' | 'red' | 'gray';

export interface BarSegment {
  windowStart: string;
  status: BarStatus;
  successCount: number;
  failCount: number;
}

export type MonitorStatus = 'healthy' | 'degraded' | 'down';

export interface MonitorView {
  id: string;
  url: string;
  intervalSeconds: number;
  isActive: boolean;
  status: MonitorStatus;
  uptimePct24h: number;
  uptimePct7d: number;
  avgLatencyMs: number;
  bars: BarSegment[];
  recentPings: ApiPing[];
}

// ─── Per-node live status (driven by WebSocket) ───────────────────────────────

export type NodeLiveStatus = 'green' | 'red' | 'gray';

export interface NodeStatus {
  nodeId: string;
  geoRegion: string;
  latitude: number;
  longitude: number;
  lastSuccess: boolean | null;
  lastLatencyMs: number | null;
  lastSeenMs: number | null; // Date.now() when last packet arrived
  status: NodeLiveStatus;
}
