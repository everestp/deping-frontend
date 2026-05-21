import React, { useState, useCallback } from 'react';
import {
  Activity,
  RefreshCw,
  Globe,
  Clock,
  TrendingUp,
  Coins,
  Wifi,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  MapPin,
  Info,
  ExternalLink,
} from 'lucide-react';
import { Card } from '../components/Common/Card';
import { MetricBox } from '../components/Common/MetricBox';
import { Button } from '../components/Common/Button';
import { LatencyChart, LatencyDataPoint } from '../components/Metrics/LatencyChart';
import { useInterval } from '../hooks/useInterval';

// ────────────────────────────────────────────────────────────
// ProbeOutcome — mirrors Rust backend telemetry model
// ────────────────────────────────────────────────────────────
interface ProbeOutcome {
  id: string;
  target_id: string;
  region: string;
  timestamp: string;
  success: boolean;
  http_status: number | null;
  error_kind: string | null;
  dns_us: number;
  tcp_us: number;
  tls_us: number;
  ttfb_us: number;
  total_us: number;
}

// ────────────────────────────────────────────────────────────
// Monitored target + aggregated bar data
// ────────────────────────────────────────────────────────────
interface MonitoredTarget {
  id: string;
  url: string;
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  uptimePct: number;
  avgLatencyMs: number;
  bars: BarSegment[];
  probes: ProbeOutcome[];
}

type BarStatus = 'green' | 'red' | 'gray';

interface BarSegment {
  windowStart: string;
  status: BarStatus;
  successCount: number;
  failCount: number;
}

// ────────────────────────────────────────────────────────────
// Geographic node positions on SVG map
// ────────────────────────────────────────────────────────────
interface GeoNode {
  region: string;
  label: string;
  cx: number;
  cy: number;
}

const GEO_NODES: GeoNode[] = [
  { region: 'US-East', label: 'US-East (Virginia)', cx: 248, cy: 175 },
  { region: 'US-West', label: 'US-West (Oregon)', cx: 128, cy: 175 },
  { region: 'EU-Central', label: 'EU-Central (Frankfurt)', cx: 478, cy: 140 },
  { region: 'AP-South', label: 'AP-South (Mumbai)', cx: 628, cy: 205 },
  { region: 'SA-East', label: 'SA-East (São Paulo)', cx: 298, cy: 305 },
];

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────
const REGIONS = ['US-East', 'EU-Central', 'AP-South', 'US-West', 'SA-East'] as const;
const TARGET_URLS = [
  'https://api.deping.xyz',
  'https://solana.com',
  'https://api.coingecko.com',
  'https://mainnet.helius-rpc.com',
  'https://status.solana.com',
];
const TARGET_NAMES = [
  'deping API Gateway',
  'Solana Homepage',
  'CoinGecko Ping',
  'Helius RPC Endpoint',
  'Solana Status Page',
];

function randBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateProbe(targetId: string, region: string): ProbeOutcome {
  const success = Math.random() > 0.06;
  const dns = randBetween(800, 12000);
  const tcp = randBetween(3000, 45000);
  const tls = randBetween(8000, 35000);
  const ttfb = randBetween(15000, 120000);
  const total = dns + tcp + tls + ttfb + randBetween(5000, 80000);
  const now = new Date();
  const ts = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} UTC`;

  return {
    id: Math.random().toString(36).slice(2),
    target_id: targetId,
    region,
    timestamp: ts,
    success,
    http_status: success ? 200 : null,
    error_kind: success ? null : 'ConnectionTimeout',
    dns_us: dns,
    tcp_us: tcp,
    tls_us: tls,
    ttfb_us: ttfb,
    total_us: total,
  };
}

function buildBars(probes: ProbeOutcome[]): BarSegment[] {
  const bars: BarSegment[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 3 * 60 * 1000);
    const windowStart = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    const windowProbes = probes.filter(() => Math.random() > 0.3);
    const successCount = windowProbes.filter((p) => p.success).length || 0;
    const failCount = windowProbes.filter((p) => !p.success).length || 0;

    let status: BarStatus = 'gray';
    if (successCount + failCount > 0) {
      status = successCount >= failCount ? 'green' : 'red';
    }
    bars.push({ windowStart, status, successCount, failCount });
  }
  return bars;
}

function buildInitialTargets(): MonitoredTarget[] {
  return TARGET_URLS.map((url, i) => {
    const probes = Array.from({ length: 20 }, () =>
      generateProbe(`tgt_${String(i + 1).padStart(3, '0')}`, REGIONS[Math.floor(Math.random() * REGIONS.length)])
    );
    const ok = probes.filter((p) => p.success).length;
    const avgMs = Math.round(probes.reduce((s, p) => s + p.total_us, 0) / Math.max(probes.length, 1) / 1000);
    return {
      id: `tgt_${String(i + 1).padStart(3, '0')}`,
      url,
      name: TARGET_NAMES[i],
      status: ok / Math.max(probes.length, 1) > 0.95 ? 'healthy' : ok / Math.max(probes.length, 1) > 0.8 ? 'degraded' : 'down',
      uptimePct: parseFloat(((ok / Math.max(probes.length, 1)) * 100).toFixed(2)),
      avgLatencyMs: avgMs,
      bars: buildBars(probes),
      probes,
    };
  });
}

function generateChartPoint(time: string): LatencyDataPoint {
  return {
    time,
    'US-East': randBetween(18, 85),
    'EU-Central': randBetween(28, 110),
    'AP-South': randBetween(45, 175),
  };
}

function buildInitialChart(): LatencyDataPoint[] {
  const now = Date.now();
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now - (11 - i) * 30000);
    return generateChartPoint(`${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`);
  });
}

// ────────────────────────────────────────────────────────────
// Bar color map
// ────────────────────────────────────────────────────────────
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

// ────────────────────────────────────────────────────────────
// Tooltip component for geo map
// ────────────────────────────────────────────────────────────
interface GeoTooltipProps {
  node: GeoNode;
  probe: ProbeOutcome | null;
  position: { x: number; y: number };
}

function GeoTooltip({ node, probe, position }: GeoTooltipProps) {
  if (!probe) return null;
  const markerColor = !probe.success
    ? 'text-red-400'
    : probe.total_us > 400000
    ? 'text-amber-400'
    : 'text-emerald-400';

  return (
    <div
      className="absolute z-50 glass rounded-xl p-3 border border-[var(--border-subtle)] shadow-xl pointer-events-none min-w-[200px]"
      style={{ left: position.x, top: position.y - 10, transform: 'translate(-50%, -100%)' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <MapPin className={`w-3.5 h-3.5 ${markerColor}`} />
        <span className="text-xs font-semibold text-[var(--text-primary)]">{node.label}</span>
      </div>
      <div className="space-y-1 text-[11px] font-mono-data">
        <div className="flex justify-between">
          <span className="text-[var(--text-muted)]">DNS Lookup</span>
          <span className="text-[var(--text-primary)]">{(probe.dns_us / 1000).toFixed(1)}ms</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--text-muted)]">TCP Connect</span>
          <span className="text-[var(--text-primary)]">{(probe.tcp_us / 1000).toFixed(1)}ms</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--text-muted)]">TLS Handshake</span>
          <span className="text-[var(--text-primary)]">{(probe.tls_us / 1000).toFixed(1)}ms</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--text-muted)]">TTFB</span>
          <span className="text-[var(--text-primary)]">{(probe.ttfb_us / 1000).toFixed(1)}ms</span>
        </div>
        <div className="flex justify-between border-t border-[var(--border-subtle)] pt-1 mt-1">
          <span className="text-[var(--text-muted)] font-semibold">Total</span>
          <span className={`font-semibold ${markerColor}`}>{(probe.total_us / 1000).toFixed(1)}ms</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--text-muted)]">Status</span>
          <span className={probe.success ? 'text-emerald-400' : 'text-red-400'}>
            {probe.http_status ? `HTTP ${probe.http_status}` : probe.error_kind || 'Error'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// SVG World Map component
// ────────────────────────────────────────────────────────────
interface WorldMapProps {
  probes: ProbeOutcome[];
  onTooltip: (data: { node: GeoNode; probe: ProbeOutcome | null; position: { x: number; y: number } } | null) => void;
}

function WorldMap({ probes, onTooltip }: WorldMapProps) {
  function getProbeForRegion(region: string): ProbeOutcome | null {
    return probes?.filter((p) => p.region === region).sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0] || null;
  }

  function markerColor(probe: ProbeOutcome | null): string {
    if (!probe) return 'fill-gray-500';
    if (!probe.success) return 'fill-red-400';
    if (probe.total_us > 400000) return 'fill-amber-400';
    return 'fill-emerald-400';
  }

  function handleHover(node: GeoNode, evt: React.MouseEvent<SVGCircleElement>) {
    const probe = getProbeForRegion(node.region);
    const rect = (evt.currentTarget as SVGCircleElement).getBoundingClientRect();
    onTooltip({
      node,
      probe,
      position: { x: rect.left + rect.width / 2, y: rect.top },
    });
  }

  return (
    <svg viewBox="0 0 800 400" className="w-full h-auto" style={{ maxHeight: '420px' }}>
      {/* Ocean background */}
      <rect x="0" y="0" width="800" height="400" rx="12" fill="rgba(5,8,25,0.6)" />

      {/* Simplified continent outlines */}
      {/* North America */}
      <path d="M100,80 L220,70 L260,100 L270,140 L250,180 L230,200 L200,220 L160,230 L130,210 L100,180 L80,140 Z"
        fill="rgba(56,182,255,0.06)" stroke="rgba(56,182,255,0.15)" strokeWidth="1" />
      {/* South America */}
      <path d="M200,240 L240,230 L270,260 L280,300 L260,340 L230,360 L200,350 L190,310 L195,270 Z"
        fill="rgba(56,182,255,0.06)" stroke="rgba(56,182,255,0.15)" strokeWidth="1" />
      {/* Europe */}
      <path d="M430,80 L500,75 L520,90 L530,120 L510,150 L480,160 L450,150 L430,120 Z"
        fill="rgba(56,182,255,0.06)" stroke="rgba(56,182,255,0.15)" strokeWidth="1" />
      {/* Africa */}
      <path d="M440,170 L500,165 L520,200 L510,260 L490,300 L460,310 L440,280 L430,230 Z"
        fill="rgba(56,182,255,0.06)" stroke="rgba(56,182,255,0.15)" strokeWidth="1" />
      {/* Asia */}
      <path d="M540,70 L700,80 L720,120 L710,180 L680,210 L620,230 L560,220 L540,180 L530,130 Z"
        fill="rgba(56,182,255,0.06)" stroke="rgba(56,182,255,0.15)" strokeWidth="1" />
      {/* Australia */}
      <path d="M640,280 L720,270 L740,300 L720,330 L670,330 L640,310 Z"
        fill="rgba(56,182,255,0.06)" stroke="rgba(56,182,255,0.15)" strokeWidth="1" />

      {/* Grid lines */}
      {[80, 160, 240, 320].map((y) => (
        <line key={`h${y}`} x1="0" y1={y} x2="800" y2={y} stroke="rgba(56,182,255,0.04)" strokeWidth="0.5" />
      ))}
      {[160, 320, 480, 640].map((x) => (
        <line key={`v${x}`} x1={x} y1="0" x2={x} y2="400" stroke="rgba(56,182,255,0.04)" strokeWidth="0.5" />
      ))}

      {/* Node markers */}
      {GEO_NODES.map((node) => {
        const probe = getProbeForRegion(node.region);
        const color = markerColor(probe);
        const isActive = probe?.success !== false;
        return (
          <g key={node.region}>
            {/* Pulse ring */}
            {isActive && (
              <circle cx={node.cx} cy={node.cy} r="14" fill="none" stroke={probe && probe.total_us < 150000 ? 'rgba(52,211,153,0.3)' : probe && probe.total_us < 400000 ? 'rgba(251,191,36,0.3)' : 'rgba(248,113,113,0.3)'} strokeWidth="1.5" className="animate-pulse-dot" />
            )}
            {/* Core dot */}
            <circle
              cx={node.cx}
              cy={node.cy}
              r="6"
              className={color}
              style={{ cursor: 'pointer' }}
              onMouseEnter={(evt) => handleHover(node, evt as unknown as React.MouseEvent<SVGCircleElement>)}
              onMouseLeave={() => onTooltip(null)}
            />
            {/* Label */}
            <text x={node.cx} y={node.cy + 22} textAnchor="middle" fill="rgba(148,163,184,0.7)" fontSize="9" fontFamily="JetBrains Mono, monospace">
              {node.region}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ────────────────────────────────────────────────────────────
// Main Dashboard
// ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [targets, setTargets] = useState<MonitoredTarget[]>(buildInitialTargets);
  const [chartData, setChartData] = useState<LatencyDataPoint[]>(buildInitialChart);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [totalChecks, setTotalChecks] = useState(142847);
  const [pendingRewards, setPendingRewards] = useState(3.47);

  // View state: null = accordion grid, string = selected target ID for geo map
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [tooltipData, setTooltipData] = useState<{ node: GeoNode; probe: ProbeOutcome | null; position: { x: number; y: number } } | null>(null);

  const selectedTarget = targets?.find((t) => t.id === selectedTargetId) || null;

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 600));

    const now = new Date();
    const label = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setChartData((prev) => [...(prev || []).slice(-11), generateChartPoint(label)]);

    setTargets((prev) =>
      (prev || []).map((t) => {
        const newProbes = [
          ...t.probes.slice(-19),
          generateProbe(t.id, REGIONS[Math.floor(Math.random() * REGIONS.length)]),
        ];
        const ok = newProbes.filter((p) => p.success).length;
        const avgMs = Math.round(newProbes.reduce((s, p) => s + p.total_us, 0) / Math.max(newProbes.length, 1) / 1000);
        return {
          ...t,
          probes: newProbes,
          bars: buildBars(newProbes),
          status: ok / Math.max(newProbes.length, 1) > 0.95 ? 'healthy' as const : ok / Math.max(newProbes.length, 1) > 0.8 ? 'degraded' as const : 'down' as const,
          uptimePct: parseFloat(((ok / Math.max(newProbes.length, 1)) * 100).toFixed(2)),
          avgLatencyMs: avgMs,
        };
      })
    );

    setTotalChecks((p) => p + randBetween(40, 120));
    setPendingRewards((p) => parseFloat((p + randBetween(3, 8) * 0.01).toFixed(4)));
    setLastRefresh(new Date());
    setRefreshing(false);
  }, []);

  useInterval(refresh, 30000);
  useInterval(() => setTotalChecks((p) => p + randBetween(1, 4)), 2000);

  const avgLatency =
    chartData?.length > 0
      ? Math.round(
          (chartData || []).slice(-3).reduce((sum, d) => sum + (d?.['US-East'] || 0) + (d?.['EU-Central'] || 0) + (d?.['AP-South'] || 0), 0) /
            Math.max((chartData || []).slice(-3).length * 3, 1)
        )
      : 0;

  const allProbes = (targets || []).flatMap((t) => t?.probes || []);
  const uptimeOk = (allProbes?.filter((p) => p?.success).length || 0) / Math.max(allProbes?.length || 1, 1);
  const uptimePct = (uptimeOk * 100).toFixed(2);
  const alertLevel = avgLatency > 150 ? 'critical' : avgLatency > 80 ? 'warning' : 'normal';

  // ──────────────────────────────────────────────────────────
  // PHASE B: Geographic Map Drill-Down View
  // ──────────────────────────────────────────────────────────
  if (selectedTargetId && selectedTarget) {
    const targetProbes = selectedTarget?.probes || [];
    const regionProbes = REGIONS.map((region) => {
      const rp = targetProbes?.filter((p) => p?.region === region) || [];
      const avgTotal = rp.length > 0 ? rp.reduce((s, p) => s + (p?.total_us || 0), 0) / rp.length : 0;
      const okCount = rp.filter((p) => p?.success).length;
      return { region, avgMs: Math.round(avgTotal / 1000), availability: rp.length > 0 ? ((okCount / rp.length) * 100).toFixed(1) : '0.0', count: rp.length };
    });
    const globalAvg = regionProbes.length > 0 ? Math.round(regionProbes.reduce((s, r) => s + r.avgMs, 0) / regionProbes.length) : 0;
    const globalAvail = regionProbes.length > 0 ? (regionProbes.reduce((s, r) => s + parseFloat(r.availability), 0) / regionProbes.length).toFixed(1) : '0.0';

    return (
      <div className="space-y-6 animate-fade-in-up">
        {/* Back button + header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setSelectedTargetId(null); setTooltipData(null); }}
            className="w-9 h-9 rounded-lg glass border border-[var(--border-subtle)] flex items-center justify-center text-sky-400 hover:bg-sky-500/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-mono-data text-xl font-semibold text-[var(--text-primary)]">
              Geographic Cockpit
            </h1>
            <p className="text-sm text-[var(--text-muted)] font-mono-data mt-0.5">
              {selectedTarget.name} — {selectedTarget.url}
            </p>
          </div>
        </div>

        {/* Map */}
        <Card className="relative overflow-visible">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-4 h-4 text-sky-400" />
            <h2 className="font-semibold text-[var(--text-primary)]">Global Node Distribution</h2>
            <span className="ml-auto text-xs font-mono-data text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
              {targetProbes?.length || 0} probes
            </span>
          </div>
          <div className="relative">
            <WorldMap probes={targetProbes} onTooltip={setTooltipData} />
            {tooltipData && <GeoTooltip {...tooltipData} />}
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 text-xs font-mono-data text-[var(--text-muted)]">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> &lt;150ms</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> 150–400ms</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400" /> &gt;400ms / Error</span>
          </div>
        </Card>

        {/* Analytics grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricBox label="Global Avg Response" value={globalAvg} unit="ms" alert={globalAvg > 400 ? 'critical' : globalAvg > 150 ? 'warning' : 'normal'} />
          <MetricBox label="Global Availability" value={globalAvail} unit="%" alert={parseFloat(globalAvail) > 99 ? 'normal' : 'warning'} />
          <MetricBox label="Total Probes" value={targetProbes?.length || 0} sublabel="All regions" />
          <MetricBox label="Target Uptime" value={selectedTarget?.uptimePct || 0} unit="%" alert={(selectedTarget?.uptimePct || 0) > 99 ? 'normal' : 'warning'} />
        </div>

        {/* Region breakdown */}
        <Card>
          <h2 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-400" />
            Regional Performance Breakdown
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  {['Region', 'Avg Latency', 'Availability', 'Probes'].map((h) => (
                    <th key={h} className="text-left px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {regionProbes.map((r) => (
                  <tr key={r.region} className="hover:bg-white/3 transition-colors">
                    <td className="px-3 py-2.5 font-mono-data text-xs text-sky-400">{r.region}</td>
                    <td className="px-3 py-2.5 font-mono-data text-xs font-medium text-[var(--text-primary)]">{r.avgMs}ms</td>
                    <td className="px-3 py-2.5 font-mono-data text-xs font-medium text-emerald-400">{r.availability}%</td>
                    <td className="px-3 py-2.5 font-mono-data text-xs text-[var(--text-muted)]">{r.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────
  // PHASE A: Accordion Grid Overview
  // ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-mono-data text-xl font-semibold text-[var(--text-primary)]">
            Network Dashboard
          </h1>
          <p className="text-sm text-[var(--text-muted)] font-mono-data mt-0.5">
            Last updated: {lastRefresh.toLocaleTimeString()} — auto-refresh every 30s
          </p>
        </div>
        <Button variant="secondary" size="sm" loading={refreshing} onClick={refresh}>
          <RefreshCw className="w-3.5 h-3.5" />
          {refreshing ? 'Refreshing...' : 'Refresh Metrics'}
        </Button>
      </div>

      {/* Top-level metric boxes */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricBox
          label="Monitored Targets"
          value={(targets || []).length}
          sublabel="All targets active"
          icon={<Globe className="w-4 h-4" />}
          alert="normal"
          trend="stable"
          trendValue="No change"
        />
        <MetricBox
          label="Avg Response Latency"
          value={avgLatency}
          unit="ms"
          sublabel="Across all regions"
          icon={<Clock className="w-4 h-4" />}
          alert={alertLevel}
          trend={avgLatency > 80 ? 'up' : 'down'}
          trendValue={`${avgLatency > 80 ? '+' : '-'}${Math.abs(avgLatency - 60)}ms`}
        />
        <MetricBox
          label="Fleet Uptime"
          value={uptimePct}
          unit="%"
          sublabel="Last 100 checks"
          icon={<Wifi className="w-4 h-4" />}
          alert={parseFloat(uptimePct) > 99 ? 'normal' : 'warning'}
          trend="stable"
          trendValue="SLA met"
        />
        <MetricBox
          label="Pending Rewards"
          value={pendingRewards.toFixed(4)}
          unit="$UPT"
          sublabel="Accumulating off-chain"
          icon={<Coins className="w-4 h-4" />}
          alert="normal"
          trend="up"
          trendValue="+0.05 / min"
        />
      </div>

      {/* 7-Bar Uptime Accordion */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-400" />
            Target Uptime Overview
          </h2>
          <span className="text-xs font-mono-data text-[var(--text-muted)]">Last 21 minutes</span>
        </div>

        <div className="space-y-1">
          {(targets || []).map((target) => {
            const sc = STATUS_CONFIG[target?.status || 'healthy'];
            const isExpanded = expandedRow === target?.id;

            return (
              <div key={target?.id || Math.random()}>
                {/* Accordion row */}
                <button
                  onClick={() => setExpandedRow(isExpanded ? null : target?.id || null)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/4 transition-colors text-left"
                >
                  {/* Status dot */}
                  <span className={`w-2 h-2 rounded-full ${sc.dot} animate-pulse-dot shrink-0`} />

                  {/* Name + URL */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-[var(--text-primary)] truncate">{target?.name || 'Unknown'}</span>
                      <span className={`text-[10px] font-mono-data px-1.5 py-0.5 rounded border ${sc.bg} ${sc.color}`}>
                        {sc.label}
                      </span>
                    </div>
                    <span className="text-xs font-mono-data text-[var(--text-muted)] truncate block">{target?.url || ''}</span>
                  </div>

                  {/* 7-bar timeline */}
                  <div className="flex items-center gap-1 shrink-0">
                    {(target?.bars || []).map((bar, bi) => (
                      <div
                        key={`${target?.id}-bar-${bi}`}
                        className={`w-5 h-5 rounded-sm border ${BAR_COLORS[bar?.status || 'gray']} ${BAR_BORDERS[bar?.status || 'gray']} transition-colors`}
                        title={`${bar?.windowStart || ''}: ${bar?.successCount || 0} ok, ${bar?.failCount || 0} fail`}
                      />
                    ))}
                  </div>

                  {/* Uptime + latency */}
                  <div className="text-right shrink-0 hidden sm:block">
                    <p className="font-mono-data text-xs font-semibold text-emerald-400">{target?.uptimePct?.toFixed(2) || '0.00'}%</p>
                    <p className="font-mono-data text-[10px] text-[var(--text-muted)]">{target?.avgLatencyMs || 0}ms</p>
                  </div>

                  {/* Chevron */}
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                  )}
                </button>

                {/* Expanded details drawer */}
                {isExpanded && (
                  <div className="ml-5 mr-3 mb-2 p-4 glass rounded-lg border border-[var(--border-subtle)] animate-fade-in-up">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      <div className="text-center">
                        <p className="text-xs text-[var(--text-muted)]">Uptime</p>
                        <p className="font-mono-data text-lg font-bold text-emerald-400">{target?.uptimePct?.toFixed(2) || '0.00'}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-[var(--text-muted)]">Avg Latency</p>
                        <p className="font-mono-data text-lg font-bold text-sky-400">{target?.avgLatencyMs || 0}ms</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-[var(--text-muted)]">Probes</p>
                        <p className="font-mono-data text-lg font-bold text-[var(--text-primary)]">{target?.probes?.length || 0}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-[var(--text-muted)]">Status</p>
                        <p className={`font-mono-data text-lg font-bold ${sc.color}`}>{sc.label}</p>
                      </div>
                    </div>

                    {/* Recent probes table */}
                    <div className="mb-4 max-h-32 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-[var(--border-subtle)]">
                            {['Time', 'Region', 'Total', 'Status'].map((h) => (
                              <th key={h} className="text-left px-2 py-1.5 text-[10px] uppercase tracking-wider text-[var(--text-muted)]">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-subtle)]">
                          {(target?.probes || []).slice(-5).reverse().map((p) => (
                            <tr key={p?.id || Math.random()} className="hover:bg-white/3">
                              <td className="px-2 py-1.5 font-mono-data text-[var(--text-muted)]">{p?.timestamp || ''}</td>
                              <td className="px-2 py-1.5 font-mono-data text-sky-400">{p?.region || ''}</td>
                              <td className="px-2 py-1.5 font-mono-data text-[var(--text-primary)]">{((p?.total_us || 0) / 1000).toFixed(1)}ms</td>
                              <td className="px-2 py-1.5">
                                <span className={`font-mono-data ${p?.success ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {p?.http_status ? `HTTP ${p.http_status}` : p?.error_kind || 'Error'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Open geo map button */}
                    <Button
                      size="sm"
                      onClick={() => setSelectedTargetId(target?.id || null)}
                      className="animate-border-glow"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      Open Full Geographic Cockpit Map
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Latency chart */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-400" />
            <h2 className="font-semibold text-[var(--text-primary)]">Latency Trends</h2>
          </div>
          <span className="text-xs text-[var(--text-muted)] font-mono-data">Last 6 minutes</span>
        </div>
        <LatencyChart data={chartData || []} />
      </Card>

      {/* Alerts */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <h3 className="font-semibold text-[var(--text-primary)]">Alerts</h3>
        </div>
        {avgLatency > 100 ? (
          <div className="text-xs text-amber-400 font-mono-data bg-amber-500/8 border border-amber-500/20 rounded-lg px-3 py-2">
            High latency detected on AP-South region
          </div>
        ) : (
          <div className="text-xs text-emerald-400 font-mono-data bg-emerald-500/8 border border-emerald-500/20 rounded-lg px-3 py-2">
            All systems operating within normal parameters
          </div>
        )}
      </Card>
    </div>
  );
}
