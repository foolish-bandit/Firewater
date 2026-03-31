import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, Heart, List as ListIcon, ChevronRight, Sparkles } from 'lucide-react';
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
    // Seed based on date so it changes daily, not on every render
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
    <div className="flex flex-col items-center min-h-[80vh] space-y-16 animate-in fade-in duration-700">
      {/* Hero */}
      <div className="text-center space-y-6 pt-8 md:pt-16">
        <div className="w-20 h-20 rounded-full vintage-border flex items-center justify-center mx-auto mb-6 overflow-hidden p-2">
          <img src="/logo.svg" alt="BRRL Book Logo" className="w-full h-full object-contain opacity-80" />
        </div>
        <h1 className="font-serif text-6xl md:text-8xl font-normal tracking-wide gold-gradient-text">
          BRRL Book
        </h1>
        <p className="text-[#EAE4D9]/60 max-w-xl mx-auto text-xl font-serif italic">
          The definitive archive of American Whiskey.
        </p>
        <p className="micro-label text-[#C89B3C]">{bourbons.length} Bourbons Cataloged</p>
      </div>

      <div className="w-full max-w-2xl space-y-8">
        {/* Search */}
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

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/catalog')}
            className="p-6 bg-[#1A1816] vintage-border hover:border-[#C89B3C] card-glow-hover transition-all group text-left hover:-translate-y-0.5 duration-300"
          >
            <div className="mb-3 text-[#C89B3C] group-hover:scale-110 transition-transform origin-left">
              <ListIcon size={24} />
            </div>
            <h3 className="font-serif text-xl text-[#EAE4D9] mb-1">Browse Catalog</h3>
            <p className="text-xs text-[#EAE4D9]/40 uppercase tracking-widest">Explore All</p>
          </button>

          <button
            onClick={() => navigate('/discover')}
            className="p-6 bg-[#1A1816] vintage-border hover:border-[#C89B3C] card-glow-hover transition-all group text-left hover:-translate-y-0.5 duration-300"
          >
            <div className="mb-3 text-[#C89B3C] group-hover:scale-110 transition-transform origin-left">
              <Sparkles size={24} />
            </div>
            <h3 className="font-serif text-xl text-[#EAE4D9] mb-1">Discover</h3>
            <p className="text-xs text-[#EAE4D9]/40 uppercase tracking-widest">Find Your Next Pour</p>
          </button>

          <button
            onClick={handleRandom}
            className="p-6 bg-[#1A1816] vintage-border hover:border-[#C89B3C] card-glow-hover transition-all group text-left hover:-translate-y-0.5 duration-300"
          >
            <div className="mb-3 text-[#C89B3C] group-hover:scale-110 transition-transform origin-left">
              <Star size={24} />
            </div>
            <h3 className="font-serif text-xl text-[#EAE4D9] mb-1">Random Pour</h3>
            <p className="text-xs text-[#EAE4D9]/40 uppercase tracking-widest">Feeling Lucky</p>
          </button>

          <button
            onClick={() => navigate('/lists')}
            className={`p-6 bg-[#1A1816] vintage-border hover:border-[#C89B3C] card-glow-hover transition-all group text-left hover:-translate-y-0.5 duration-300 ${!user ? 'opacity-60 hover:opacity-100' : ''}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`${user ? 'text-[#C89B3C]' : 'text-[#EAE4D9]/40 group-hover:text-[#C89B3C]'} group-hover:scale-110 transition-all origin-left`}>
                <Heart size={24} />
              </div>
              {totalListed > 0 && (
                <span className="px-2 py-0.5 bg-[#C89B3C]/20 text-[10px] font-sans font-semibold tracking-widest text-[#C89B3C] border border-[#C89B3C]/30 rounded-full">
                  {totalListed}
                </span>
              )}
            </div>
            <h3 className="font-serif text-xl text-[#EAE4D9] mb-1">My Lists</h3>
            <p className="text-xs text-[#EAE4D9]/40 uppercase tracking-widest">
              {user ? 'Your Collection' : 'Sign In to Track'}
            </p>
          </button>
        </div>
      </div>

      {/* Journey Stats */}
      {totalListed > 0 && (
        <div className="flex items-center justify-center gap-4 sm:gap-6 text-center flex-wrap">
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

      {/* Featured Bourbon of the Day */}
      {featuredBourbon && (
        <div className="w-full max-w-2xl">
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
