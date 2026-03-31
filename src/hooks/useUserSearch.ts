import { useState, useCallback } from 'react';
import { UserSearchResult } from '../types';

export function useUserSearch() {
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const searchUsers = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/social?scope=profiles&action=search&q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setResults(data.users);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const clearResults = useCallback(() => setResults([]), []);

  return { results, searching, searchUsers, clearResults };
}
