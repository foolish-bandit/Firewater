import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, X, Plus, Camera, ChevronDown } from 'lucide-react';
import { Liquor } from '../data';
import { levenshteinDistance } from '../utils/stringUtils';
import LiquorCard from './LiquorCard';

interface CatalogViewProps {
  wantToTry: string[];
  tried: string[];
  toggleWantToTry: (id: string) => void;
  toggleTried: (id: string) => void;
  liquors: Liquor[];
  onOpenSubmit: () => void;
  onOpenScanner: () => void;
}

export default function CatalogView({ wantToTry, tried, toggleWantToTry, toggleTried, liquors, onOpenSubmit, onOpenScanner }: CatalogViewProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const ITEMS_PER_PAGE = 24;
  const [searchResults, setSearchResults] = useState<string[] | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const hasConsumedInitialQuery = useRef(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const maxPriceInData = useMemo(() => Math.max(...liquors.map(b => b.price)), [liquors]);
  const minProofInData = useMemo(() => Math.min(...liquors.map(b => b.proof)), [liquors]);

  const [maxPrice, setMaxPrice] = useState<number>(maxPriceInData);
  const [minProof, setMinProof] = useState<number>(minProofInData);

  const filtersActive = maxPrice < maxPriceInData || minProof > minProofInData;

  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>('name');

  const categories = ['All', 'High Proof', 'Wheated', 'Rye', 'Single Barrel', 'Under $50'];

  const flavorKeywords: Record<string, keyof Liquor['flavorProfile']> = {
    sweet: 'sweetness', sugary: 'sweetness', honey: 'sweetness',
    spicy: 'spice', spice: 'spice', pepper: 'spice', cinnamon: 'spice',
    oaky: 'oak', oak: 'oak', wood: 'oak', woody: 'oak',
    caramel: 'caramel', toffee: 'caramel', butterscotch: 'caramel',
    vanilla: 'vanilla', creamy: 'vanilla',
    fruity: 'fruit', fruit: 'fruit', cherry: 'fruit', apple: 'fruit', citrus: 'fruit',
    nutty: 'nutty', nut: 'nutty', almond: 'nutty', pecan: 'nutty',
    floral: 'floral', flower: 'floral',
    smoky: 'smoky', smoke: 'smoky', charred: 'smoky',
    leather: 'leather', tobacco: 'leather',
    hot: 'heat', warm: 'heat', burn: 'heat',
    complex: 'complexity',
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    const lowerQ = searchQuery.toLowerCase().trim();
    const queryWords = lowerQ.split(/\s+/);

    // Check for price queries like "under 50", "below 30", "cheap", "budget", "expensive"
    let priceMax: number | null = null;
    let priceMin: number | null = null;
    const underMatch = lowerQ.match(/(?:under|below|less than|cheaper than)\s*\$?(\d+)/);
    if (underMatch) priceMax = Number(underMatch[1]);
    const overMatch = lowerQ.match(/(?:over|above|more than)\s*\$?(\d+)/);
    if (overMatch) priceMin = Number(overMatch[1]);
    if (queryWords.includes('cheap') || queryWords.includes('budget') || queryWords.includes('affordable')) priceMax = 40;
    if (queryWords.includes('expensive') || queryWords.includes('premium') || queryWords.includes('luxury')) priceMin = 80;

    // Detect flavor keywords in query
    const matchedFlavors = queryWords
      .map(w => flavorKeywords[w])
      .filter(Boolean);

    // Score each liquor
    const scored = liquors.map((b: Liquor) => {
      let score = 0;
      const bName = b.name.toLowerCase();
      const bDistillery = b.distillery.toLowerCase();
      const bDesc = b.description.toLowerCase();
      const bType = b.type.toLowerCase();
      const bMash = b.mashBill.toLowerCase();

      // Exact name match (highest weight)
      if (bName.includes(lowerQ)) score += 100;
      // Word-level name matching (exact substring)
      queryWords.forEach(w => {
        if (bName.includes(w)) score += 20;
        if (bDistillery.includes(w)) score += 15;
        if (bDesc.includes(w)) score += 5;
        if (bType.includes(w)) score += 10;
        if (bMash.includes(w)) score += 10;
      });

      // Fuzzy matching for typos (only if no exact matches yet)
      if (score === 0) {
        const nameWords = bName.split(/\s+/);
        const distilleryWords = bDistillery.split(/\s+/);
        queryWords.forEach(qw => {
          if (qw.length < 3) return; // skip short words
          const threshold = qw.length <= 4 ? 1 : 2;
          for (const nw of nameWords) {
            if (levenshteinDistance(qw, nw) <= threshold) { score += 12; break; }
          }
          for (const dw of distilleryWords) {
            if (levenshteinDistance(qw, dw) <= threshold) { score += 8; break; }
          }
        });
      }

      // Flavor-based scoring
      matchedFlavors.forEach(flavor => {
        score += b.flavorProfile[flavor]; // 1-10 points per matched flavor
      });

      // Price filtering
      if (priceMax !== null && b.price > priceMax) score = 0;
      if (priceMin !== null && b.price < priceMin) score = 0;

      return { id: b.id, score };
    });

    const matches = scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(s => s.id);

    setSearchResults(matches);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
  };

  // Auto-trigger search when navigated with a ?q= query param
  useEffect(() => {
    if (initialQuery && !hasConsumedInitialQuery.current) {
      hasConsumedInitialQuery.current = true;
      handleSearch({ preventDefault: () => {} } as React.FormEvent);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredLiquors = useMemo(() => {
    let result = liquors;

    // AI/Text Search Filter
    if (searchResults) {
      result = searchResults.map((id: string) => liquors.find((b: Liquor) => b.id === id)).filter(Boolean) as Liquor[];
    }

    // Category Filter
    if (activeCategory !== 'All') {
      switch (activeCategory) {
        case 'High Proof':
          result = result.filter((b: Liquor) => b.proof >= 100);
          break;
        case 'Wheated':
          result = result.filter((b: Liquor) => b.mashBill.toLowerCase().includes('wheat'));
          break;
        case 'Rye':
          result = result.filter((b: Liquor) => b.mashBill.toLowerCase().includes('rye') && !b.mashBill.toLowerCase().includes('wheat'));
          break;
        case 'Single Barrel':
          result = result.filter((b: Liquor) => b.type.toLowerCase().includes('single barrel') || b.name.toLowerCase().includes('single barrel'));
          break;
        case 'Under $50':
          result = result.filter((b: Liquor) => b.price < 50);
          break;
      }
    }

    return result.filter((b: Liquor) => b.price <= maxPrice && b.proof >= minProof);
  }, [searchResults, maxPrice, minProof, liquors, activeCategory]);

  const sortedLiquors = useMemo(() => {
    const sorted = [...filteredLiquors];
    switch (sortBy) {
      case 'price-asc': sorted.sort((a, b) => a.price - b.price); break;
      case 'price-desc': sorted.sort((a, b) => b.price - a.price); break;
      case 'proof-asc': sorted.sort((a, b) => a.proof - b.proof); break;
      case 'proof-desc': sorted.sort((a, b) => b.proof - a.proof); break;
      case 'name': default: sorted.sort((a, b) => a.name.localeCompare(b.name)); break;
    }
    return sorted;
  }, [filteredLiquors, sortBy]);

  useEffect(() => setPage(1), [searchQuery, searchResults, activeCategory, maxPrice, minProof, sortBy]);

  const totalPages = Math.ceil(sortedLiquors.length / ITEMS_PER_PAGE);
  const paginatedLiquors = sortedLiquors.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* Search & Filters Header */}
      <div className="bg-[#1A1816] vintage-border p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
           <div className="flex items-baseline gap-3">
             <h2 className="font-serif text-3xl text-[#EAE4D9]">The Catalog</h2>
             <span className="micro-label text-[#C89B3C]">{sortedLiquors.length} liquors</span>
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
                aria-label="Scan barcode"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 sm:flex-wrap sm:overflow-visible border-t border-[#EAE4D9]/10 pt-4">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 sm:px-4 py-1.5 text-[10px] sm:text-xs font-semibold tracking-wider sm:tracking-widest uppercase transition-all border whitespace-nowrap shrink-0 sm:shrink ${
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
        <div className="border-t border-[#EAE4D9]/10 pt-4">
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
                  className="w-full flavor-slider"
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
                  className="w-full flavor-slider"
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

      {/* Sort bar */}
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-2">
          <span className="micro-label text-[#EAE4D9]/40">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-[#141210] border border-[#EAE4D9]/15 text-[#EAE4D9] text-xs px-3 py-1.5 focus:outline-none focus:border-[#C89B3C] rounded-sm appearance-none cursor-pointer"
          >
            <option value="name">Name</option>
            <option value="price-asc">Price ↑</option>
            <option value="price-desc">Price ↓</option>
            <option value="proof-asc">Proof ↑</option>
            <option value="proof-desc">Proof ↓</option>
          </select>
        </div>
      </div>

      {/* Results */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedLiquors.length > 0 ? (
              paginatedLiquors.map((liquor: Liquor) => (
                <LiquorCard
                  key={liquor.id}
                  liquor={liquor}
                  onClick={() => { navigate(`/liquor/${liquor.id}`); }}
                  isWanted={wantToTry.includes(liquor.id)}
                  isTried={tried.includes(liquor.id)}
                  onToggleWant={(e: React.MouseEvent) => { e.stopPropagation(); toggleWantToTry(liquor.id); }}
                  onToggleTried={(e: React.MouseEvent) => { e.stopPropagation(); toggleTried(liquor.id); }}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-20 space-y-6">
                <div className="w-16 h-16 rounded-full vintage-border flex items-center justify-center mx-auto text-[#EAE4D9]/40">
                  <Search size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-serif text-[#EAE4D9] mb-2">No liquors found</h3>
                  <p className="text-[#EAE4D9]/60 max-w-md mx-auto mb-6">We couldn't find any matches for your search criteria. Try adjusting your filters or search terms.</p>
                  <div className="flex flex-wrap items-center justify-center gap-4">
                    <button
                      onClick={onOpenSubmit}
                      className="bg-[#C89B3C] text-[#141210] px-6 py-3 rounded font-semibold tracking-widest uppercase hover:bg-[#B08832] transition-colors inline-flex items-center gap-2"
                    >
                      <Plus size={16} /> Add it to the database
                    </button>
                    <button
                      onClick={() => { setSearchQuery(''); setSearchResults(null); setActiveCategory('All'); setMaxPrice(maxPriceInData); setMinProof(minProofInData); }}
                      className="bg-transparent vintage-border hover:bg-[#C89B3C] hover:text-[#141210] hover:border-[#C89B3C] text-[#C89B3C] px-6 py-3 font-sans font-semibold tracking-widest uppercase text-xs transition-all duration-300"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8">
              <span className="micro-label text-[#C89B3C]">
                Showing {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, sortedLiquors.length)} of {sortedLiquors.length} liquors
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
    </div>
  );
}
