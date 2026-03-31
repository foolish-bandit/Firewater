import React, { createContext, useContext, useCallback, useRef, useState } from 'react';

interface PhotoContextValue {
  getPhotoUrl: (bourbonId: string) => string | null | undefined;
  requestPhoto: (bourbonId: string) => void;
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

  const requestPhoto = useCallback((bourbonId: string) => {
    if (fetchedIds.current.has(bourbonId) || pendingIds.current.has(bourbonId)) return;
    fetchedIds.current.add(bourbonId);
    pendingIds.current.add(bourbonId);

    if (!flushScheduled.current) {
      flushScheduled.current = true;
      setTimeout(flush, 0);
    }
  }, [flush]);

  const getPhotoUrl = useCallback((bourbonId: string): string | null | undefined => {
    return photoMap.get(bourbonId);
  }, [photoMap]);

  return (
    <PhotoContext.Provider value={{ getPhotoUrl, requestPhoto }}>
      {children}
    </PhotoContext.Provider>
  );
}

export function usePhotoUrl(bourbonId: string): string | null | undefined {
  const ctx = useContext(PhotoContext);
  if (!ctx) throw new Error('usePhotoUrl must be used within PhotoProvider');

  const { getPhotoUrl, requestPhoto } = ctx;

  // Request on first render
  const requested = useRef(false);
  if (!requested.current) {
    requested.current = true;
    requestPhoto(bourbonId);
  }

  return getPhotoUrl(bourbonId);
}
