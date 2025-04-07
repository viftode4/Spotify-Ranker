"use client";

import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { AlbumCard } from "@/components/AlbumCard";
import { AddAlbumDialog } from "@/components/AddAlbumDialog";
import { AlbumFilter } from "@/components/AlbumFilter";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { toast } from "sonner";
import { useAlbumCache, AlbumWithRatings } from "@/hooks/useAlbumCache";

export default function AlbumsPage() {
  const { data: session } = useSession();
  const { 
    albums, 
    isLoading, 
    error, 
    addAlbum: addAlbumToCache, 
    rateAlbum: rateAlbumInCache, 
    deleteAlbum: deleteAlbumFromCache 
  } = useAlbumCache();

  const [filteredAlbums, setFilteredAlbums] = useState<AlbumWithRatings[]>([]);
  const [uniqueArtists, setUniqueArtists] = useState<string[]>([]);

  // Update filtered albums and unique artists when albums change
  useEffect(() => {
    if (albums.length > 0) {
      setFilteredAlbums(albums);
      
      // Extract unique artists
      const artists = Array.from(new Set(albums.map((album: AlbumWithRatings) => album.artist)));
      setUniqueArtists(artists as string[]);
    }
  }, [albums]);

  // Show error toast if API fetch fails
  useEffect(() => {
    if (error) {
      toast.error(error || "Failed to fetch albums");
    }
  }, [error]);

  // Add album
  const handleAddAlbum = async (spotifyId: string) => {
    try {
      await addAlbumToCache(spotifyId);
      toast.success("Album added successfully!");
    } catch (error: unknown) {
      const err = error as Error;
      console.error("Error adding album:", err);
      toast.error(err.message || "Failed to add album");
      throw err;
    }
  };

  // Rate album
  const handleRateAlbum = async (albumId: string, score: number) => {
    try {
      await rateAlbumInCache(albumId, score);
    } catch (error: unknown) {
      const err = error as Error;
      console.error("Error rating album:", err);
      toast.error(err.message || "Failed to rate album");
      throw err;
    }
  };

  // Delete album
  const handleDeleteAlbum = async (albumId: string) => {
    try {
      await deleteAlbumFromCache(albumId);
    } catch (error: unknown) {
      const err = error as Error;
      console.error("Error deleting album:", err);
      toast.error(err.message || "Failed to delete album");
      throw err;
    }
  };

  // Filter albums
  const handleFilterAlbums = (filters: {
    search: string;
    artist: string;
    minRating: number;
    maxRating: number;
  }) => {
    const filtered = albums.filter((album) => {
      // Filter by search text
      const matchesSearch =
        !filters.search ||
        album.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        album.artist.toLowerCase().includes(filters.search.toLowerCase());

      // Filter by artist
      const matchesArtist = !filters.artist || album.artist === filters.artist;

      // Filter by rating range
      let avgRating = 0;
      if (album.ratings.length > 0) {
        avgRating =
          album.ratings.reduce((acc, rating) => acc + rating.score, 0) /
          album.ratings.length;
      }
      
      const matchesRating =
        avgRating >= filters.minRating && avgRating <= filters.maxRating;

      return matchesSearch && matchesArtist && matchesRating;
    });

    setFilteredAlbums(filtered);
  };

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] px-4 text-center">
        <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Sign in to rank Spotify albums</h1>
        <Button 
          size="lg" 
          onClick={() => signIn('spotify')} 
          className="flex items-center gap-2 hover-lift"
        >
          <LogIn className="h-4 w-4 sm:h-5 sm:w-5" />
          Sign in with Spotify
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <p className="text-base sm:text-lg">Loading albums...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between gap-3 items-start sm:items-center">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Spotify Albums</h1>
        <AddAlbumDialog onAddAlbum={handleAddAlbum} />
      </div>

      <AlbumFilter artists={uniqueArtists} onFilter={handleFilterAlbums} />

      {filteredAlbums.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          <p className="text-base sm:text-lg text-muted-foreground mb-4">No albums found</p>
          <AddAlbumDialog onAddAlbum={handleAddAlbum} />
        </div>
      ) : (
        <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
          {filteredAlbums.map((album) => (
            <AlbumCard
              key={album.id}
              album={album}
              userRating={album.ratings?.find?.(r => r.userId === session.user.id)}
              userId={session.user.id}
              onRateAlbum={handleRateAlbum}
              onDeleteAlbum={handleDeleteAlbum}
            />
          ))}
        </div>
      )}
    </div>
  );
} 