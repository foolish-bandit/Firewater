import React from 'react';
import { GlassWater, Camera, Sparkles } from 'lucide-react';
import { Liquor } from '../data';

interface LiquorMediaProps {
  liquor: Liquor;
  imageUrl?: string | null;
  aspectClassName?: string;
  className?: string;
  priority?: boolean;
  showCaption?: boolean;
}

type SpiritFamily = {
  family: string;
  mood: string;
  gradient: string;
  glow: string;
  edge: string;
  bottleFill: string;
};

function getSpiritFamily(liquor: Liquor): SpiritFamily {
  const type = `${liquor.type} ${liquor.name}`.toLowerCase();

  if (type.includes('gin') || type.includes('genever')) {
    return {
      family: 'Botanical Study',
      mood: 'Citrus lift · cool glass · bright garnish',
      gradient: 'from-emerald-500/20 via-teal-400/10 to-sky-500/20',
      glow: 'bg-[radial-gradient(circle_at_30%_20%,rgba(96,165,250,0.18),transparent_45%),radial-gradient(circle_at_75%_30%,rgba(52,211,153,0.14),transparent_38%),linear-gradient(180deg,rgba(18,24,28,0.95),rgba(20,18,16,1))]',
      edge: 'border-emerald-300/20',
      bottleFill: 'from-slate-100/10 via-emerald-200/12 to-sky-200/10',
    };
  }

  if (type.includes('vodka') || type.includes('soju') || type.includes('shochu')) {
    return {
      family: 'Crystal Pour',
      mood: 'Frozen rim · clean finish · polished bar top',
      gradient: 'from-slate-200/20 via-sky-200/10 to-cyan-400/20',
      glow: 'bg-[radial-gradient(circle_at_30%_18%,rgba(226,232,240,0.22),transparent_38%),radial-gradient(circle_at_72%_28%,rgba(125,211,252,0.16),transparent_35%),linear-gradient(180deg,rgba(15,23,42,0.92),rgba(20,18,16,1))]',
      edge: 'border-sky-200/25',
      bottleFill: 'from-white/20 via-slate-100/12 to-cyan-100/12',
    };
  }

  if (type.includes('tequila') || type.includes('mezcal') || type.includes('sotol') || type.includes('raicilla')) {
    return {
      family: 'Desert Smoke',
      mood: 'Warm stone · ember smoke · agave dusk',
      gradient: 'from-amber-400/25 via-orange-400/10 to-lime-300/15',
      glow: 'bg-[radial-gradient(circle_at_25%_20%,rgba(251,191,36,0.18),transparent_36%),radial-gradient(circle_at_80%_35%,rgba(132,204,22,0.14),transparent_32%),linear-gradient(180deg,rgba(33,24,18,0.95),rgba(20,18,16,1))]',
      edge: 'border-amber-300/25',
      bottleFill: 'from-amber-100/16 via-orange-200/14 to-lime-100/10',
    };
  }

  if (type.includes('rum') || type.includes('cacha') || type.includes('arrack')) {
    return {
      family: 'Molasses Glow',
      mood: 'Tropical cane · lacquered wood · night market',
      gradient: 'from-amber-500/20 via-rose-400/10 to-orange-500/20',
      glow: 'bg-[radial-gradient(circle_at_28%_18%,rgba(245,158,11,0.18),transparent_35%),radial-gradient(circle_at_78%_30%,rgba(251,113,133,0.12),transparent_32%),linear-gradient(180deg,rgba(40,20,16,0.95),rgba(20,18,16,1))]',
      edge: 'border-orange-300/20',
      bottleFill: 'from-amber-100/16 via-orange-200/12 to-rose-200/8',
    };
  }

  if (type.includes('amaro') || type.includes('fernet') || type.includes('liqueur') || type.includes('vermouth') || type.includes('bitters') || type.includes('absinthe') || type.includes('pastis')) {
    return {
      family: 'After-Dinner Cabinet',
      mood: 'Herbal depth · velvet booth · amber lamp',
      gradient: 'from-fuchsia-400/15 via-amber-300/10 to-lime-300/15',
      glow: 'bg-[radial-gradient(circle_at_25%_22%,rgba(192,132,252,0.16),transparent_36%),radial-gradient(circle_at_80%_30%,rgba(163,230,53,0.12),transparent_34%),linear-gradient(180deg,rgba(30,20,24,0.95),rgba(20,18,16,1))]',
      edge: 'border-fuchsia-200/20',
      bottleFill: 'from-amber-100/12 via-fuchsia-100/10 to-lime-100/10',
    };
  }

  if (type.includes('brandy') || type.includes('cognac') || type.includes('armagnac') || type.includes('grappa') || type.includes('eaux')) {
    return {
      family: 'Cellar Amber',
      mood: 'Leather chair · old oak · candle glow',
      gradient: 'from-amber-400/25 via-yellow-300/10 to-stone-200/10',
      glow: 'bg-[radial-gradient(circle_at_30%_18%,rgba(251,191,36,0.16),transparent_35%),radial-gradient(circle_at_78%_28%,rgba(214,211,209,0.12),transparent_35%),linear-gradient(180deg,rgba(36,24,18,0.95),rgba(20,18,16,1))]',
      edge: 'border-amber-200/20',
      bottleFill: 'from-amber-50/16 via-yellow-100/12 to-stone-100/10',
    };
  }

  if (type.includes('scotch') || type.includes('whisk') || type.includes('whiskey') || type.includes('bourbon') || type.includes('rye') || type.includes('malt') || type.includes('liquor')) {
    return {
      family: 'Fireside Reserve',
      mood: 'Oak stave · low light · tasting room hush',
      gradient: 'from-[#C89B3C]/35 via-[#7A3B1D]/10 to-[#E8C56D]/15',
      glow: 'bg-[radial-gradient(circle_at_28%_18%,rgba(200,155,60,0.2),transparent_35%),radial-gradient(circle_at_78%_26%,rgba(176,80,80,0.12),transparent_32%),linear-gradient(180deg,rgba(36,22,16,0.96),rgba(20,18,16,1))]',
      edge: 'border-[#C89B3C]/25',
      bottleFill: 'from-[#F7E7B8]/16 via-[#C89B3C]/10 to-[#7A3B1D]/12',
    };
  }

  return {
    family: 'Collector Selection',
    mood: 'Studio light · polished glass · archival label',
    gradient: 'from-[#EAE4D9]/20 via-[#C89B3C]/10 to-[#C89B3C]/20',
    glow: 'bg-[radial-gradient(circle_at_28%_18%,rgba(234,228,217,0.16),transparent_35%),radial-gradient(circle_at_78%_28%,rgba(200,155,60,0.12),transparent_32%),linear-gradient(180deg,rgba(28,24,22,0.95),rgba(20,18,16,1))]',
    edge: 'border-[#EAE4D9]/15',
    bottleFill: 'from-[#EAE4D9]/15 via-[#C89B3C]/10 to-[#EAE4D9]/8',
  };
}

function getMonogram(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function getLiquorMediaIdentity(liquor: Liquor) {
  const spirit = getSpiritFamily(liquor);

  return {
    ...spirit,
    monogram: getMonogram(liquor.name),
    typeLabel: liquor.type,
    proofLabel: `${liquor.proof} Proof`,
    distilleryLabel: liquor.distillery,
  };
}

export default function LiquorMedia({
  liquor,
  imageUrl,
  aspectClassName = 'aspect-[4/5]',
  className = '',
  priority = false,
  showCaption = true,
}: LiquorMediaProps) {
  const identity = getLiquorMediaIdentity(liquor);

  return (
    <div className={`relative isolate overflow-hidden vintage-border bg-[var(--bg-primary)] ${aspectClassName} ${className}`}>
      {imageUrl ? (
        <>
          <img
            src={imageUrl}
            alt={liquor.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            loading={priority ? 'eager' : 'lazy'}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#141210]/88 via-[#141210]/18 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
            <div className="flex items-end justify-between gap-3">
              <div className="space-y-1">
                <p className="text-[10px] font-sans font-semibold tracking-[0.28em] uppercase text-[#EAE4D9]/65">Bottle Portrait</p>
                <p className="font-serif text-lg italic text-[#EAE4D9] line-clamp-2">{identity.typeLabel}</p>
              </div>
              <span className="shrink-0 rounded-full border border-[#EAE4D9]/20 bg-[#141210]/60 px-3 py-1 text-[10px] font-sans font-semibold tracking-[0.22em] uppercase text-[#C89B3C] backdrop-blur-sm">
                {identity.proofLabel}
              </span>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className={`absolute inset-0 ${identity.glow}`} />
          <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-r ${identity.gradient} opacity-70`} />
          <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(234,228,217,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(234,228,217,0.04)_1px,transparent_1px)] [background-size:22px_22px]" />
          <div className="absolute -left-8 top-10 h-28 w-28 rounded-full bg-[#C89B3C]/10 blur-3xl" />
          <div className="absolute -right-10 bottom-14 h-36 w-36 rounded-full bg-white/6 blur-3xl" />

          <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-[#EAE4D9]/10 bg-[#141210]/55 px-3 py-1.5 backdrop-blur-sm">
            <Sparkles size={12} className="text-[#C89B3C]" />
            <span className="text-[10px] font-sans font-semibold tracking-[0.24em] uppercase text-[#EAE4D9]/70">
              Curated fallback art
            </span>
          </div>

          <div className="absolute right-4 top-4 text-right">
            <p className="text-[11px] font-sans font-semibold tracking-[0.24em] uppercase text-[#EAE4D9]/40">{identity.family}</p>
            <p className="mt-1 max-w-[12rem] text-[11px] font-serif italic leading-relaxed text-[#EAE4D9]/58">{identity.mood}</p>
          </div>

          <div className="absolute inset-x-[31%] bottom-[15%] top-[20%]">
            <div className={`absolute inset-x-[22%] top-0 h-[12%] rounded-t-[18px] border border-[#EAE4D9]/15 bg-gradient-to-b ${identity.bottleFill}`} />
            <div className="absolute inset-x-[34%] top-[-4.5%] h-[8%] rounded-t-md border border-[#EAE4D9]/15 bg-[#EAE4D9]/10" />
            <div className={`absolute inset-x-0 bottom-0 top-[8%] rounded-[40%_40%_18%_18%/12%_12%_22%_22%] border ${identity.edge} bg-gradient-to-b ${identity.bottleFill} shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-[2px]`}>
              <div className="absolute inset-x-[14%] top-[18%] h-[36%] rounded-[32px] border border-[#EAE4D9]/10 bg-[#141210]/20" />
              <div className="absolute inset-x-[18%] bottom-[14%] top-[58%] rounded-[28px] border border-[#EAE4D9]/12 bg-[#141210]/26" />
            </div>
            <div className="absolute left-1/2 top-[30%] -translate-x-1/2 text-center">
              <div className="font-display text-4xl sm:text-5xl tracking-[0.18em] text-[#EAE4D9]/24">{identity.monogram}</div>
              <div className="mt-1 h-px w-16 bg-gradient-to-r from-transparent via-[#C89B3C]/45 to-transparent" />
            </div>
          </div>

          {showCaption && (
            <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-[#EAE4D9]/10 bg-[#141210]/58 p-4 backdrop-blur-md">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-sans font-semibold tracking-[0.26em] uppercase text-[#C89B3C]">{identity.distilleryLabel}</p>
                  <p className="mt-1 font-display text-lg leading-tight text-[#EAE4D9] line-clamp-2">{identity.typeLabel}</p>
                </div>
                <div className="rounded-full border border-[#EAE4D9]/10 bg-white/5 p-2 text-[#EAE4D9]/65">
                  <GlassWater size={16} />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 text-[10px] font-sans font-semibold tracking-[0.22em] uppercase">
                <span className="text-[#EAE4D9]/45">{identity.family}</span>
                <span className="inline-flex items-center gap-1.5 text-[#C89B3C]/80">
                  <Camera size={11} /> {identity.proofLabel}
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
