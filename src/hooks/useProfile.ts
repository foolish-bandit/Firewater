import { useState, useEffect, useCallback } from 'react';
import { UserProfile, User } from '../types';

export function useProfile(userId: string | undefined, currentUser: User | null) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = {};
      if (currentUser) headers['x-user-id'] = currentUser.id;

      const res = await fetch(`/api/social?scope=profiles&action=get&userId=${userId}`, { headers });
      if (!res.ok) throw new Error('Failed to fetch profile');
      const data = await res.json();
      setProfile(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId, currentUser]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(async (updates: {
    bio?: string;
    favorite_spirit?: string;
    is_public?: boolean;
    top_shelf?: string[];
  }) => {
    if (!currentUser || !userId) return;
    try {
      const res = await fetch(`/api/social?scope=profiles&action=update&userId=${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update profile');
      await fetchProfile();
    } catch (err: any) {
      setError(err.message);
    }
  }, [currentUser, userId, fetchProfile]);

  const toggleFollow = useCallback(async () => {
    if (!currentUser || !userId) return;
    try {
      const res = await fetch('/api/social?scope=follows&action=toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({ targetUserId: userId }),
      });
      if (!res.ok) throw new Error('Follow action failed');
      const { following } = await res.json();
      setProfile(prev => prev ? {
        ...prev,
        is_following: following,
        follower_count: following ? prev.follower_count + 1 : prev.follower_count - 1,
      } : null);
    } catch (err: any) {
      setError(err.message);
    }
  }, [currentUser, userId]);

  return { profile, loading, error, updateProfile, toggleFollow, refetch: fetchProfile };
}
