import React from 'react';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';

export interface LogEntry {
  id: string;
  timestamp: string;
  region: string;
  target: string;
  latency: number;
  status: number;
  healthy: boolean;
}

interface LogTableProps {
  entries: LogEntry[];
}

const REGION_COLORS: Record<string, string> = {
  'US-East': 'text-sky-400 bg-sky-500/10',
  'US-East-2': 'text-sky-400 bg-sky-500/10',
  'EU-Central': 'text-emerald-400 bg-emerald-500/10',
  'AP-South': 'text-amber-400 bg-amber-500/10',
  'AP-South-1': 'text-amber-400 bg-amber-500/10',
  'SA-East': 'text-purple-400 bg-purple-500/10',
};

function StatusBadge({ status }: { status: number }) {
  const ok = status >= 200 && status < 300;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono-data font-medium ${
        ok ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
      }`}
    >
      {ok ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
      {status}
    </span>
  );
}

export function LogTable({ entries }: LogTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border-subtle)]">
            {['Timestamp', 'Region', 'Target', 'Latency', 'Status'].map((h) => (
              <th
                key={h}
                className="text-left px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-subtle)]">
          {entries.map((entry) => (
            <tr key={entry.id} className="hover:bg-white/3 transition-colors">
              <td className="px-3 py-2.5">
                <span className="font-mono-data text-xs text-[var(--text-muted)]">
                  {entry.timestamp}
                </span>
              </td>
              <td className="px-3 py-2.5">
                <span
                  className={`text-xs font-mono-data px-2 py-0.5 rounded ${
                    REGION_COLORS[entry.region] || 'text-[var(--text-secondary)] bg-white/5'
                  }`}
                >
                  {entry.region}
                </span>
              </td>
              <td className="px-3 py-2.5">
                <span className="font-mono-data text-xs text-[var(--text-secondary)] truncate max-w-[160px] block">
                  {entry.target}
                </span>
              </td>
              <td className="px-3 py-2.5">
                <span
                  className={`font-mono-data text-xs font-medium ${
                    entry.latency < 80
                      ? 'text-emerald-400'
                      : entry.latency < 200
                      ? 'text-amber-400'
                      : 'text-red-400'
                  }`}
                >
                  {entry.latency}ms
                </span>
              </td>
              <td className="px-3 py-2.5">
                <StatusBadge status={entry.status} />
              </td>
            </tr>
          ))}
          {entries.length === 0 && (
            <tr>
              <td colSpan={5} className="px-3 py-8 text-center text-[var(--text-muted)] text-sm">
                <Clock className="w-5 h-5 mx-auto mb-2 opacity-40" />
                No log entries yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
