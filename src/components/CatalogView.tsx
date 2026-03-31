import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, X, Plus, Camera } from 'lucide-react';
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
  const shouldAutoScan = searchParams.get('scan') === '1';
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const ITEMS_PER_PAGE = 24;
  const [searchResults, setSearchResults] = useState<string[] | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const hasConsumedInitialQuery = useRef(false);
  const hasConsumedScanParam = useRef(false);

  const maxPriceInData = useMemo(() => Math.max(...liquors.map(b => b.price)), [liquors]);
  const minProofInData = useMemo(() => Math.min(...liquors.map(b => b.proof)), [liquors]);

  const [maxPrice, setMaxPrice] = useState<number>(maxPriceInData);
  const [minProof, setMinProof] = useState<number>(minProofInData);
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

    let priceMax: number | null = null;
    let priceMin: number | null = null;
    const underMatch = lowerQ.match(/(?:under|below|less than|cheaper than)\s*\$?(\d+)/);
    if (underMatch) priceMax = Number(underMatch[1]);
    const overMatch = lowerQ.match(/(?:over|above|more than)\s*\$?(\d+)/);
    if (overMatch) priceMin = Number(overMatch[1]);
    if (queryWords.includes('cheap') || queryWords.includes('budget') || queryWords.includes('affordable')) priceMax = 40;
    if (queryWords.includes('expensive') || queryWords.includes('premium') || queryWords.includes('luxury')) priceMin = 80;

    const matchedFlavors = queryWords
      .map(w => flavorKeywords[w])
      .filter(Boolean);

    const scored = liquors.map((b: Liquor) => {
      let score = 0;
      const bName = b.name.toLowerCase();
      const bDistillery = b.distillery.toLowerCase();
      const bDesc = b.description.toLowerCase();
      const bType = b.type.toLowerCase();
      const bMash = b.mashBill.toLowerCase();

      if (bName.includes(lowerQ)) score += 100;
      queryWords.forEach(w => {
        if (bName.includes(w)) score += 20;
        if (bDistillery.includes(w)) score += 15;
        if (bDesc.includes(w)) score += 5;
        if (bType.includes(w)) score += 10;
        if (bMash.includes(w)) score += 10;
      });

      if (score === 0) {
        const nameWords = bName.split(/\s+/);
        const distilleryWords = bDistillery.split(/\s+/);
        queryWords.forEach(qw => {
          if (qw.length < 3) return;
          const threshold = qw.length <= 4 ? 1 : 2;
          for (const nw of nameWords) {
            if (levenshteinDistance(qw, nw) <= threshold) { score += 12; break; }
          }
          for (const dw of distilleryWords) {
            if (levenshteinDistance(qw, dw) <= threshold) { score += 8; break; }
          }
        });
      }

      matchedFlavors.forEach(flavor => {
        score += b.flavorProfile[flavor];
      });

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

  useEffect(() => {
    if (initialQuery && !hasConsumedInitialQuery.current) {
      hasConsumedInitialQuery.current = true;
      handleSearch({ preventDefault: () => {} } as React.FormEvent);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (shouldAutoScan && !hasConsumedScanParam.current) {
      hasConsumedScanParam.current = true;
      onOpenScanner();
    }
  }, [onOpenScanner, shouldAutoScan]);

  const filteredLiquors = useMemo(() => {
    let result = liquors;

    if (searchResults) {
      result = searchResults.map((id: string) => liquors.find((b: Liquor) => b.id === id)).filter(Boolean) as Liquor[];
    }

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

  const filterDescriptions = useMemo(() => {
    const parts: string[] = [];
    if (searchQuery.trim()) parts.push(`matching “${searchQuery.trim()}”`);
    if (activeCategory !== 'All') parts.push(`in ${activeCategory}`);
    if (maxPrice < maxPriceInData) parts.push(`priced at $${maxPrice} or less`);
    if (minProof > minProofInData) parts.push(`at ${minProof}+ proof`);
    if (parts.length === 0) return ['showing the full catalog'];
    return parts;
  }, [activeCategory, maxPrice, maxPriceInData, minProof, minProofInData, searchQuery]);

  const filtersActive = filterDescriptions[0] !== 'showing the full catalog';

  const resetAllFilters = () => {
    setSearchQuery('');
    setSearchResults(null);
    setActiveCategory('All');
    setMaxPrice(maxPriceInData);
    setMinProof(minProofInData);
    setSortBy('name');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-[#1A1816] vintage-border p-4 sm:p-6 space-y-6">
        <div className="flex flex-col xl:flex-row gap-6 xl:items-end xl:justify-between">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-baseline gap-3 flex-wrap">
              <h2 className="font-serif text-3xl text-[#EAE4D9]">Discover the catalog</h2>
              <span className="micro-label text-[#C89B3C]">{sortedLiquors.length} bottles</span>
            </div>
            <p className="text-[#EAE4D9]/55 font-serif italic text-base leading-relaxed">
              Start with the discovery quiz, then use search, scan, and filters here to narrow the shelf to the right bottle.
            </p>
          </div>

      {/* Search & Filters Header */}
      <div className="surface-panel p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
           <div className="flex items-baseline gap-3">
             <h2 className="font-serif text-3xl text-theme-primary">The Catalog</h2>
             <span className="micro-label text-theme-accent">{sortedLiquors.length} liquors</span>
           </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)] gap-4">
          <form onSubmit={handleSearch} className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-theme-accent" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="input-surface w-full py-2 pl-10 pr-20 font-serif italic text-sm rounded-sm focus:outline-none transition-all"
            />
            <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="flex items-center p-1 text-theme-faint hover:text-[var(--text-accent-strong)] transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onOpenScanner}
                className="flex items-center p-1 text-theme-faint hover:text-[var(--text-accent-strong)] transition-colors"
                title="Scan barcode"
                aria-label="Scan barcode"
                type="submit"
                className="px-3 py-1.5 text-[11px] font-semibold tracking-widest uppercase text-[#141210] bg-[#C89B3C] hover:bg-[#D4A843] transition-colors"
              >
                Search
              </button>
            </div>
          </form>

          <div className="flex items-center gap-2 justify-between xl:justify-end">
            <span className="micro-label text-[#EAE4D9]/40">Sort</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#141210] border border-[#EAE4D9]/15 text-[#EAE4D9] text-xs px-3 py-3 focus:outline-none focus:border-[#C89B3C] rounded-sm appearance-none cursor-pointer min-w-[180px]"
            >
              <option value="name">Name</option>
              <option value="price-asc">Price ↑</option>
              <option value="price-desc">Price ↓</option>
              <option value="proof-asc">Proof ↑</option>
              <option value="proof-desc">Proof ↓</option>
            </select>
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 sm:flex-wrap sm:overflow-visible border-t border-theme pt-4">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`segmented-tab px-3 sm:px-4 py-1.5 whitespace-nowrap shrink-0 sm:shrink border ${
                activeCategory === cat
                  ? 'is-active border-[var(--text-accent-strong)]'
                  : 'border-[var(--border-subtle)] hover:border-[var(--border-accent-soft)] hover:text-[var(--text-accent-strong)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Advanced Filters Toggle */}
        <div className="border-t border-theme pt-4">
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-theme-muted hover:text-[var(--text-tier-1)] transition-colors"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
            Advanced Filters
            {filtersActive && (
              <span className="badge badge-accent">
                Active
              </span>
            )}
          </button>
          {showAdvancedFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="micro-label text-theme-primary">Max Price</label>
                  <span className="font-mono text-xs text-theme-accent">${maxPrice}</span>
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
                  <label className="micro-label text-theme-primary">Min Proof</label>
                  <span className="font-mono text-xs text-theme-accent">{minProof}</span>
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
                  className="text-xs font-semibold tracking-widest uppercase text-theme-accent hover:text-[var(--text-tier-1)] transition-colors"
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
          <span className="micro-label text-theme-faint">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input-surface text-xs px-3 py-1.5 focus:outline-none rounded-sm appearance-none cursor-pointer"
          >
            <option value="name">Name</option>
            <option value="price-asc">Price ↑</option>
            <option value="price-desc">Price ↓</option>
            <option value="proof-asc">Proof ↑</option>
            <option value="proof-desc">Proof ↓</option>
          </select>
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
                <div className="w-16 h-16 rounded-full vintage-border flex items-center justify-center mx-auto text-theme-faint">
                  <Search size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-serif text-theme-primary mb-2">No liquors found</h3>
                  <p className="text-theme-muted max-w-md mx-auto mb-6">We couldn't find any matches for your search criteria. Try adjusting your filters or search terms.</p>
                  <div className="flex flex-wrap items-center justify-center gap-4">
                    <button
                      onClick={onOpenSubmit}
                      className="btn-base btn-accent px-6 py-3 rounded inline-flex items-center gap-2"
                    >
                      <Plus size={16} /> Add it to the database
                    </button>
                    <button
                      onClick={() => { setSearchQuery(''); setSearchResults(null); setActiveCategory('All'); setMaxPrice(maxPriceInData); setMinProof(minProofInData); }}
                      className="btn-base btn-outline px-6 py-3 text-xs"
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
              <span className="micro-label text-theme-accent">
                Showing {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, sortedLiquors.length)} of {sortedLiquors.length} liquors
              </span>
            ))}
            {filtersActive && (
              <button
                onClick={resetAllFilters}
                className="text-xs font-semibold tracking-widest uppercase text-[#C89B3C] hover:text-[#EAE4D9] transition-colors px-2"
              >
                Reset All
              </button>
            )}
          </div>
        </div>
      </div>

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
              <h3 className="text-xl font-serif text-[#EAE4D9] mb-2">No bottles matched this discovery view</h3>
              <p className="text-[#EAE4D9]/60 max-w-md mx-auto mb-6">Try broadening your filters, changing your search words, or starting with the discovery quiz for a fresh path.</p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="btn-base btn-outline px-4 py-1.5 text-xs disabled:opacity-30 disabled:pointer-events-none"
                >
                  <Plus size={16} /> Add it to the database
                </button>
                <span className="text-theme-muted text-sm font-serif">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="btn-base btn-outline px-4 py-1.5 text-xs disabled:opacity-30 disabled:pointer-events-none"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8">
          <span className="micro-label text-[#C89B3C]">
            Showing {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, sortedLiquors.length)} of {sortedLiquors.length} bottles
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
