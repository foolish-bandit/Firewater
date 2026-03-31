import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, X, Loader2, Plus, Camera, AlertCircle, ChevronDown } from 'lucide-react';
import { Bourbon } from '../data';
import { GoogleGenAI, Type } from '@google/genai';
import BourbonCard from './BourbonCard';

interface CatalogViewProps {
  wantToTry: string[];
  tried: string[];
  toggleWantToTry: (id: string) => void;
  toggleTried: (id: string) => void;
  bourbons: Bourbon[];
  onOpenSubmit: () => void;
  onOpenScanner: () => void;
}

export default function CatalogView({ wantToTry, tried, toggleWantToTry, toggleTried, bourbons, onOpenSubmit, onOpenScanner }: CatalogViewProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);
const ITEMS_PER_PAGE = 24;

export default function CatalogView({ onSelect, wantToTry, tried, toggleWantToTry, toggleTried, bourbons, onOpenSubmit, onOpenScanner, initialSearchQuery, onConsumeSearchQuery }: CatalogViewProps) {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');
  const [isSearching, setIsSearching] = useState(false);
  const [aiResults, setAiResults] = useState<string[] | null>(null);
  const [searchFallback, setSearchFallback] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const hasConsumedInitialQuery = useRef(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const maxPriceInData = useMemo(() => Math.max(...bourbons.map(b => b.price)), [bourbons]);
  const minProofInData = useMemo(() => Math.min(...bourbons.map(b => b.proof)), [bourbons]);

  const [maxPrice, setMaxPrice] = useState<number>(maxPriceInData);
  const [minProof, setMinProof] = useState<number>(minProofInData);

  const filtersActive = maxPrice < maxPriceInData || minProof > minProofInData;

  const [page, setPage] = useState(1);

  const categories = ['All', 'High Proof', 'Wheated', 'Rye', 'Single Barrel', 'Under $50'];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setAiResults(null);
      return;
    }

    setIsSearching(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `
        You are a bourbon expert. A user is searching for: "${searchQuery}".
        Here is our catalog of bourbons:
        ${JSON.stringify(bourbons.map((b: Bourbon) => ({ id: b.id, name: b.name, description: b.description, flavorProfile: b.flavorProfile })))}

        Return a JSON array of bourbon IDs (strings) that best match the query, ordered by relevance. Limit to top 6.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });

      const ids = JSON.parse(response.text || '[]');
      setAiResults(ids);
      setSearchFallback(false);
    } catch (error) {
      console.error("AI Search failed, falling back to text search", error);
      setSearchFallback(true);
      // Fallback to text search
      const lowerQ = searchQuery.toLowerCase();
      const matches = bourbons.filter((b: Bourbon) =>
        b.name.toLowerCase().includes(lowerQ) ||
        b.description.toLowerCase().includes(lowerQ)
      ).map((b: Bourbon) => b.id);
      setAiResults(matches);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setAiResults(null);
    setSearchFallback(false);
  };

  // Auto-trigger search when navigated with a ?q= query param
  useEffect(() => {
    if (initialQuery && !hasConsumedInitialQuery.current) {
      hasConsumedInitialQuery.current = true;
      handleSearch({ preventDefault: () => {} } as React.FormEvent);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredBourbons = useMemo(() => {
    let result = bourbons;

    // AI/Text Search Filter
    if (aiResults) {
      result = aiResults.map((id: string) => bourbons.find((b: Bourbon) => b.id === id)).filter(Boolean) as Bourbon[];
    }

    // Category Filter
    if (activeCategory !== 'All') {
      switch (activeCategory) {
        case 'High Proof':
          result = result.filter((b: Bourbon) => b.proof >= 100);
          break;
        case 'Wheated':
          result = result.filter((b: Bourbon) => b.mashBill.toLowerCase().includes('wheat'));
          break;
        case 'Rye':
          result = result.filter((b: Bourbon) => b.mashBill.toLowerCase().includes('rye') && !b.mashBill.toLowerCase().includes('wheat'));
          break;
        case 'Single Barrel':
          result = result.filter((b: Bourbon) => b.type.toLowerCase().includes('single barrel') || b.name.toLowerCase().includes('single barrel'));
          break;
        case 'Under $50':
          result = result.filter((b: Bourbon) => b.price < 50);
          break;
      }
    }

    return result.filter((b: Bourbon) => b.price <= maxPrice && b.proof >= minProof);
  }, [aiResults, maxPrice, minProof, bourbons, activeCategory]);

  useEffect(() => setPage(1), [searchQuery, aiResults, activeCategory, maxPrice, minProof]);

  const totalPages = Math.ceil(filteredBourbons.length / ITEMS_PER_PAGE);
  const paginatedBourbons = filteredBourbons.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* Search & Filters Header */}
      <div className="bg-[#1A1816] vintage-border p-6 space-y-6 relative">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none border-[2px] border-[#141210] m-1"></div>

        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between relative z-10">
           <div className="flex items-baseline gap-3">
             <h2 className="font-serif text-3xl text-[#EAE4D9]">The Catalog</h2>
             <span className="micro-label text-[#C89B3C]">{filteredBourbons.length} bourbons</span>
           </div>

           <form onSubmit={handleSearch} className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-[#C89B3C]" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full bg-[#141210] border border-[#EAE4D9]/20 py-2 pl-10 pr-20 text-[#EAE4D9] placeholder-[#EAE4D9]/40 focus:outline-none focus:border-[#C89B3C] transition-all font-serif italic text-sm rounded-sm"
            />
            <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="flex items-center p-1 text-[#EAE4D9]/40 hover:text-[#C89B3C] transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onOpenScanner}
                className="flex items-center p-1 text-[#EAE4D9]/40 hover:text-[#C89B3C] transition-colors"
                title="Scan barcode"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 relative z-10 border-t border-[#EAE4D9]/10 pt-4">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 text-xs font-semibold tracking-widest uppercase transition-all border ${
                activeCategory === cat
                  ? 'bg-[#C89B3C] text-[#141210] border-[#C89B3C]'
                  : 'bg-transparent text-[#EAE4D9]/60 border-[#EAE4D9]/20 hover:border-[#C89B3C] hover:text-[#C89B3C]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Advanced Filters Toggle */}
        <div className="relative z-10 border-t border-[#EAE4D9]/10 pt-4">
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-[#EAE4D9]/60 hover:text-[#EAE4D9] transition-colors"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
            Advanced Filters
            {filtersActive && (
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase bg-[#C89B3C]/20 text-[#C89B3C] border border-[#C89B3C]/30 rounded-full">
                Active
              </span>
            )}
          </button>
          {showAdvancedFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="micro-label text-[#EAE4D9]">Max Price</label>
                  <span className="font-mono text-xs text-[#C89B3C]">${maxPrice}</span>
                </div>
                <input
                  type="range"
                  min="0" max={maxPriceInData} step="10"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-[#C89B3C] h-1 bg-[#141210] rounded-none appearance-none cursor-pointer"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="micro-label text-[#EAE4D9]">Min Proof</label>
                  <span className="font-mono text-xs text-[#C89B3C]">{minProof}</span>
                </div>
                <input
                  type="range"
                  min={minProofInData} max="160" step="1"
                  value={minProof}
                  onChange={(e) => setMinProof(Number(e.target.value))}
                  className="w-full accent-[#C89B3C] h-1 bg-[#141210] rounded-none appearance-none cursor-pointer"
                />
              </div>
              {filtersActive && (
                <button
                  onClick={() => { setMaxPrice(maxPriceInData); setMinProof(minProofInData); }}
                  className="text-xs font-semibold tracking-widest uppercase text-[#C89B3C] hover:text-[#EAE4D9] transition-colors"
                >
                  Reset Filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* AI Fallback Notice */}
      {searchFallback && aiResults && (
        <div className="bg-[#C89B3C]/10 border border-[#C89B3C]/30 p-4 rounded-lg flex items-start gap-3">
          <AlertCircle className="text-[#C89B3C] shrink-0 mt-0.5" size={18} />
          <p className="text-[#EAE4D9]/80 text-sm flex-1">
            <span className="text-[#C89B3C] font-medium">AI search is temporarily unavailable.</span>{' '}
            Showing basic text matches instead. We're working on it.
          </p>
          <button
            onClick={() => setSearchFallback(false)}
            className="text-[#EAE4D9]/40 hover:text-[#C89B3C] transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Results */}
      {isSearching ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4 text-amber-600">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-stone-400 animate-pulse">Consulting the experts...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBourbons.length > 0 ? (
            filteredBourbons.map((bourbon: Bourbon) => (
              <BourbonCard
                key={bourbon.id}
                bourbon={bourbon}
                onClick={() => { navigate(`/bourbon/${bourbon.id}`); }}
                isWanted={wantToTry.includes(bourbon.id)}
                isTried={tried.includes(bourbon.id)}
                onToggleWant={(e: React.MouseEvent) => { e.stopPropagation(); toggleWantToTry(bourbon.id); }}
                onToggleTried={(e: React.MouseEvent) => { e.stopPropagation(); toggleTried(bourbon.id); }}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-20 space-y-6">
              <div className="w-16 h-16 rounded-full vintage-border flex items-center justify-center mx-auto text-[#EAE4D9]/40">
                <Search size={24} />
              </div>
              <div>
                <h3 className="text-xl font-serif text-[#EAE4D9] mb-2">No bourbons found</h3>
                <p className="text-[#EAE4D9]/60 max-w-md mx-auto mb-6">We couldn't find any matches for your search criteria. Try adjusting your filters or search terms.</p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <button
                    onClick={onOpenSubmit}
                    className="bg-[#C89B3C] text-[#141210] px-6 py-3 rounded font-semibold tracking-widest uppercase hover:bg-[#B08832] transition-colors inline-flex items-center gap-2"
                  >
                    <Plus size={16} /> Add it to the database
                  </button>
                  <button
                    onClick={() => { setSearchQuery(''); setAiResults(null); setSearchFallback(false); setActiveCategory('All'); setMaxPrice(maxPriceInData); setMinProof(minProofInData); }}
                    className="bg-transparent vintage-border hover:bg-[#C89B3C] hover:text-[#141210] hover:border-[#C89B3C] text-[#C89B3C] px-6 py-3 font-sans font-semibold tracking-widest uppercase text-xs transition-all duration-300"
                  >
                    Clear Filters
                  </button>
                </div>
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedBourbons.length > 0 ? (
              paginatedBourbons.map((bourbon: Bourbon) => (
                <BourbonCard
                  key={bourbon.id}
                  bourbon={bourbon}
                  onClick={() => onSelect(bourbon.id)}
                  isWanted={wantToTry.includes(bourbon.id)}
                  isTried={tried.includes(bourbon.id)}
                  onToggleWant={(e: React.MouseEvent) => { e.stopPropagation(); toggleWantToTry(bourbon.id); }}
                  onToggleTried={(e: React.MouseEvent) => { e.stopPropagation(); toggleTried(bourbon.id); }}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-20 space-y-6">
                <div className="w-16 h-16 rounded-full vintage-border flex items-center justify-center mx-auto text-[#EAE4D9]/40">
                  <Search size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-serif text-[#EAE4D9] mb-2">No bourbons found</h3>
                  <p className="text-[#EAE4D9]/60 max-w-md mx-auto mb-6">We couldn't find any matches for your search criteria. Try adjusting your filters or search terms.</p>
                  <button
                    onClick={onOpenSubmit}
                    className="bg-[#C89B3C] text-[#141210] px-6 py-3 rounded font-semibold tracking-widest uppercase hover:bg-[#B08832] transition-colors inline-flex items-center gap-2"
                  >
                    <Plus size={16} /> Add it to the database
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8">
              <span className="micro-label text-[#C89B3C]">
                Showing {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filteredBourbons.length)} of {filteredBourbons.length} bourbons
              </span>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-1.5 text-xs font-semibold tracking-widest uppercase transition-colors vintage-border text-[#C89B3C] hover:bg-[#C89B3C] hover:text-[#141210] hover:border-[#C89B3C] disabled:opacity-30 disabled:pointer-events-none"
                >
                  Previous
                </button>
                <span className="text-[#EAE4D9]/60 text-sm font-serif">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="px-4 py-1.5 text-xs font-semibold tracking-widest uppercase transition-colors vintage-border text-[#C89B3C] hover:bg-[#C89B3C] hover:text-[#141210] hover:border-[#C89B3C] disabled:opacity-30 disabled:pointer-events-none"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
