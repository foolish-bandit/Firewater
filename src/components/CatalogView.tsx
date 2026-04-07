import React, { useState, useMemo, useEffect, useRef } from 'react';
import PageTransition from './PageTransition';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, X, Plus, Camera, ChevronDown, Sparkles } from 'lucide-react';
import { Liquor } from '../data';
import { hapticTap } from '../lib/capacitor';
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

const CATEGORIES = [
  'All', 'High Proof', 'Wheated', 'Rye', 'Single Barrel', 'Under $50',
  'Small Batch', 'Barrel Proof', 'Cask Strength', 'Bottled in Bond',
  'Aged 10+', 'Kentucky', 'Tennessee', 'Craft/Micro',
];
const DEFAULT_VISIBLE = 8;

const CRAFT_DISTILLERIES = [
  'new riff', 'wilderness trail', 'balcones', 'stranahan', 'westland',
  'corsair', 'cedar ridge', 'breckenridge', 'few', 'westward',
  'ragged branch', 'virginia distillery', 'spirit works', 'coppercraft',
];

function parseAge(age: string): number | null {
  const m = age.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

function matchesCategory(b: Liquor, cat: string): boolean {
  const nameDescType = `${b.name} ${b.description} ${b.type}`.toLowerCase();
  switch (cat) {
    case 'High Proof': return b.proof >= 100;
    case 'Wheated': return b.mashBill.toLowerCase().includes('wheat');
    case 'Rye': return b.mashBill.toLowerCase().includes('rye') && !b.mashBill.toLowerCase().includes('wheat');
    case 'Single Barrel': return nameDescType.includes('single barrel');
    case 'Under $50': return b.price < 50;
    case 'Small Batch': return nameDescType.includes('small batch');
    case 'Barrel Proof': return nameDescType.includes('barrel proof');
    case 'Cask Strength': return nameDescType.includes('cask strength');
    case 'Bottled in Bond': return b.proof === 100 && nameDescType.includes('bottled in bond');
    case 'Aged 10+': { const a = parseAge(b.age); return a !== null && a >= 10; }
    case 'Kentucky': return b.region.toLowerCase().includes('kentucky');
    case 'Tennessee': return b.region.toLowerCase().includes('tennessee');
    case 'Craft/Micro': {
      const dist = b.distillery.toLowerCase();
      return CRAFT_DISTILLERIES.some(d => dist.includes(d)) ||
        nameDescType.includes('craft') || nameDescType.includes('micro');
    }
    default: return true;
  }
}

export default function CatalogView({ wantToTry, tried, toggleWantToTry, toggleTried, liquors, onOpenSubmit, onOpenScanner }: CatalogViewProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const shouldAutoScan = searchParams.get('scan') === '1';
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const ITEMS_PER_PAGE = 24;
  const [searchResults, setSearchResults] = useState<string[] | null>(null);
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set(['All']));
  const [showAllCategories, setShowAllCategories] = useState(false);
  const hasConsumedInitialQuery = useRef(false);
  const hasConsumedScanParam = useRef(false);

  const [priceFilter, setPriceFilter] = useState<'any' | 'under-30' | 'under-50' | 'under-75' | 'over-75'>('any');
  const [selectedRegions, setSelectedRegions] = useState<Set<string>>(new Set());
  const [regionSearch, setRegionSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>('name');

  // Top 8 regions by frequency
  const topRegions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const b of liquors) {
      if (b.region) counts.set(b.region, (counts.get(b.region) || 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([r]) => r);
  }, [liquors]);

  const allRegions = useMemo(() => {
    const regions = new Set(liquors.map(b => b.region).filter(Boolean));
    return Array.from(regions).sort();
  }, [liquors]);

  const filteredRegionOptions = useMemo(() => {
    if (!regionSearch.trim()) return [];
    const q = regionSearch.toLowerCase();
    return allRegions.filter(r =>
      r.toLowerCase().includes(q) && !topRegions.includes(r)
    );
  }, [regionSearch, allRegions, topRegions]);

  const toggleRegion = (region: string) => {
    setSelectedRegions(prev => {
      const next = new Set(prev);
      if (next.has(region)) next.delete(region);
      else next.add(region);
      return next;
    });
  };

  const toggleCategory = (cat: string) => {
    if (cat === 'All') {
      setActiveCategories(new Set(['All']));
      return;
    }
    setActiveCategories(prev => {
      const next = new Set(prev);
      next.delete('All');
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      if (next.size === 0) next.add('All');
      return next;
    });
  };

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

    if (!activeCategories.has('All')) {
      result = result.filter((b: Liquor) =>
        Array.from(activeCategories).some(cat => matchesCategory(b, cat))
      );
    }

    if (selectedRegions.size > 0) {
      result = result.filter((b: Liquor) => selectedRegions.has(b.region));
    }

    if (priceFilter !== 'any') {
      switch (priceFilter) {
        case 'under-30': result = result.filter(b => b.price < 30); break;
        case 'under-50': result = result.filter(b => b.price < 50); break;
        case 'under-75': result = result.filter(b => b.price < 75); break;
        case 'over-75': result = result.filter(b => b.price >= 75); break;
      }
    }

    return result;
  }, [searchResults, liquors, activeCategories, selectedRegions, priceFilter]);

  const sortedLiquors = useMemo(() => {
    const sorted = [...filteredLiquors];
    switch (sortBy) {
      case 'price-asc': sorted.sort((a, b) => a.price - b.price); break;
      case 'price-desc': sorted.sort((a, b) => b.price - a.price); break;
      case 'proof-asc': sorted.sort((a, b) => a.proof - b.proof); break;
      case 'proof-desc': sorted.sort((a, b) => b.proof - a.proof); break;
      case 'name-desc': sorted.sort((a, b) => b.name.localeCompare(a.name)); break;
      case 'name': default: sorted.sort((a, b) => a.name.localeCompare(b.name)); break;
    }
    return sorted;
  }, [filteredLiquors, sortBy]);

  useEffect(() => setPage(1), [searchQuery, searchResults, activeCategories, priceFilter, selectedRegions, sortBy]);

  const totalPages = Math.ceil(sortedLiquors.length / ITEMS_PER_PAGE);
  const paginatedLiquors = sortedLiquors.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filterDescriptions = useMemo(() => {
    const parts: string[] = [];
    if (searchQuery.trim()) parts.push(`matching "${searchQuery.trim()}"`);
    if (!activeCategories.has('All')) parts.push(`in ${Array.from(activeCategories).join(', ')}`);
    if (selectedRegions.size > 0) parts.push(`from ${Array.from(selectedRegions).join(', ')}`);
    if (priceFilter !== 'any') {
      const labels: Record<string, string> = { 'under-30': 'under $30', 'under-50': 'under $50', 'under-75': 'under $75', 'over-75': '$75+' };
      parts.push(labels[priceFilter]);
    }
    if (parts.length === 0) return ['showing the full catalog'];
    return parts;
  }, [activeCategories, selectedRegions, priceFilter, searchQuery]);

  const filtersActive = filterDescriptions[0] !== 'showing the full catalog';

  const resetAllFilters = () => {
    setSearchQuery('');
    setSearchResults(null);
    setActiveCategories(new Set(['All']));
    setSelectedRegions(new Set());
    setPriceFilter('any');
    setRegionSearch('');
    setSortBy('name');
  };

  const visibleCategories = showAllCategories ? CATEGORIES : CATEGORIES.slice(0, DEFAULT_VISIBLE);

  const priceOptions: { label: string; value: typeof priceFilter }[] = [
    { label: 'Any Price', value: 'any' },
    { label: 'Under $30', value: 'under-30' },
    { label: 'Under $50', value: 'under-50' },
    { label: 'Under $75', value: 'under-75' },
    { label: '$75+', value: 'over-75' },
  ];

  return (
    <PageTransition><div className="space-y-8">
      <div className="surface-raised p-4 sm:p-6 space-y-6">
        <div className="flex flex-col xl:flex-row gap-6 xl:items-end xl:justify-between">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-baseline gap-3 flex-wrap">
              <h2 className="font-serif text-3xl text-on-surface">Discover the catalog</h2>
              <span className="micro-label text-on-surface-accent">{sortedLiquors.length} bottles</span>
            </div>
            <p className="text-on-surface-muted font-serif italic text-base leading-relaxed">
              Use search, scan, and filters here to narrow the shelf to the right bottle.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
            <button
              type="button"
              onClick={onOpenScanner}
              className="inline-flex items-center justify-center gap-2 btn btn-secondary px-5 py-3"
            >
              <Camera size={16} /> Scan a Bottle
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)] gap-4">
          <form onSubmit={handleSearch} className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-on-surface-accent" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by flavor, distillery, bottle, or budget"
              className="w-full input-base py-3 pl-10 pr-24 rounded-sm"
            />
            <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="flex items-center p-1 text-on-surface-muted hover:text-on-surface-accent transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <button
                type="submit"
                className="btn btn-primary px-3 py-1.5 text-[11px]"
              >
                Search
              </button>
            </div>
          </form>

          <div className="flex items-center gap-2 justify-end">
            <span className="micro-label text-on-surface-muted">Sort</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-surface-base border border-border-subtle text-on-surface text-xs px-3 py-3 focus:outline-none focus:border-border-accent-strong rounded-sm appearance-none cursor-pointer min-w-[180px]"
            >
              <option value="name">Name A–Z</option>
              <option value="name-desc">Name Z–A</option>
              <option value="price-asc">Price ↑</option>
              <option value="price-desc">Price ↓</option>
              <option value="proof-asc">Proof ↑</option>
              <option value="proof-desc">Proof ↓</option>
            </select>
          </div>
        </div>

        {/* Category tags — multi-select */}
        <div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 sm:flex-wrap sm:overflow-visible">
            {visibleCategories.map(cat => (
              <button
                key={cat}
                onClick={() => { hapticTap(); toggleCategory(cat); }}
                className={`seg-item px-3 sm:px-4 py-2 text-[10px] sm:text-xs tracking-wider sm:tracking-widest shrink-0 sm:shrink ${
                  activeCategories.has(cat) ? 'seg-item-active' : ''
                }`}
              >
                {cat}
              </button>
            ))}
            {CATEGORIES.length > DEFAULT_VISIBLE && (
              <button
                onClick={() => setShowAllCategories(prev => !prev)}
                className="seg-item px-3 py-2 text-[10px] sm:text-xs tracking-wider shrink-0 flex items-center gap-1 text-on-surface-accent"
              >
                {showAllCategories ? 'Show less' : 'Show more'}
                <ChevronDown size={12} className={`transition-transform ${showAllCategories ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* Price preset buttons */}
        <div className="space-y-2">
          <p className="micro-label text-on-surface-muted">Price</p>
          <div className="flex gap-2 flex-wrap">
            {priceOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => { hapticTap(); setPriceFilter(opt.value); }}
                className={`seg-item px-3 py-2 text-[10px] sm:text-xs tracking-wider sm:tracking-widest ${
                  priceFilter === opt.value ? 'seg-item-active' : ''
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Region multi-select */}
        <div className="space-y-2">
          <p className="micro-label text-on-surface-muted">Region</p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => { hapticTap(); setSelectedRegions(new Set()); }}
              className={`seg-item px-3 py-2 text-[10px] sm:text-xs tracking-wider sm:tracking-widest ${
                selectedRegions.size === 0 ? 'seg-item-active' : ''
              }`}
            >
              All Regions
            </button>
            {topRegions.map(r => (
              <button
                key={r}
                onClick={() => { hapticTap(); toggleRegion(r); }}
                className={`seg-item px-3 py-2 text-[10px] sm:text-xs tracking-wider sm:tracking-widest flex items-center gap-1 ${
                  selectedRegions.has(r) ? 'seg-item-active' : ''
                }`}
              >
                {r}
                {selectedRegions.has(r) && <X size={10} />}
              </button>
            ))}
          </div>
          {/* Selected regions not in top 8 */}
          {Array.from(selectedRegions).filter(r => !topRegions.includes(r)).length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {Array.from(selectedRegions).filter(r => !topRegions.includes(r)).map(r => (
                <button
                  key={r}
                  onClick={() => { hapticTap(); toggleRegion(r); }}
                  className="seg-item seg-item-active px-3 py-2 text-[10px] sm:text-xs tracking-wider sm:tracking-widest flex items-center gap-1"
                >
                  {r} <X size={10} />
                </button>
              ))}
            </div>
          )}
          <div className="relative max-w-xs">
            <input
              type="text"
              value={regionSearch}
              onChange={(e) => setRegionSearch(e.target.value)}
              placeholder="Search regions..."
              className="w-full input-base py-2 px-3 text-xs rounded-sm"
            />
            {filteredRegionOptions.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-surface-raised vintage-border max-h-40 overflow-y-auto custom-scrollbar">
                {filteredRegionOptions.map(r => (
                  <button
                    key={r}
                    onClick={() => { toggleRegion(r); setRegionSearch(''); }}
                    className={`w-full text-left px-3 py-2 text-xs font-sans hover:bg-on-surface-accent/5 transition-colors ${
                      selectedRegions.has(r) ? 'text-on-surface-accent' : 'text-on-surface-secondary'
                    }`}
                  >
                    {r} {selectedRegions.has(r) && '✓'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-border-subtle pt-4 flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="micro-label text-on-surface-accent">Active discovery view</p>
            <p className="text-sm text-on-surface-secondary leading-relaxed">
              You&apos;re {filterDescriptions.join(', ')}.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {filterDescriptions.map((description) => (
              <span
                key={description}
                className="badge badge-accent px-3 py-1.5 text-[10px] text-on-surface-secondary"
              >
                {description}
              </span>
            ))}
            {filtersActive && (
              <button
                onClick={resetAllFilters}
                className="text-xs font-semibold tracking-widest uppercase text-on-surface-accent hover:text-on-surface transition-colors px-2"
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
          <div className="col-span-full flex flex-col items-center justify-center text-center py-16 px-4">
            <Search size={48} className="text-on-surface-accent/30 mb-5" />
            <h3 className="font-serif text-xl text-on-surface mb-2">No bottles matched this discovery view</h3>
            <p className="text-on-surface-muted text-sm mb-6 max-w-sm">Try broadening your search or submit a bottle to the community catalog.</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={resetAllFilters}
                className="btn btn-primary"
              >
                Clear Filters
              </button>
              <button
                onClick={onOpenSubmit}
                className="btn btn-secondary"
              >
                Submit a Bottle
              </button>
            </div>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8">
          <span className="micro-label text-on-surface-accent">
            Showing {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, sortedLiquors.length)} of {sortedLiquors.length} bottles
          </span>

          <div className="flex items-center gap-4">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="btn btn-secondary btn-sm"
            >
              Previous
            </button>
            <span className="text-on-surface-muted text-sm font-serif">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className="btn btn-secondary btn-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Bottom fallback CTA */}
      <div className="pt-4">
        <div className="section-divider mb-8" />
        <div className="text-center space-y-4">
          <p className="font-serif text-on-surface-muted">Didn't find what you're looking for?</p>
          <button
            onClick={() => {
              const randomLiquor = liquors[Math.floor(Math.random() * liquors.length)];
              if (randomLiquor) navigate(`/liquor/${randomLiquor.id}`);
            }}
            className="btn btn-secondary px-6 py-3 inline-flex items-center gap-2"
          >
            <Sparkles size={16} /> Random Discovery
          </button>
          <p>
            <button
              onClick={onOpenSubmit}
              className="text-xs font-sans text-on-surface-muted hover:text-on-surface-accent transition-colors"
            >
              or submit a new bottle
            </button>
          </p>
        </div>
      </div>
    </div></PageTransition>
  );
}
