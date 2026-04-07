import { useMemo, useState, type MouseEvent } from 'react';
import PageTransition from './PageTransition';
import { useNavigate } from 'react-router-dom';
import { Heart, CheckCircle, Download, ChevronDown, Sparkles, Trophy, Compass, Flame } from 'lucide-react';
import { Liquor } from '../data';
import { hapticTap, isNative } from '../lib/capacitor';
import { Review } from '../types';
import LiquorCard from './LiquorCard';
import InsightsPanel from './InsightsPanel';

interface ListsViewProps {
  wantToTry: string[];
  tried: string[];
  toggleWantToTry: (id: string) => void;
  toggleTried: (id: string) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  liquors: Liquor[];
  reviews: Review[];
}

function formatLiquor(b: Liquor): string {
  return `- ${b.name} (${b.distillery}) — $${b.price} — ${b.proof} proof`;
}

function buildListsText(wantLiquors: Liquor[], triedLiquors: Liquor[]): string {
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
  return lines.join('\n');
}

const FILE_NAME = 'firewater-lists.txt';

async function exportLists(wantLiquors: Liquor[], triedLiquors: Liquor[], showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void) {
  const text = buildListsText(wantLiquors, triedLiquors);

  if (isNative) {
    // Try Web Share API (iOS 15+ supports sharing File objects)
    if (navigator.share) {
      try {
        const file = new File([text], FILE_NAME, { type: 'text/plain' });
        await navigator.share({ files: [file] });
        return;
      } catch (e: any) {
        // User cancelled share or share not supported for files — fall through
        if (e?.name === 'AbortError') return;
      }
    }

    // Fallback: write to app documents via Capacitor Filesystem
    try {
      const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
      await Filesystem.writeFile({
        path: FILE_NAME,
        data: text,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });
      showToast?.(`Saved to Documents/${FILE_NAME}`);
    } catch {
      showToast?.('Could not save file', 'error');
    }
    return;
  }

  // Web: download via anchor element
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = FILE_NAME;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ListsView({ wantToTry, tried, toggleWantToTry, toggleTried, liquors, reviews, showToast }: ListsViewProps) {
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
      accent: 'text-on-surface-accent border-border-accent bg-on-surface-accent/10',
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
    <PageTransition><div className="space-y-10">
      <div className="text-center space-y-4 py-8">
        <p className="micro-label text-on-surface-accent">Collection Journey</p>
        <h1 className="font-serif text-4xl md:text-5xl font-normal text-on-surface">My Shelf</h1>
        <p className="text-on-surface-muted font-serif italic max-w-2xl mx-auto text-lg">Not just a list of bottles — a map of what you've explored, what you've claimed, and what still calls your name.</p>
      </div>

      {total > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] gap-5">
          <div className="rounded-[30px] border border-border-accent premium-gradient p-5 sm:p-7">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-5">
              <div>
                <p className="micro-label text-on-surface-accent mb-2">Progress Story</p>
                <h2 className="font-serif text-3xl text-on-surface">Your collection arc</h2>
              </div>
              <div className="text-left md:text-right">
                <p className="text-[10px] tracking-[0.28em] uppercase text-on-surface-muted">Journey completion</p>
                <p className="font-serif text-4xl text-on-surface">{completionPct}%</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-[10px] font-semibold tracking-[0.26em] uppercase text-on-surface-muted">
                <span>{triedLiquors.length} conquered</span>
                <span>{wantLiquors.length} still chasing</span>
              </div>
              <div className="h-3 rounded-full bg-[#0F0D0B] overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-on-surface-accent/70 via-on-surface-accent to-on-surface-accent/50 transition-all duration-700" style={{ width: `${completionPct}%` }} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                {journeyCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <div key={card.title} className="rounded-[22px] border border-border-subtle bg-on-surface/[0.03] p-4">
                      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-full border ${card.accent}`}>
                        <Icon size={17} />
                      </div>
                      <p className="text-[10px] font-semibold tracking-[0.26em] uppercase text-on-surface-muted">{card.title}</p>
                      <p className="mt-2 font-serif text-2xl text-on-surface leading-tight">{card.value}</p>
                      <p className="mt-2 text-sm text-on-surface-muted leading-relaxed">{card.note}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="rounded-[30px] border border-border-subtle bg-surface-raised p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-5">
              <Sparkles size={16} className="text-on-surface-accent" />
              <p className="micro-label text-on-surface-accent">Milestones & Categories</p>
            </div>

            <div className="space-y-4">
              <div className="rounded-[22px] border border-border-accent bg-on-surface-accent/8 p-4">
                <p className="text-[10px] font-semibold tracking-[0.26em] uppercase text-on-surface-muted">Next unlock</p>
                <p className="mt-2 font-serif text-3xl text-on-surface">{nextMilestone.target} bottles</p>
                <p className="mt-2 text-sm text-on-surface-muted">{nextMilestone.remaining === 0 ? 'Milestone secured — keep climbing.' : `${nextMilestone.remaining} more tasted bottles to unlock your next badge.`}</p>
              </div>

              <div className="space-y-3">
                {categoryJourney.completionByCategory.length > 0 ? categoryJourney.completionByCategory.map((category) => (
                  <div key={category.type} className="rounded-[20px] border border-border-subtle bg-on-surface/[0.03] p-4">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <p className="font-serif text-lg text-on-surface">{category.type}</p>
                      <span className="text-[10px] tracking-[0.26em] uppercase text-on-surface-accent">{category.pct}% complete</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#0F0D0B] overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-on-surface-accent/60 to-on-surface-accent" style={{ width: `${category.pct}%` }} />
                    </div>
                    <p className="mt-2 text-sm text-on-surface-muted">{category.categoryTried} of {category.categoryTotal} bottles in this lane have been tasted.</p>
                  </div>
                )) : (
                  <p className="text-on-surface-muted font-serif italic">Build your shelf to surface category completion cues.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {tried.length >= 3 && (
        <div className="surface-raised overflow-hidden rounded-[28px]">
          <button
            onClick={() => setInsightsOpen(prev => !prev)}
            className="w-full flex items-center justify-between p-4 sm:p-5 text-left group"
          >
            <span className="micro-label text-on-surface-accent group-hover:text-on-surface-accent/80 transition-colors">Your Insights</span>
            <ChevronDown
              size={18}
              className={`text-on-surface-accent transition-transform duration-300 ${insightsOpen ? 'rotate-180' : ''}`}
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
        <div className="flex gap-1 surface-raised p-1 rounded-full">
          <button
            onClick={() => { hapticTap(); setActiveTab('want'); }}
            className={`px-3 sm:px-6 py-2.5 text-[10px] sm:text-xs font-semibold tracking-wider sm:tracking-widest uppercase transition-all duration-300 rounded-full ${
              activeTab === 'want'
                ? 'seg-item-active'
                : 'seg-item hover:text-on-surface'
            }`}
          >
            <span className="flex items-center gap-1.5 sm:gap-2">
              <Heart size={14} />
              <span className="hidden sm:inline">Want to try</span>
              <span className="sm:hidden">Want</span>
              ({wantLiquors.length})
            </span>
          </button>
          <button
            onClick={() => { hapticTap(); setActiveTab('tried'); }}
            className={`px-3 sm:px-6 py-2.5 text-[10px] sm:text-xs font-semibold tracking-wider sm:tracking-widest uppercase transition-all duration-300 rounded-full ${
              activeTab === 'tried'
                ? 'seg-item-active'
                : 'seg-item hover:text-on-surface'
            }`}
          >
            <span className="flex items-center gap-1.5 sm:gap-2">
              <CheckCircle size={14} />
              Tried &amp; tasted ({triedLiquors.length})
            </span>
          </button>
        </div>

        {total > 0 && (
          <button
            onClick={() => exportLists(wantLiquors, triedLiquors, showToast)}
            className="btn btn-secondary inline-flex items-center gap-2 font-sans font-semibold tracking-widest uppercase text-xs px-6 py-2 transition-colors"
          >
            <Download size={14} />
            Export
          </button>
        )}
      </div>

      {activeTab === 'want' && (
        <div>
          {wantLiquors.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-16 px-4">
              <Heart size={48} className="text-on-surface-accent/30 mb-5" />
              <h3 className="font-serif text-xl text-on-surface mb-2">Your wishlist is empty</h3>
              <p className="text-on-surface-muted text-sm mb-1 max-w-xs">Tap the heart icon on any bottle to save it here.</p>
              <p className="text-on-surface-muted font-serif italic text-sm mb-6 max-w-xs">Explore the catalog to find new pours.</p>
              <button
                onClick={() => navigate('/catalog')}
                className="btn btn-primary"
              >
                Explore the Catalog
              </button>
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
            <div className="flex flex-col items-center justify-center text-center py-16 px-4">
              <CheckCircle size={48} className="text-on-surface-accent/30 mb-5" />
              <h3 className="font-serif text-xl text-on-surface mb-2">Nothing tried yet</h3>
              <p className="text-on-surface-muted text-sm mb-6 max-w-xs">Mark bottles as tried to track your journey.</p>
              <button
                onClick={() => navigate('/catalog')}
                className="btn btn-primary"
              >
                Browse the Catalog
              </button>
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
    </div></PageTransition>
  );
}
