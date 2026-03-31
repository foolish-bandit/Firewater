import { useState, useEffect } from 'react';
import { User } from '../types';
import { apiFetch } from '../api';

export function useAdmin(user: User | null) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user?.email) {
      setIsAdmin(false);
      return;
    }

    let cancelled = false;

    apiFetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (!cancelled) setIsAdmin(data.isAdmin === true);
      })
      .catch(() => {
        if (!cancelled) setIsAdmin(false);
      });

    return () => { cancelled = true; };
  }, [user?.email]);

  return { isAdmin };
}
