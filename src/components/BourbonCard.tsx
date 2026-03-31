import React from 'react';
import { Heart, CheckCircle } from 'lucide-react';
import { Bourbon } from '../data';

interface BourbonCardProps {
  bourbon: Bourbon;
  onClick: () => void;
  isWanted: boolean;
  isTried: boolean;
  onToggleWant: (e: React.MouseEvent) => void;
  onToggleTried: (e: React.MouseEvent) => void;
}

export default function BourbonCard({ bourbon, onClick, isWanted, isTried, onToggleWant, onToggleTried }: BourbonCardProps) {
  return (
    <div
      onClick={onClick}
      className="group bg-[#1A1816] vintage-border overflow-hidden cursor-pointer hover:border-[#C89B3C] hover:shadow-[0_0_30px_rgba(200,155,60,0.1)] transition-all duration-500 flex flex-col h-full relative"
    >
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none border-[2px] border-[#141210] m-1 z-10"></div>
      <div className="p-6 flex-1 flex flex-col relative z-20 bg-[#1A1816]">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-serif text-2xl font-normal text-[#EAE4D9] group-hover:text-[#C89B3C] transition-colors leading-tight flex-1 mr-3">{bourbon.name}</h3>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={onToggleWant}
              className={`p-2 rounded-full transition-all duration-300 ${isWanted ? 'bg-[#C89B3C]/20 text-[#C89B3C] border border-[#C89B3C]/50' : 'bg-[#141210]/80 text-[#EAE4D9]/40 hover:text-[#C89B3C] border border-transparent hover:border-[#C89B3C]/30'}`}
              title="Want to Try"
            >
              <Heart size={16} className={isWanted ? "fill-current" : ""} />
            </button>
            <button
              onClick={onToggleTried}
              className={`p-2 rounded-full transition-all duration-300 ${isTried ? 'bg-[#C89B3C]/20 text-[#C89B3C] border border-[#C89B3C]/50' : 'bg-[#141210]/80 text-[#EAE4D9]/40 hover:text-[#C89B3C] border border-transparent hover:border-[#C89B3C]/30'}`}
              title="Tried"
            >
              <CheckCircle size={16} className={isTried ? "fill-current" : ""} />
            </button>
          </div>
        </div>
        <p className="micro-label text-[#C89B3C] mb-3">{bourbon.distillery}</p>
        <div className="flex items-center gap-3 mb-4">
          {bourbon.source === 'community' && (
            <span className="px-2 py-0.5 bg-[#C89B3C]/20 text-[8px] font-sans font-semibold tracking-widest uppercase text-[#C89B3C] border border-[#C89B3C]/30 rounded-sm">
              Community
            </span>
          )}
          <span className="px-3 py-1 bg-[#141210]/90 text-[10px] font-sans font-semibold tracking-widest uppercase text-[#C89B3C] vintage-border">
            {bourbon.proof} Proof
          </span>
          <span className="font-serif text-lg text-[#EAE4D9] italic ml-auto">${bourbon.price}</span>
        </div>
        <div className="w-8 h-px bg-[#EAE4D9]/10 mb-4"></div>
        <p className="text-sm text-[#EAE4D9]/60 line-clamp-3 flex-1 font-serif italic leading-relaxed">{bourbon.description}</p>
      </div>
    </div>
  );
}
