/**
 * useMonitors
 *
 * 1. Fetches /monitors on mount
 * 2. For each monitor, fetches /monitors/:id/stats immediately and then
 *    re-fetches every `interval_seconds` seconds (±4 s tolerance window)
 * 3. Connects a single WebSocket to receive live ping packets.
 *    WebSocket data is used ONLY to drive the Leaflet map node colours.
 *    A node is:
 *      - green  → last packet arrived within interval+10 s AND Success=true
 *      - red    → last packet arrived within interval+10 s AND Success=false
 *      - gray   → no packet yet OR last packet is older than interval+10 s
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { fetchMonitors, fetchMonitorStats } from '../api/monitor-api';
import type {
  ApiMonitor,
  ApiPing,
  BarSegment,
  BarStatus,
  MonitorView,
  NodeStatus,
  WsResultPacket,
} from "../types/monitor";

const WS_URL = "ws://localhost:8080/ws";

// ─── helpers ─────────────────────────────────────────────────────────────────

function deriveStatus(uptime: number) {
  if (uptime >= 99) return 'healthy' as const;
  if (uptime >= 85) return 'degraded' as const;
  return 'down' as const;
}

/**
 * Build 7 bar segments from recent_pings.
 * Each bar covers one check_interval window going back from now.
 */
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

  // Map: monitorId → interval timer id
  const timersRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());
  const wsRef = useRef<WebSocket | null>(null);
  // Map: monitorId → intervalSeconds (needed in WS handler to check staleness)
  const intervalMapRef = useRef<Map<string, number>>(new Map());

  // ── stats loader ────────────────────────────────────────────────────────────
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

  // ── initial load ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const apiMonitors = await fetchMonitors();
        if (cancelled) return;

        // Seed interval map
        apiMonitors.forEach((m) => intervalMapRef.current.set(m.id, m.interval_seconds));

        // Load all stats in parallel
        await Promise.all(apiMonitors.map(loadStats));
        if (cancelled) return;
        setLoading(false);

        // Set up per-monitor polling
        apiMonitors.forEach((m) => {
          const tid = setInterval(
            () => loadStats(m),
            m.interval_seconds * 1000
          );
          timersRef.current.set(m.id, tid);
        });
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load monitors');
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      timersRef.current.forEach((tid) => clearInterval(tid));
      timersRef.current.clear();
    };
  }, [loadStats]);

// ── WebSocket for live map node colours ───────────────────────────────────
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    // Track active timeouts to clear them on unmount
    const stalenessTimeouts = new Set<ReturnType<typeof setTimeout>>();

    function connect() {
      ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[WS] Connected");
      };

      ws.onmessage = (event) => {
        try {
          const packet: WsResultPacket = JSON.parse(event.data);
          const now = Date.now();
          const maxInterval = Math.max(...Array.from(intervalMapRef.current.values()), 60);

          setNodeStatuses((prev) => {
            const next = { ...prev };
            packet.Results.forEach((r) => {
              const nodeKey = `${r.NodeID}__${r.GeoRegion}`;
              next[nodeKey] = {
                nodeId: r.NodeID,
                geoRegion: r.GeoRegion,
                latitude: r.Latitude,
                longitude: r.Longitude,
                lastSuccess: r.Success,
                lastLatencyMs: r.LatencyMs,
                lastSeenMs: now,
                status: r.Success ? 'green' : 'red',
              };
            });
            return next;
          });

          // Schedule a "staleness check"
          const tid = setTimeout(() => {
            setNodeStatuses((prev) => {
              const next = { ...prev };
              packet.Results.forEach((r) => {
                const nodeKey = `${r.NodeID}__${r.GeoRegion}`;
                const node = next[nodeKey];
                // Only mark gray if the node hasn't been updated since this timeout was set
                if (node && (Date.now() - node.lastSeenMs >= (maxInterval + 10) * 1000)) {
                  next[nodeKey] = { ...node, status: 'gray' };
                }
              });
              return next;
            });
            stalenessTimeouts.delete(tid);
          }, (maxInterval + 10) * 1000);

          stalenessTimeouts.add(tid);
        } catch (err) {
          console.error("[WS] Parse error:", err);
        }
      };

      ws.onclose = () => {
        reconnectTimeout = setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        console.error("[WS] Error:", err);
        ws?.close();
      };
    }

    connect();

    return () => {
      // Cleanup everything on unmount
      clearTimeout(reconnectTimeout);
      stalenessTimeouts.forEach(clearTimeout);
      ws?.close();
      wsRef.current = null;
    };
  }, []);
  // ── manual refresh ────────────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    try {
      const apiMonitors = await fetchMonitors();
      await Promise.all(apiMonitors.map(loadStats));
    } catch (e) {
      console.warn('[useMonitors] manual refresh error:', e);
    }
  }, [loadStats]);

  return { monitors, nodeStatuses, loading, error, lastRefresh, refresh };
}
