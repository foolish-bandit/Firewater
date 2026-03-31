import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Heart, ChevronRight, Sparkles, BookOpen, Crosshair, Users, Flame, Wheat, FlaskConical, DollarSign, Layers, Camera } from 'lucide-react';
import { User } from '../types';
import { Liquor } from '../data';

interface HomeViewProps {
  user: User | null;
  liquors: Liquor[];
  wantToTry: string[];
  tried: string[];
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

export default function HomeView({ user, liquors, wantToTry, tried }: HomeViewProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [placeholderVisible, setPlaceholderVisible] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

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
    const picks: Liquor[] = [];
    const used = new Set<number>();
    for (let i = 0; i < Math.min(8, liquors.length); i++) {
      let idx = (daysSinceEpoch * 7 + i * 13) % liquors.length;
      while (used.has(idx)) idx = (idx + 1) % liquors.length;
      used.add(idx);
      picks.push(liquors[idx]);
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

  return (
    <div className="experience-page flex flex-col min-h-[80vh] animate-in fade-in duration-700">
      <section className="w-full max-w-3xl mx-auto px-4 pt-4 md:pt-6">
        <div className="experience-hero">
          <form onSubmit={handleSearch} className="bg-[#141210]/60 vintage-border search-pulse p-1 relative group focus-within:border-[#C89B3C]/50 transition-colors">
            <div className="w-full flex items-center gap-4 px-5 py-3.5 relative">
              <Search className="h-5 w-5 text-[#C89B3C] flex-shrink-0" />
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-base sm:text-lg font-serif italic text-[#EAE4D9] focus:outline-none"
                />
                {!searchQuery && (
                  <span
                    className={`absolute inset-0 flex items-center text-base sm:text-lg font-serif italic text-[#EAE4D9]/30 pointer-events-none transition-opacity duration-300 ${placeholderVisible ? 'opacity-100' : 'opacity-0'}`}
                  >
                    {PLACEHOLDERS[placeholderIdx]}
                  </span>
                )}
              </div>
            </div>
          </form>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full vintage-border flex items-center justify-center overflow-hidden p-1.5 flex-shrink-0">
                <img src="/logo.svg" alt="FIREWATER" className="w-full h-full object-contain opacity-80" />
              </div>
              <div>
                {user ? (
                  <p className="text-[#EAE4D9]/60 text-sm font-sans">Howdy, <span className="text-[#EAE4D9]">{user.name?.split(' ')[0] || 'partner'}</span></p>
                ) : (
                  <p className="text-[#EAE4D9]/60 text-sm font-sans">Howdy, <span className="text-[#EAE4D9]">stranger</span></p>
                )}
                <div className="flex items-center gap-2">
                  <Users size={11} className="text-[#C89B3C]" />
                  <span className="section-kicker">{liquors.length} bottles on the shelf</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="font-serif text-4xl md:text-6xl font-normal gold-gradient-text leading-tight">
                Saddle up.
                <br />
                Pour one out.
              </h1>
              <p className="text-[#EAE4D9]/50 text-base md:text-lg font-serif italic max-w-2xl">
                The saloon for every spirit. Straight-shooting reviews. No snake oil.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                const randomLiquor = liquors[Math.floor(Math.random() * liquors.length)];
                navigate(`/liquor/${randomLiquor.id}`);
              }}
              className="flex-1 py-3.5 px-5 bg-[#C89B3C] hover:bg-[#D4A843] transition-all duration-300 flex items-center justify-center gap-3 hover:-translate-y-0.5 gold-glow active:scale-[0.97] active:shadow-none"
            >
              <Sparkles size={16} className="text-[#141210]" />
              <span className="font-sans text-sm font-semibold text-[#141210] uppercase tracking-widest">Luck of the Draw</span>
            </button>
            {totalListed > 0 && (
              <button
                onClick={() => navigate('/lists')}
                className="py-3.5 px-5 vintage-border hover:border-[#C89B3C] transition-all duration-300 flex items-center justify-center gap-2 hover:-translate-y-0.5 bg-[#141210]/40"
              >
                <Heart size={14} className="text-[#C89B3C]" />
                <span className="font-sans text-xs font-semibold text-[#EAE4D9]/70 tracking-[0.12em]">{totalListed} saved</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Community Picks - horizontal scroll */}
      <section className="w-full max-w-3xl mx-auto px-4 experience-support">
        <div className="experience-support-block">
          <div className="flex items-center justify-between gap-4">
            <h2 className="section-heading text-xl md:text-2xl">What the Regulars Are Drinking</h2>
            <button
              onClick={() => navigate('/catalog')}
              className="section-kicker inline-flex items-center gap-1 hover:gap-2 transition-all"
            >
              View all <ChevronRight size={14} />
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scroll-touch custom-scrollbar" style={{ scrollbarWidth: 'none' }}>
          {communityPicks.map(liquor => (
            <button
              key={liquor.id}
              onClick={() => navigate(`/liquor/${liquor.id}`)}
              className="flex-shrink-0 w-40 sm:w-48 bg-[#1A1816] vintage-border hover:border-[#C89B3C] card-elevated card-elevated-hover transition-all hover:-translate-y-0.5 duration-300 text-left group"
            >
              <div className="h-24 sm:h-28 bg-[#1E1C19] flex flex-col items-center justify-center px-3 gap-2 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#C89B3C]/5 to-transparent" />
                <span className="font-serif text-2xl sm:text-3xl text-[#C89B3C]/30 font-normal">{liquor.proof}°</span>
                <span className="px-2 py-0.5 bg-[#C89B3C]/10 text-[9px] font-sans font-semibold tracking-widest uppercase text-[#C89B3C] rounded-full">
                  {topFlavor(liquor)}
                </span>
              </div>
              <div className="p-3">
                <h3 className="font-serif text-sm text-[#EAE4D9] leading-tight line-clamp-2 mb-1 group-hover:text-[#C89B3C] transition-colors">
                  {liquor.name}
                </h3>
                <p className="meta-eyebrow truncate">{liquor.distillery}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-serif text-sm text-[#EAE4D9]/70">${liquor.price}</span>
                  <span className="meta-eyebrow text-[#EAE4D9]/30">{liquor.proof}pf</span>
                </div>
              </div>
            </button>
          ))}
          </div>
        </div>
      </section>

      {wantToTryLiquors.length > 0 && (
        <section className="w-full max-w-3xl mx-auto px-4 experience-meta">
          <div className="experience-meta-card">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <h2 className="section-heading text-xl md:text-2xl">Your Hitlist</h2>
                <span className="px-2 py-0.5 bg-[#C89B3C]/20 text-[10px] font-sans font-semibold tracking-[0.12em] text-[#C89B3C] border border-[#C89B3C]/30 rounded-full">
                  {wantToTry.length}
                </span>
              </div>
              <button
                onClick={() => navigate('/lists')}
                className="section-kicker inline-flex items-center gap-1 hover:gap-2 transition-all"
              >
                View all <ChevronRight size={14} />
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto pt-3 pb-2 scroll-touch custom-scrollbar" style={{ scrollbarWidth: 'none' }}>
            {wantToTryLiquors.map(liquor => (
              <button
                key={liquor.id}
                onClick={() => navigate(`/liquor/${liquor.id}`)}
                className="flex-shrink-0 w-40 sm:w-48 bg-[#1A1816] vintage-border hover:border-[#C89B3C] card-elevated card-elevated-hover transition-all hover:-translate-y-0.5 duration-300 text-left group"
              >
                <div className="h-24 sm:h-28 bg-[#1E1C19] flex flex-col items-center justify-center px-3 gap-2 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#C89B3C]/5 to-transparent" />
                  <Heart size={20} className="text-[#C89B3C]/40" />
                  <span className="px-2 py-0.5 bg-[#C89B3C]/10 text-[9px] font-sans font-semibold tracking-widest uppercase text-[#C89B3C] rounded-full">
                    {topFlavor(liquor)}
                  </span>
                </div>
                <div className="p-3">
                  <h3 className="font-serif text-sm text-[#EAE4D9] leading-tight line-clamp-2 mb-1 group-hover:text-[#C89B3C] transition-colors">
                    {liquor.name}
                  </h3>
                  <p className="meta-eyebrow truncate">{liquor.distillery}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-serif text-sm text-[#EAE4D9]/70">${liquor.price}</span>
                    <span className="meta-eyebrow text-[#EAE4D9]/30">{liquor.proof}pf</span>
                  </div>
                </div>
              </button>
            ))}
            </div>
          </div>
        </section>
      )}

      {/* Browse Categories */}
      <section className="w-full max-w-3xl mx-auto px-4 experience-meta">
        <div className="experience-meta-card">
          <div className="flex items-center justify-between gap-4">
            <h2 className="section-heading text-xl md:text-2xl">Ride the Range</h2>
            <button
              onClick={() => navigate('/catalog')}
              className="section-kicker inline-flex items-center gap-1 hover:gap-2 transition-all"
            >
              View all <ChevronRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-3">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.filter}
                onClick={() => handleCategoryClick(cat.filter)}
                className="flex flex-col items-center gap-3 p-4 bg-transparent border border-transparent border-t-[#EAE4D9]/15 hover:border-[#C89B3C]/30 transition-all hover:-translate-y-0.5 duration-300 group"
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${cat.color}15` }}
                >
                  <Icon size={20} style={{ color: cat.color }} />
                </div>
                <span className="text-[11px] text-[#EAE4D9]/60 tracking-[0.08em] font-sans text-center group-hover:text-[#EAE4D9] transition-colors">
                  {cat.label}
                </span>
              </button>
            );
          })}
          </div>
        </div>
      </section>

      {/* Value Props - compact row */}
      <section className="w-full max-w-3xl mx-auto px-4 experience-meta">
        <div className="experience-meta-card">
          <div className="section-divider mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/discover')}
            className="p-5 bg-transparent border border-transparent border-t-[#EAE4D9]/15 hover:border-[#C89B3C]/30 transition-all group text-left hover:-translate-y-0.5 duration-300 flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-full bg-[#C89B3C]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#C89B3C]/20 transition-colors">
              <Crosshair size={18} className="text-[#C89B3C]" />
            </div>
            <div>
              <h3 className="font-serif text-lg text-[#EAE4D9] mb-1">Start with the discovery quiz</h3>
              <p className="text-xs text-[#EAE4D9]/40 font-serif italic leading-relaxed">
                Get matched to bottles that fit your palate before you browse deeper.
              </p>
            </div>
          </button>

          <button
            onClick={() => navigate('/catalog')}
            className="p-5 bg-transparent border border-transparent border-t-[#EAE4D9]/15 hover:border-[#C89B3C]/30 transition-all group text-left hover:-translate-y-0.5 duration-300 flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-full bg-[#C89B3C]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#C89B3C]/20 transition-colors">
              <Search size={18} className="text-[#C89B3C]" />
            </div>
            <div>
              <h3 className="font-serif text-lg text-[#EAE4D9] mb-1">Refine in the catalog</h3>
              <p className="text-xs text-[#EAE4D9]/40 font-serif italic leading-relaxed">
                Search, sort, and filter the shelf with plain-language discovery tools.
              </p>
            </div>
          </button>

          <button
            onClick={() => navigate('/lists')}
            className="p-5 bg-transparent border border-transparent border-t-[#EAE4D9]/15 hover:border-[#C89B3C]/30 transition-all group text-left hover:-translate-y-0.5 duration-300 flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-full bg-[#C89B3C]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#C89B3C]/20 transition-colors">
              <BookOpen size={18} className="text-[#C89B3C]" />
            </div>
            <div>
              <h3 className="font-serif text-lg text-[#EAE4D9] mb-1">Save what stands out</h3>
              <p className="text-xs text-[#EAE4D9]/40 font-serif italic leading-relaxed">
                Keep a running list of bottles to try next and bottles you've already explored.
              </p>
            </div>
          </button>
          </div>
        </div>
      </section>
    </div>
  );
}
