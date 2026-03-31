import { useState, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, CheckCircle, Download, ChevronDown, Sparkles, Trophy, Compass, Flame } from 'lucide-react';
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

  const categoryJourney = useMemo(() => {
    const allCategories = Array.from(new Set(liquors.map((liquor) => liquor.type).filter(Boolean)));
    const triedCategories = Array.from(new Set(triedLiquors.map((liquor) => liquor.type).filter(Boolean)));
    const completionByCategory = Array.from(new Set([...wantLiquors, ...triedLiquors].map((liquor) => liquor.type).filter(Boolean)))
      .map((type) => {
        const categoryTotal = wantLiquors.filter((liquor) => liquor.type === type).length + triedLiquors.filter((liquor) => liquor.type === type).length;
        const categoryTried = triedLiquors.filter((liquor) => liquor.type === type).length;
        const pct = categoryTotal > 0 ? Math.round((categoryTried / categoryTotal) * 100) : 0;
        return { type, categoryTotal, categoryTried, pct };
      })
      .sort((a, b) => b.pct - a.pct || b.categoryTried - a.categoryTried)
      .slice(0, 3);

    return {
      discovered: triedCategories.length,
      total: allCategories.length,
      completionByCategory,
    };
  }, [liquors, triedLiquors, wantLiquors]);

  const nextMilestone = useMemo(() => {
    const triedCount = triedLiquors.length;
    const milestones = [5, 10, 25, 50, 100];
    const target = milestones.find((milestone) => milestone > triedCount) ?? (Math.ceil(triedCount / 50) * 50 + 50);
    return { target, remaining: Math.max(target - triedCount, 0) };
  }, [triedLiquors.length]);

  const recentActivity = useMemo(() => {
    const now = Date.now();
    const recentReviewCount = reviews.filter((review) => {
      const timestamp = new Date(review.date).getTime();
      return !Number.isNaN(timestamp) && (now - timestamp) <= 1000 * 60 * 60 * 24 * 30;
    }).length;

    return {
      reviewBurst: recentReviewCount,
      momentumLabel: recentReviewCount >= 4 ? 'On a hot streak' : recentReviewCount >= 1 ? 'Recently active' : 'Ready for a new streak',
    };
  }, [reviews]);

  const journeyCards = [
    {
      title: 'Collection depth',
      value: `${triedLiquors.length} tasted`,
      note: nextMilestone.remaining === 0 ? `Milestone ${nextMilestone.target} reached.` : `${nextMilestone.remaining} more to hit ${nextMilestone.target}.`,
      icon: Trophy,
      accent: 'text-[#E2C27A] border-[#C89B3C]/18 bg-[#C89B3C]/10',
    },
    {
      title: 'Category trail',
      value: `${categoryJourney.discovered}/${categoryJourney.total}`,
      note: 'Spirit categories discovered through tasted bottles.',
      icon: Compass,
      accent: 'text-emerald-300 border-emerald-500/18 bg-emerald-500/10',
    },
    {
      title: 'Momentum',
      value: recentActivity.momentumLabel,
      note: recentActivity.reviewBurst > 0 ? `${recentActivity.reviewBurst} review${recentActivity.reviewBurst === 1 ? '' : 's'} in the last 30 days.` : 'Drop a few notes to spark your next streak.',
      icon: Flame,
      accent: 'text-rose-300 border-rose-500/18 bg-rose-500/10',
    },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="text-center space-y-4 py-8">
        <h1 className="font-serif text-4xl md:text-5xl font-normal text-theme-primary">My Shelf</h1>
        <p className="text-theme-muted font-serif italic max-w-2xl mx-auto text-lg">Every bottle you've conquered and every one you're chasing.</p>
      </div>

      {total > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <div className="surface-panel p-3 sm:p-5 flex flex-col items-center text-center">
            <Heart size={16} className="text-theme-accent mb-1 sm:mb-2 sm:w-[18px] sm:h-[18px]" />
            <span className="font-serif text-xl sm:text-2xl text-theme-primary">{wantLiquors.length}</span>
            <span className="micro-label text-theme-accent mt-1 text-[8px] sm:text-[0.65rem]">Want to Try</span>
          </div>
          <div className="surface-panel p-3 sm:p-5 flex flex-col items-center text-center">
            <CheckCircle size={16} className="text-theme-accent mb-1 sm:mb-2 sm:w-[18px] sm:h-[18px]" />
            <span className="font-serif text-xl sm:text-2xl text-theme-primary">{triedLiquors.length}</span>
            <span className="micro-label text-theme-accent mt-1 text-[8px] sm:text-[0.65rem]">Tried</span>
          </div>
          <div className="surface-panel p-3 sm:p-5 flex flex-col items-center text-center">
            <TrendingUp size={16} className="text-theme-accent mb-1 sm:mb-2 sm:w-[18px] sm:h-[18px]" />
            <span className="font-serif text-xl sm:text-2xl text-theme-primary">{completionPct}%</span>
            <span className="micro-label text-theme-accent mt-1 text-[8px] sm:text-[0.65rem]">Completion</span>
          </div>
        </div>
      )}

      {tried.length >= 3 && (
        <div className="surface-panel overflow-hidden">
          <button
            onClick={() => setInsightsOpen(prev => !prev)}
            className="w-full flex items-center justify-between p-4 sm:p-5 text-left group"
          >
            <span className="micro-label text-theme-accent group-hover:text-[var(--text-accent-soft)] transition-colors">Your Insights</span>
            <ChevronDown
              size={18}
              className={`text-theme-accent transition-transform duration-300 ${insightsOpen ? 'rotate-180' : ''}`}
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

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Tabs */}
        <div className="segmented-control">
          <button
            onClick={() => setActiveTab('want')}
            className={`segmented-tab px-3 sm:px-6 py-2.5 text-[10px] sm:text-xs ${
              activeTab === 'want'
                ? 'is-active'
                : 'hover:text-[var(--text-tier-1)]'
            }`}
          >
            <span className="flex items-center gap-1.5 sm:gap-2">
              <Heart size={14} />
              <span className="hidden sm:inline">Wishlisted pours</span>
              <span className="sm:hidden">Want</span>
              ({wantLiquors.length})
            </span>
          </button>
          <button
            onClick={() => setActiveTab('tried')}
            className={`segmented-tab px-3 sm:px-6 py-2.5 text-[10px] sm:text-xs ${
              activeTab === 'tried'
                ? 'is-active'
                : 'hover:text-[var(--text-tier-1)]'
            }`}
          >
            <span className="flex items-center gap-1.5 sm:gap-2">
              <CheckCircle size={14} />
              Claimed bottles ({triedLiquors.length})
            </span>
          </button>
        </div>

        {total > 0 && (
          <button
            onClick={() => exportLists(wantLiquors, triedLiquors)}
            className="btn-base btn-outline text-xs px-6 py-2"
          >
            <Download size={14} />
            Export
          </button>
        )}
      </div>

      {activeTab === 'want' && (
        <div>
          {wantLiquors.length === 0 ? (
            <div className="surface-panel border-dashed p-8 sm:p-16 text-center relative overflow-hidden">
              <img src="/logo.svg" alt="" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 opacity-[0.03] pointer-events-none" />
              <div className="relative z-10">
                <Heart size={32} className="text-theme-accent-faint mx-auto mb-4" />
                <p className="text-theme-faint font-serif italic text-lg mb-6">Your wishlist is empty. Explore the catalog to find new pours.</p>
                <button
                  onClick={() => navigate('/catalog')}
                  className="btn-base btn-outline px-6 py-3 text-xs"
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
                  onToggleWant={(e: MouseEvent) => { e.stopPropagation(); toggleWantToTry(b.id); }}
                  onToggleTried={(e: MouseEvent) => { e.stopPropagation(); toggleTried(b.id); }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'tried' && (
        <div>
          {triedLiquors.length === 0 ? (
            <div className="surface-panel border-dashed p-8 sm:p-16 text-center relative overflow-hidden">
              <img src="/logo.svg" alt="" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 opacity-[0.03] pointer-events-none" />
              <div className="relative z-10">
                <CheckCircle size={32} className="text-theme-accent-faint mx-auto mb-4" />
                <p className="text-theme-faint font-serif italic text-lg mb-6">You haven't marked any liquors as tried yet.</p>
                <button
                  onClick={() => navigate('/catalog')}
                  className="btn-base btn-outline px-6 py-3 text-xs"
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
                  onToggleWant={(e: MouseEvent) => { e.stopPropagation(); toggleWantToTry(b.id); }}
                  onToggleTried={(e: MouseEvent) => { e.stopPropagation(); toggleTried(b.id); }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
