import { useState, useEffect, useMemo } from 'react';
import { X, Camera, Images } from 'lucide-react';
import { Liquor } from '../data';
import { usePhotos, Photo } from '../hooks/usePhotos';
import LiquorMedia, { getLiquorMediaIdentity } from './LiquorMedia';

interface PhotoGalleryProps {
  liquorId: string;
  liquor: Liquor;
  onUploadClick?: () => void;
}

export default function PhotoGallery({ liquorId, liquor, onUploadClick }: PhotoGalleryProps) {
  const { photos, fetchPhotos } = usePhotos();
  const [lightbox, setLightbox] = useState<Photo | null>(null);
  const identity = useMemo(() => getLiquorMediaIdentity(liquor), [liquor]);

  useEffect(() => {
    fetchPhotos(liquorId);
  }, [liquorId, fetchPhotos]);

  const primaryPhoto = photos[0];
  const supportingPhotos = photos.slice(1, 5);

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="micro-label text-on-surface-accent">Visual Notes</p>
            <h3 className="mt-2 font-display text-3xl sm:text-4xl text-on-surface">Bottle Identity & Atmosphere</h3>
          </div>
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-border-subtle bg-surface-raised/80 px-4 py-2 backdrop-blur-sm">
            <Images size={14} className="text-on-surface-accent" />
            <span className="text-[10px] font-sans font-semibold tracking-[0.24em] uppercase text-on-surface-muted">
              {photos.length > 0 ? `${photos.length} community photo${photos.length === 1 ? '' : 's'}` : 'Premium fallback art'}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {primaryPhoto ? (
            <button
              onClick={() => setLightbox(primaryPhoto)}
              className="group block w-full text-left"
            >
              <div className="relative overflow-hidden vintage-border bg-surface-base aspect-[5/4] sm:aspect-[4/3]">
                <img
                  src={primaryPhoto.blob_url}
                  alt={`${liquor.name} photo`}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-base/82 via-surface-base/12 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-sans font-semibold tracking-[0.24em] uppercase text-on-surface-accent">Featured Community Photo</p>
                    <p className="mt-1 font-display text-lg sm:text-2xl text-on-surface line-clamp-2">{identity.typeLabel}</p>
                  </div>
                  <span className="rounded-full border border-border-subtle bg-surface-base/65 px-3 py-1 text-[10px] font-sans font-semibold tracking-[0.22em] uppercase text-on-surface-secondary backdrop-blur-sm">
                    Tap to expand
                  </span>
                </div>
              </div>
            </button>
          ) : (
            <div className="space-y-3">
              <LiquorMedia liquor={liquor} aspectClassName="aspect-[5/4] sm:aspect-[4/3]" className="w-full" priority />
              <div
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-border-accent bg-surface-raised/70 px-4 py-3"
                onClick={onUploadClick}
              >
                <div>
                  <p className="text-sm font-serif italic text-on-surface-secondary">No approved photos yet — the hero uses a curated spirit illustration.</p>
                  <p className="mt-1 text-[10px] font-sans font-semibold tracking-[0.22em] uppercase text-on-surface-accent/70">{identity.mood}</p>
                </div>
                <div className="inline-flex items-center gap-2 text-[10px] font-sans font-semibold tracking-[0.22em] uppercase text-on-surface-accent">
                  <Camera size={12} /> Ready for the first real pour shot
                </div>
              </div>
            </div>
          )}

          {supportingPhotos.length > 0 && (
            <div className="grid grid-cols-4 gap-3">
              {supportingPhotos.map((photo) => (
                <button
                  key={photo.id}
                  onClick={() => setLightbox(photo)}
                  className="group overflow-hidden vintage-border bg-surface-base aspect-square"
                >
                  <img
                    src={photo.blob_url}
                    alt={`${liquor.name} detail`}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

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
            alt="Liquor photo"
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
