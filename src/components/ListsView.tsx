import { useMemo, useState, useCallback, type MouseEvent } from 'react';
import PageTransition from './PageTransition';
import { useNavigate } from 'react-router-dom';
import { Heart, CheckCircle, Download, ChevronDown, Compass, Flame, Trophy } from 'lucide-react';
import { Liquor } from '../data';
import { hapticTap, isNative } from '../lib/capacitor';
import { Review } from '../types';
import LiquorCard from './LiquorCard';
import InsightsPanel from './InsightsPanel';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { SectionRule, Flourish } from './ornaments';

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

  usePullToRefresh(useCallback(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, []));
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
      title: 'Collection Depth',
      value: `${triedLiquors.length}`,
      unit: 'TASTED',
      note: nextMilestone.remaining === 0 ? `Milestone ${nextMilestone.target} reached.` : `${nextMilestone.remaining} more to hit ${nextMilestone.target}.`,
      icon: Trophy,
    },
    {
      title: 'Category Trail',
      value: `${categoryJourney.discovered}/${categoryJourney.total}`,
      unit: 'SPIRITS',
      note: 'Spirit categories discovered through tasted bottles.',
      icon: Compass,
    },
    {
      title: 'Momentum',
      value: recentActivity.momentumLabel,
      unit: recentActivity.reviewBurst > 0 ? `${recentActivity.reviewBurst} NOTE${recentActivity.reviewBurst === 1 ? '' : 'S'} · 30D` : 'READY',
      note: recentActivity.reviewBurst > 0 ? 'Tasting notes logged in the last 30 days.' : 'Drop a few notes to spark your next streak.',
      icon: Flame,
    },
  ];

  return (
    <PageTransition><div className="space-y-10">
      <div className="text-center space-y-4 py-8">
        <p className="micro-label text-on-surface-accent">
          <span className="text-on-surface-accent">◆</span> Collection Journey
        </p>
        <h1 className="heading-xl text-4xl md:text-5xl italic font-normal text-on-surface leading-[1.05]">My Shelf</h1>
        <Flourish className="text-on-surface-accent mx-auto" width={110} />
        <p className="text-on-surface-muted font-serif italic max-w-2xl mx-auto text-base">Not just a list of bottles — a map of what you've explored, what you've claimed, and what still calls your name.</p>
      </div>

      {total > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] gap-5">
          <div className="border border-border-accent bg-surface-raised p-5 sm:p-7">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-5 pb-5 border-b border-border-subtle">
              <div>
                <p className="micro-label text-on-surface-accent mb-2">
                  <span className="text-on-surface-accent">◆</span> Progress Story
                </p>
                <h2 className="heading-md text-2xl italic text-on-surface">Your collection arc</h2>
              </div>
              <div className="text-left md:text-right">
                <p className="micro-label text-on-surface-muted">Journey complete</p>
                <p className="heading-xl text-5xl italic text-on-surface-accent leading-none mt-1">{completionPct}%</p>
              </div>
            </div>

            <div className="space-y-4">
              <div
                className="flex items-center justify-between text-[10px] tracking-[0.22em] uppercase text-on-surface-muted"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                <span>{triedLiquors.length} conquered</span>
                <span>{wantLiquors.length} still chasing</span>
              </div>
              <div className="h-[3px] bg-surface-base overflow-hidden">
                <div className="h-full bg-on-surface-accent transition-all duration-700" style={{ width: `${completionPct}%` }} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 border border-border-subtle mt-4">
                {journeyCards.map((card, idx) => {
                  const Icon = card.icon;
                  return (
                    <div
                      key={card.title}
                      className={`p-4 border-border-subtle ${idx < journeyCards.length - 1 ? 'border-b sm:border-b-0 sm:border-r' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className="text-[10px] tracking-[0.22em] text-on-surface-accent"
                          style={{ fontFamily: 'var(--font-mono)' }}
                        >
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <Icon size={14} className="text-on-surface-accent" />
                      </div>
                      <p className="micro-label text-on-surface-muted">{card.title}</p>
                      <p className="heading-md text-xl italic text-on-surface mt-2 leading-tight">{card.value}</p>
                      <p
                        className="mt-1 text-[10px] tracking-[0.22em] text-on-surface-accent"
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        {card.unit}
                      </p>
                      <p className="mt-2 text-xs font-serif italic text-on-surface-muted leading-relaxed">{card.note}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="border border-border-subtle bg-surface-raised p-5 sm:p-6">
            <div className="flex items-center justify-between gap-2 mb-5 pb-4 border-b border-border-subtle">
              <p className="micro-label text-on-surface-accent">
                <span className="text-on-surface-accent">◆</span> Milestones &amp; Categories
              </p>
              <Trophy size={14} className="text-on-surface-accent" />
            </div>

            <div className="space-y-4">
              <div className="border border-border-accent bg-on-surface-accent/5 p-4">
                <p className="micro-label text-on-surface-muted">Next unlock</p>
                <p className="heading-md text-3xl italic text-on-surface mt-1 leading-none">{nextMilestone.target} <span className="text-on-surface-muted text-base">bottles</span></p>
                <p className="mt-2 text-sm font-serif italic text-on-surface-muted">
                  {nextMilestone.remaining === 0 ? 'Milestone secured — keep climbing.' : `${nextMilestone.remaining} more tasted to unlock your next badge.`}
                </p>
              </div>

              <div className="space-y-0 border border-border-subtle">
                {categoryJourney.completionByCategory.length > 0 ? categoryJourney.completionByCategory.map((category, i) => (
                  <div
                    key={category.type}
                    className={`p-4 ${i < categoryJourney.completionByCategory.length - 1 ? 'border-b border-border-subtle' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-baseline gap-3 min-w-0">
                        <span
                          className="text-[10px] tracking-[0.22em] text-on-surface-accent shrink-0"
                          style={{ fontFamily: 'var(--font-mono)' }}
                        >
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <p className="heading-md text-lg italic text-on-surface leading-tight truncate">{category.type}</p>
                      </div>
                      <span
                        className="text-[10px] tracking-[0.22em] text-on-surface-accent shrink-0"
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        {category.pct}%
                      </span>
                    </div>
                    <div className="h-[2px] bg-surface-base overflow-hidden">
                      <div className="h-full bg-on-surface-accent" style={{ width: `${category.pct}%` }} />
                    </div>
                    <p className="mt-2 text-xs font-serif italic text-on-surface-muted">
                      {category.categoryTried} of {category.categoryTotal} in this lane have been tasted.
                    </p>
                  </div>
                )) : (
                  <p className="p-4 text-on-surface-muted font-serif italic">Build your shelf to surface category completion cues.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {tried.length >= 3 && (
        <div className="border border-border-subtle bg-surface-raised overflow-hidden">
          <button
            onClick={() => setInsightsOpen(prev => !prev)}
            className="w-full flex items-center justify-between p-4 sm:p-5 text-left group"
          >
            <span className="micro-label text-on-surface-accent group-hover:text-on-surface transition-colors">
              <span className="text-on-surface-accent">◆</span> Your Insights
            </span>
            <ChevronDown
              size={16}
              className={`text-on-surface-accent transition-transform duration-300 ${insightsOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {insightsOpen && (
            <div className="px-4 sm:px-5 pb-5 border-t border-border-subtle pt-5">
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

      <div className="border-t border-border-subtle pt-6">
        <SectionRule title={activeTab === 'want' ? 'THE SHORTLIST' : 'THE TASTED'} />
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex gap-0 border border-border-subtle">
          <button
            onClick={() => { hapticTap(); setActiveTab('want'); }}
            className={`px-4 sm:px-6 py-2.5 text-[10px] sm:text-xs tracking-[0.22em] uppercase transition-colors border-r border-border-subtle ${
              activeTab === 'want'
                ? 'bg-on-surface-accent text-on-surface-invert'
                : 'text-on-surface-muted hover:text-on-surface'
            }`}
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            <span className="flex items-center gap-1.5 sm:gap-2">
              <Heart size={12} />
              <span className="hidden sm:inline">Want</span>
              <span>({wantLiquors.length})</span>
            </span>
          </button>
          <button
            onClick={() => { hapticTap(); setActiveTab('tried'); }}
            className={`px-4 sm:px-6 py-2.5 text-[10px] sm:text-xs tracking-[0.22em] uppercase transition-colors ${
              activeTab === 'tried'
                ? 'bg-on-surface-accent text-on-surface-invert'
                : 'text-on-surface-muted hover:text-on-surface'
            }`}
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            <span className="flex items-center gap-1.5 sm:gap-2">
              <CheckCircle size={12} />
              <span className="hidden sm:inline">Tried</span>
              <span>({triedLiquors.length})</span>
            </span>
          </button>
        </div>

        {total > 0 && (
          <button
            onClick={() => exportLists(wantLiquors, triedLiquors, showToast)}
            className="inline-flex items-center gap-2 border border-border-subtle hover:border-border-accent-strong text-[10px] tracking-[0.22em] uppercase text-on-surface-secondary px-4 py-2 transition-colors"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            <Download size={12} />
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
                  onToggleWant={(e: MouseEvent) => { e.stopPropagation(); hapticTap(); toggleWantToTry(b.id); }}
                  onToggleTried={(e: MouseEvent) => { e.stopPropagation(); hapticTap(); toggleTried(b.id); }}
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
                  onToggleWant={(e: MouseEvent) => { e.stopPropagation(); hapticTap(); toggleWantToTry(b.id); }}
                  onToggleTried={(e: MouseEvent) => { e.stopPropagation(); hapticTap(); toggleTried(b.id); }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div></PageTransition>
  );
}
