import React from 'react';
import { Heart, CheckCircle } from 'lucide-react';
import { Liquor } from '../data';
import { usePhotoUrl } from '../contexts/PhotoContext';
import LiquorMedia from './LiquorMedia';
import { hapticTap } from '../lib/capacitor';

interface LiquorCardProps {
  liquor: Liquor;
  onClick: () => void;
  isWanted: boolean;
  isTried: boolean;
  onToggleWant: (e: React.MouseEvent) => void;
  onToggleTried: (e: React.MouseEvent) => void;
}

function getTopFlavors(liquor: Liquor): string[] {
  const entries = Object.entries(liquor.flavorProfile);
  entries.sort((a, b) => b[1] - a[1]);
  return entries.slice(0, 2).map(([key]) => key.charAt(0).toUpperCase() + key.slice(1));
}

function getPriceTier(price: number): { label: string; className: string } {
  if (price >= 100) return { label: '$$$$', className: 'text-[var(--text-accent)] text-shadow-[0_0_8px_rgba(200,155,60,0.3)]' };
  if (price >= 60) return { label: '$$$', className: 'text-[var(--text-accent)]' };
  if (price >= 30) return { label: '$$', className: 'text-theme-secondary' };
  return { label: '$', className: 'text-theme-muted' };
}

export default function LiquorCard({ liquor, onClick, isWanted, isTried, onToggleWant, onToggleTried }: LiquorCardProps) {
  const topFlavors = getTopFlavors(liquor);
  const priceTier = getPriceTier(liquor.price);
  const photoUrl = usePhotoUrl(liquor.id);

  return (
    <div
      onClick={() => { hapticTap(); onClick(); }}
      className="group surface-raised overflow-hidden cursor-pointer hover:border-border-accent-strong transition-colors duration-200 flex flex-col h-full relative"
    >
      <LiquorMedia
        liquor={liquor}
        imageUrl={photoUrl ?? undefined}
        aspectClassName="aspect-[5/4]"
        className="w-full border-x-0 border-t-0"
      />

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="micro-label text-on-surface-accent line-clamp-1">
              <span className="text-on-surface-accent">◆</span> {liquor.type} &middot; {liquor.region}
            </p>
            <h3 className="heading-md text-2xl italic text-on-surface group-hover:text-on-surface-accent transition-colors leading-tight line-clamp-2">{liquor.name}</h3>
          </div>
          <div className="flex gap-1 shrink-0 pt-0.5">
            <button
              onClick={onToggleWant}
              className={`icon-toggle min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors duration-200 active:scale-90 ${isWanted ? 'icon-toggle-active' : ''}`}
              title="Want to Try"
              aria-label={isWanted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart size={16} className={isWanted ? 'fill-current' : ''} />
            </button>
            <button
              onClick={onToggleTried}
              className={`icon-toggle min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors duration-200 active:scale-90 ${isTried ? 'icon-toggle-active' : ''}`}
              title="Tried"
              aria-label={isTried ? 'Remove from tried' : 'Mark as tried'}
            >
              <CheckCircle size={16} className={isTried ? 'fill-current' : ''} />
            </button>
          </div>
        </div>

        <div className="flex items-baseline justify-between gap-3 pt-3 border-t border-border-subtle">
          <div
            className="text-[10px] tracking-[0.22em] uppercase text-on-surface-muted"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {liquor.proof} PR &middot; {topFlavors.join(' · ')}
          </div>
          <span className={`font-serif text-xl italic ${priceTier.className}`}>
            ${liquor.price}
          </span>
        </div>

        {liquor.source === 'community' && (
          <p className="mt-3 micro-label text-on-surface-accent">
            <span className="text-on-surface-accent">◆</span> Community submission
          </p>
        )}
      </div>
    </div>
  );
}
