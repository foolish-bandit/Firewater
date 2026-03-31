import { Heart, CheckCircle } from 'lucide-react';
import { Bourbon } from '../data';
import ListCard from './ListCard';

interface ListsViewProps {
  wantToTry: string[];
  tried: string[];
  onSelect: (id: string) => void;
  bourbons: Bourbon[];
}

export default function ListsView({ wantToTry, tried, onSelect, bourbons }: ListsViewProps) {
  const wantBourbons = wantToTry.map((id) => bourbons.find((b) => b.id === id)).filter(Boolean) as Bourbon[];
  const triedBourbons = tried.map((id) => bourbons.find((b) => b.id === id)).filter(Boolean) as Bourbon[];

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <div className="text-center space-y-4 py-8">
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-amber-50">My Barrel Book</h1>
        <p className="text-stone-400 max-w-2xl mx-auto text-lg">Track your whiskey journey.</p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b border-stone-800 pb-4">
          <Heart className="text-rose-500" size={24} />
          <h2 className="font-serif text-2xl font-bold text-stone-100">Want to Try ({wantBourbons.length})</h2>
        </div>

        {wantBourbons.length === 0 ? (
          <div className="bg-stone-900 border border-stone-800 border-dashed rounded-2xl p-12 text-center text-stone-500">
            Your wishlist is empty. Explore the catalog to find new pours.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wantBourbons.map((b) => (
              <ListCard key={b.id} bourbon={b} onClick={() => onSelect(b.id)} />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b border-stone-800 pb-4">
          <CheckCircle className="text-emerald-500" size={24} />
          <h2 className="font-serif text-2xl font-bold text-stone-100">Tried ({triedBourbons.length})</h2>
        </div>

        {triedBourbons.length === 0 ? (
          <div className="bg-stone-900 border border-stone-800 border-dashed rounded-2xl p-12 text-center text-stone-500">
            You haven't marked any bourbons as tried yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {triedBourbons.map((b) => (
              <ListCard key={b.id} bourbon={b} onClick={() => onSelect(b.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
