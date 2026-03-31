export type ViewState = 'home' | 'catalog' | 'detail' | 'lists';

export interface User {
  id: string;
  email: string;
  name: string;
  picture: string;
  display_name?: string;
  avatar_icon?: string;
  phone?: string;
  authProvider?: 'google' | 'email' | 'phone';
}

export interface Review {
  id: string;
  liquorId: string;
  rating: number;
  text: string;
  date: string;
  userId?: string;
  userName?: string;
  userPicture?: string;
  nose?: string;
  palate?: string;
  finish?: string;
  tags?: string[];
}

export interface UserProfile {
  id: string;
  name: string;
  picture: string;
  display_name?: string;
  avatar_icon?: string;
  bio: string;
  favorite_spirit: string;
  is_public: boolean;
  top_shelf: string[];
  created_at: string;
  following_count: number;
  follower_count: number;
  review_count: number;
  tried_count: number;
  want_count: number;
  avg_rating: number | null;
  is_following: boolean;
  is_own: boolean;
}

export interface UserSearchResult {
  id: string;
  name: string;
  picture: string;
  display_name?: string;
  avatar_icon?: string;
  bio: string;
  is_public: boolean;
  follower_count: number;
  review_count: number;
  tried_count: number;
}
