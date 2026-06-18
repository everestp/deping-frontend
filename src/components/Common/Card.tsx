

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  float?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', glow = false, float = false, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={[
        'glass rounded-xl p-5 transition-all duration-300',
        glow ? 'glow-indigo' : '',
        float ? 'animate-float-slow' : '',
        onClick ? 'cursor-pointer hover:scale-[1.015]' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}
