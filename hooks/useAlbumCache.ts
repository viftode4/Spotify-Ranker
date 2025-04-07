import { useState, useEffect } from "react";
import { Album, Rating } from "@prisma/client";
import { getCachedItem, setCachedItem, DEFAULT_TTL } from "@/lib/cache";

// Type definition for album with ratings - ensuring compatibility with the app's types
export interface AlbumWithRatings extends Album {
  ratings: Rating[];
  releaseDate?: string; // Making sure this is string | undefined, not string | null
}

// Cache key
const ALBUMS_CACHE_KEY = "cached_albums";

/**
 * Custom hook to fetch and cache albums with localStorage
 * @param ttl Time to live for cache in milliseconds
 */
export function useAlbumCache(ttl = DEFAULT_TTL) {
  const [albums, setAlbums] = useState<AlbumWithRatings[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlbumsFromAPI = async (): Promise<AlbumWithRatings[]> => {
    const response = await fetch("/api/albums");
    if (!response.ok) {
      throw new Error("Failed to fetch albums");
    }
    return await response.json();
  };

  const fetchAlbums = async (force = false) => {
    try {
      setIsLoading(true);
      
      // Check cache first if not forced refresh
      if (!force) {
        const cachedAlbums = getCachedItem<AlbumWithRatings[]>(ALBUMS_CACHE_KEY, ttl);
        if (cachedAlbums) {
          setAlbums(cachedAlbums);
          setIsLoading(false);
          return;
        }
      }
      
      // Fetch fresh data
      const data = await fetchAlbumsFromAPI();
      
      // Update state
      setAlbums(data);
      
      // Cache the result
      setCachedItem(ALBUMS_CACHE_KEY, data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching albums:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to manually refresh data
  const refreshAlbums = () => fetchAlbums(true);

  // Function to add a new album and update cache
  const addAlbum = async (spotifyId: string) => {
    try {
      const response = await fetch("/api/albums", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ spotifyId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add album");
      }

      const newAlbum = await response.json();
      // Ensure the album has a ratings array
      const albumWithRatings = {
        ...newAlbum,
        ratings: newAlbum.ratings || [],
      };
      
      // Update state
      const updatedAlbums = [albumWithRatings, ...albums];
      setAlbums(updatedAlbums);
      
      // Update cache
      setCachedItem(ALBUMS_CACHE_KEY, updatedAlbums);
      
      return albumWithRatings;
    } catch (error) {
      const err = error as Error;
      throw err;
    }
  };

  // Function to rate an album and update cache
  const rateAlbum = async (albumId: string, score: number) => {
    try {
      const response = await fetch("/api/ratings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ albumId, score }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to rate album");
      }

      const newRating = await response.json();
      
      // Update albums with new rating
      const updatedAlbums = albums.map((album) => {
        if (album.id === albumId) {
          // Remove existing rating by this user if it exists
          const filteredRatings = album.ratings.filter(
            (r) => r.userId !== newRating.userId
          );
          
          return {
            ...album,
            ratings: [...filteredRatings, newRating],
          };
        }
        return album;
      });
      
      // Update state
      setAlbums(updatedAlbums);
      
      // Update cache
      setCachedItem(ALBUMS_CACHE_KEY, updatedAlbums);
      
      return newRating;
    } catch (error) {
      const err = error as Error;
      throw err;
    }
  };

  // Function to delete an album and update cache
  const deleteAlbum = async (albumId: string) => {
    try {
      const response = await fetch(`/api/albums/${albumId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete album");
      }

      // Remove album from state
      const updatedAlbums = albums.filter((album) => album.id !== albumId);
      setAlbums(updatedAlbums);
      
      // Update cache
      setCachedItem(ALBUMS_CACHE_KEY, updatedAlbums);
      
      return true;
    } catch (error) {
      const err = error as Error;
      throw err;
    }
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchAlbums();
  }, []);

  return {
    albums,
    isLoading,
    error,
    refreshAlbums,
    addAlbum,
    rateAlbum,
    deleteAlbum
  };
} 