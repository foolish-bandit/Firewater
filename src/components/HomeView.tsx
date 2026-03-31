import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, Heart, ChevronRight, Sparkles, MessageSquare, BookOpen, Crosshair } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
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

  const featuredBourbon = useMemo(() => {
    const daysSinceEpoch = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    const idx = daysSinceEpoch % bourbons.length;
    return bourbons[idx];
  }, [bourbons]);

  const featuredFlavorData = useMemo(() => {
    if (!featuredBourbon) return [];
    return Object.entries(featuredBourbon.flavorProfile).map(([key, value]) => ({
      subject: key.charAt(0).toUpperCase() + key.slice(1),
      A: value,
      fullMark: 10,
    }));
  }, [featuredBourbon]);

  const handleRandom = () => {
    const randomBourbon = bourbons[Math.floor(Math.random() * bourbons.length)];
    navigate(`/bourbon/${randomBourbon.id}`);
  };

  const totalListed = wantToTry.length + tried.length;

  return (
    <div className="flex flex-col items-center min-h-[80vh] animate-in fade-in duration-700">
      {/* Hero */}
      <div className="text-center pt-8 md:pt-16 pb-12 md:pb-16 w-full max-w-3xl mx-auto px-4">
        <div className="w-20 h-20 rounded-full vintage-border flex items-center justify-center mx-auto mb-8 overflow-hidden p-2">
          <img src="/logo.svg" alt="BRRL Book Logo" className="w-full h-full object-contain opacity-80" />
        </div>
        <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-normal tracking-wide gold-gradient-text mb-6">
          BRRL Book
        </h1>
        <p className="text-[#EAE4D9]/70 max-w-2xl mx-auto text-lg md:text-2xl font-serif italic leading-relaxed">
          Find your next bottle. Read honest reviews.
          <br className="hidden sm:block" />
          {' '}Track your bourbon journey.
        </p>
        <p className="micro-label text-[#C89B3C] mt-4">{bourbons.length} Bourbons Cataloged</p>
      </div>

      {/* Search */}
      <div className="w-full max-w-2xl px-4 mb-12 md:mb-16">
        <form onSubmit={handleSearch} className="bg-[#1A1816] vintage-border search-pulse p-1 relative group focus-within:border-[#C89B3C]/50 transition-colors">
          <div className="w-full flex items-center gap-4 px-6 py-4">
            <Search className="h-6 w-6 text-[#C89B3C] flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={PLACEHOLDERS[placeholderIdx]}
              className="flex-1 bg-transparent text-base sm:text-xl font-serif italic text-[#EAE4D9] placeholder-[#EAE4D9]/40 focus:outline-none"
            />
          </div>
        </form>
      </div>

      {/* Value Propositions */}
      <div className="w-full max-w-4xl px-4 mb-16 md:mb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => navigate('/discover')}
            className="p-8 bg-[#1A1816] vintage-border hover:border-[#C89B3C] card-glow-hover transition-all group text-left hover:-translate-y-1 duration-300"
          >
            <div className="mb-5 w-12 h-12 rounded-full bg-[#C89B3C]/10 flex items-center justify-center group-hover:bg-[#C89B3C]/20 transition-colors">
              <Crosshair size={22} className="text-[#C89B3C]" />
            </div>
            <h3 className="font-serif text-2xl text-[#EAE4D9] mb-2">Find Your Next Bottle</h3>
            <p className="text-sm text-[#EAE4D9]/50 font-serif italic leading-relaxed">
              Search by flavor, price, or proof. Get recommendations that actually match what you like.
            </p>
            <div className="flex items-center gap-2 text-[#C89B3C] text-xs font-semibold tracking-widest uppercase mt-5 group-hover:gap-3 transition-all">
              <span>Discover</span>
              <ChevronRight size={14} />
            </div>
          </button>

          <button
            onClick={() => navigate('/catalog')}
            className="p-8 bg-[#1A1816] vintage-border hover:border-[#C89B3C] card-glow-hover transition-all group text-left hover:-translate-y-1 duration-300"
          >
            <div className="mb-5 w-12 h-12 rounded-full bg-[#C89B3C]/10 flex items-center justify-center group-hover:bg-[#C89B3C]/20 transition-colors">
              <MessageSquare size={22} className="text-[#C89B3C]" />
            </div>
            <h3 className="font-serif text-2xl text-[#EAE4D9] mb-2">No-BS Reviews</h3>
            <p className="text-sm text-[#EAE4D9]/50 font-serif italic leading-relaxed">
              Honest tasting notes and ratings from real drinkers. No paid promos, no fluff.
            </p>
            <div className="flex items-center gap-2 text-[#C89B3C] text-xs font-semibold tracking-widest uppercase mt-5 group-hover:gap-3 transition-all">
              <span>Browse Catalog</span>
              <ChevronRight size={14} />
            </div>
          </button>

          <button
            onClick={() => navigate('/lists')}
            className="p-8 bg-[#1A1816] vintage-border hover:border-[#C89B3C] card-glow-hover transition-all group text-left hover:-translate-y-1 duration-300"
          >
            <div className="mb-5 w-12 h-12 rounded-full bg-[#C89B3C]/10 flex items-center justify-center group-hover:bg-[#C89B3C]/20 transition-colors">
              <BookOpen size={22} className="text-[#C89B3C]" />
            </div>
            <h3 className="font-serif text-2xl text-[#EAE4D9] mb-2">Track Your Journey</h3>
            <p className="text-sm text-[#EAE4D9]/50 font-serif italic leading-relaxed">
              Keep a list of what you've tried and what's next. Your personal bourbon diary.
            </p>
            <div className="flex items-center gap-2 text-[#C89B3C] text-xs font-semibold tracking-widest uppercase mt-5 group-hover:gap-3 transition-all">
              <span>{user ? 'My Lists' : 'Get Started'}</span>
              <ChevronRight size={14} />
            </div>
          </button>
        </div>
      </div>

      {/* Journey Stats */}
      {totalListed > 0 && (
        <div className="flex items-center justify-center gap-4 sm:gap-6 text-center flex-wrap mb-12">
          <div className="flex items-center gap-2">
            <Heart size={14} className="text-[#C89B3C]" />
            <span className="micro-label text-[#C89B3C]">{wantToTry.length} Want to Try</span>
          </div>
          <div className="w-px h-4 bg-[#EAE4D9]/10" />
          <div className="flex items-center gap-2">
            <Star size={14} className="text-[#C89B3C]" />
            <span className="micro-label text-[#C89B3C]">{tried.length} Tried</span>
          </div>
        </div>
      )}

      {/* Quick Actions Row */}
      <div className="w-full max-w-2xl px-4 mb-16">
        <div className="flex gap-4">
          <button
            onClick={handleRandom}
            className="flex-1 py-4 px-6 bg-[#1A1816] vintage-border hover:border-[#C89B3C] card-glow-hover transition-all hover:-translate-y-0.5 duration-300 flex items-center justify-center gap-3"
          >
            <Sparkles size={18} className="text-[#C89B3C]" />
            <span className="font-serif text-[#EAE4D9] text-lg">Random Pour</span>
          </button>
          <button
            onClick={() => navigate('/catalog')}
            className="flex-1 py-4 px-6 bg-[#1A1816] vintage-border hover:border-[#C89B3C] card-glow-hover transition-all hover:-translate-y-0.5 duration-300 flex items-center justify-center gap-3"
          >
            <Search size={18} className="text-[#C89B3C]" />
            <span className="font-serif text-[#EAE4D9] text-lg">Full Catalog</span>
          </button>
        </div>
      </div>

      {/* Featured Bourbon of the Day */}
      {featuredBourbon && (
        <div className="w-full max-w-2xl px-4 pb-12">
          <div className="section-divider mb-10" />
          <div className="text-center mb-8">
            <p className="micro-label text-[#C89B3C] mb-2">Pour of the Day</p>
            <h2 className="font-serif text-3xl md:text-4xl font-normal text-[#EAE4D9]">Featured Bourbon</h2>
          </div>

          <div
            onClick={() => navigate(`/bourbon/${featuredBourbon.id}`)}
            className="bg-[#1A1816] vintage-border p-5 sm:p-8 cursor-pointer hover:border-[#C89B3C] card-glow-hover transition-all duration-500 group"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="font-serif text-3xl text-[#EAE4D9] group-hover:text-[#C89B3C] transition-colors leading-tight">
                  {featuredBourbon.name}
                </h3>
                <p className="micro-label text-[#C89B3C]">{featuredBourbon.distillery}</p>
                <div className="flex items-center gap-4">
                  <span className="px-3 py-1 bg-[#141210]/90 text-[10px] font-sans font-semibold tracking-widest uppercase text-[#C89B3C] vintage-border">
                    {featuredBourbon.proof} Proof
                  </span>
                  <span className="font-serif text-lg text-[#EAE4D9] italic">${featuredBourbon.price}</span>
                </div>
                <p className="text-sm text-[#EAE4D9]/60 font-serif italic leading-relaxed line-clamp-4">
                  {featuredBourbon.description}
                </p>
                <div className="flex items-center gap-2 text-[#C89B3C] text-xs font-semibold tracking-widest uppercase group-hover:gap-3 transition-all">
                  <span>View Details</span>
                  <ChevronRight size={14} />
                </div>
              </div>

              {/* Mini Radar Chart */}
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={featuredFlavorData}>
                    <PolarGrid stroke="rgba(234, 228, 217, 0.08)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(234, 228, 217, 0.35)', fontSize: 9, fontFamily: 'Montserrat' }} />
                    <Radar name={featuredBourbon.name} dataKey="A" stroke="#C89B3C" fill="#C89B3C" fillOpacity={0.15} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
