import { useState, useEffect } from "react";
import { AlbumWithRatings } from "./useAlbumCache";
import { getCachedItem, setCachedItem, DEFAULT_TTL } from "@/lib/cache";

interface TierGroup {
  name: string;
  min: number;
  max: number;
  color: string;
  albums: (AlbumWithRatings & { averageRating: number })[];
}

// Cache key
const TIERLIST_CACHE_KEY = "cached_tierlist";

// Define tier ranges - same as in TierList component
const tiers = [
  { name: "S", min: 9, max: 10, color: "bg-red-500" },
  { name: "A", min: 8, max: 8.9, color: "bg-orange-500" },
  { name: "B", min: 7, max: 7.9, color: "bg-yellow-500" },
  { name: "C", min: 6, max: 6.9, color: "bg-green-500" },
  { name: "D", min: 5, max: 5.9, color: "bg-blue-500" },
  { name: "E", min: 3, max: 4.9, color: "bg-indigo-500" },
  { name: "F", min: 0, max: 2.9, color: "bg-purple-500" },
];

/**
 * Custom hook to fetch and cache tier list data with localStorage
 * @param ttl Time to live for cache in milliseconds
 */
export function useTierListCache(ttl = DEFAULT_TTL) {
  const [tierGroups, setTierGroups] = useState<TierGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlbumsFromAPI = async (): Promise<AlbumWithRatings[]> => {
    const response = await fetch("/api/albums");
    if (!response.ok) {
      throw new Error("Failed to fetch albums");
    }
    return await response.json();
  };

  const calculateTierGroups = (albums: AlbumWithRatings[]): TierGroup[] => {
    // Only include albums that have at least one rating
    const albumsWithRatings = albums.filter(album => album.ratings.length > 0);
    
    // Calculate average ratings
    const albumsWithAverageRatings = albumsWithRatings.map(album => {
      const totalRatings = album.ratings.length;
      const averageRating = totalRatings > 0
        ? album.ratings.reduce((acc, rating) => acc + rating.score, 0) / totalRatings
        : 0;
      
      return {
        ...album,
        averageRating
      };
    });
    
    // Create tier groups
    return tiers.map(tier => {
      const tierAlbums = albumsWithAverageRatings.filter(
        album => album.averageRating >= tier.min && album.averageRating <= tier.max
      );
      
      return {
        ...tier,
        albums: tierAlbums
      };
    });
  };

  const fetchTierList = async (force = false) => {
    try {
      setIsLoading(true);
      
      // Check cache first if not forced refresh
      if (!force) {
        const cachedTierGroups = getCachedItem<TierGroup[]>(TIERLIST_CACHE_KEY, ttl);
        if (cachedTierGroups) {
          setTierGroups(cachedTierGroups);
          setIsLoading(false);
          return;
        }
      }
      
      // Fetch fresh data
      const albums = await fetchAlbumsFromAPI();
      const groups = calculateTierGroups(albums);
      
      // Update state
      setTierGroups(groups);
      
      // Cache the result
      setCachedItem(TIERLIST_CACHE_KEY, groups);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching tier list:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to manually refresh data
  const refreshTierList = () => fetchTierList(true);

  // Initial fetch on component mount
  useEffect(() => {
    fetchTierList();
  }, []);

  return {
    tierGroups,
    isLoading,
    error,
    refreshTierList
  };
} 