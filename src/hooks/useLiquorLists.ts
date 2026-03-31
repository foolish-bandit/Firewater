import { useState, useEffect, useRef, useCallback } from 'react';
import { User } from '../types';
import { apiFetch } from '../api';

export function useLiquorLists(user?: User | null, onError?: (msg: string) => void) {
  const [wantToTry, setWantToTry] = useState<string[]>([]);
  const [tried, setTried] = useState<string[]>([]);
  const loaded = useRef(false);
  const dbLoaded = useRef(false);

  // Load from localStorage immediately (instant UI), then override with DB data if logged in
  useEffect(() => {
    const savedWant = localStorage.getItem('bs_wantToTry');
    const savedTried = localStorage.getItem('bs_tried');
    if (savedWant) setWantToTry(JSON.parse(savedWant));
    if (savedTried) setTried(JSON.parse(savedTried));
    loaded.current = true;
  }, []);

  // When user logs in, fetch lists from DB (source of truth) and merge
  useEffect(() => {
    if (!user || dbLoaded.current) return;
    dbLoaded.current = true;

    // First, sync any local-only items to DB
    const syncKey = `bs_lists_synced_${user.id}`;
    const needsSync = !localStorage.getItem(syncKey);

    const fetchFromDb = () => {
      apiFetch(`/api/social?scope=lists&userId=${user.id}`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch lists');
          return res.json();
        })
        .then(data => {
          const dbWant: string[] = data.want || [];
          const dbTried: string[] = data.tried || [];
          setWantToTry(dbWant);
          setTried(dbTried);
          // Update localStorage cache
          localStorage.setItem('bs_wantToTry', JSON.stringify(dbWant));
          localStorage.setItem('bs_tried', JSON.stringify(dbTried));
        })
        .catch(() => {
          // Offline — keep localStorage data
        });
    };

    if (needsSync && loaded.current) {
      const localWant = JSON.parse(localStorage.getItem('bs_wantToTry') || '[]');
      const localTried = JSON.parse(localStorage.getItem('bs_tried') || '[]');
      if (localWant.length > 0 || localTried.length > 0) {
        apiFetch('/api/social?scope=lists&action=sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ want: localWant, tried: localTried }),
        }).then(res => {
          if (res.ok) localStorage.setItem(syncKey, 'true');
          // After sync, fetch the merged result from DB
          fetchFromDb();
        }).catch(() => onError?.('List sync failed — changes saved locally'));
        return;
      }
    }

    fetchFromDb();
  }, [user]);

  // Save to localStorage cache (debounced)
  useEffect(() => {
    if (!loaded.current) return;
    const timer = setTimeout(() => {
      localStorage.setItem('bs_wantToTry', JSON.stringify(wantToTry));
    }, 500);
    return () => clearTimeout(timer);
  }, [wantToTry]);

  useEffect(() => {
    if (!loaded.current) return;
    const timer = setTimeout(() => {
      localStorage.setItem('bs_tried', JSON.stringify(tried));
    }, 500);
    return () => clearTimeout(timer);
  }, [tried]);

  const syncListAction = useCallback((liquorId: string, listType: 'want' | 'tried', action: 'add' | 'remove') => {
    if (!user) return;
    apiFetch('/api/social?scope=lists&action=update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bourbonId: liquorId, listType, action }),
    }).catch(() => onError?.('Could not sync list to server'));
  }, [user, onError]);

  const toggleWantToTry = useCallback((id: string) => {
    if (wantToTry.includes(id)) {
      setWantToTry(prev => prev.filter(x => x !== id));
      syncListAction(id, 'want', 'remove');
    } else {
      setWantToTry(prev => [...prev, id]);
      setTried(prev => prev.filter(x => x !== id));
      syncListAction(id, 'want', 'add');
    }
  }, [wantToTry, syncListAction]);

  const toggleTried = useCallback((id: string) => {
    if (tried.includes(id)) {
      setTried(prev => prev.filter(x => x !== id));
      syncListAction(id, 'tried', 'remove');
    } else {
      setTried(prev => [...prev, id]);
      setWantToTry(prev => prev.filter(x => x !== id));
      syncListAction(id, 'tried', 'add');
    }
  }, [tried, syncListAction]);

  return { wantToTry, tried, toggleWantToTry, toggleTried };
}
