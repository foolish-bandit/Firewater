import { useMemo } from 'react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip,
} from 'recharts';
import { Liquor, FlavorProfile } from '../data';
import { Review } from '../types';

interface InsightsPanelProps {
  triedIds: string[];
  wantIds: string[];
  reviews: Review[];
  liquors: Liquor[];
}

const FLAVOR_LABELS: Record<keyof FlavorProfile, string> = {
  sweetness: 'Sweet',
  spice: 'Spicy',
  oak: 'Oaky',
  caramel: 'Caramel',
  vanilla: 'Vanilla',
  fruit: 'Fruity',
  nutty: 'Nutty',
  floral: 'Floral',
  smoky: 'Smoky',
  leather: 'Leathery',
  heat: 'Hot',
  complexity: 'Complex',
};

export default function InsightsPanel({ triedIds, wantIds, reviews, liquors }: InsightsPanelProps) {
  const triedLiquors = useMemo(
    () => triedIds.map(id => liquors.find(b => b.id === id)).filter(Boolean) as Liquor[],
    [triedIds, liquors]
  );

  // --- Collection Overview ---
  const avgRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  }, [reviews]);

  // --- Proof Distribution ---
  const proofData = useMemo(() => {
    const buckets = [
      { range: '80-89', min: 80, max: 89, count: 0 },
      { range: '90-99', min: 90, max: 99, count: 0 },
      { range: '100-109', min: 100, max: 109, count: 0 },
      { range: '110-119', min: 110, max: 119, count: 0 },
      { range: '120+', min: 120, max: Infinity, count: 0 },
    ];
    triedLiquors.forEach(b => {
      const bucket = buckets.find(bk => b.proof >= bk.min && b.proof <= bk.max);
      if (bucket) bucket.count++;
    });
    return buckets.map(({ range, count }) => ({ range, count }));
  }, [triedLiquors]);

  // --- Price Breakdown ---
  const priceStats = useMemo(() => {
    if (triedLiquors.length === 0) return null;
    const prices = triedLiquors.map(b => b.price);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    return {
      avg: Math.round(avg),
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }, [triedLiquors]);

  // --- Flavor DNA ---
  const flavorDNA = useMemo(() => {
    if (triedLiquors.length === 0) return null;
    const keys = Object.keys(triedLiquors[0].flavorProfile) as (keyof FlavorProfile)[];
    const aggregated: Record<string, number> = {};
    keys.forEach(key => {
      const avg = triedLiquors.reduce((sum, b) => sum + b.flavorProfile[key], 0) / triedLiquors.length;
      aggregated[key] = Math.round(avg * 10) / 10;
    });
    return keys.map(key => ({
      subject: key.charAt(0).toUpperCase() + key.slice(1),
      A: aggregated[key],
      fullMark: 10,
    }));
  }, [triedLiquors]);

  // --- Top Distilleries ---
  const topDistilleries = useMemo(() => {
    const counts: Record<string, number> = {};
    triedLiquors.forEach(b => {
      counts[b.distillery] = (counts[b.distillery] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [triedLiquors]);

  // --- Palate Profile ---
  const palateText = useMemo(() => {
    if (triedLiquors.length === 0) return null;
    const keys = Object.keys(triedLiquors[0].flavorProfile) as (keyof FlavorProfile)[];
    const avgScores: { key: keyof FlavorProfile; avg: number }[] = keys.map(key => ({
      key,
      avg: triedLiquors.reduce((sum, b) => sum + b.flavorProfile[key], 0) / triedLiquors.length,
    }));
    avgScores.sort((a, b) => b.avg - a.avg);
    const top3 = avgScores.slice(0, 3).map(s => FLAVOR_LABELS[s.key].toLowerCase());
    return `You gravitate toward ${top3[0]}, ${top3[1]} liquors with prominent ${top3[2]} notes.`;
  }, [triedLiquors]);

  return (
    <div className="space-y-6">
      {/* Collection Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
        {[
          { label: 'Tried', value: triedIds.length },
          { label: 'Want to Try', value: wantIds.length },
          { label: 'Reviewed', value: reviews.length },
          { label: 'Avg Rating', value: avgRating > 0 ? avgRating.toFixed(1) : '--' },
        ].map(stat => (
          <div key={stat.label} className="surface-raised p-3 sm:p-5 flex flex-col items-center text-center">
            <span className="font-display text-xl sm:text-2xl text-on-surface">{stat.value}</span>
            <span className="micro-label text-on-surface-accent mt-1 text-[8px] sm:text-[0.65rem]">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Two-column grid for charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Proof Distribution */}
        <div className="surface-raised p-4 sm:p-6">
          <h3 className="micro-label text-on-surface-accent mb-4">Proof Distribution</h3>
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={proofData} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="range"
                  tick={{ fill: 'rgba(234, 228, 217, 0.5)', fontSize: 11, fontFamily: 'Montserrat' }}
                  width={55}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A1816',
                    border: '1px solid rgba(200, 155, 60, 0.3)',
                    borderRadius: 0,
                    fontSize: 12,
                    color: '#EAE4D9',
                  }}
                  cursor={{ fill: 'rgba(200, 155, 60, 0.05)' }}
                />
                <Bar dataKey="count" fill="#C89B3C" radius={[0, 2, 2, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="surface-raised p-4 sm:p-6">
          <h3 className="micro-label text-on-surface-accent mb-4">Price Breakdown</h3>
          {priceStats ? (
            <div className="space-y-5 pt-2">
              <div>
                <p className="text-on-surface-muted text-xs font-sans tracking-wider uppercase mb-1">Average Price</p>
                <p className="font-display text-3xl text-on-surface">${priceStats.avg}</p>
              </div>
              <div>
                <p className="text-on-surface-muted text-xs font-sans tracking-wider uppercase mb-1">Price Range</p>
                <p className="font-display text-2xl text-on-surface">
                  ${priceStats.min} <span className="text-on-surface/30 text-lg mx-1">-</span> ${priceStats.max}
                </p>
              </div>
              <div className="w-full h-1 bg-on-surface/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#C89B3C]/40 to-[#C89B3C] rounded-full"
                  style={{
                    width: `${Math.min(100, ((priceStats.avg - priceStats.min) / (priceStats.max - priceStats.min || 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          ) : (
            <p className="text-on-surface-muted text-sm font-serif italic">No price data available.</p>
          )}
        </div>

        {/* Flavor DNA */}
        {flavorDNA && (
          <div className="surface-raised p-4 sm:p-6">
            <h3 className="micro-label text-on-surface-accent mb-4">Your Flavor DNA</h3>
            <div className="h-[240px] sm:h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={flavorDNA}>
                  <PolarGrid stroke="rgba(234, 228, 217, 0.1)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(234, 228, 217, 0.4)', fontSize: 10, fontFamily: 'Montserrat' }} />
                  <Radar name="Flavor DNA" dataKey="A" stroke="#C89B3C" fill="#C89B3C" fillOpacity={0.2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Top Distilleries */}
        {topDistilleries.length > 0 && (
          <div className="surface-raised p-4 sm:p-6">
            <h3 className="micro-label text-on-surface-accent mb-4">Top Distilleries</h3>
            <div className="space-y-3">
              {topDistilleries.map(([name, count], i) => (
                <div key={name} className="flex items-center gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full vintage-border flex items-center justify-center text-on-surface-accent font-display text-xs">
                    {i + 1}
                  </span>
                  <span className="text-sm text-on-surface/80 font-sans flex-1 truncate">{name}</span>
                  <span className="flex-shrink-0 bg-on-surface-accent/15 text-on-surface-accent text-xs font-semibold tracking-wider px-2.5 py-0.5 rounded-full">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Palate Profile */}
      {palateText && (
        <div className="surface-raised p-4 sm:p-6">
          <h3 className="micro-label text-on-surface-accent mb-3">Palate Profile</h3>
          <p className="font-serif italic text-on-surface/70 text-lg leading-relaxed">{palateText}</p>
        </div>
      )}
    </div>
  );
}
