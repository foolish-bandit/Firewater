import { LucideIcon } from 'lucide-react';

interface StatBoxProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
}

export default function StatBox({ label, value, icon: Icon }: StatBoxProps) {
  return (
    <div className="border border-border-subtle bg-surface-raised p-5 flex flex-col items-center justify-center text-center transition-colors duration-200 hover:border-border-accent">
      {Icon && <Icon size={14} className="text-on-surface-accent mb-2" />}
      <span className="micro-label text-on-surface-muted mb-1">{label}</span>
      <span className="heading-md text-2xl italic text-on-surface">{value}</span>
    </div>
  );
}
