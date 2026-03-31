import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, Heart, ChevronRight, Sparkles, MessageSquare, BookOpen, Crosshair, Users, Flame, Wheat, FlaskConical, DollarSign, Layers } from 'lucide-react';
import { User } from '../types';
import { Bourbon } from '../data';

interface HomeViewProps {
  user: User | null;
  bourbons: Bourbon[];
  wantToTry: string[];
  tried: string[];
}

const PLACEHOLDERS = [
  'Search by flavor... "smooth and sweet"',
  'Search by distillery... "Buffalo Trace"',
  'Search by style... "high rye bourbon"',
  'Search by price... "under 50 dollars"',
  'Search by proof... "barrel strength"',
];

const CATEGORIES = [
  { label: 'High Proof', icon: Flame, filter: 'high-proof', color: '#E85D3A' },
  { label: 'Wheated', icon: Wheat, filter: 'wheated', color: '#D4A843' },
  { label: 'High Rye', icon: FlaskConical, filter: 'rye', color: '#8B6F47' },
  { label: 'Single Barrel', icon: Layers, filter: 'single-barrel', color: '#9B7653' },
  { label: 'Under $50', icon: DollarSign, filter: 'under-50', color: '#5A8F5A' },
  { label: 'The Whole Saloon', icon: BookOpen, filter: 'all', color: '#C89B3C' },
];

export default function HomeView({ user, bourbons, wantToTry, tried }: HomeViewProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx(prev => (prev + 1) % PLACEHOLDERS.length);
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

  // Community picks: a rotating set of 6 bourbons seeded by date
  const communityPicks = useMemo(() => {
    if (bourbons.length === 0) return [];
    const daysSinceEpoch = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    const picks: Bourbon[] = [];
    const used = new Set<number>();
    for (let i = 0; i < Math.min(8, bourbons.length); i++) {
      let idx = (daysSinceEpoch * 7 + i * 13) % bourbons.length;
      while (used.has(idx)) idx = (idx + 1) % bourbons.length;
      used.add(idx);
      picks.push(bourbons[idx]);
    }
    return picks;
  }, [bourbons]);

  // Want-to-try bourbons for the user's list preview
  const wantToTryBourbons = useMemo(() => {
    return wantToTry
      .slice(0, 6)
      .map(id => bourbons.find(b => b.id === id))
      .filter((b): b is Bourbon => !!b);
  }, [wantToTry, bourbons]);

  const totalListed = wantToTry.length + tried.length;

  // Top flavor for a bourbon (for the badge)
  const topFlavor = (b: Bourbon) => {
    const entries = Object.entries(b.flavorProfile);
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0][0].charAt(0).toUpperCase() + entries[0][0].slice(1);
  };

  return (
    <div className="flex flex-col min-h-[80vh] animate-in fade-in duration-700">
      {/* Search - pinned to top */}
      <div className="w-full max-w-3xl mx-auto px-4 pt-4 md:pt-6 mb-6">
        <form onSubmit={handleSearch} className="bg-[#1A1816] vintage-border search-pulse p-1 relative group focus-within:border-[#C89B3C]/50 transition-colors">
          <div className="w-full flex items-center gap-4 px-5 py-3.5">
            <Search className="h-5 w-5 text-[#C89B3C] flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={PLACEHOLDERS[placeholderIdx]}
              className="flex-1 bg-transparent text-base sm:text-lg font-serif italic text-[#EAE4D9] placeholder-[#EAE4D9]/30 focus:outline-none"
            />
          </div>
        </form>
      </div>

      {/* Header / Greeting */}
      <div className="w-full max-w-3xl mx-auto px-4 pt-2">
        <div className="flex items-center gap-4 mb-8">
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
              <span className="micro-label text-[#C89B3C]">{bourbons.length} Bottles on the Shelf</span>
            </div>
          </div>
        </div>

        {/* Hero headline */}
        <h1 className="font-serif text-4xl md:text-6xl font-normal gold-gradient-text mb-3 leading-tight">
          Saddle up.
          <br />
          Pour one out.
        </h1>
        <p className="text-[#EAE4D9]/50 text-base md:text-lg font-serif italic mb-8">
          A watering hole for bourbon drinkers. Straight-shooting reviews. No snake oil.
        </p>
      </div>

      {/* Community Picks - horizontal scroll */}
      <div className="w-full max-w-3xl mx-auto mb-10">
        <div className="flex items-center justify-between px-4 mb-4">
          <h2 className="font-serif text-xl md:text-2xl text-[#EAE4D9]">What the Regulars Are Drinking</h2>
          <button
            onClick={() => navigate('/catalog')}
            className="text-[#C89B3C] text-xs font-semibold tracking-widest uppercase flex items-center gap-1 hover:gap-2 transition-all"
          >
            View All <ChevronRight size={14} />
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto px-4 pb-2 scroll-touch custom-scrollbar" style={{ scrollbarWidth: 'none' }}>
          {communityPicks.map(bourbon => (
            <button
              key={bourbon.id}
              onClick={() => navigate(`/bourbon/${bourbon.id}`)}
              className="flex-shrink-0 w-40 sm:w-48 bg-[#1A1816] vintage-border hover:border-[#C89B3C] card-elevated card-elevated-hover transition-all hover:-translate-y-0.5 duration-300 text-left group"
            >
              {/* Flavor color band */}
              <div className="h-24 sm:h-28 bg-[#1E1C19] flex flex-col items-center justify-center px-3 gap-2 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#C89B3C]/5 to-transparent" />
                <span className="font-serif text-2xl sm:text-3xl text-[#C89B3C]/30 font-normal">{bourbon.proof}°</span>
                <span className="px-2 py-0.5 bg-[#C89B3C]/10 text-[9px] font-sans font-semibold tracking-widest uppercase text-[#C89B3C] rounded-full">
                  {topFlavor(bourbon)}
                </span>
              </div>
              <div className="p-3">
                <h3 className="font-serif text-sm text-[#EAE4D9] leading-tight line-clamp-2 mb-1 group-hover:text-[#C89B3C] transition-colors">
                  {bourbon.name}
                </h3>
                <p className="text-[10px] text-[#EAE4D9]/40 uppercase tracking-widest font-sans truncate">{bourbon.distillery}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-serif text-sm text-[#EAE4D9]/70">${bourbon.price}</span>
                  <span className="text-[10px] text-[#EAE4D9]/30 uppercase tracking-widest font-sans">{bourbon.proof}pf</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Want to Try - show if user has items */}
      {wantToTryBourbons.length > 0 && (
        <div className="w-full max-w-3xl mx-auto mb-10">
          <div className="flex items-center justify-between px-4 mb-4">
            <div className="flex items-center gap-3">
              <h2 className="font-serif text-xl md:text-2xl text-[#EAE4D9]">Your Hitlist</h2>
              <span className="px-2 py-0.5 bg-[#C89B3C]/20 text-[10px] font-sans font-semibold tracking-widest text-[#C89B3C] border border-[#C89B3C]/30 rounded-full">
                {wantToTry.length}
              </span>
            </div>
            <button
              onClick={() => navigate('/lists')}
              className="text-[#C89B3C] text-xs font-semibold tracking-widest uppercase flex items-center gap-1 hover:gap-2 transition-all"
            >
              View All <ChevronRight size={14} />
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto px-4 pb-2 scroll-touch custom-scrollbar" style={{ scrollbarWidth: 'none' }}>
            {wantToTryBourbons.map(bourbon => (
              <button
                key={bourbon.id}
                onClick={() => navigate(`/bourbon/${bourbon.id}`)}
                className="flex-shrink-0 w-40 sm:w-48 bg-[#1A1816] vintage-border hover:border-[#C89B3C] card-elevated card-elevated-hover transition-all hover:-translate-y-0.5 duration-300 text-left group"
              >
                <div className="h-24 sm:h-28 bg-[#1E1C19] flex flex-col items-center justify-center px-3 gap-2 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#C89B3C]/5 to-transparent" />
                  <Heart size={20} className="text-[#C89B3C]/40" />
                  <span className="px-2 py-0.5 bg-[#C89B3C]/10 text-[9px] font-sans font-semibold tracking-widest uppercase text-[#C89B3C] rounded-full">
                    {topFlavor(bourbon)}
                  </span>
                </div>
                <div className="p-3">
                  <h3 className="font-serif text-sm text-[#EAE4D9] leading-tight line-clamp-2 mb-1 group-hover:text-[#C89B3C] transition-colors">
                    {bourbon.name}
                  </h3>
                  <p className="text-[10px] text-[#EAE4D9]/40 uppercase tracking-widest font-sans truncate">{bourbon.distillery}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-serif text-sm text-[#EAE4D9]/70">${bourbon.price}</span>
                    <span className="text-[10px] text-[#EAE4D9]/30 uppercase tracking-widest font-sans">{bourbon.proof}pf</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Browse Categories */}
      <div className="w-full max-w-3xl mx-auto px-4 mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl md:text-2xl text-[#EAE4D9]">Ride the Range</h2>
          <button
            onClick={() => navigate('/catalog')}
            className="text-[#C89B3C] text-xs font-semibold tracking-widest uppercase flex items-center gap-1 hover:gap-2 transition-all"
          >
            View All <ChevronRight size={14} />
          </button>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.filter}
                onClick={() => handleCategoryClick(cat.filter)}
                className="flex flex-col items-center gap-3 p-4 bg-[#1A1816] vintage-border hover:border-[#C89B3C] card-elevated card-elevated-hover transition-all hover:-translate-y-0.5 duration-300 group"
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

      {/* Value Props - compact row */}
      <div className="w-full max-w-3xl mx-auto px-4 mb-10">
        <div className="section-divider mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/discover')}
            className="p-5 bg-[#1A1816] vintage-border hover:border-[#C89B3C] card-elevated card-elevated-hover transition-all group text-left hover:-translate-y-0.5 duration-300 flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-full bg-[#C89B3C]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#C89B3C]/20 transition-colors">
              <Crosshair size={18} className="text-[#C89B3C]" />
            </div>
            <div>
              <h3 className="font-serif text-lg text-[#EAE4D9] mb-1">Scout Your Next Bottle</h3>
              <p className="text-xs text-[#EAE4D9]/40 font-serif italic leading-relaxed">
                Recommendations from the crew that match your palate.
              </p>
            </div>
          </button>

          <button
            onClick={() => navigate('/catalog')}
            className="p-5 bg-[#1A1816] vintage-border hover:border-[#C89B3C] card-elevated card-elevated-hover transition-all group text-left hover:-translate-y-0.5 duration-300 flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-full bg-[#C89B3C]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#C89B3C]/20 transition-colors">
              <MessageSquare size={18} className="text-[#C89B3C]" />
            </div>
            <div>
              <h3 className="font-serif text-lg text-[#EAE4D9] mb-1">Straight-Shooting Reviews</h3>
              <p className="text-xs text-[#EAE4D9]/40 font-serif italic leading-relaxed">
                Honest notes from folks who actually drink the stuff.
              </p>
            </div>
          </button>

          <button
            onClick={() => navigate('/lists')}
            className="p-5 bg-[#1A1816] vintage-border hover:border-[#C89B3C] card-elevated card-elevated-hover transition-all group text-left hover:-translate-y-0.5 duration-300 flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-full bg-[#C89B3C]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#C89B3C]/20 transition-colors">
              <BookOpen size={18} className="text-[#C89B3C]" />
            </div>
            <div>
              <h3 className="font-serif text-lg text-[#EAE4D9] mb-1">Blaze Your Trail</h3>
              <p className="text-xs text-[#EAE4D9]/40 font-serif italic leading-relaxed">
                Track what you've conquered and what's on the horizon.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="w-full max-w-3xl mx-auto px-4 pb-12">
        <div className="flex gap-3">
          <button
            onClick={() => {
              const randomBourbon = bourbons[Math.floor(Math.random() * bourbons.length)];
              navigate(`/bourbon/${randomBourbon.id}`);
            }}
            className="flex-1 py-3.5 px-5 bg-[#C89B3C] hover:bg-[#D4A843] transition-all duration-300 flex items-center justify-center gap-3 hover:-translate-y-0.5 gold-glow active:scale-[0.97] active:shadow-none"
          >
            <Sparkles size={16} className="text-[#141210]" />
            <span className="font-sans text-sm font-semibold text-[#141210] uppercase tracking-widest">Luck of the Draw</span>
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
