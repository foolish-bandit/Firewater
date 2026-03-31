import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, Heart, List as ListIcon } from 'lucide-react';
import { User } from '../types';
import { Bourbon } from '../data';

interface HomeViewProps {
  user: User | null;
  bourbons: Bourbon[];
}

export default function HomeView({ user, bourbons }: HomeViewProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    navigate(q ? `/catalog?q=${encodeURIComponent(q)}` : '/catalog');
  };

  const handleRandom = () => {
    const randomBourbon = bourbons[Math.floor(Math.random() * bourbons.length)];
    navigate(`/bourbon/${randomBourbon.id}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-12 animate-in fade-in duration-700">
      <div className="text-center space-y-6">
        <div className="w-24 h-24 rounded-full vintage-border flex items-center justify-center mx-auto mb-8 overflow-hidden p-2">
          <img src="/logo.svg" alt="Barrel Book Logo" className="w-full h-full object-contain opacity-80" />
        </div>
        <h1 className="font-serif text-6xl md:text-8xl font-normal text-[#EAE4D9] tracking-wide">Barrel Book</h1>
        <p className="text-[#EAE4D9]/60 max-w-xl mx-auto text-xl font-serif italic">The definitive archive of American Whiskey.</p>
      </div>

      <div className="w-full max-w-2xl space-y-8">
        {/* Search */}
        <form onSubmit={handleSearch} className="bg-[#1A1816] vintage-border p-1 relative group hover:border-[#C89B3C]/50 focus-within:border-[#C89B3C]/50 transition-colors">
          <div className="w-full flex items-center gap-4 px-6 py-4">
            <Search className="h-6 w-6 text-[#C89B3C] flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search the archives..."
              className="flex-1 bg-transparent text-xl font-serif italic text-[#EAE4D9] placeholder-[#EAE4D9]/40 focus:outline-none"
            />
          </div>
        </form>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/catalog')}
            className="p-6 bg-[#1A1816] vintage-border hover:border-[#C89B3C] hover:bg-[#1A1816]/80 transition-all group text-left"
          >
            <div className="mb-3 text-[#C89B3C] group-hover:scale-110 transition-transform origin-left">
              <ListIcon size={24} />
            </div>
            <h3 className="font-serif text-xl text-[#EAE4D9] mb-1">Browse Catalog</h3>
            <p className="text-xs text-[#EAE4D9]/40 uppercase tracking-widest">Explore All</p>
          </button>

          <button
            onClick={handleRandom}
            className="p-6 bg-[#1A1816] vintage-border hover:border-[#C89B3C] hover:bg-[#1A1816]/80 transition-all group text-left"
          >
            <div className="mb-3 text-[#C89B3C] group-hover:scale-110 transition-transform origin-left">
              <Star size={24} />
            </div>
            <h3 className="font-serif text-xl text-[#EAE4D9] mb-1">Random Pour</h3>
            <p className="text-xs text-[#EAE4D9]/40 uppercase tracking-widest">Feeling Lucky</p>
          </button>

          {user ? (
            <button
              onClick={() => navigate('/lists')}
              className="p-6 bg-[#1A1816] vintage-border hover:border-[#C89B3C] hover:bg-[#1A1816]/80 transition-all group text-left"
            >
              <div className="mb-3 text-[#C89B3C] group-hover:scale-110 transition-transform origin-left">
                <Heart size={24} />
              </div>
              <h3 className="font-serif text-xl text-[#EAE4D9] mb-1">My Lists</h3>
              <p className="text-xs text-[#EAE4D9]/40 uppercase tracking-widest">Your Collection</p>
            </button>
          ) : (
             <button
              onClick={() => navigate('/lists')}
              className="p-6 bg-[#1A1816] vintage-border hover:border-[#C89B3C] hover:bg-[#1A1816]/80 transition-all group text-left opacity-60 hover:opacity-100"
            >
              <div className="mb-3 text-[#EAE4D9]/40 group-hover:text-[#C89B3C] transition-colors">
                <Heart size={24} />
              </div>
              <h3 className="font-serif text-xl text-[#EAE4D9] mb-1">My Lists</h3>
              <p className="text-xs text-[#EAE4D9]/40 uppercase tracking-widest">Sign In to Track</p>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
