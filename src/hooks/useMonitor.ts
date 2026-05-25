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

const WS_URL = "ws://localhost:8080/ws";

// ─── helpers ─────────────────────────────────────────────────────────────────

function deriveStatus(uptime: number) {
  if (uptime >= 99) return 'healthy' as const;
  if (uptime >= 85) return 'degraded' as const;
  return 'down' as const;
}

function buildBars(pings: ApiPing[], intervalSeconds: number): BarSegment[] {
  const now = Date.now();
  const bars: BarSegment[] = [];
  for (let i = 6; i >= 0; i--) {
    const windowEnd = now - i * intervalSeconds * 1000;
    const windowStart = windowEnd - intervalSeconds * 1000;
    const inWindow = pings.filter((p) => {
      const ts = new Date(p.Timestamp).getTime();
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
      windowStart: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
      status,
      successCount,
      failCount,
    });
  }
  return bars;
}

function avgLatency(pings: ApiPing[]): number {
  if (pings.length === 0) return 0;
  return Math.round(pings.reduce((s, p) => s + p.LatencyMs, 0) / pings.length);
}

// ─── hook ─────────────────────────────────────────────────────────────────────

export function useMonitors() {
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
      setMonitors((prev) => {
        const next = [...prev];
        const idx = next.findIndex((m) => m.id === monitor.id);
        const view: MonitorView = {
          id: monitor.id,
          url: monitor.target_url,
          intervalSeconds: monitor.interval_seconds,
          isActive: monitor.is_active,
          status: deriveStatus(stats.uptime_pct_24h),
          uptimePct24h: stats.uptime_pct_24h,
          uptimePct7d: stats.uptime_pct_7d,
          avgLatencyMs: avgLatency(stats.recent_pings),
          bars: buildBars(stats.recent_pings, stats.check_interval),
          recentPings: stats.recent_pings,
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

  // 1. Initial Load & Polling
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

  // 2. WebSocket Connection
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

  // 3. Centralized Staleness Cleaner
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setNodeStatuses((prev) => {
        let changed = false;
        const next = { ...prev };
        const maxInterval = Math.max(...Array.from(intervalMapRef.current.values()), 60);
        for (const key in next) {
          if (now - next[key].lastSeenMs > (maxInterval + 10) * 1000) {
            if (next[key].status !== 'gray') {
              next[key] = { ...next[key], status: 'gray' };
              changed = true;
            }
          }
        }
        return changed ? next : prev;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const apiMonitors = await fetchMonitors();
      await Promise.all(apiMonitors.map(loadStats));
    } catch (e) { console.warn(e); }
  }, [loadStats]);

  return { monitors, nodeStatuses, loading, error, lastRefresh, refresh };
}
