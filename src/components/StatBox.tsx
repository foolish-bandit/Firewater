import { LucideIcon } from 'lucide-react';

interface StatBoxProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
}

export default function StatBox({ label, value, icon: Icon }: StatBoxProps) {
  return (
    <div className="bg-[#1A1816] vintage-border border-t-2 border-t-[#C89B3C]/30 p-5 flex flex-col items-center justify-center text-center card-elevated hover:border-[#EAE4D9]/25 transition-all duration-300">
      {Icon && <Icon size={18} className="text-[#C89B3C] mb-2" />}
      <span className="micro-label text-[#C89B3C] mb-1">{label}</span>
      <span className="font-serif text-2xl text-[#EAE4D9]">{value}</span>
    </div>
  );
}
