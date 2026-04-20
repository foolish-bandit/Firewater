interface FlourishProps {
  width?: number;
  className?: string;
}

export function Flourish({ width = 120, className = '' }: FlourishProps) {
  return (
    <svg width={width} height="10" viewBox="0 0 120 10" className={className} aria-hidden>
      <line x1="0" y1="5" x2="50" y2="5" stroke="currentColor" strokeWidth="0.5" />
      <circle cx="54" cy="5" r="1" fill="currentColor" />
      <path d="M60 5 L64 2 L68 5 L64 8 Z" fill="currentColor" />
      <circle cx="66" cy="5" r="1" fill="currentColor" />
      <line x1="70" y1="5" x2="120" y2="5" stroke="currentColor" strokeWidth="0.5" />
    </svg>
  );
}
