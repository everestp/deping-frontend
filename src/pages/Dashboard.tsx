import React, { useState, useMemo } from 'react';
import {
  Activity,
  RefreshCw,
  Globe,
  Clock,
  Coins,
  Wifi,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  MapPin,
  Loader2,
} from 'lucide-react';
import { Card } from '../components/Common/Card';
import { MetricBox } from '../components/Common/MetricBox';
import { Button } from '../components/Common/Button';
import { LatencyChart, LatencyDataPoint } from '../components/Metrics/LatencyChart';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useMonitors } from '../hooks/useMonitor';
import type { MonitorView, NodeStatus, ApiPing, BarStatus, ApiMonitorStats } from '../types/monitor';
import { fetchMonitorStats } from '../api/monitor-api';

// ─── Leaflet icon fix ─────────────────────────────────────────────────────────
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// ─── Constants ────────────────────────────────────────────────────────────────
const BAR_COLORS: Record<BarStatus, string> = {
  green: 'bg-emerald-400',
  red: 'bg-red-400',
  gray: 'bg-white/10',
};
const BAR_BORDERS: Record<BarStatus, string> = {
  green: 'border-emerald-400/40',
  red: 'border-red-400/40',
  gray: 'border-white/10',
};
const STATUS_CONFIG = {
  healthy: { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/25', dot: 'bg-emerald-400', label: 'Healthy' },
  degraded: { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/25', dot: 'bg-amber-400', label: 'Degraded' },
  down: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/25', dot: 'bg-red-400', label: 'Down' },
};
const NODE_COLORS: Record<string, string> = {
  green: '#34d399',
  red: '#f87171',
  gray: '#6b7280',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatUrl(url: string): string {
  try { return new URL(url).hostname; } catch { return url; }
}

// Build latency chart points from recent pings of a monitor
function buildChartFromPings(pings: ApiPing[]): LatencyDataPoint[] {
  // Group by minute, take up to 12 most recent minutes
  const byMinute = new Map<string, number[]>();
  pings.forEach((p) => {
    const d = new Date(p.Timestamp);
    const key = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    if (!byMinute.has(key)) byMinute.set(key, []);
    byMinute.get(key)!.push(p.LatencyMs);
  });
  return Array.from(byMinute.entries())
    .slice(-12)
    .map(([time, vals]) => ({
      time,
      Latency: Math.round(vals.reduce((s, v) => s + v, 0) / vals.length),
    }));
}

// ─── Live Map (WebSocket-driven) ──────────────────────────────────────────────
interface LiveMapProps {
  nodeStatuses: Record<string, NodeStatus>;
}
function LiveMap({ nodeStatuses }: LiveMapProps) {
  const nodes = Object.values(nodeStatuses);

  return (
    <div className="h-[380px] w-full rounded-xl overflow-hidden border border-slate-800">
      <MapContainer center={[20, 0]} zoom={2} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap contributors &copy; CARTO'
        />
        {nodes.map((node) => {
          const color = NODE_COLORS[node.status];
          return (
            <CircleMarker
              key={`${node.nodeId}__${node.geoRegion}`}
              center={[node.latitude, node.longitude]}
              radius={9}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.85, weight: 2 }}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={0.95} permanent={false}>
                <div className="text-xs font-mono leading-relaxed">
                  <div className="font-semibold">{node.nodeId} — {node.geoRegion}</div>
                  {node.lastLatencyMs !== null && (
                    <div>Latency: <span className="font-bold">{node.lastLatencyMs}ms</span></div>
                  )}
                  <div>
                    Status:{' '}
                    <span style={{ color }}>
                      {node.status === 'green' ? 'OK' : node.status === 'red' ? 'Error' : 'No data'}
                    </span>
                  </div>
                  {node.lastSeenMs && (
                    <div className="text-gray-400">
                      {Math.round((Date.now() - node.lastSeenMs) / 1000)}s ago
                    </div>
                  )}
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}

// ─── Geo Drill-Down Map (per-monitor pings plotted) ───────────────────────────
interface GeoMapProps {
  monitor: MonitorView;
  onBack: () => void;
}
function GeoMap({ monitor, onBack }: GeoMapProps) {
  // Group pings by region, take latest per region
  const regionMap = new Map<string, ApiPing>();
  monitor.recentPings.forEach((p) => {
    const existing = regionMap.get(p.GeoRegion);
    if (!existing || p.Timestamp > existing.Timestamp) {
      regionMap.set(p.GeoRegion, p);
    }
  });
  const regions = Array.from(regionMap.values());

  const globalAvg = regions.length
    ? Math.round(regions.reduce((s, r) => s + r.LatencyMs, 0) / regions.length)
    : 0;
  const successCount = regions.filter((r) => r.Success).length;
  const globalAvail = regions.length
    ? ((successCount / regions.length) * 100).toFixed(1)
    : '0.0';

  function pinColor(p: ApiPing): string {
    if (!p.Success) return '#f87171';
    if (p.LatencyMs > 400) return '#fbbf24';
    return '#34d399';
  }

  const chartPoints = buildChartFromPings(monitor.recentPings);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-lg glass border border-[var(--border-subtle)] flex items-center justify-center text-sky-400 hover:bg-sky-500/10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="font-mono-data text-xl font-semibold text-[var(--text-primary)]">
            Geographic Cockpit
          </h1>
          <p className="text-sm text-[var(--text-muted)] font-mono-data mt-0.5">
            {monitor.url}
          </p>
        </div>
      </div>

      {/* Map */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Globe className="w-4 h-4 text-sky-400" />
          <h2 className="font-semibold text-[var(--text-primary)]">Node Distribution</h2>
          <span className="ml-auto text-xs font-mono-data text-emerald-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {monitor.recentPings.length} recent pings
          </span>
        </div>

        <div className="h-[380px] w-full rounded-xl overflow-hidden border border-slate-800">
          <MapContainer center={[20, 0]} zoom={2} scrollWheelZoom={false} className="h-full w-full">
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; OpenStreetMap contributors &copy; CARTO'
            />
            {regions.map((p) => {
              const color = pinColor(p);
              return (
                <CircleMarker
                  key={p.GeoRegion}
                  center={[p.Latitude, p.Longitude]}
                  radius={9}
                  pathOptions={{ color, fillColor: color, fillOpacity: 0.85, weight: 2 }}
                >
                  <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
                    <div className="text-xs font-mono leading-relaxed min-w-[160px]">
                      <div className="font-semibold mb-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {p.GeoRegion} — {p.RunnerPubkey}
                      </div>
                      <div>DNS: {(p.DnsUs / 1000).toFixed(1)}ms</div>
                      <div>TCP: {(p.TcpUs / 1000).toFixed(1)}ms</div>
                      <div>TLS: {(p.TlsUs / 1000).toFixed(1)}ms</div>
                      <div>TTFB: {(p.TtfbUs / 1000).toFixed(1)}ms</div>
                      <div className="border-t border-gray-600 mt-1 pt-1 font-bold">
                        Total: {p.LatencyMs}ms
                      </div>
                      <div>
                        Status:{' '}
                        <span style={{ color }}>
                          {p.Success ? `HTTP ${p.StatusCode}` : p.ErrorKind ?? 'Error'}
                        </span>
                      </div>
                    </div>
                  </Tooltip>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>

        <div className="flex items-center gap-4 mt-3 text-xs font-mono-data text-[var(--text-muted)]">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> &lt;400ms OK</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> &gt;400ms Slow</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400" /> Error</span>
        </div>
      </Card>

      {/* Summary metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricBox label="Global Avg Latency" value={globalAvg} unit="ms"
          alert={globalAvg > 400 ? 'critical' : globalAvg > 150 ? 'warning' : 'normal'} />
        <MetricBox label="Node Availability" value={globalAvail} unit="%"
          alert={parseFloat(globalAvail) >= 99 ? 'normal' : 'warning'} />
        <MetricBox label="Uptime 24h" value={monitor.uptimePct24h.toFixed(2)} unit="%"
          alert={monitor.uptimePct24h >= 99 ? 'normal' : 'warning'} />
        <MetricBox label="Uptime 7d" value={monitor.uptimePct7d.toFixed(2)} unit="%"
          alert={monitor.uptimePct7d >= 99 ? 'normal' : 'warning'} />
      </div>

      {/* Per-region table */}
      <Card>
        <h2 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-sky-400" />
          Latest Ping by Region
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-subtle)]">
                {['Region', 'Node', 'Latency', 'DNS', 'TCP', 'TLS', 'TTFB', 'Status', 'Time'].map((h) => (
                  <th key={h} className="text-left px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {regions.map((p) => (
                <tr key={p.GeoRegion} className="hover:bg-white/3 transition-colors">
                  <td className="px-3 py-2.5 font-mono-data text-xs text-sky-400">{p.GeoRegion}</td>
                  <td className="px-3 py-2.5 font-mono-data text-xs text-[var(--text-muted)]">{p.RunnerPubkey}</td>
                  <td className="px-3 py-2.5 font-mono-data text-xs font-bold text-[var(--text-primary)]">{p.LatencyMs}ms</td>
                  <td className="px-3 py-2.5 font-mono-data text-xs text-[var(--text-muted)]">{(p.DnsUs / 1000).toFixed(1)}ms</td>
                  <td className="px-3 py-2.5 font-mono-data text-xs text-[var(--text-muted)]">{(p.TcpUs / 1000).toFixed(1)}ms</td>
                  <td className="px-3 py-2.5 font-mono-data text-xs text-[var(--text-muted)]">{(p.TlsUs / 1000).toFixed(1)}ms</td>
                  <td className="px-3 py-2.5 font-mono-data text-xs text-[var(--text-muted)]">{(p.TtfbUs / 1000).toFixed(1)}ms</td>
                  <td className="px-3 py-2.5">
                    <span className={`font-mono-data text-xs ${p.Success ? 'text-emerald-400' : 'text-red-400'}`}>
                      {p.Success ? `HTTP ${p.StatusCode}` : p.ErrorKind ?? 'Error'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-mono-data text-xs text-[var(--text-muted)]">
                    {new Date(p.Timestamp).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Latency chart for this monitor */}
      {chartPoints.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-sky-400" />
            <h2 className="font-semibold text-[var(--text-primary)]">Latency Trend</h2>
          </div>
          <LatencyChart data={chartPoints} />
        </Card>
      )}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { monitors, nodeStatuses, loading, error, lastRefresh, refresh } = useMonitors();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonitorId, setSelectedMonitorId] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
const [expandedId, setExpandedId] = useState<string | null>(null);
const [isFetchingStats, setIsFetchingStats] = useState<string | null>(null);
const [statsCache, setStatsCache] = useState<Record<string, ApiMonitorStats>>({});
  const selectedMonitor = monitors.find((m) => m.id === selectedMonitorId) ?? null;



  const handleToggleExpand = async (monitorId: string) => {
  // If closing, just clear
  if (expandedId === monitorId) {
    setExpandedId(null);
    return;
  }

  setExpandedId(monitorId);

  // Fetch only if not already in cache
  if (!statsCache[monitorId]) {
    setIsFetchingStats(monitorId);
    try {
      const stats = await fetchMonitorStats(monitorId);
      setStatsCache((prev) => ({ ...prev, [monitorId]: stats }));
    } catch (e) {
      console.error("Failed to load stats:", e);
    } finally {
      setIsFetchingStats(null);
    }
  }
};

  async function handleRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  // ── Aggregated top-level metrics ───────────────────────────────────────────
  const { avgLatencyMs, fleetUptime, activeCount } = useMemo(() => {
    if (monitors.length === 0) return { avgLatencyMs: 0, fleetUptime: '0.00', activeCount: 0 };
    const active = monitors.filter((m) => m.isActive);
    const avgMs = Math.round(active.reduce((s, m) => s + m.avgLatencyMs, 0) / Math.max(active.length, 1));
    const uptimeAvg = (active.reduce((s, m) => s + m.uptimePct24h, 0) / Math.max(active.length, 1)).toFixed(2);
    return { avgLatencyMs: avgMs, fleetUptime: uptimeAvg, activeCount: active.length };
  }, [monitors]);

  const alertLevel = avgLatencyMs > 400 ? 'critical' : avgLatencyMs > 150 ? 'warning' : 'normal';
  const liveNodeCount = Object.values(nodeStatuses).length;
  const liveOkCount = Object.values(nodeStatuses).filter((n) => n.status === 'green').length;

  // ── Geo drill-down ────────────────────────────────────────────────────────
  if (selectedMonitorId && selectedMonitor) {
    return <GeoMap monitor={selectedMonitor} onBack={() => setSelectedMonitorId(null)} />;
  }

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-[var(--text-muted)]">
        <Loader2 className="w-5 h-5 animate-spin text-sky-400" />
        <span className="font-mono-data text-sm">Loading monitors…</span>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-red-400">
        <AlertTriangle className="w-5 h-5" />
        <span className="font-mono-data text-sm">{error}</span>
      </div>
    );
  }

  // ── Main view ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-mono-data text-xl font-semibold text-[var(--text-primary)]">
            Network Dashboard
          </h1>
          <p className="text-sm text-[var(--text-muted)] font-mono-data mt-0.5">
            Last updated: {lastRefresh.toLocaleTimeString()} — each monitor auto-refreshes per its interval
          </p>
        </div>
        <Button variant="secondary" size="sm" loading={refreshing} onClick={handleRefresh}>
          <RefreshCw className="w-3.5 h-3.5" />
          {refreshing ? 'Refreshing…' : 'Refresh All'}
        </Button>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricBox
          label="Active Monitors"
          value={activeCount}
          sublabel={`${monitors.length} total`}
          icon={<Globe className="w-4 h-4" />}
          alert="normal"
        />
        <MetricBox
          label="Avg Response Latency"
          value={avgLatencyMs}
          unit="ms"
          sublabel="Fleet average"
          icon={<Clock className="w-4 h-4" />}
          alert={alertLevel}
        />
        <MetricBox
          label="Fleet Uptime 24h"
          value={fleetUptime}
          unit="%"
          sublabel="Across all monitors"
          icon={<Wifi className="w-4 h-4" />}
          alert={parseFloat(fleetUptime) >= 99 ? 'normal' : 'warning'}
        />
        <MetricBox
          label="Live Nodes"
          value={`${liveOkCount}/${liveNodeCount}`}
          sublabel="WebSocket connected"
          icon={<Coins className="w-4 h-4" />}
          alert={liveNodeCount > 0 && liveOkCount === liveNodeCount ? 'normal' : liveNodeCount === 0 ? 'normal' : 'warning'}
        />
      </div>

      {/* Live WebSocket map — always visible */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Globe className="w-4 h-4 text-sky-400" />
          <h2 className="font-semibold text-[var(--text-primary)]">Live Node Map</h2>
          <span className="ml-auto text-xs font-mono-data text-sky-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            WebSocket live
          </span>
        </div>
        {liveNodeCount === 0 ? (
          <div className="h-[100px] flex items-center justify-center text-[var(--text-muted)] text-sm font-mono-data gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Waiting for live node data…
          </div>
        ) : (
          <LiveMap nodeStatuses={nodeStatuses} />
        )}
        <div className="flex items-center gap-4 mt-3 text-xs font-mono-data text-[var(--text-muted)]">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> OK</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400" /> Error</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-500" /> No data / stale</span>
        </div>
      </Card>

      {/* Target accordion */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-400" />
            Monitor Overview
          </h2>
          <span className="text-xs font-mono-data text-[var(--text-muted)]">
            Bars = last 7 check intervals
          </span>
        </div>

     <div className="space-y-1">
  {monitors.map((monitor) => {
    const sc = STATUS_CONFIG[monitor.status];
    const isExpanded = expandedId === monitor.id;
    const stats = statsCache[monitor.id];

    return (
      <div key={monitor.id} className="border border-[var(--border-subtle)] rounded-lg overflow-hidden">
        {/* Row Header */}
        <button
          onClick={() => handleToggleExpand(monitor.id)}
          className="w-full flex items-center gap-3 px-3 py-3 hover:bg-white/4 transition-colors text-left"
        >
          <span className={`w-2 h-2 rounded-full ${sc.dot} animate-pulse shrink-0`} />
          <div className="min-w-0 flex-1">
            <span className="font-semibold text-sm text-[var(--text-primary)]">{formatUrl(monitor.url)}</span>
          </div>

          {isFetchingStats === monitor.id && <Loader2 className="w-4 h-4 animate-spin text-sky-400" />}
          {isExpanded ? <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />}
        </button>

        {/* Expanded Area */}
        {isExpanded && (
          <div className="px-4 pb-4 pt-2 bg-black/20 border-t border-[var(--border-subtle)]">
            {isFetchingStats === monitor.id ? (
              <div className="text-xs text-sky-400 py-4">Loading stats...</div>
            ) : stats ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <MetricBox label="Uptime 24h" value={`${stats.uptime_pct_24h.toFixed(2)}%`} />
                  <MetricBox label="Uptime 7d" value={`${stats.uptime_pct_7d.toFixed(2)}%`} />
                  <MetricBox label="Avg Latency" value={`${(stats.recent_pings.reduce((a, b) => a + b.LatencyMs, 0) / (stats.recent_pings.length || 1)).toFixed(0)}ms`} />
                  <MetricBox label="Interval" value={`${stats.check_interval}s`} />
                </div>

                <div className="max-h-40 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="text-[var(--text-muted)] uppercase text-[10px]">
                      <tr>
                        <th className="text-left py-1">Time</th>
                        <th className="text-left py-1">Region</th>
                        <th className="text-left py-1">Node</th>
                        <th className="text-right py-1">Latency</th>
                        <th className="text-right py-1">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {stats.recent_pings.map((p) => (
                        <tr key={p.ID}>
                          <td className="py-2 text-[var(--text-muted)]">{new Date(p.Timestamp).toLocaleTimeString()}</td>
                          <td className="py-2 text-sky-400">{p.GeoRegion}</td>
                          <td className="py-2">{p.RunnerPubkey}</td>
                          <td className="py-2 text-right">{p.LatencyMs}ms</td>
                          <td className={`py-2 text-right ${p.Success ? 'text-emerald-400' : 'text-red-400'}`}>
                            {p.Success ? 'OK' : p.ErrorKind}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Button size="sm" onClick={() => setSelectedMonitorId(monitor.id)}>
                  <Globe className="w-3 h-3 mr-2" /> Open Geographic Cockpit
                </Button>
              </div>
            ) : (
              <div className="text-red-400 text-xs py-2">Failed to load statistics.</div>
            )}
          </div>
        )}
      </div>
    );
  })}
</div>
      </Card>

      {/* Alerts */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <h3 className="font-semibold text-[var(--text-primary)]">Alerts</h3>
        </div>
        {monitors.some((m) => m.status === 'down') ? (
          <div className="text-xs text-red-400 font-mono-data bg-red-500/8 border border-red-500/20 rounded-lg px-3 py-2">
            {monitors.filter((m) => m.status === 'down').map((m) => formatUrl(m.url)).join(', ')} — monitor(s) down
          </div>
        ) : monitors.some((m) => m.status === 'degraded') ? (
          <div className="text-xs text-amber-400 font-mono-data bg-amber-500/8 border border-amber-500/20 rounded-lg px-3 py-2">
            Degraded uptime detected on: {monitors.filter((m) => m.status === 'degraded').map((m) => formatUrl(m.url)).join(', ')}
          </div>
        ) : (
          <div className="text-xs text-emerald-400 font-mono-data bg-emerald-500/8 border border-emerald-500/20 rounded-lg px-3 py-2">
            All monitors operating within normal parameters
          </div>
        )}
      </Card>
    </div>
  );
}
