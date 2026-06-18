// ─────────────────────────────────────────────
// components/miner/TerminalFeed.tsx
// ─────────────────────────────────────────────

import { Cpu } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { TerminalLine } from '../../types/miner';

interface TerminalFeedProps {
  lines: TerminalLine[];
}

const lineColor: Record<TerminalLine['type'], string> = {
  reward: 'var(--accent-green)',
  warn:   'var(--accent-amber)',
  info:   'var(--text-muted)',
};

export function TerminalFeed({ lines }: TerminalFeedProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [lines]);

  return (
    <div
      className="glass rounded-2xl p-5"
      style={{ border: '1px solid var(--border-subtle)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Cpu className="w-4 h-4" style={{ color: 'var(--accent-blue)' }} />
        <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
          Node Activity Feed
        </h2>
        <span className="ml-auto flex items-center gap-1.5 text-[10px] font-mono-data" style={{ color: 'var(--accent-green)' }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot" style={{ background: 'var(--accent-green)' }} />
          LIVE
        </span>
      </div>

      {/* Terminal body */}
      <div
        ref={ref}
        className="terminal-bg h-48 overflow-y-auto rounded-lg p-3 space-y-1"
      >
        {lines.map((line) => (
          <p
            key={line.id}
            className="font-mono-data text-[11px] leading-relaxed"
            style={{ color: lineColor[line.type] }}
          >
            {line.text}
          </p>
        ))}
        {/* blinking cursor */}
        <span
          className="inline-block w-2 h-3 ml-0.5 align-middle animate-terminal-blink"
          style={{ background: 'var(--accent-green)' }}
        />
      </div>
    </div>
  );
}
