interface CompassMarkProps {
  size?: number;
  opacity?: number;
  className?: string;
}

export function CompassMark({ size = 32, opacity = 0.9, className = '' }: CompassMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      style={{ opacity }}
      className={className}
      aria-hidden
    >
      <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="0.5" />
      <circle cx="16" cy="16" r="10" fill="none" stroke="currentColor" strokeWidth="0.3" strokeDasharray="1 1" />
      {[0, 90, 180, 270].map((a) => (
        <path key={a} d="M16 2 L18 16 L16 30 L14 16 Z" fill="currentColor" transform={`rotate(${a} 16 16)`} />
      ))}
      {[45, 135, 225, 315].map((a) => (
        <path key={a} d="M16 6 L17 16 L16 26 L15 16 Z" fill="currentColor" opacity="0.4" transform={`rotate(${a} 16 16)`} />
      ))}
    </svg>
  );
}
