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
      className="flex items-center gap-4 bg-[#1A1816] vintage-border p-5 cursor-pointer hover:border-[#C89B3C] card-elevated card-elevated-hover transition-all duration-300 group border-l-2 border-l-transparent hover:border-l-[#C89B3C]"
    >
      {/* Mini flavor signature */}
      <div className="w-14 shrink-0 space-y-1">
        {topFlavors.map(f => (
          <div key={f.name} className="flex items-center gap-1">
            <div className="h-[3px] bg-[#141210] rounded-full flex-1 overflow-hidden">
              <div
                className="h-full bg-[#C89B3C]/60 rounded-full"
                style={{ width: `${(f.value / 10) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-serif text-lg text-[#EAE4D9] group-hover:text-[#C89B3C] transition-colors truncate">{liquor.name}</h4>
        <p className="micro-label text-[#C89B3C]">{liquor.distillery}</p>
        {liquor.type && <p className="micro-label text-[#EAE4D9]/40 mt-0.5">{liquor.type}</p>}
      </div>

      <div className="text-right shrink-0">
        <p className="text-sm font-serif text-[#EAE4D9]/60">{liquor.proof}°</p>
        <p className="text-sm font-serif text-[#EAE4D9]/40 italic">${liquor.price}</p>
      </div>

      <ChevronRight size={16} className="text-[#EAE4D9]/20 group-hover:text-[#C89B3C] transition-colors shrink-0" />
    </div>
  );
}
