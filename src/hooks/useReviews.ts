import { useState, useEffect, useCallback, useRef } from 'react';
import { Review, User } from '../types';

export function useReviews(user: User | null) {
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
    }).catch(() => { /* silent fail, will retry next login */ });
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
          bourbonId: newReview.bourbonId,
          rating: newReview.rating,
          text: newReview.text,
          nose: newReview.nose || '',
          palate: newReview.palate || '',
          finish: newReview.finish || '',
          tags: newReview.tags || [],
          userName: user.name,
          userPicture: user.picture,
        }),
      }).catch(() => { /* localStorage is the fallback */ });
    }
  }, [user]);

  const editReview = useCallback((reviewId: string, updates: { rating?: number; text?: string }) => {
    setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, ...updates } : r));

    if (user) {
      fetch('/api/social?scope=reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
        body: JSON.stringify({ reviewId, ...updates }),
      }).catch(() => {});
    }
  }, [user]);

  const deleteReview = useCallback((reviewId: string) => {
    setReviews(prev => prev.filter(r => r.id !== reviewId));

    if (user) {
      fetch(`/api/social?scope=reviews&reviewId=${reviewId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': user.id },
      }).catch(() => {});
    }
  }, [user]);

  const getReviewsForBourbon = useCallback((id: string): Review[] => {
    return reviews.filter(r => r.bourbonId === id);
  }, [reviews]);

  return { reviews, addReview, editReview, deleteReview, getReviewsForBourbon };
}
