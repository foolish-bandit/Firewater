import { useState, useCallback, useEffect, useRef } from 'react';
import { storage } from '../lib/storage';

type Theme = 'dark' | 'light';

const STORAGE_KEY = 'brrl_theme';

function getInitialTheme(): Theme {
  // Synchronous web-only read for instant render (avoids flash).
  // On native this returns null; the async read in useEffect will correct it.
  const stored = storage.getSync(STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') return stored;
  if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
  return 'dark';
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const loaded = useRef(false);

  // Async read from storage (authoritative on native)
  useEffect(() => {
    let cancelled = false;
    storage.get(STORAGE_KEY).then(stored => {
      if (cancelled) return;
      if (stored === 'dark' || stored === 'light') {
        setTheme(stored);
      }
      loaded.current = true;
    });
    return () => { cancelled = true; };
  }, []);

  // Persist theme changes + apply to DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (!loaded.current) return;
    storage.set(STORAGE_KEY, theme);
  }, [theme]);

  // Listen for system preference changes when no stored preference
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const handler = (e: MediaQueryListEvent) => {
      storage.get(STORAGE_KEY).then(val => {
        if (!val) {
          setTheme(e.matches ? 'light' : 'dark');
        }
      });
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  return { theme, toggleTheme } as const;
}
