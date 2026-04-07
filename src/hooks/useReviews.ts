import { useState, useEffect, useCallback, useRef } from 'react';
import { Review, User } from '../types';
import { apiFetch } from '../api';
import { storage } from '../lib/storage';
import { hapticImpact } from '../lib/capacitor';

export function useReviews(user: User | null, onError?: (msg: string) => void) {
  const [reviews, setReviews] = useState<Review[]>(() =>
    storage.getSyncJSON<Review[]>('bs_reviews') || []
  );
  const loaded = useRef(false);
  const dbLoaded = useRef(false);

  // Async load from storage
  useEffect(() => {
    storage.getJSON<Review[]>('bs_reviews').then(saved => {
      if (saved) setReviews(saved);
      loaded.current = true;
    });
  }, []);

  // When user logs in, fetch their reviews from DB (source of truth)
  useEffect(() => {
    if (!user || dbLoaded.current) return;
    dbLoaded.current = true;

    const syncKey = `bs_reviews_synced_${user.id}`;

    const fetchFromDb = () => {
      apiFetch(`/api/social?scope=reviews&userId=${user.id}`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch reviews');
          return res.json();
        })
        .then(data => {
          const dbReviews: any[] = data.reviews || [];
          // Map DB format to frontend Review format
          const mapped: Review[] = dbReviews.map(r => ({
            id: r.id,
            liquorId: r.bourbon_id,
            rating: r.rating,
            text: r.text || '',
            date: r.created_at,
            userId: r.user_id,
            userName: r.user_name,
            userPicture: r.user_picture,
            nose: r.nose || '',
            palate: r.palate || '',
            finish: r.finish || '',
            tags: typeof r.tags === 'string' ? JSON.parse(r.tags) : (r.tags || []),
          }));
          setReviews(mapped);
          storage.setJSON('bs_reviews', mapped);
        })
        .catch(() => {
          // Offline — keep cached data
        });
    };

    storage.get(syncKey).then(hasSynced => {
      const needsSync = !hasSynced;
      if (needsSync && loaded.current) {
        storage.getJSON<Review[]>('bs_reviews').then(localReviews => {
          const allLocal = localReviews || [];
          const userReviews = allLocal.filter((r: Review) => r.userId === user.id);
          if (userReviews.length > 0) {
            apiFetch('/api/social?scope=reviews&action=sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ reviews: userReviews }),
            }).then(res => {
              if (res.ok) storage.set(syncKey, 'true');
              fetchFromDb();
            }).catch(() => onError?.('Review sync failed — changes saved locally'));
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
      storage.setJSON('bs_reviews', reviews);
    }, 500);
    return () => clearTimeout(timer);
  }, [reviews]);

  const addReview = useCallback((review: Omit<Review, 'id' | 'date' | 'userId' | 'userName' | 'userPicture'>) => {
    hapticImpact();
    const newReview: Review = {
      ...review,
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      ...(user && {
        userId: user.id,
        userName: user.name,
        userPicture: user.picture,
      }),
    };
    setReviews(prev => [newReview, ...prev]);

    if (user) {
      apiFetch('/api/social?scope=reviews&action=create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newReview.id,
          bourbonId: newReview.liquorId,
          rating: newReview.rating,
          text: newReview.text,
          nose: newReview.nose || '',
          palate: newReview.palate || '',
          finish: newReview.finish || '',
          tags: newReview.tags || [],
          userName: user.name,
          userPicture: user.picture,
        }),
      }).catch(() => onError?.('Could not save review to server'));
    }
  }, [user, onError]);

  const editReview = useCallback((reviewId: string, updates: { rating?: number; text?: string }) => {
    setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, ...updates } : r));

    if (user) {
      apiFetch('/api/social?scope=reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, ...updates }),
      }).catch(() => onError?.('Could not update review on server'));
    }
  }, [user, onError]);

  const deleteReview = useCallback((reviewId: string) => {
    setReviews(prev => prev.filter(r => r.id !== reviewId));

    if (user) {
      apiFetch(`/api/social?scope=reviews&reviewId=${reviewId}`, {
        method: 'DELETE',
      }).catch(() => onError?.('Could not delete review from server'));
    }
  }, [user, onError]);

  const getReviewsForLiquor = useCallback((id: string): Review[] => {
    return reviews.filter(r => r.liquorId === id);
  }, [reviews]);

  return { reviews, addReview, editReview, deleteReview, getReviewsForLiquor };
}
