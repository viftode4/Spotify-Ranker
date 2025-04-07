export interface User {
  id: string;
  name?: string;
  image?: string;
  topRating?: {
    id: string;
    score: number;
    comment: string;
    votes: number;
    raterUser: {
      id: string;
      name: string;
      image: string;
    };
  } | null;
}

export interface Rating {
  id: string;
  score: number;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  albumId: string;
  user: User;
}

export interface Track {
  id: string;
  name: string;
  duration: number;
  number: number;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  isHidden: boolean;
  userId: string;
  albumId: string;
  user: User;
}

export interface Album {
  id: string;
  spotifyId: string;
  name: string;
  artist: string;
  imageUrl: string;
  releaseDate?: string;
  createdAt: Date;
  updatedAt: Date;
  ratings: Rating[];
  comments: Comment[];
  tracks: Track[];
} 