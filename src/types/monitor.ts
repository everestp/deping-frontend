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
  RunnerPubkey: string;
  Results: WsPingResult[];
}

export interface WsPingResult {
  JobID: string;
  BatchID: string;
  NodeID: string;
  TargetURL: string;
  Success: boolean;
  StatusCode: number;
  DnsUs: number;
  TcpUs: number;
  TlsUs: number;
  TtfbUs: number;
  TotalUs: number;
  LatencyMs: number;
  ErrorKind: string;
  ErrorMsg: string;
  TimestampMs: number;
  GeoRegion: string;
  Latitude: number;
  Longitude: number;
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
