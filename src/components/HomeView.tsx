import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Heart, ChevronRight, Sparkles, BookOpen, Crosshair, Users, Flame, Wheat, FlaskConical, DollarSign, Layers, Camera } from 'lucide-react';
import { User } from '../types';
import { Liquor } from '../data';
import Logo from './Logo';

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
    <div className="flex flex-col min-h-[80vh] animate-in fade-in duration-700">
      <div className="w-full max-w-5xl mx-auto px-4 pt-4 md:pt-8 mb-hero">
        <div className="bg-[#1A1816] vintage-border p-6 md:p-8 lg:p-10 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(200,155,60,0.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(200,155,60,0.08),transparent_30%)] pointer-events-none" />
          <div className="relative flex flex-col gap-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full vintage-border flex items-center justify-center overflow-hidden p-1.5 flex-shrink-0">
                <Logo className="w-full h-full object-contain opacity-80" />
              </div>
              <div>
                {user ? (
                  <p className="text-[#EAE4D9]/60 text-sm font-sans">Howdy, <span className="text-[#EAE4D9]">{user.name?.split(' ')[0] || 'partner'}</span></p>
                ) : (
                  <p className="text-[#EAE4D9]/60 text-sm font-sans">Howdy, <span className="text-[#EAE4D9]">stranger</span></p>
                )}
                <div className="flex items-center gap-2">
                  <Users size={11} className="text-[#C89B3C]" />
                  <span className="micro-label text-[#C89B3C]">{liquors.length} Bottles Ready to Discover</span>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] gap-8 items-start">
              <div>
                <h1 className="font-serif text-4xl md:text-6xl font-normal gold-gradient-text mb-4 leading-tight">
                  Start with a match.
                  <br />
                  Keep exploring from there.
                </h1>
                <p className="text-[#EAE4D9]/65 text-base md:text-lg font-serif italic mb-8 max-w-2xl leading-relaxed">
                  Take the discovery quiz for guided picks, browse the catalog when you want the full shelf, or search and scan your way into something new.
                </p>
                <p className="text-sm text-[#EAE4D9]/45 max-w-2xl leading-relaxed mb-2">
                  Firewater helps you find bottles that match your palate, track what you've tasted, and build a personal shelf — whether you're just getting started or deep into the journey.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 mb-5">
                  <button
                    onClick={() => navigate('/discover')}
                    className="inline-flex items-center justify-center gap-2 bg-[#C89B3C] text-[#141210] px-6 py-4 font-sans font-semibold tracking-widest uppercase hover:bg-[#D4A843] transition-all duration-300 hover:-translate-y-0.5 gold-glow"
                  >
                    <Crosshair size={18} /> Start Discovery Quiz
                  </button>
                  <button
                    onClick={() => navigate('/catalog')}
                    className="inline-flex items-center justify-center gap-2 vintage-border hover:bg-[#C89B3C] hover:text-[#141210] hover:border-[#C89B3C] text-[#C89B3C] px-6 py-4 font-sans font-semibold tracking-widest uppercase transition-all duration-300"
                  >
                    <BookOpen size={18} /> Browse Catalog
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => inputRef.current?.focus()}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#141210] border border-[#EAE4D9]/15 text-[#EAE4D9]/75 hover:text-[#EAE4D9] hover:border-[#C89B3C]/50 transition-colors text-xs font-semibold tracking-widest uppercase"
                  >
                    <Search size={16} className="text-[#C89B3C]" /> Search the Catalog
                  </button>
                  <button
                    onClick={() => navigate('/catalog?scan=1')}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#141210] border border-[#EAE4D9]/15 text-[#EAE4D9]/75 hover:text-[#EAE4D9] hover:border-[#C89B3C]/50 transition-colors text-xs font-semibold tracking-widest uppercase"
                  >
                    <Camera size={16} className="text-[#C89B3C]" /> Scan a Bottle
                  </button>
                </div>
              </div>

              <div className="bg-[#141210]/80 border border-[#EAE4D9]/10 p-5 md:p-6 space-y-4">
                <div>
                  <h2 className="font-serif text-2xl text-[#EAE4D9] mb-2">Know what you want?</h2>
                  <p className="text-sm text-[#EAE4D9]/55 leading-relaxed">
                    Search by flavor, distillery, proof, or budget to jump straight into the shelf.
                  </p>
                </div>
                <form onSubmit={handleSearch} className="bg-[#1A1816] vintage-border search-pulse p-1 relative group focus-within:border-[#C89B3C]/50 transition-colors">
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                  <div className="border border-[#EAE4D9]/10 bg-[#1A1816]/70 p-3">
                    <p className="micro-label text-[#C89B3C] mb-1">1</p>
                    <p className="text-sm text-[#EAE4D9] font-serif">Take the discovery quiz</p>
                  </div>
                  <div className="border border-[#EAE4D9]/10 bg-[#1A1816]/70 p-3">
                    <p className="micro-label text-[#C89B3C] mb-1">2</p>
                    <p className="text-sm text-[#EAE4D9] font-serif">Search and filter the shelf</p>
                  </div>
                  <div className="border border-[#EAE4D9]/10 bg-[#1A1816]/70 p-3">
                    <p className="micro-label text-[#C89B3C] mb-1">3</p>
                    <p className="text-sm text-[#EAE4D9] font-serif">Build your personal shelf</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-5xl mx-auto mb-section">
        <div className="flex items-center justify-between px-4 mb-4">
          <h2 className="font-display text-xl md:text-2xl text-[#EAE4D9]">Popular discoveries right now</h2>
          <button
            onClick={() => navigate('/catalog')}
            className="text-[#C89B3C] text-xs font-semibold tracking-widest uppercase flex items-center gap-1 hover:gap-2 transition-all"
          >
            Browse Catalog <ChevronRight size={14} />
          </button>
        </div>
        <p className="text-sm font-serif italic text-[#EAE4D9]/50 px-4 -mt-2 mb-2">
          Bottles the community keeps coming back to — a rotating selection based on what fellow explorers are discovering.
        </p>
        <div className="flex gap-4 overflow-x-auto px-4 pb-2 scroll-touch custom-scrollbar" style={{ scrollbarWidth: 'none' }}>
          {communityPicks.map(liquor => (
            <button
              key={liquor.id}
              onClick={() => navigate(`/liquor/${liquor.id}`)}
              className="flex-shrink-0 w-40 sm:w-48 bg-[#1A1816] card-elevated card-elevated-hover transition-all hover:-translate-y-0.5 duration-300 text-left group"
            >
              <div className="h-24 sm:h-28 bg-[#1E1C19] flex flex-col items-center justify-center px-3 gap-2 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#C89B3C]/5 to-transparent" />
                <span className="font-display text-2xl sm:text-3xl text-[#C89B3C]/30 font-normal">{liquor.proof}°</span>
                <span className="px-2 py-0.5 bg-[#C89B3C]/10 text-[9px] font-sans font-semibold tracking-widest uppercase text-[#C89B3C] rounded-full">
                  {topFlavor(liquor)}
                </span>
              </div>
              <div className="p-3">
                <h3 className="font-display text-sm text-[#EAE4D9] leading-tight line-clamp-2 mb-1 group-hover:text-[#C89B3C] transition-colors">
                  {liquor.name}
                </h3>
                <p className="text-[10px] text-[#EAE4D9]/40 uppercase tracking-widest font-sans truncate">{liquor.distillery}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-display text-sm text-[#EAE4D9]/70">${liquor.price}</span>
                  <span className="text-[10px] text-[#EAE4D9]/30 uppercase tracking-widest font-sans">{liquor.proof}pf</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {wantToTryLiquors.length > 0 && (
        <div className="w-full max-w-5xl mx-auto mb-subsection">
          <div className="flex items-center justify-between px-4 mb-4">
            <div className="flex items-center gap-3">
              <h2 className="font-display text-xl md:text-2xl text-[#EAE4D9]">Your discovery shortlist</h2>
              <span className="px-2 py-0.5 bg-[#C89B3C]/20 text-[10px] font-sans font-semibold tracking-widest text-[#C89B3C] border border-[#C89B3C]/30 rounded-full">
                {wantToTry.length}
              </span>
            </div>
            <button
              onClick={() => navigate('/lists')}
              className="text-[#C89B3C] text-xs font-semibold tracking-widest uppercase flex items-center gap-1 hover:gap-2 transition-all"
            >
              View Lists <ChevronRight size={14} />
            </button>
          </div>
          <p className="text-sm font-serif italic text-[#EAE4D9]/50 px-4 -mt-2 mb-2">
            Bottles you've flagged to try next. Tap any to see tasting notes, or head to your full shelf to manage the list.
          </p>
          <div className="flex gap-4 overflow-x-auto px-4 pb-2 scroll-touch custom-scrollbar" style={{ scrollbarWidth: 'none' }}>
            {wantToTryLiquors.map(liquor => (
              <button
                key={liquor.id}
                onClick={() => navigate(`/liquor/${liquor.id}`)}
                className="flex-shrink-0 w-40 sm:w-48 bg-[#1A1816] card-elevated card-elevated-hover transition-all hover:-translate-y-0.5 duration-300 text-left group"
              >
                <div className="h-24 sm:h-28 bg-[#1E1C19] flex flex-col items-center justify-center px-3 gap-2 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#C89B3C]/5 to-transparent" />
                  <Heart size={20} className="text-[#C89B3C]/40" />
                  <span className="px-2 py-0.5 bg-[#C89B3C]/10 text-[9px] font-sans font-semibold tracking-widest uppercase text-[#C89B3C] rounded-full">
                    {topFlavor(liquor)}
                  </span>
                </div>
                <div className="p-3">
                  <h3 className="font-display text-sm text-[#EAE4D9] leading-tight line-clamp-2 mb-1 group-hover:text-[#C89B3C] transition-colors">
                    {liquor.name}
                  </h3>
                  <p className="text-[10px] text-[#EAE4D9]/40 uppercase tracking-widest font-sans truncate">{liquor.distillery}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-display text-sm text-[#EAE4D9]/70">${liquor.price}</span>
                    <span className="text-[10px] text-[#EAE4D9]/30 uppercase tracking-widest font-sans">{liquor.proof}pf</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="w-full max-w-5xl mx-auto px-4 mb-section">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl md:text-2xl text-[#EAE4D9]">Browse by starting point</h2>
          <button
            onClick={() => navigate('/catalog')}
            className="text-[#C89B3C] text-xs font-semibold tracking-widest uppercase flex items-center gap-1 hover:gap-2 transition-all"
          >
            Browse Catalog <ChevronRight size={14} />
          </button>
        </div>
        <p className="text-sm font-serif italic text-[#EAE4D9]/50 mb-1">
          Pick a lane — high proof, wheated, budget-friendly — and see every bottle that fits. A quick way to narrow the shelf before you search.
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.filter}
                onClick={() => handleCategoryClick(cat.filter)}
                className="flex flex-col items-center gap-3 p-4 bg-[#1A1816] card-elevated card-elevated-hover transition-all hover:-translate-y-0.5 duration-300 group"
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${cat.color}15` }}
                >
                  <Icon size={20} style={{ color: cat.color }} />
                </div>
                <span className="text-[11px] text-[#EAE4D9]/60 uppercase tracking-widest font-sans text-center group-hover:text-[#EAE4D9] transition-colors">
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-full max-w-5xl mx-auto px-4 mb-subsection">
        <div className="section-divider mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/discover')}
            className="p-4 bg-[#1A1816] border border-[#EAE4D9]/8 hover:border-[#C89B3C]/30 transition-all group text-left duration-300 flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-full bg-[#C89B3C]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#C89B3C]/20 transition-colors">
              <Crosshair size={18} className="text-[#C89B3C]" />
            </div>
            <div>
              <h3 className="font-display text-lg text-[#EAE4D9] mb-1">Start with the discovery quiz</h3>
              <p className="text-xs text-[#EAE4D9]/40 font-serif italic leading-relaxed">
                Answer five quick questions about your taste and we'll surface the bottles most likely to click with you.
              </p>
            </div>
          </button>

          <button
            onClick={() => navigate('/catalog')}
            className="p-4 bg-[#1A1816] border border-[#EAE4D9]/8 hover:border-[#C89B3C]/30 transition-all group text-left duration-300 flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-full bg-[#C89B3C]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#C89B3C]/20 transition-colors">
              <Search size={18} className="text-[#C89B3C]" />
            </div>
            <div>
              <h3 className="font-display text-lg text-[#EAE4D9] mb-1">Refine in the catalog</h3>
              <p className="text-xs text-[#EAE4D9]/40 font-serif italic leading-relaxed">
                Type a flavor, a distillery, or a budget and the catalog zeroes in. Add filters to dial it tighter until you find the one.
              </p>
            </div>
          </button>

          <button
            onClick={() => navigate('/lists')}
            className="p-4 bg-[#1A1816] border border-[#EAE4D9]/8 hover:border-[#C89B3C]/30 transition-all group text-left duration-300 flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-full bg-[#C89B3C]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#C89B3C]/20 transition-colors">
              <BookOpen size={18} className="text-[#C89B3C]" />
            </div>
            <div>
              <h3 className="font-display text-lg text-[#EAE4D9] mb-1">Save what stands out</h3>
              <p className="text-xs text-[#EAE4D9]/40 font-serif italic leading-relaxed">
                Heart a bottle to add it to your hitlist. Mark it tried once you've tasted it. Over time, your shelf becomes a map of your palate.
              </p>
            </div>
          </button>
        </div>
      </div>

      <div className="w-full max-w-5xl mx-auto px-4 pb-12">
        <div className="flex gap-3">
          <button
            onClick={() => {
              const randomLiquor = liquors[Math.floor(Math.random() * liquors.length)];
              navigate(`/liquor/${randomLiquor.id}`);
            }}
            className="flex-1 py-3.5 px-5 bg-[#C89B3C] hover:bg-[#D4A843] transition-all duration-300 flex items-center justify-center gap-3 hover:-translate-y-0.5 gold-glow active:scale-[0.97] active:shadow-none"
          >
            <Sparkles size={16} className="text-[#141210]" />
            <span className="font-sans text-sm font-semibold text-[#141210] uppercase tracking-widest">Random Discovery</span>
          </button>
          {totalListed > 0 && (
            <button
              onClick={() => navigate('/lists')}
              className="py-3.5 px-5 vintage-border hover:border-[#C89B3C] transition-all duration-300 flex items-center justify-center gap-2 hover:-translate-y-0.5"
            >
              <Heart size={14} className="text-[#C89B3C]" />
              <span className="font-sans text-xs font-semibold text-[#EAE4D9]/70 uppercase tracking-widest">{totalListed}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
