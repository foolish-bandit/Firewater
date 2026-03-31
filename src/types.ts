export type ViewState = 'home' | 'catalog' | 'detail' | 'lists';

export interface User {
  id: string;
  email: string;
  name: string;
  picture: string;
}

export interface Review {
  id: string;
  bourbonId: string;
  rating: number;
  text: string;
  date: string;
  userId?: string;
  userName?: string;
  userPicture?: string;
}
