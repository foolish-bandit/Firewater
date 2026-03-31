import React from 'react';
import { Heart, CheckCircle, ImageOff, Camera } from 'lucide-react';
import { Bourbon } from '../data';
import { usePhotoUrl } from '../contexts/PhotoContext';

interface BourbonCardProps {
  bourbon: Bourbon;
  onClick: () => void;
  isWanted: boolean;
  isTried: boolean;
  onToggleWant: (e: React.MouseEvent) => void;
  onToggleTried: (e: React.MouseEvent) => void;
}

function getTopFlavors(bourbon: Bourbon): string[] {
  const entries = Object.entries(bourbon.flavorProfile);
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
  if (proof >= 130) return 'bg-gradient-to-r from-[#C89B3C] to-[#B05050]';
  if (proof >= 100) return 'bg-gradient-to-r from-[#C89B3C]/70 to-[#C89B3C]';
  return 'bg-gradient-to-r from-[#EAE4D9]/20 to-[#C89B3C]/50';
}

export default function BourbonCard({ bourbon, onClick, isWanted, isTried, onToggleWant, onToggleTried }: BourbonCardProps) {
  const topFlavors = getTopFlavors(bourbon);
  const priceTier = getPriceTier(bourbon.price);
  const proofPercent = Math.min((bourbon.proof / 160) * 100, 100);
  const photoUrl = usePhotoUrl(bourbon.id);

  return (
    <div
      onClick={onClick}
      className="group bg-[var(--bg-surface)] vintage-border overflow-hidden cursor-pointer hover:border-[var(--text-accent)] card-elevated card-elevated-hover transition-all duration-300 ease-out flex flex-col h-full relative hover:-translate-y-1.5"
    >
      {/* Top gold accent bar */}
      <div className="h-[2px] w-[30%] group-hover:w-full bg-gradient-to-r from-[#C89B3C] to-[#E8C56D] transition-all duration-500 ease-out" />

      {/* Photo / Placeholder */}
      {photoUrl ? (
        <div className="w-full h-40 overflow-hidden bg-[var(--bg-primary)]">
          <img
            src={photoUrl}
            alt={bourbon.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="w-full h-32 bg-[var(--bg-primary)]/60 flex flex-col items-center justify-center gap-2 border-b border-[var(--color-vintage-border)]">
          <ImageOff size={22} className="text-[var(--text-primary)]/10 opacity-10" />
          <span className="text-[var(--text-primary)] opacity-20 text-[9px] font-sans font-semibold tracking-widest uppercase flex items-center gap-1">
            <Camera size={9} /> No photo yet
          </span>
        </div>
      )}

      <div className="p-6 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-serif text-2xl font-normal text-[var(--text-primary)] group-hover:text-[var(--text-accent)] transition-colors leading-tight flex-1 mr-3">{bourbon.name}</h3>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={onToggleWant}
              className={`p-2 rounded-full transition-all duration-300 active:scale-90 ${isWanted ? 'bg-[#C89B3C]/20 text-[var(--text-accent)] border border-[#C89B3C]/50' : 'bg-[var(--bg-primary)]/80 text-[var(--text-primary)]/40 hover:text-[var(--text-accent)] border border-transparent hover:border-[#C89B3C]/30'}`}
              title="Want to Try"
              aria-label={isWanted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart size={16} className={isWanted ? "fill-current" : ""} />
            </button>
            <button
              onClick={onToggleTried}
              className={`p-2 rounded-full transition-all duration-300 active:scale-90 ${isTried ? 'bg-[#C89B3C]/20 text-[var(--text-accent)] border border-[#C89B3C]/50' : 'bg-[var(--bg-primary)]/80 text-[var(--text-primary)]/40 hover:text-[var(--text-accent)] border border-transparent hover:border-[#C89B3C]/30'}`}
              title="Tried"
              aria-label={isTried ? 'Remove from tried' : 'Mark as tried'}
            >
              <CheckCircle size={16} className={isTried ? "fill-current" : ""} />
            </button>
          </div>
        </div>

        <p className="micro-label text-[var(--text-accent)] mb-3">{bourbon.distillery}</p>

        <div className="flex items-center gap-3 mb-2">
          {bourbon.source === 'community' && (
            <span className="px-2 py-0.5 bg-[#C89B3C]/20 text-[8px] font-sans font-semibold tracking-widest uppercase text-[var(--text-accent)] border border-[var(--border-accent)] rounded-sm">
              Community
            </span>
          )}
          <span className="px-3 py-1 bg-[var(--bg-primary)]/90 text-[10px] font-sans font-semibold tracking-widest uppercase text-[var(--text-accent)] vintage-border">
            {bourbon.proof} Proof
          </span>
          <span className={`font-serif text-lg italic ml-auto font-medium ${priceTier.className}`}>
            {priceTier.label}
            <span className="text-theme-muted text-sm ml-1">${bourbon.price}</span>
          </span>
        </div>

        {/* Proof indicator bar */}
        <div className="w-full h-[2px] bg-[var(--bg-primary)] rounded-full mb-4 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${getProofColor(bourbon.proof)}`}
            style={{ width: `${proofPercent}%` }}
          />
        </div>

        {/* Top flavors */}
        <div className="flex gap-2 mb-4">
          {topFlavors.map(flavor => (
            <span key={flavor} className="px-2 py-0.5 text-[9px] font-sans font-medium tracking-wider uppercase text-theme-muted border border-[var(--border-primary)] rounded-full">
              {flavor}
            </span>
          ))}
        </div>

        <p className="text-sm text-theme-secondary line-clamp-3 flex-1 font-serif italic leading-relaxed">{bourbon.description}</p>
      </div>
    </div>
  );
}
