
import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
export interface LatencyDataPoint {
  time: string;
  dns: number;
  tcp: number;
  tls: number;
  total: number; // Changed from totalUs to 'total'
}

interface LatencyChartProps {
  data: LatencyDataPoint[];
}

const LINES = [
  { key: 'dns', color: '#3b82f6' },
  { key: 'tcp', color: '#fbbf24' }, // Make this bright Amber
  { key: 'tls', color: '#8b5cf6' },
  { key: 'total', color: '#ffffff' },
];
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { color: string; name: string; value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="glass rounded-lg p-3 border border-[var(--border-subtle)] shadow-xl">
      <p className="text-xs text-[var(--text-muted)] font-mono-data mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs font-mono-data">
          <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-[var(--text-secondary)]">{entry.name}:</span>
          <span className="font-semibold" style={{ color: entry.color }}>
            {entry.value}ms
          </span>
        </div>
      ))}
    </div>
  );
}

export function LatencyChart({ data }: LatencyChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis
          dataKey="time"
          tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}ms`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend verticalAlign="top" height={36} iconType="circle" />
        
        {/* Render breakdown lines */}
        {LINES.filter(l => l.key !== 'total').map(({ key, color }) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={color}
            strokeWidth={2}
            dot={false}
            opacity={0.7}
          />
        ))}

        {/* Render 'total' last to sit on top */}
        <Line
          type="monotone"
          dataKey="total"
          stroke="#ffffff"
          strokeWidth={3}
          dot={{ r: 4, fill: '#ffffff' }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
