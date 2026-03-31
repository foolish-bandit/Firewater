import { Bourbon } from '../data';

interface ListCardProps {
  bourbon: Bourbon;
  onClick: () => void;
}

export default function ListCard({ bourbon, onClick }: ListCardProps) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 bg-[#1A1816] vintage-border p-3 cursor-pointer hover:border-[#C89B3C] transition-colors"
    >
      <div className="w-16 h-16 vintage-border bg-[#141210] flex items-center justify-center shrink-0">
        <span className="font-serif text-2xl text-[#C89B3C]">{bourbon.name.charAt(0)}</span>
      </div>
      <div>
        <h4 className="font-serif text-lg text-[#EAE4D9]">{bourbon.name}</h4>
        <p className="micro-label text-[#C89B3C]">{bourbon.distillery}</p>
      </div>
    </div>
  );
}
