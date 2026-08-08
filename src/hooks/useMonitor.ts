import { useEffect, useRef, useState, useCallback } from 'react';
import { fetchMonitors, fetchMonitorStats } from '../api/monitor-api';
import type {
  ApiMonitor,
  ApiPing,
  BarSegment,
  BarStatus,
  MonitorView,
  NodeStatus,
  WsPingResult,
  WsResultPacket,
} from "../types/monitor";

const WS_URL = "wss://api.deping.xyz/ws";

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface UseMonitorsReturn {
  monitors: MonitorView[];
  nodeStatuses: Record<string, NodeStatus>;
  loading: boolean;
  error: string | null;
  lastRefresh: Date;
  refresh: () => Promise<void>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function deriveStatus(uptime: number) {
  if (uptime >= 99) return 'healthy' as const;
  if (uptime >= 85) return 'degraded' as const;
  return 'down' as const;
}

function buildBars(pings: ApiPing[] | undefined | null, intervalSeconds: number): BarSegment[] {
  const now = Date.now();
  const intervalMs = intervalSeconds * 1000;
  const bars: BarSegment[] = [];
  const safePings = pings || [];

  for (let i = 6; i >= 0; i--) {
    const windowEnd = now - (i * intervalMs);
    const windowStart = windowEnd - intervalMs;

    const inWindow = safePings.filter((p) => {
      const ts = p.TimestampMs > 0 ? p.TimestampMs : new Date(p.Timestamp).getTime();
      return ts >= windowStart && ts < windowEnd;
    });

    const successCount = inWindow.filter((p) => p.Success).length;
    const failCount = inWindow.filter((p) => !p.Success).length;

    let status: BarStatus = 'gray';
    if (inWindow.length > 0) {
      status = successCount >= failCount ? 'green' : 'red';
    }

    const d = new Date(windowStart);
    bars.push({
      windowStart: d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
      status,
      successCount,
      failCount,
    });
  }
  return bars;
}

function avgLatency(pings: ApiPing[] | undefined | null): number {
  if (!pings || !Array.isArray(pings) || pings.length === 0) return 0;
  return Math.round(pings.reduce((s, p) => s + p.LatencyMs, 0) / pings.length);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useMonitors(): UseMonitorsReturn {
  const [monitors, setMonitors] = useState<MonitorView[]>([]);
  const [nodeStatuses, setNodeStatuses] = useState<Record<string, NodeStatus>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const timersRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());
  const wsRef = useRef<WebSocket | null>(null);
  const intervalMapRef = useRef<Map<string, number>>(new Map());

  const loadStats = useCallback(async (monitor: ApiMonitor) => {
    try {
      const stats = await fetchMonitorStats(monitor.id);
      if (!stats) return;

      setMonitors((prev) => {
        const next = [...prev];
        const idx = next.findIndex((m) => m.id === monitor.id);
        const view: MonitorView = {
          id: monitor.id,
          url: monitor.target_url,
          intervalSeconds: monitor.interval_seconds,
          isActive: monitor.is_active,
          status: deriveStatus(stats.uptime_pct_24h ?? 0),
          uptimePct24h: stats.uptime_pct_24h ?? 0,
          uptimePct7d: stats.uptime_pct_7d ?? 0,
          avgLatencyMs: avgLatency(stats.recent_pings),
          bars: buildBars(stats.recent_pings, stats.check_interval),
          recentPings: stats.recent_pings || [],
        };
        if (idx === -1) next.push(view);
        else next[idx] = view;
        return next;
      });
      setLastRefresh(new Date());
    } catch (e) {
      console.warn(`[useMonitors] stats error for ${monitor.id}:`, e);
    }
  }, []);

  // WebSocket
  useEffect(() => {
    let reconnectTimeout: ReturnType<typeof setTimeout>;
    function connect() {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;
      ws.onmessage = (event) => {
        try {
          const packet: WsResultPacket = JSON.parse(event.data);
          const now = Date.now();
          if (!packet || !Array.isArray(packet.results)) return;
          setNodeStatuses((prev) => {
            const next = { ...prev };
            packet.results.forEach((r: WsPingResult) => {
              const nodeKey = `${r.node_id}__${r.geo_region}`;
              next[nodeKey] = {
                nodeId: r.node_id,
                geoRegion: r.geo_region,
                latitude: r.latitude,
                longitude: r.longitude,
                lastSuccess: r.success,
                lastLatencyMs: r.latency_ms,
                lastSeenMs: now,
                status: r.success ? 'green' : 'red',
              };
            });
            return next;
          });
        } catch {}
      };
      ws.onclose = () => { reconnectTimeout = setTimeout(connect, 3000); };
    }
    connect();
    return () => { clearTimeout(reconnectTimeout); wsRef.current?.close(); };
  }, []);

  // Initial Load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const apiMonitors = await fetchMonitors();
        if (cancelled) return;
        apiMonitors.forEach((m) => intervalMapRef.current.set(m.id, m.interval_seconds));
        await Promise.all(apiMonitors.map(loadStats));
        if (cancelled) return;
        setLoading(false);
        apiMonitors.forEach((m) => {
          const tid = setInterval(() => loadStats(m), m.interval_seconds * 1000);
          timersRef.current.set(m.id, tid);
        });
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load');
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
      timersRef.current.forEach((tid) => clearInterval(tid));
    };
  }, [loadStats]);

  const refresh = useCallback(async () => {
    const apiMonitors = await fetchMonitors();
    await Promise.all(apiMonitors.map(loadStats));
  }, [loadStats]);

  return { monitors, nodeStatuses, loading, error, lastRefresh, refresh };
}
