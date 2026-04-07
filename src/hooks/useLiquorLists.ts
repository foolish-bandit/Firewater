import { useState, useEffect, useRef, useCallback } from 'react';
import { User } from '../types';
import { apiFetch } from '../api';
import { storage } from '../lib/storage';

export function useLiquorLists(user?: User | null, onError?: (msg: string) => void) {
  const [wantToTry, setWantToTry] = useState<string[]>(() =>
    storage.getSyncJSON<string[]>('bs_wantToTry') || []
  );
  const [tried, setTried] = useState<string[]>(() =>
    storage.getSyncJSON<string[]>('bs_tried') || []
  );
  const loaded = useRef(false);
  const dbLoaded = useRef(false);

  // Async load from storage
  useEffect(() => {
    Promise.all([
      storage.getJSON<string[]>('bs_wantToTry'),
      storage.getJSON<string[]>('bs_tried'),
    ]).then(([savedWant, savedTried]) => {
      if (savedWant) setWantToTry(savedWant);
      if (savedTried) setTried(savedTried);
      loaded.current = true;
    });
  }, []);

  // When user logs in, fetch lists from DB (source of truth) and merge
  useEffect(() => {
    if (!user || dbLoaded.current) return;
    dbLoaded.current = true;

    const syncKey = `bs_lists_synced_${user.id}`;

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
          storage.setJSON('bs_wantToTry', dbWant);
          storage.setJSON('bs_tried', dbTried);
        })
        .catch(() => {
          // Offline — keep cached data
        });
    };

    storage.get(syncKey).then(hasSynced => {
      const needsSync = !hasSynced;
      if (needsSync && loaded.current) {
        Promise.all([
          storage.getJSON<string[]>('bs_wantToTry'),
          storage.getJSON<string[]>('bs_tried'),
        ]).then(([localWant, localTried]) => {
          const want = localWant || [];
          const tried = localTried || [];
          if (want.length > 0 || tried.length > 0) {
            apiFetch('/api/social?scope=lists&action=sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ want, tried }),
            }).then(res => {
              if (res.ok) storage.set(syncKey, 'true');
              fetchFromDb();
            }).catch(() => onError?.('List sync failed — changes saved locally'));
            return;
          }
          fetchFromDb();
        });
      } else {
        fetchFromDb();
      }
    });
  }, [user]);

  // Save to storage cache (debounced)
  useEffect(() => {
    if (!loaded.current) return;
    const timer = setTimeout(() => {
      storage.setJSON('bs_wantToTry', wantToTry);
    }, 500);
    return () => clearTimeout(timer);
  }, [wantToTry]);

  useEffect(() => {
    if (!loaded.current) return;
    const timer = setTimeout(() => {
      storage.setJSON('bs_tried', tried);
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
