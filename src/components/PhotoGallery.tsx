import { useState, useEffect } from 'react';
import { X, Camera, ImageOff } from 'lucide-react';
import { usePhotos, Photo } from '../hooks/usePhotos';

interface PhotoGalleryProps {
  bourbonId: string;
  onUploadClick?: () => void;
}

export default function PhotoGallery({ bourbonId, onUploadClick }: PhotoGalleryProps) {
  const { photos, fetchPhotos } = usePhotos();
  const [lightbox, setLightbox] = useState<Photo | null>(null);

  useEffect(() => {
    fetchPhotos(bourbonId);
  }, [bourbonId, fetchPhotos]);

  if (photos.length === 0) {
    return (
      <div className="space-y-3">
        <h3 className="micro-label text-[#C89B3C]">Community Photos</h3>
        <div
          className="bg-[#1A1816] vintage-border border-dashed p-6 sm:p-8 flex flex-col items-center justify-center text-center space-y-3 cursor-pointer hover:border-[#C89B3C]/30 transition-colors group"
          onClick={onUploadClick}
        >
          <div className="w-14 h-14 rounded-full bg-[#141210] vintage-border flex items-center justify-center group-hover:border-[#C89B3C]/30 transition-colors">
            <ImageOff size={24} className="text-[#EAE4D9]/20 group-hover:text-[#C89B3C]/40 transition-colors" />
          </div>
          <p className="text-[#EAE4D9]/40 font-serif italic text-sm">No photos added yet</p>
          <p className="text-[#C89B3C]/60 text-xs font-sans font-semibold tracking-widest uppercase flex items-center gap-1.5 group-hover:text-[#C89B3C] transition-colors">
            <Camera size={12} /> Be the first to add one
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <h3 className="micro-label text-[#C89B3C]">Community Photos</h3>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
          {photos.map(photo => (
            <button
              key={photo.id}
              onClick={() => setLightbox(photo)}
              className="shrink-0 snap-start group"
            >
              <img
                src={photo.blob_url}
                alt="Bourbon photo"
                className="w-28 h-28 object-cover vintage-border group-hover:border-[#C89B3C] transition-colors"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors z-10"
            onClick={() => setLightbox(null)}
          >
            <X size={28} />
          </button>
          <img
            src={lightbox.blob_url}
            alt="Bourbon photo"
            className="max-w-full max-h-[85vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {lightbox.user_name && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/50 text-xs font-sans tracking-wider">
              Photo by {lightbox.user_name}
            </div>
          )}
        </div>
      )}
    </>
  );
}
