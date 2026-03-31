import { useState, useEffect, useCallback, useRef } from 'react';
import { Review, User } from '../types';

export function useReviews(user: User | null, onError?: (msg: string) => void) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const loaded = useRef(false);
  const synced = useRef(false);

  // Load from localStorage
  useEffect(() => {
    const savedReviews = localStorage.getItem('bs_reviews');
    if (savedReviews) setReviews(JSON.parse(savedReviews));
    loaded.current = true;
  }, []);

  // Save to localStorage (debounced)
  useEffect(() => {
    if (!loaded.current) return;
    const timer = setTimeout(() => {
      localStorage.setItem('bs_reviews', JSON.stringify(reviews));
    }, 500);
    return () => clearTimeout(timer);
  }, [reviews]);

  // Sync localStorage reviews to DB on login (one-time migration)
  useEffect(() => {
    if (!user || synced.current || !loaded.current) return;
    synced.current = true;

    const syncKey = `bs_reviews_synced_${user.id}`;
    if (localStorage.getItem(syncKey)) return;

    const userReviews = reviews.filter(r => r.userId === user.id);
    if (userReviews.length === 0) return;

    fetch('/api/social?scope=reviews&action=sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
      body: JSON.stringify({ reviews: userReviews }),
    }).then(res => {
      if (res.ok) localStorage.setItem(syncKey, 'true');
    }).catch(() => onError?.('Review sync failed — changes saved locally'));
  }, [user, reviews]);

  const addReview = useCallback((review: Omit<Review, 'id' | 'date' | 'userId' | 'userName' | 'userPicture'>) => {
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

    // Also save to DB if logged in
    if (user) {
      fetch('/api/social?scope=reviews&action=create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
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
  }, [user]);

  const editReview = useCallback((reviewId: string, updates: { rating?: number; text?: string }) => {
    setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, ...updates } : r));

    if (user) {
      fetch('/api/social?scope=reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
        body: JSON.stringify({ reviewId, ...updates }),
      }).catch(() => onError?.('Could not update review on server'));
    }
  }, [user, onError]);

  const deleteReview = useCallback((reviewId: string) => {
    setReviews(prev => prev.filter(r => r.id !== reviewId));

    if (user) {
      fetch(`/api/social?scope=reviews&reviewId=${reviewId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': user.id },
      }).catch(() => onError?.('Could not delete review from server'));
    }
  }, [user, onError]);

  const getReviewsForLiquor = useCallback((id: string): Review[] => {
    return reviews.filter(r => r.liquorId === id);
  }, [reviews]);

  return { reviews, addReview, editReview, deleteReview, getReviewsForLiquor };
}
