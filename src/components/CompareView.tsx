import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { X, Search, ChevronDown } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Legend } from 'recharts';
import { Bourbon } from '../data';

interface CompareViewProps {
  bourbons: Bourbon[];
}

const COMPARE_COLORS = ['#C89B3C', '#5BA3A3', '#A35B7A'];

const FLAVOR_KEYS = [
  'sweetness', 'spice', 'oak', 'caramel', 'vanilla', 'fruit',
  'nutty', 'floral', 'smoky', 'leather', 'heat', 'complexity'
] as const;

export default function CompareView({ bourbons }: CompareViewProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto-add bourbon from URL param
  useEffect(() => {
    const addId = searchParams.get('add');
    if (addId && bourbons.some(b => b.id === addId)) {
      setSelectedIds(prev => {
        if (prev.includes(addId)) return prev;
        if (prev.length >= 3) return prev;
        return [...prev, addId];
      });
      // Clear the param
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, bourbons, setSearchParams]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);

  const selectedBourbons = useMemo(
    () => selectedIds.map(id => bourbons.find(b => b.id === id)).filter(Boolean) as Bourbon[],
    [selectedIds, bourbons]
  );

  const filteredBourbons = useMemo(() => {
    if (!searchQuery.trim()) return bourbons.filter(b => !selectedIds.includes(b.id)).slice(0, 20);
    const q = searchQuery.toLowerCase();
    return bourbons
      .filter(b => !selectedIds.includes(b.id))
      .filter(b => b.name.toLowerCase().includes(q) || b.distillery.toLowerCase().includes(q))
      .slice(0, 20);
  }, [searchQuery, bourbons, selectedIds]);

  const addBourbon = (id: string) => {
    if (selectedIds.length >= 3) return;
    setSelectedIds(prev => [...prev, id]);
    setSearchQuery('');
    setDropdownOpen(false);
  };

  const removeBourbon = (id: string) => {
    setSelectedIds(prev => prev.filter(i => i !== id));
  };

  // Radar chart data
  const radarData = useMemo(() => {
    if (selectedBourbons.length < 2) return [];
    return FLAVOR_KEYS.map(key => {
      const entry: Record<string, string | number> = {
        subject: key.charAt(0).toUpperCase() + key.slice(1),
        fullMark: 10,
      };
      selectedBourbons.forEach((b, i) => {
        entry[`bourbon${i}`] = b.flavorProfile[key];
      });
      return entry;
    });
  }, [selectedBourbons]);

  // Flavor differences
  const flavorDiffs = useMemo(() => {
    if (selectedBourbons.length < 2) return [];
    return FLAVOR_KEYS.map(key => {
      const values = selectedBourbons.map(b => b.flavorProfile[key]);
      const max = Math.max(...values);
      const min = Math.min(...values);
      return { key, label: key.charAt(0).toUpperCase() + key.slice(1), diff: max - min, values };
    })
      .sort((a, b) => b.diff - a.diff)
      .filter(d => d.diff > 0);
  }, [selectedBourbons]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="text-center">
        <p className="micro-label text-[#C89B3C] mb-2">Analyze</p>
        <h1 className="font-serif text-4xl sm:text-5xl font-normal text-[#EAE4D9]">Compare Bourbons</h1>
      </div>

      {/* Selection Area */}
      <div className="bg-[#1A1816] vintage-border p-5 sm:p-8 space-y-4">
        {/* Selected bourbon pills */}
        <div className="flex flex-wrap gap-2 min-h-[40px]">
          {selectedBourbons.map((b, i) => (
            <div
              key={b.id}
              className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-sans font-medium tracking-wider"
              style={{
                backgroundColor: `${COMPARE_COLORS[i]}15`,
                border: `1px solid ${COMPARE_COLORS[i]}50`,
                color: COMPARE_COLORS[i],
              }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COMPARE_COLORS[i] }} />
              <span className="truncate max-w-[200px]">{b.name}</span>
              <button
                onClick={() => removeBourbon(b.id)}
                className="hover:opacity-70 transition-opacity ml-1"
                aria-label={`Remove ${b.name}`}
              >
                <X size={14} />
              </button>
            </div>
          ))}
          {selectedIds.length === 0 && (
            <p className="text-[#EAE4D9]/40 font-serif italic text-sm self-center">No bourbons selected</p>
          )}
        </div>

        {/* Search dropdown */}
        {selectedIds.length < 3 && (
          <div className="relative" ref={dropdownRef}>
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#EAE4D9]/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setDropdownOpen(true);
                }}
                onFocus={() => setDropdownOpen(true)}
                placeholder={`Search bourbon to add (${3 - selectedIds.length} remaining)...`}
                className="w-full bg-[#141210] vintage-border pl-11 pr-4 py-3 text-[#EAE4D9] placeholder-[#EAE4D9]/30 focus:outline-none focus:border-[#C89B3C] text-sm font-sans"
              />
              <ChevronDown size={16} className={`absolute right-4 top-1/2 -translate-y-1/2 text-[#EAE4D9]/40 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </div>

            {dropdownOpen && filteredBourbons.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-[#1A1816] vintage-border max-h-60 overflow-y-auto shadow-xl">
                {filteredBourbons.map(b => (
                  <button
                    key={b.id}
                    onClick={() => addBourbon(b.id)}
                    className="w-full text-left px-4 py-3 hover:bg-[#C89B3C]/10 transition-colors border-b border-[#EAE4D9]/5 last:border-0"
                  >
                    <span className="text-sm font-sans text-[#EAE4D9]">{b.name}</span>
                    <span className="text-xs text-[#EAE4D9]/40 ml-2 font-sans">{b.distillery}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Empty state */}
      {selectedBourbons.length < 2 && (
        <div className="text-center py-16">
          <p className="text-[#EAE4D9]/40 font-serif italic text-lg">
            Select 2-3 bourbons to compare their flavor profiles
          </p>
        </div>
      )}

      {/* Comparison Content */}
      {selectedBourbons.length >= 2 && (
        <div className="space-y-8">
          {/* Overlaid Radar Chart */}
          <div className="bg-[#1A1816] vintage-border p-5 sm:p-8">
            <h3 className="micro-label text-[#C89B3C] mb-4 sm:mb-8">Flavor Profile Overlay</h3>
            <div className="h-[300px] sm:h-[400px] md:h-[500px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="rgba(234, 228, 217, 0.1)" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{
                      fill: 'rgba(234, 228, 217, 0.5)',
                      fontSize: 10,
                      fontFamily: 'Montserrat',
                    }}
                  />
                  {selectedBourbons.map((b, i) => (
                    <Radar
                      key={b.id}
                      name={b.name}
                      dataKey={`bourbon${i}`}
                      stroke={COMPARE_COLORS[i]}
                      fill={COMPARE_COLORS[i]}
                      fillOpacity={0.1}
                      strokeWidth={2}
                    />
                  ))}
                  <Legend
                    wrapperStyle={{
                      fontSize: '12px',
                      fontFamily: 'Montserrat',
                      color: 'rgba(234, 228, 217, 0.6)',
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Side-by-side Stats Table */}
          <div className="bg-[#1A1816] vintage-border p-5 sm:p-8">
            <h3 className="micro-label text-[#C89B3C] mb-4 sm:mb-6">Specifications</h3>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm font-sans">
                <thead>
                  <tr className="border-b border-[#EAE4D9]/10">
                    <th className="text-left py-3 pr-4 text-[#EAE4D9]/40 font-semibold tracking-widest uppercase text-xs">Attribute</th>
                    {selectedBourbons.map((b, i) => (
                      <th key={b.id} className="text-left py-3 px-4 font-semibold tracking-wider text-xs" style={{ color: COMPARE_COLORS[i] }}>
                        {b.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Distillery', getValue: (b: Bourbon) => b.distillery },
                    { label: 'Proof', getValue: (b: Bourbon) => String(b.proof) },
                    { label: 'Age', getValue: (b: Bourbon) => b.age },
                    { label: 'Price', getValue: (b: Bourbon) => `$${b.price}` },
                    { label: 'Mash Bill', getValue: (b: Bourbon) => b.mashBill },
                    { label: 'Region', getValue: (b: Bourbon) => b.region },
                    { label: 'Type', getValue: (b: Bourbon) => b.type },
                  ].map((row) => (
                    <tr key={row.label} className="border-b border-[#EAE4D9]/5">
                      <td className="py-3 pr-4 text-[#EAE4D9]/40 font-semibold tracking-widest uppercase text-xs">{row.label}</td>
                      {selectedBourbons.map((b) => (
                        <td key={b.id} className="py-3 px-4 text-[#EAE4D9]/80 font-serif italic">{row.getValue(b)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile stacked cards */}
            <div className="md:hidden space-y-4">
              {[
                { label: 'Distillery', getValue: (b: Bourbon) => b.distillery },
                { label: 'Proof', getValue: (b: Bourbon) => String(b.proof) },
                { label: 'Age', getValue: (b: Bourbon) => b.age },
                { label: 'Price', getValue: (b: Bourbon) => `$${b.price}` },
                { label: 'Mash Bill', getValue: (b: Bourbon) => b.mashBill },
                { label: 'Region', getValue: (b: Bourbon) => b.region },
                { label: 'Type', getValue: (b: Bourbon) => b.type },
              ].map((row) => (
                <div key={row.label} className="border-b border-[#EAE4D9]/5 pb-3">
                  <p className="text-[#EAE4D9]/40 font-semibold tracking-widest uppercase text-[10px] mb-2">{row.label}</p>
                  <div className="space-y-1">
                    {selectedBourbons.map((b, i) => (
                      <div key={b.id} className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COMPARE_COLORS[i] }} />
                        <span className="text-[#EAE4D9]/80 font-serif italic text-sm">{row.getValue(b)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Flavor Difference Highlights */}
          {flavorDiffs.length > 0 && (
            <div className="bg-[#1A1816] vintage-border p-5 sm:p-8">
              <h3 className="micro-label text-[#C89B3C] mb-4 sm:mb-6">Biggest Flavor Differences</h3>
              <div className="space-y-4">
                {flavorDiffs.slice(0, 6).map((d) => (
                  <div key={d.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-sans font-semibold tracking-widest uppercase text-[#EAE4D9]/60">{d.label}</span>
                      <span className="text-xs font-sans text-[#C89B3C]">
                        {d.diff.toFixed(1)} pt spread
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {selectedBourbons.map((b, i) => (
                        <div key={b.id} className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COMPARE_COLORS[i] }} />
                            <span className="text-[10px] font-sans text-[#EAE4D9]/40 truncate">{b.name}</span>
                          </div>
                          <div className="w-full h-2 bg-[#141210] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${(d.values[i] / 10) * 100}%`,
                                backgroundColor: COMPARE_COLORS[i],
                                opacity: 0.7,
                              }}
                            />
                          </div>
                          <span className="text-[10px] font-sans text-[#EAE4D9]/40 mt-1 block">{d.values[i]}/10</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
