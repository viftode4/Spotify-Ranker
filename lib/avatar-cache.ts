import { cache } from 'react';

interface UserAvatarData {
  id: string;
  name: string | null;
  image: string | null;
  averageRating: number | null;
  ratingCount: number;
  flairs: string[];
}

// Cache the avatar data for 5 minutes
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// In-memory cache
const avatarCache = new Map<string, { data: UserAvatarData; timestamp: number }>();

export const getAvatarData = async (userId: string): Promise<UserAvatarData> => {
  // Check if we have cached data that's still valid
  const cached = avatarCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  // Fetch fresh data
  const response = await fetch(`/api/users/avatar?userId=${userId}`, {
    next: { revalidate: 300 } // Revalidate every 5 minutes
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch avatar data');
  }
  
  const data = await response.json();
  
  // Update cache
  avatarCache.set(userId, {
    data,
    timestamp: Date.now()
  });
  
  return data;
}; 