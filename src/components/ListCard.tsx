import { Bourbon } from '../data';

interface ListCardProps {
  bourbon: Bourbon;
  onClick: () => void;
}

export default function ListCard({ bourbon, onClick }: ListCardProps) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 bg-stone-900 border border-stone-800 rounded-xl p-3 cursor-pointer hover:bg-stone-800 transition-colors"
    >
      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-stone-800 to-stone-900 flex items-center justify-center border border-stone-700 shrink-0">
        <span className="font-serif text-2xl text-stone-500 font-bold">{bourbon.name.charAt(0)}</span>
      </div>
      <div>
        <h4 className="font-serif font-bold text-stone-200">{bourbon.name}</h4>
        <p className="text-xs text-stone-500">{bourbon.distillery}</p>
      </div>
    </div>
  );
}
