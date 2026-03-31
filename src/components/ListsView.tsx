import { useNavigate } from 'react-router-dom';
import { Heart, CheckCircle } from 'lucide-react';
import { Heart, CheckCircle, Download } from 'lucide-react';
import { Bourbon } from '../data';
import { ViewState } from '../types';
import ListCard from './ListCard';

function formatBourbon(b: Bourbon): string {
  return `- ${b.name} (${b.distillery}) — $${b.price} — ${b.proof} proof`;
}

function exportLists(wantBourbons: Bourbon[], triedBourbons: Bourbon[]) {
  const lines = ['=== BARREL BOOK — MY LISTS ===', ''];
  lines.push('WANT TO TRY:');
  if (wantBourbons.length === 0) {
    lines.push('(none)');
  } else {
    wantBourbons.forEach(b => lines.push(formatBourbon(b)));
  }
  lines.push('');
  lines.push('TRIED:');
  if (triedBourbons.length === 0) {
    lines.push('(none)');
  } else {
    triedBourbons.forEach(b => lines.push(formatBourbon(b)));
  }
  lines.push('');
  lines.push(`Exported from Barrel Book on ${new Date().toLocaleDateString()}`);

  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'barrel-book-lists.txt';
  a.click();
  URL.revokeObjectURL(url);
}

interface ListsViewProps {
  wantToTry: string[];
  tried: string[];
  bourbons: Bourbon[];
}

export default function ListsView({ wantToTry, tried, bourbons }: ListsViewProps) {
  const navigate = useNavigate();
  onSelect: (id: string) => void;
  onNavigate: (view: ViewState) => void;
  bourbons: Bourbon[];
}

export default function ListsView({ wantToTry, tried, onSelect, onNavigate, bourbons }: ListsViewProps) {
  const wantBourbons = wantToTry.map((id) => bourbons.find((b) => b.id === id)).filter(Boolean) as Bourbon[];
  const triedBourbons = tried.map((id) => bourbons.find((b) => b.id === id)).filter(Boolean) as Bourbon[];

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <div className="text-center space-y-4 py-8">
        <h1 className="font-serif text-4xl md:text-5xl font-normal text-[#EAE4D9]">My Barrel Book</h1>
        <p className="text-[#EAE4D9]/60 font-serif italic max-w-2xl mx-auto text-lg">Track your whiskey journey.</p>
        {(wantBourbons.length > 0 || triedBourbons.length > 0) && (
          <button
            onClick={() => exportLists(wantBourbons, triedBourbons)}
            className="inline-flex items-center gap-2 bg-transparent vintage-border hover:bg-[#C89B3C] hover:text-[#141210] hover:border-[#C89B3C] text-[#C89B3C] font-sans font-semibold tracking-widest uppercase text-xs px-6 py-2 transition-colors"
          >
            <Download size={14} />
            Export Lists
          </button>
        )}
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-3 vintage-border-b pb-4">
          <Heart className="text-[#C89B3C]" size={24} />
          <h2 className="font-serif text-2xl text-[#EAE4D9]">Want to Try ({wantBourbons.length})</h2>
        </div>

        {wantBourbons.length === 0 ? (
          <div className="bg-stone-900 border border-stone-800 border-dashed rounded-2xl p-12 text-center text-stone-500">
            Your wishlist is empty. Explore the catalog to find new pours.
            <div>
              <button
                onClick={() => navigate('/catalog')}
                className="mt-4 bg-transparent vintage-border hover:bg-[#C89B3C] hover:text-[#141210] hover:border-[#C89B3C] text-[#C89B3C] px-6 py-3 font-sans font-semibold tracking-widest uppercase text-xs transition-all duration-300"
              >
                Browse the Catalog
              </button>
            </div>
          <div className="bg-[#1A1816] vintage-border border-dashed p-12 text-center text-[#EAE4D9]/40 font-serif italic">
            <p className="mb-6">Your wishlist is empty. Explore the catalog to find new pours.</p>
            <button
              onClick={() => onNavigate('catalog')}
              className="bg-transparent vintage-border hover:bg-[#C89B3C] hover:text-[#141210] hover:border-[#C89B3C] text-[#C89B3C] font-sans font-semibold tracking-widest uppercase px-6 py-2 transition-colors"
            >
              Browse Catalog
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wantBourbons.map((b) => (
              <ListCard key={b.id} bourbon={b} onClick={() => { navigate(`/bourbon/${b.id}`); }} />
            ))}
          </div>
        )}
      </div>

      <div className="w-full h-px bg-gradient-to-r from-transparent via-[#C89B3C]/30 to-transparent" />

      <div className="space-y-6">
        <div className="flex items-center gap-3 vintage-border-b pb-4">
          <CheckCircle className="text-[#C89B3C]" size={24} />
          <h2 className="font-serif text-2xl text-[#EAE4D9]">Tried ({triedBourbons.length})</h2>
        </div>

        {triedBourbons.length === 0 ? (
          <div className="bg-stone-900 border border-stone-800 border-dashed rounded-2xl p-12 text-center text-stone-500">
            You haven't marked any bourbons as tried yet.
            <div>
              <button
                onClick={() => navigate('/catalog')}
                className="mt-4 bg-transparent vintage-border hover:bg-[#C89B3C] hover:text-[#141210] hover:border-[#C89B3C] text-[#C89B3C] px-6 py-3 font-sans font-semibold tracking-widest uppercase text-xs transition-all duration-300"
              >
                Explore Bourbons
              </button>
            </div>
          <div className="bg-[#1A1816] vintage-border border-dashed p-12 text-center text-[#EAE4D9]/40 font-serif italic">
            <p className="mb-6">You haven't marked any bourbons as tried yet.</p>
            <button
              onClick={() => onNavigate('catalog')}
              className="bg-transparent vintage-border hover:bg-[#C89B3C] hover:text-[#141210] hover:border-[#C89B3C] text-[#C89B3C] font-sans font-semibold tracking-widest uppercase px-6 py-2 transition-colors"
            >
              Browse Catalog
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {triedBourbons.map((b) => (
              <ListCard key={b.id} bourbon={b} onClick={() => { navigate(`/bourbon/${b.id}`); }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
