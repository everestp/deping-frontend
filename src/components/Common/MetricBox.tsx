

type AlertLevel = 'normal' | 'warning' | 'critical';

interface MetricBoxProps {
  label: string;
  value: string | number;
  unit?: string;
  sublabel?: string;
  icon?: React.ReactNode;
  alert?: AlertLevel;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
}

const ALERT_COLORS: Record<AlertLevel, string> = {
  normal: 'text-emerald-400',
  warning: 'text-amber-400',
  critical: 'text-red-400',
};

const ALERT_BORDER: Record<AlertLevel, string> = {
  normal: 'border-emerald-500/20',
  warning: 'border-amber-500/30',
  critical: 'border-red-500/40',
};

export function MetricBox({
  label,
  value,
  unit,
  sublabel,
  icon,
  alert = 'normal',
  trend,
  trendValue,
}: MetricBoxProps) {
  return (
    <div
      className={[
        'glass rounded-xl p-4 transition-all duration-300 hover:scale-[1.02]',
        ALERT_BORDER[alert],
      ].join(' ')}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
          {label}
        </span>
        {icon && (
          <span className={`${ALERT_COLORS[alert]} opacity-80`}>{icon}</span>
        )}
      </div>

      <div className="flex items-end gap-1.5">
        <span className={`font-mono-data text-2xl font-semibold leading-none ${ALERT_COLORS[alert]}`}>
          {value}
        </span>
        {unit && (
          <span className="font-mono-data text-sm text-[var(--text-muted)] mb-0.5">{unit}</span>
        )}
      </div>

      <div className="flex items-center justify-between mt-2">
        {sublabel && (
          <span className="text-xs text-[var(--text-muted)]">{sublabel}</span>
        )}
        {trend && trendValue && (
          <span
            className={`text-xs font-mono-data font-medium ${
              trend === 'up'
                ? 'text-emerald-400'
                : trend === 'down'
                ? 'text-red-400'
                : 'text-[var(--text-muted)]'
            }`}
          >
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
          </span>
        )}
      </div>
    </div>
  );
}
