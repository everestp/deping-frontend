

type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost' | 'success';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:
    'bg-sky-500 hover:bg-sky-400 text-white border border-sky-400/30 animate-border-glow shadow-[0_0_16px_rgba(56,182,255,0.25)]',
  secondary:
    'bg-transparent hover:bg-white/5 text-sky-300 border border-sky-400/30 hover:border-sky-400/60',
  destructive:
    'bg-transparent hover:bg-red-500/10 text-red-400 border border-red-500/30 hover:border-red-500/60',
  ghost:
    'bg-transparent hover:bg-white/5 text-[var(--text-secondary)] border border-transparent hover:border-white/10',
  success:
    'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/30 shadow-[0_0_12px_rgba(52,211,153,0.2)]',
};

const SIZE_STYLES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className = '',
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium font-mono-data transition-all duration-200',
        VARIANT_STYLES[variant],
        SIZE_STYLES[size],
        isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}
