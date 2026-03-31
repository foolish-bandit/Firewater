import { useState, useEffect, useRef } from 'react';
import { User } from '../types';

export function useLiquorLists(user?: User | null, onError?: (msg: string) => void) {
  const [wantToTry, setWantToTry] = useState<string[]>([]);
  const [tried, setTried] = useState<string[]>([]);
  const loaded = useRef(false);
  const synced = useRef(false);

  // Load from localStorage
  useEffect(() => {
    const savedWant = localStorage.getItem('bs_wantToTry');
    const savedTried = localStorage.getItem('bs_tried');
    if (savedWant) setWantToTry(JSON.parse(savedWant));
    if (savedTried) setTried(JSON.parse(savedTried));
    loaded.current = true;
  }, []);

  // Save to localStorage (debounced)
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

  // Sync localStorage lists to DB on login (one-time migration)
  useEffect(() => {
    if (!user || synced.current || !loaded.current) return;
    synced.current = true;

    const syncKey = `bs_lists_synced_${user.id}`;
    if (localStorage.getItem(syncKey)) return;

    if (wantToTry.length === 0 && tried.length === 0) return;

    fetch('/api/social?scope=lists&action=sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
      body: JSON.stringify({ want: wantToTry, tried }),
    }).then(res => {
      if (res.ok) localStorage.setItem(syncKey, 'true');
    }).catch(() => onError?.('List sync failed — changes saved locally'));
  }, [user, wantToTry, tried]);

  const syncListAction = (liquorId: string, listType: 'want' | 'tried', action: 'add' | 'remove') => {
    if (!user) return;
    fetch('/api/social?scope=lists&action=update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
      body: JSON.stringify({ bourbonId: liquorId, listType, action }),
    }).catch(() => onError?.('Could not sync list to server'));
  };

  const toggleWantToTry = (id: string) => {
    if (wantToTry.includes(id)) {
      setWantToTry(prev => prev.filter(x => x !== id));
      syncListAction(id, 'want', 'remove');
    } else {
      setWantToTry(prev => [...prev, id]);
      setTried(prev => prev.filter(x => x !== id));
      syncListAction(id, 'want', 'add');
    }
  };

  const toggleTried = (id: string) => {
    if (tried.includes(id)) {
      setTried(prev => prev.filter(x => x !== id));
      syncListAction(id, 'tried', 'remove');
    } else {
      setTried(prev => [...prev, id]);
      setWantToTry(prev => prev.filter(x => x !== id));
      syncListAction(id, 'tried', 'add');
    }
  };

  return { wantToTry, tried, toggleWantToTry, toggleTried };
}
