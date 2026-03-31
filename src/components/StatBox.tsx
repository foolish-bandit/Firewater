import { LucideIcon } from 'lucide-react';

interface StatBoxProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
}

export default function StatBox({ label, value, icon: Icon }: StatBoxProps) {
  return (
    <div className="surface-raised border-t-2 border-t-on-surface-accent/30 p-5 flex flex-col items-center justify-center text-center card-elevated hover:border-border-subtle transition-all duration-300">
      {Icon && <Icon size={18} className="text-on-surface-accent mb-2" />}
      <span className="micro-label text-on-surface-accent mb-1">{label}</span>
      <span className="font-serif text-2xl text-on-surface">{value}</span>
    </div>
  );
}
