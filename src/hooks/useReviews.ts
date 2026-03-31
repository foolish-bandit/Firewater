import { useState, useEffect, useCallback } from 'react';
import { Review, User } from '../types';

export function useReviews(user: User | null) {
  const [reviews, setReviews] = useState<Review[]>([]);

  // Load from localStorage
  useEffect(() => {
    const savedReviews = localStorage.getItem('bs_reviews');
    if (savedReviews) setReviews(JSON.parse(savedReviews));
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('bs_reviews', JSON.stringify(reviews));
  }, [reviews]);

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
  }, [user]);

  const getReviewsForBourbon = useCallback((id: string): Review[] => {
    return reviews.filter(r => r.bourbonId === id);
  }, [reviews]);

  return { reviews, addReview, getReviewsForBourbon };
}
