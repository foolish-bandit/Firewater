import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import PageTransition from './PageTransition';
import { useNavigate } from 'react-router-dom';
import { Search, Heart, ChevronRight, Sparkles, BookOpen, Users, Flame, Wheat, FlaskConical, DollarSign, Layers, Camera } from 'lucide-react';
import { SignUpButton } from '@clerk/react';
import { User, Review } from '../types';
import { Liquor } from '../data';

interface HomeViewProps {
  user: User | null;
  liquors: Liquor[];
  wantToTry: string[];
  tried: string[];
  reviews: Review[];
}

const PLACEHOLDERS = [
  'Search the catalog by flavor... "smooth and sweet"',
  'Search the catalog by distillery... "Buffalo Trace"',
  'Search the catalog by style... "high rye whiskey"',
  'Search the catalog by budget... "under 50 dollars"',
  'Search the catalog by proof... "barrel strength"',
];

const CATEGORIES = [
  { label: 'High Proof', icon: Flame, filter: 'high-proof', color: '#E85D3A' },
  { label: 'Wheated', icon: Wheat, filter: 'wheated', color: '#D4A843' },
  { label: 'High Rye', icon: FlaskConical, filter: 'rye', color: '#8B6F47' },
  { label: 'Single Barrel', icon: Layers, filter: 'single-barrel', color: '#9B7653' },
  { label: 'Under $50', icon: DollarSign, filter: 'under-50', color: '#5A8F5A' },
  { label: 'Full Catalog', icon: BookOpen, filter: 'all', color: '#C89B3C' },
];

export default function HomeView({ user, liquors, wantToTry, tried, reviews }: HomeViewProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [placeholderVisible, setPlaceholderVisible] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll-fade state for carousels
  const [popularScrolled, setPopularScrolled] = useState(false);
  const [shortlistScrolled, setShortlistScrolled] = useState(false);
  const popularRef = useRef<HTMLDivElement>(null);
  const shortlistRef = useRef<HTMLDivElement>(null);

  const handlePopularScroll = useCallback(() => {
    setPopularScrolled((popularRef.current?.scrollLeft ?? 0) > 0);
  }, []);
  const handleShortlistScroll = useCallback(() => {
    setShortlistScrolled((shortlistRef.current?.scrollLeft ?? 0) > 0);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderVisible(false);
      setTimeout(() => {
        setPlaceholderIdx(prev => (prev + 1) % PLACEHOLDERS.length);
        setPlaceholderVisible(true);
      }, 300);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    navigate(q ? `/catalog?q=${encodeURIComponent(q)}` : '/catalog');
  };

  const handleCategoryClick = (filter: string) => {
    if (filter === 'all') {
      navigate('/catalog');
    } else if (filter === 'under-50') {
      navigate('/catalog?q=under 50 dollars');
    } else if (filter === 'high-proof') {
      navigate('/catalog?q=high proof');
    } else if (filter === 'wheated') {
      navigate('/catalog?q=wheated');
    } else if (filter === 'rye') {
      navigate('/catalog?q=high rye');
    } else if (filter === 'single-barrel') {
      navigate('/catalog?q=single barrel');
    }
  };

  const communityPicks = useMemo(() => {
    if (liquors.length === 0) return [];
    const daysSinceEpoch = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    const interestingTerms = /single barrel|small batch|barrel proof|cask strength|limited|special|reserve/i;

    const scoreLiquor = (l: Liquor) => {
      let score = 0;
      if (l.price <= 60) score++;
      if (l.proof >= 90) score++;
      const text = `${l.type} ${l.name} ${l.description}`;
      if (interestingTerms.test(text)) score++;
      return score;
    };

    const priorityPool = liquors.filter(l => scoreLiquor(l) >= 2);
    const pool = priorityPool.length >= 8 ? priorityPool : liquors;

    const picks: Liquor[] = [];
    const used = new Set<number>();
    for (let i = 0; i < Math.min(8, pool.length); i++) {
      let idx = (daysSinceEpoch * 7 + i * 13) % pool.length;
      while (used.has(idx)) idx = (idx + 1) % pool.length;
      used.add(idx);
      picks.push(pool[idx]);
    }

    // If priority pool was too small, fill remainder from general pool
    if (priorityPool.length < 8 && priorityPool.length > 0) {
      const pickedIds = new Set(picks.map(p => p.id));
      const remaining = priorityPool.filter(l => !pickedIds.has(l.id));
      const general = liquors.filter(l => !pickedIds.has(l.id) && !remaining.includes(l));
      // Replace non-priority picks with priority ones where possible
      const priorityPicks: Liquor[] = [];
      const generalPicks: Liquor[] = [];
      for (const p of picks) {
        if (scoreLiquor(p) >= 2) priorityPicks.push(p);
        else generalPicks.push(p);
      }
      picks.length = 0;
      picks.push(...priorityPicks, ...generalPicks);
    }

    return picks;
  }, [liquors]);

  const wantToTryLiquors = useMemo(() => {
    return wantToTry
      .slice(0, 6)
      .map(id => liquors.find(b => b.id === id))
      .filter((b): b is Liquor => !!b);
  }, [wantToTry, liquors]);

  const totalListed = wantToTry.length + tried.length;

  const topFlavor = (b: Liquor) => {
    const entries = Object.entries(b.flavorProfile);
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0][0].charAt(0).toUpperCase() + entries[0][0].slice(1);
  };

  const reviewsByLiquor = useMemo(() => {
    const map = new Map<string, Review>();
    for (const r of reviews) {
      const text = r.text || r.nose || r.palate || r.finish || '';
      if (!text.trim()) continue;
      const existing = map.get(r.liquorId);
      if (!existing || r.rating > existing.rating) {
        map.set(r.liquorId, r);
      }
    }
    return map;
  }, [reviews]);

  return (
    <PageTransition><div className="flex flex-col min-h-[80vh]">
      <div className="w-full max-w-5xl mx-auto px-4 pt-4 md:pt-8 mb-10">
        <div className="surface-raised p-6 md:p-8 lg:p-10 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(200,155,60,0.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(200,155,60,0.08),transparent_30%)] pointer-events-none" />
          <div className="relative flex flex-col gap-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full vintage-border flex items-center justify-center overflow-hidden p-1.5 flex-shrink-0">
                <img src="/logo.svg" alt="FIREWATER" className="w-full h-full object-contain opacity-80" />
              </div>
              <div>
                {user ? (
                  <p className="text-on-surface-muted text-sm font-sans">Howdy, <span className="text-on-surface">{user.name?.split(' ')[0] || 'partner'}</span></p>
                ) : (
                  <p className="text-on-surface-muted text-sm font-sans">Howdy, <span className="text-on-surface">stranger</span></p>
                )}
                <div className="flex items-center gap-2">
                  <Users size={11} className="text-on-surface-accent" />
                  <span className="micro-label text-on-surface-accent">{liquors.length} Bottles Ready to Discover</span>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] gap-8 items-start">
              <div>
                <p className="micro-label text-on-surface-accent mb-3">Discover your next bottle</p>
                <h1 className="font-serif text-4xl md:text-6xl font-normal gold-gradient-text mb-4 leading-tight">
                  Start with a match.
                  <br />
                  Keep exploring from there.
                </h1>
                <p className="text-on-surface-secondary text-base md:text-lg font-serif italic mb-8 max-w-2xl leading-relaxed">
                  Browse the catalog for the full shelf, search by flavor or budget, scan a bottle, or let us surprise you with something new.
                </p>
                <p className="text-sm text-on-surface-muted max-w-2xl leading-relaxed mb-2">
                  Firewater helps you find bottles that match your palate, track what you've tasted, and build a personal shelf — whether you're just getting started or deep into the journey.
                </p>

              </div>

              <div className="bg-surface-base/80 border border-border-subtle p-5 md:p-6 space-y-4">
                <div>
                  <p className="micro-label text-on-surface-accent mb-2">Quick search</p>
                  <h2 className="font-serif text-2xl text-on-surface mb-2">Know what you want?</h2>
                  <p className="text-sm text-on-surface-muted leading-relaxed">
                    Search by flavor, distillery, proof, or budget to jump straight into the shelf.
                  </p>
                </div>
                <form onSubmit={handleSearch} className="bg-surface-raised vintage-border search-pulse p-1 relative group focus-within:border-border-accent transition-colors">
                  <div className="w-full flex items-center gap-4 px-5 py-3.5 relative">
                    <Search className="h-5 w-5 text-on-surface-accent flex-shrink-0" />
                    <div className="relative flex-1">
                      <input
                        ref={inputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-transparent text-base sm:text-lg font-serif italic text-on-surface focus:outline-none pr-10"
                      />
                      {!searchQuery && (
                        <span
                          className={`absolute inset-0 flex items-center text-base sm:text-lg font-serif italic text-on-surface-muted pointer-events-none transition-opacity duration-300 ${placeholderVisible ? 'opacity-100' : 'opacity-0'}`}
                        >
                          {PLACEHOLDERS[placeholderIdx]}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate('/catalog?scan=1')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-muted hover:text-on-surface-accent transition-colors p-1"
                      aria-label="Scan a bottle"
                    >
                      <Camera size={20} />
                    </button>
                  </div>
                </form>
                <button
                  onClick={handleSearch}
                  className="inline-flex items-center justify-center gap-2 btn btn-primary px-5 py-3 w-full gold-glow"
                >
                  <Search size={16} /> Search the Catalog
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-5xl mx-auto mb-section">
        <div className="flex items-center justify-between px-4 mb-4">
          <h2 className="font-serif text-xl md:text-2xl text-on-surface">Popular discoveries right now</h2>
          <button
            onClick={() => navigate('/catalog')}
            className="text-on-surface-accent text-xs font-semibold tracking-widest uppercase flex items-center gap-1 hover:gap-2 transition-all"
          >
            Browse Catalog <ChevronRight size={14} />
          </button>
        </div>
        <p className="text-sm font-serif italic text-on-surface-muted px-4 -mt-2 mb-2">
          Bottles the community keeps coming back to — a rotating selection based on what fellow explorers are discovering.
        </p>
        <div className="relative">
          <div className={`pointer-events-none absolute left-0 top-0 bottom-2 w-12 z-10 bg-gradient-to-r from-[var(--bg-primary)] to-transparent transition-opacity duration-200 ${popularScrolled ? 'opacity-100' : 'opacity-0'}`} />
          <div className="pointer-events-none absolute right-0 top-0 bottom-2 w-12 z-10 bg-gradient-to-l from-[var(--bg-primary)] to-transparent" />
          <div ref={popularRef} onScroll={handlePopularScroll} className="flex gap-4 overflow-x-auto px-4 pb-2 scroll-touch custom-scrollbar" style={{ scrollbarWidth: 'none' }}>
            {communityPicks.map(liquor => (
              <button
                key={liquor.id}
                onClick={() => navigate(`/liquor/${liquor.id}`)}
                className="flex-shrink-0 w-40 sm:w-48 surface-raised hover:border-border-accent-strong card-elevated card-elevated-hover transition-all hover:-translate-y-0.5 duration-300 text-left group"
              >
                <div className="h-24 sm:h-28 bg-surface-alt flex flex-col items-center justify-center px-3 gap-2 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-on-surface-accent/5 to-transparent" />
                  <span className="font-serif text-2xl sm:text-3xl text-on-surface-accent/30 font-normal">{liquor.proof}°</span>
                  <span className="badge badge-accent">
                    {topFlavor(liquor)}
                  </span>
                </div>
                <div className="p-3">
                  <h3 className="font-serif text-sm text-on-surface leading-tight line-clamp-2 mb-1 group-hover:text-on-surface-accent transition-colors">
                    {liquor.name}
                  </h3>
                  <p className="text-[10px] text-on-surface-muted uppercase tracking-widest font-sans truncate">{liquor.distillery}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-serif text-sm text-on-surface-secondary">${liquor.price}</span>
                    <span className="text-[10px] text-on-surface-muted uppercase tracking-widest font-sans">{liquor.proof}pf</span>
                  </div>
                  {(() => {
                    const review = reviewsByLiquor.get(liquor.id);
                    if (!review) return null;
                    const text = review.text || review.nose || review.palate || review.finish || '';
                    const snippet = text.length > 60 ? text.slice(0, 60).trimEnd() + '…' : text;
                    return (
                      <p className="text-[10px] font-serif italic text-on-surface-muted line-clamp-2 mt-1.5">
                        ★ {review.rating} — {snippet}
                      </p>
                    );
                  })()}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {wantToTryLiquors.length > 0 && (
        <div className="w-full max-w-5xl mx-auto mb-subsection">
          <div className="flex items-center justify-between px-4 mb-4">
            <div className="flex items-center gap-3">
              <h2 className="font-serif text-xl md:text-2xl text-on-surface">Your discovery shortlist</h2>
              <span className="badge badge-accent text-[10px]">
                {wantToTry.length}
              </span>
            </div>
            <button
              onClick={() => navigate('/lists')}
              className="text-on-surface-accent text-xs font-semibold tracking-widest uppercase flex items-center gap-1 hover:gap-2 transition-all"
            >
              View Lists <ChevronRight size={14} />
            </button>
          </div>
          <p className="text-sm font-serif italic text-on-surface-muted px-4 -mt-2 mb-2">
            Bottles you've flagged to try next. Tap any to see tasting notes, or head to your full shelf to manage the list.
          </p>
          <div className="relative">
            <div className={`pointer-events-none absolute left-0 top-0 bottom-2 w-12 z-10 bg-gradient-to-r from-[var(--bg-primary)] to-transparent transition-opacity duration-200 ${shortlistScrolled ? 'opacity-100' : 'opacity-0'}`} />
            <div className="pointer-events-none absolute right-0 top-0 bottom-2 w-12 z-10 bg-gradient-to-l from-[var(--bg-primary)] to-transparent" />
            <div ref={shortlistRef} onScroll={handleShortlistScroll} className="flex gap-4 overflow-x-auto px-4 pb-2 scroll-touch custom-scrollbar" style={{ scrollbarWidth: 'none' }}>
              {wantToTryLiquors.map(liquor => (
                <button
                  key={liquor.id}
                  onClick={() => navigate(`/liquor/${liquor.id}`)}
                  className="flex-shrink-0 w-40 sm:w-48 surface-raised hover:border-border-accent-strong card-elevated card-elevated-hover transition-all hover:-translate-y-0.5 duration-300 text-left group"
                >
                  <div className="h-24 sm:h-28 bg-surface-alt flex flex-col items-center justify-center px-3 gap-2 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-on-surface-accent/5 to-transparent" />
                    <Heart size={20} className="text-on-surface-accent/40" />
                    <span className="badge badge-accent">
                      {topFlavor(liquor)}
                    </span>
                  </div>
                  <div className="p-3">
                    <h3 className="font-serif text-sm text-on-surface leading-tight line-clamp-2 mb-1 group-hover:text-on-surface-accent transition-colors">
                      {liquor.name}
                    </h3>
                    <p className="text-[10px] text-on-surface-muted uppercase tracking-widest font-sans truncate">{liquor.distillery}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-serif text-sm text-on-surface-secondary">${liquor.price}</span>
                      <span className="text-[10px] text-on-surface-muted uppercase tracking-widest font-sans">{liquor.proof}pf</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-5xl mx-auto px-4 mb-section">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl md:text-2xl text-on-surface">Browse by starting point</h2>
          <button
            onClick={() => navigate('/catalog')}
            className="text-on-surface-accent text-xs font-semibold tracking-widest uppercase flex items-center gap-1 hover:gap-2 transition-all"
          >
            Browse Catalog <ChevronRight size={14} />
          </button>
        </div>
        <p className="text-sm font-serif italic text-on-surface-muted mb-1">
          Pick a lane — high proof, wheated, budget-friendly — and see every bottle that fits. A quick way to narrow the shelf before you search.
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.filter}
                onClick={() => handleCategoryClick(cat.filter)}
                className="flex flex-col items-center gap-3 p-4 surface-raised hover:border-border-accent-strong card-elevated card-elevated-hover transition-all hover:-translate-y-0.5 duration-300 group"
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${cat.color}15` }}
                >
                  <Icon size={20} style={{ color: cat.color }} />
                </div>
                <span className="text-[11px] text-on-surface-muted uppercase tracking-widest font-sans text-center group-hover:text-on-surface transition-colors">
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-full max-w-5xl mx-auto px-4 pb-12">
        <div className="section-divider mb-8" />
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <button
            onClick={() => navigate('/catalog')}
            className="flex-1 inline-flex items-center justify-center gap-2 btn btn-primary px-6 py-4 hover:-translate-y-0.5 gold-glow"
          >
            <BookOpen size={18} /> Browse Full Catalog
          </button>
          <button
            onClick={() => {
              const randomLiquor = liquors[Math.floor(Math.random() * liquors.length)];
              if (randomLiquor) navigate(`/liquor/${randomLiquor.id}`);
            }}
            className="flex-1 inline-flex items-center justify-center gap-2 btn btn-secondary px-6 py-4 hover:-translate-y-0.5"
          >
            <Sparkles size={18} /> Random Discovery
          </button>
        </div>
        {!user && (
          <p className="text-center text-sm text-on-surface-muted font-serif italic">
            Create an account to save bottles and track what you've tasted.{' '}
            <SignUpButton mode="modal">
              <button className="text-on-surface-accent hover:underline font-sans font-semibold tracking-wider uppercase text-xs">
                Sign Up
              </button>
            </SignUpButton>
          </p>
        )}
        {user && totalListed > 0 && (
          <div className="flex justify-center">
            <button
              onClick={() => navigate('/lists')}
              className="py-2.5 px-5 vintage-border hover:border-border-accent-strong transition-all duration-300 flex items-center justify-center gap-2 hover:-translate-y-0.5"
            >
              <Heart size={14} className="text-on-surface-accent" />
              <span className="font-sans text-xs font-semibold text-on-surface-secondary uppercase tracking-widest">{totalListed} saved</span>
            </button>
          </div>
        )}
      </div>
    </div></PageTransition>
  );
}
