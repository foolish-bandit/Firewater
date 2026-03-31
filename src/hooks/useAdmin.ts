import { useState, useEffect } from 'react';
import { User } from '../types';

export function useAdmin(user: User | null) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user?.email) {
      setIsAdmin(false);
      return;
    }

    let cancelled = false;

    fetch(`/api/auth/me?email=${encodeURIComponent(user.email)}`)
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
