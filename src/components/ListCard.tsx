import { ChevronRight } from 'lucide-react';
import { Liquor } from '../data';

interface ListCardProps {
  liquor: Liquor;
  onClick: () => void;
}

function getTopFlavors(liquor: Liquor, count: number = 4): { name: string; value: number }[] {
  const entries = Object.entries(liquor.flavorProfile);
  entries.sort((a, b) => b[1] - a[1]);
  return entries.slice(0, count).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value,
  }));
}

export default function ListCard({ liquor, onClick }: ListCardProps) {
  const topFlavors = getTopFlavors(liquor);

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 border border-border-subtle bg-surface-raised p-5 cursor-pointer hover:border-border-accent-strong transition-colors duration-200 group"
    >
      {/* Mini flavor signature */}
      <div className="w-14 shrink-0 space-y-1">
        {topFlavors.map(f => (
          <div key={f.name} className="flex items-center gap-1">
            <div className="h-[2px] bg-surface-base flex-1 overflow-hidden">
              <div
                className="h-full bg-on-surface-accent/60"
                style={{ width: `${(f.value / 10) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1 min-w-0">
        <p className="micro-label text-on-surface-accent">
          <span className="text-on-surface-accent">◆</span> {liquor.distillery}
        </p>
        <h4 className="heading-md text-lg italic text-on-surface group-hover:text-on-surface-accent transition-colors truncate mt-1">{liquor.name}</h4>
        {liquor.type && (
          <p
            className="text-[10px] tracking-[0.22em] uppercase text-on-surface-muted mt-1"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {liquor.type}
          </p>
        )}
      </div>

      <div className="text-right shrink-0">
        <p
          className="text-[10px] tracking-[0.22em] uppercase text-on-surface-muted"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {liquor.proof} PR
        </p>
        <p className="font-serif text-lg italic text-on-surface-accent mt-0.5">${liquor.price}</p>
      </div>

      <ChevronRight size={14} className="text-on-surface/20 group-hover:text-on-surface-accent transition-colors shrink-0" />
    </div>
  );
}
