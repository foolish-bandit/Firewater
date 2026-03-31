import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, CheckCircle, Download, TrendingUp, ChevronDown } from 'lucide-react';
import { Liquor } from '../data';
import { Review } from '../types';
import LiquorCard from './LiquorCard';
import InsightsPanel from './InsightsPanel';

interface ListsViewProps {
  wantToTry: string[];
  tried: string[];
  toggleWantToTry: (id: string) => void;
  toggleTried: (id: string) => void;
  liquors: Liquor[];
  reviews: Review[];
}

function formatLiquor(b: Liquor): string {
  return `- ${b.name} (${b.distillery}) — $${b.price} — ${b.proof} proof`;
}

function exportLists(wantLiquors: Liquor[], triedLiquors: Liquor[]) {
  const lines = ['=== FIREWATER — MY LISTS ===', ''];
  lines.push('WANT TO TRY:');
  if (wantLiquors.length === 0) {
    lines.push('(none)');
  } else {
    wantLiquors.forEach(b => lines.push(formatLiquor(b)));
  }
  lines.push('');
  lines.push('TRIED:');
  if (triedLiquors.length === 0) {
    lines.push('(none)');
  } else {
    triedLiquors.forEach(b => lines.push(formatLiquor(b)));
  }
  lines.push('');
  lines.push(`Exported from FIREWATER on ${new Date().toLocaleDateString()}`);

  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'firewater-lists.txt';
  a.click();
  URL.revokeObjectURL(url);
}

export default function ListsView({ wantToTry, tried, toggleWantToTry, toggleTried, liquors, reviews }: ListsViewProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'want' | 'tried'>('want');
  const [insightsOpen, setInsightsOpen] = useState(false);
  const wantLiquors = wantToTry.map((id) => liquors.find((b) => b.id === id)).filter(Boolean) as Liquor[];
  const triedLiquors = tried.map((id) => liquors.find((b) => b.id === id)).filter(Boolean) as Liquor[];

  const total = wantLiquors.length + triedLiquors.length;
  const completionPct = total > 0 ? Math.round((triedLiquors.length / total) * 100) : 0;

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="text-center space-y-4 py-8">
        <h1 className="font-serif text-4xl md:text-5xl font-normal text-[#EAE4D9]">My Shelf</h1>
        <p className="text-[#EAE4D9]/60 font-serif italic max-w-2xl mx-auto text-lg">Every bottle you've conquered and every one you're chasing.</p>
      </div>

      {/* Journey Stats */}
      {total > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <div className="bg-[#1A1816] vintage-border p-3 sm:p-5 flex flex-col items-center text-center">
            <Heart size={16} className="text-[#C89B3C] mb-1 sm:mb-2 sm:w-[18px] sm:h-[18px]" />
            <span className="font-serif text-xl sm:text-2xl text-[#EAE4D9]">{wantLiquors.length}</span>
            <span className="micro-label text-[#C89B3C] mt-1 text-[8px] sm:text-[0.65rem]">Want to Try</span>
          </div>
          <div className="bg-[#1A1816] vintage-border p-3 sm:p-5 flex flex-col items-center text-center">
            <CheckCircle size={16} className="text-[#C89B3C] mb-1 sm:mb-2 sm:w-[18px] sm:h-[18px]" />
            <span className="font-serif text-xl sm:text-2xl text-[#EAE4D9]">{triedLiquors.length}</span>
            <span className="micro-label text-[#C89B3C] mt-1 text-[8px] sm:text-[0.65rem]">Tried</span>
          </div>
          <div className="bg-[#1A1816] vintage-border p-3 sm:p-5 flex flex-col items-center text-center">
            <TrendingUp size={16} className="text-[#C89B3C] mb-1 sm:mb-2 sm:w-[18px] sm:h-[18px]" />
            <span className="font-serif text-xl sm:text-2xl text-[#EAE4D9]">{completionPct}%</span>
            <span className="micro-label text-[#C89B3C] mt-1 text-[8px] sm:text-[0.65rem]">Completion</span>
          </div>
        </div>
      )}

      {/* Insights Panel */}
      {tried.length >= 3 && (
        <div className="bg-[#1A1816] vintage-border overflow-hidden">
          <button
            onClick={() => setInsightsOpen(prev => !prev)}
            className="w-full flex items-center justify-between p-4 sm:p-5 text-left group"
          >
            <span className="micro-label text-[#C89B3C] group-hover:text-[#C89B3C]/80 transition-colors">Your Insights</span>
            <ChevronDown
              size={18}
              className={`text-[#C89B3C] transition-transform duration-300 ${insightsOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {insightsOpen && (
            <div className="px-4 sm:px-5 pb-5">
              <InsightsPanel
                triedIds={tried}
                wantIds={wantToTry}
                reviews={reviews}
                liquors={liquors}
              />
            </div>
          )}
        </div>
      )}

      {/* Export + Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex gap-1 bg-[#1A1816] vintage-border p-1">
          <button
            onClick={() => setActiveTab('want')}
            className={`px-3 sm:px-6 py-2.5 text-[10px] sm:text-xs font-semibold tracking-wider sm:tracking-widest uppercase transition-all duration-300 ${
              activeTab === 'want'
                ? 'bg-[#C89B3C] text-[#141210]'
                : 'text-[#EAE4D9]/60 hover:text-[#EAE4D9]'
            }`}
          >
            <span className="flex items-center gap-1.5 sm:gap-2">
              <Heart size={14} />
              <span className="hidden sm:inline">Want to Try</span>
              <span className="sm:hidden">Want</span>
              ({wantLiquors.length})
            </span>
          </button>
          <button
            onClick={() => setActiveTab('tried')}
            className={`px-3 sm:px-6 py-2.5 text-[10px] sm:text-xs font-semibold tracking-wider sm:tracking-widest uppercase transition-all duration-300 ${
              activeTab === 'tried'
                ? 'bg-[#C89B3C] text-[#141210]'
                : 'text-[#EAE4D9]/60 hover:text-[#EAE4D9]'
            }`}
          >
            <span className="flex items-center gap-1.5 sm:gap-2">
              <CheckCircle size={14} />
              Tried ({triedLiquors.length})
            </span>
          </button>
        </div>

        {/* Export */}
        {total > 0 && (
          <button
            onClick={() => exportLists(wantLiquors, triedLiquors)}
            className="inline-flex items-center gap-2 bg-transparent vintage-border hover:bg-[#C89B3C] hover:text-[#141210] hover:border-[#C89B3C] text-[#C89B3C] font-sans font-semibold tracking-widest uppercase text-xs px-6 py-2 transition-colors"
          >
            <Download size={14} />
            Export
          </button>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'want' && (
        <div>
          {wantLiquors.length === 0 ? (
            <div className="bg-[#1A1816] vintage-border border-dashed p-8 sm:p-16 text-center relative overflow-hidden">
              <img src="/logo.svg" alt="" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 opacity-[0.03] pointer-events-none" />
              <div className="relative z-10">
                <Heart size={32} className="text-[#C89B3C]/30 mx-auto mb-4" />
                <p className="text-[#EAE4D9]/40 font-serif italic text-lg mb-6">Your wishlist is empty. Explore the catalog to find new pours.</p>
                <button
                  onClick={() => navigate('/catalog')}
                  className="bg-transparent vintage-border hover:bg-[#C89B3C] hover:text-[#141210] hover:border-[#C89B3C] text-[#C89B3C] font-sans font-semibold tracking-widest uppercase px-6 py-3 text-xs transition-all duration-300"
                >
                  Browse Catalog
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wantLiquors.map((b) => (
                <LiquorCard
                  key={b.id}
                  liquor={b}
                  onClick={() => navigate(`/liquor/${b.id}`)}
                  isWanted={wantToTry.includes(b.id)}
                  isTried={tried.includes(b.id)}
                  onToggleWant={(e: React.MouseEvent) => { e.stopPropagation(); toggleWantToTry(b.id); }}
                  onToggleTried={(e: React.MouseEvent) => { e.stopPropagation(); toggleTried(b.id); }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'tried' && (
        <div>
          {triedLiquors.length === 0 ? (
            <div className="bg-[#1A1816] vintage-border border-dashed p-8 sm:p-16 text-center relative overflow-hidden">
              <img src="/logo.svg" alt="" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 opacity-[0.03] pointer-events-none" />
              <div className="relative z-10">
                <CheckCircle size={32} className="text-[#C89B3C]/30 mx-auto mb-4" />
                <p className="text-[#EAE4D9]/40 font-serif italic text-lg mb-6">You haven't marked any liquors as tried yet.</p>
                <button
                  onClick={() => navigate('/catalog')}
                  className="bg-transparent vintage-border hover:bg-[#C89B3C] hover:text-[#141210] hover:border-[#C89B3C] text-[#C89B3C] font-sans font-semibold tracking-widest uppercase px-6 py-3 text-xs transition-all duration-300"
                >
                  Browse Catalog
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {triedLiquors.map((b) => (
                <LiquorCard
                  key={b.id}
                  liquor={b}
                  onClick={() => navigate(`/liquor/${b.id}`)}
                  isWanted={wantToTry.includes(b.id)}
                  isTried={tried.includes(b.id)}
                  onToggleWant={(e: React.MouseEvent) => { e.stopPropagation(); toggleWantToTry(b.id); }}
                  onToggleTried={(e: React.MouseEvent) => { e.stopPropagation(); toggleTried(b.id); }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
