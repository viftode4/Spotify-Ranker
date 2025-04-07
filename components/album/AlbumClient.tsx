"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Album } from "./types";
import { AlbumHeader } from "./AlbumHeader";
import { AlbumRating } from "./AlbumRating";
import { TrackList } from "./TrackList";
import { AlbumComments } from "./AlbumComments";

interface AlbumClientProps {
  albumId: string;
}

export function AlbumClient({ albumId }: AlbumClientProps) {
  const { data: session } = useSession();
  const [album, setAlbum] = useState<Album | null>(null);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAlbum = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/albums/${albumId}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch album");
        }
        
        const data = await response.json();
        setAlbum(data);
        
        // Set user rating if exists
        if (session?.user?.id && data.ratings) {
          const userRating = data.ratings.find(
            (r) => r.userId === session.user.id
          );
          if (userRating) {
            setUserRating(userRating.score);
          }
        }
      } catch (error) {
        console.error("Error fetching album:", error);
        toast.error("Failed to fetch album details");
      } finally {
        setIsLoading(false);
      }
    };

    if (albumId) {
      fetchAlbum();
    }
  }, [albumId, session]);

  const handleRatingUpdate = (updatedAlbum: Album, score: number) => {
    setAlbum(updatedAlbum);
    setUserRating(score);
  };

  const handleUpdateAlbum = (updatedAlbum: Album) => {
    setAlbum(updatedAlbum);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p>Loading album...</p>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p>Album not found</p>
      </div>
    );
  }

  // Calculate average rating
  const totalRatings = album.ratings.length;
  const averageRating = totalRatings > 0
    ? album.ratings.reduce((acc, rating) => acc + rating.score, 0) / totalRatings
    : 0;

  return (
    <div className="grid md:grid-cols-[300px_1fr] gap-6">
      <div>
        <AlbumHeader 
          album={album} 
          averageRating={averageRating} 
          totalRatings={totalRatings} 
        />
        
        {session?.user && (
          <AlbumRating 
            album={album} 
            userRating={userRating} 
            userId={session.user.id} 
            onRatingUpdate={handleRatingUpdate} 
          />
        )}
      </div>
      
      <div>
        <TrackList tracks={album.tracks} />
        
        <AlbumComments 
          album={album} 
          userId={session?.user?.id} 
          onUpdateAlbum={handleUpdateAlbum} 
        />
      </div>
    </div>
  );
} 