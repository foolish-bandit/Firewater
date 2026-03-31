import React, { createContext, useContext, useCallback, useRef, useState } from 'react';

interface PhotoContextValue {
  getPhotoUrl: (liquorId: string) => string | null | undefined;
  requestPhoto: (liquorId: string) => void;
}

const PhotoContext = createContext<PhotoContextValue | null>(null);

export function PhotoProvider({ children }: { children: React.ReactNode }) {
  const [photoMap, setPhotoMap] = useState<Map<string, string | null>>(new Map());
  const pendingIds = useRef<Set<string>>(new Set());
  const flushScheduled = useRef(false);
  const fetchedIds = useRef<Set<string>>(new Set());

  const flush = useCallback(() => {
    flushScheduled.current = false;
    const ids = Array.from(pendingIds.current);
    pendingIds.current.clear();
    if (ids.length === 0) return;

    fetch(`/api/photos?action=batch&ids=${ids.join(',')}`)
      .then(r => r.ok ? r.json() : {})
      .then((map: Record<string, string>) => {
        setPhotoMap(prev => {
          const next = new Map(prev);
          ids.forEach(id => {
            next.set(id, map[id] || null);
          });
          return next;
        });
      })
      .catch(() => {});
  }, []);

  const requestPhoto = useCallback((liquorId: string) => {
    if (fetchedIds.current.has(liquorId) || pendingIds.current.has(liquorId)) return;
    fetchedIds.current.add(liquorId);
    pendingIds.current.add(liquorId);

    if (!flushScheduled.current) {
      flushScheduled.current = true;
      setTimeout(flush, 0);
    }
  }, [flush]);

  const getPhotoUrl = useCallback((liquorId: string): string | null | undefined => {
    return photoMap.get(liquorId);
  }, [photoMap]);

  return (
    <PhotoContext.Provider value={{ getPhotoUrl, requestPhoto }}>
      {children}
    </PhotoContext.Provider>
  );
}

export function usePhotoUrl(liquorId: string): string | null | undefined {
  const ctx = useContext(PhotoContext);
  if (!ctx) throw new Error('usePhotoUrl must be used within PhotoProvider');

  const { getPhotoUrl, requestPhoto } = ctx;

  // Request on first render
  const requested = useRef(false);
  if (!requested.current) {
    requested.current = true;
    requestPhoto(liquorId);
  }

  return getPhotoUrl(liquorId);
}
