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

function getProofColor(proof: number): string {
  if (proof >= 130) return 'bg-gradient-to-r from-on-surface-accent to-[#B05050]';
  if (proof >= 100) return 'bg-gradient-to-r from-on-surface-accent/70 to-on-surface-accent';
  return 'bg-gradient-to-r from-on-surface/20 to-on-surface-accent/50';
}

export default function LiquorCard({ liquor, onClick, isWanted, isTried, onToggleWant, onToggleTried }: LiquorCardProps) {
  const topFlavors = getTopFlavors(liquor);
  const priceTier = getPriceTier(liquor.price);
  const proofPercent = Math.min((liquor.proof / 160) * 100, 100);
  const photoUrl = usePhotoUrl(liquor.id);

  return (
    <div
      onClick={() => { hapticTap(); onClick(); }}
      className="group surface-raised overflow-hidden cursor-pointer hover:border-border-accent-strong card-elevated card-elevated-hover transition-all duration-300 ease-out flex flex-col h-full relative hover:-translate-y-1.5"
    >
      <div className="h-[2px] w-[30%] group-hover:w-full bg-gradient-to-r from-on-surface-accent to-on-surface-accent/60 transition-all duration-500 ease-out" />

      <LiquorMedia
        liquor={liquor}
        imageUrl={photoUrl ?? undefined}
        aspectClassName="aspect-[5/4]"
        className="w-full border-x-0 border-t-0"
      />

      <div className="p-6 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-4 mb-3 min-h-[4.5rem]">
          <div className="min-w-0 flex-1 space-y-1.5">
            <h3 className="font-serif text-2xl font-normal text-on-surface group-hover:text-on-surface-accent transition-colors leading-tight line-clamp-2">{liquor.name}</h3>
            <p className="micro-label text-on-surface-accent line-clamp-1">{liquor.distillery}</p>
          </div>
          <div className="flex gap-1 shrink-0 pt-0.5">
            <button
              onClick={onToggleWant}
              className={`icon-toggle min-w-[44px] min-h-[44px] flex items-center justify-center transition-all duration-300 active:scale-90 ${isWanted ? 'icon-toggle-active' : ''}`}
              title="Want to Try"
              aria-label={isWanted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart size={18} className={isWanted ? 'fill-current' : ''} />
            </button>
            <button
              onClick={onToggleTried}
              className={`icon-toggle min-w-[44px] min-h-[44px] flex items-center justify-center transition-all duration-300 active:scale-90 ${isTried ? 'icon-toggle-active' : ''}`}
              title="Tried"
              aria-label={isTried ? 'Remove from tried' : 'Mark as tried'}
            >
              <CheckCircle size={18} className={isTried ? 'fill-current' : ''} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-2 flex-wrap">
          {liquor.source === 'community' && (
            <span className="badge badge-accent text-[8px] rounded-sm">
              Community
            </span>
          )}
          <span className="badge badge-solid px-3 py-1 text-[10px]">
            {liquor.proof} Proof
          </span>
          <span className="badge badge-muted px-3 py-1 text-[10px] max-w-full truncate">
            {liquor.type}
          </span>
          <span className={`font-serif text-lg italic ml-auto font-medium ${priceTier.className}`}>
            {priceTier.label}
            <span className="text-theme-muted text-sm ml-1">${liquor.price}</span>
          </span>
        </div>

        <div className="w-full h-[2px] bg-surface-base rounded-full mb-4 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${getProofColor(liquor.proof)}`}
            style={{ width: `${proofPercent}%` }}
          />
        </div>

        <div className="flex gap-2 mb-4 flex-wrap min-h-[2rem] content-start">
          {topFlavors.map(flavor => (
            <span key={flavor} className="badge badge-muted px-2 py-0.5 text-[9px] font-medium tracking-wider">
              {flavor}
            </span>
          ))}
        </div>

        <p className="text-sm text-theme-secondary line-clamp-3 flex-1 font-serif italic leading-relaxed">{liquor.description}</p>
      </div>
    </div>
  );
}
