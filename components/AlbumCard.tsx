"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, StarHalf } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Rating {
  id: string;
  score: number;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  albumId: string;
}

interface Album {
  id: string;
  spotifyId: string;
  name: string;
  artist: string;
  imageUrl: string;
  releaseDate?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface AlbumCardProps {
  album: Album & { ratings: Rating[] };
  userRating?: Rating;
  userId?: string;
  onRateAlbum: (albumId: string, score: number) => Promise<void>;
}

export function AlbumCard({ 
  album,
  userRating,
  userId,
  onRateAlbum,
}: AlbumCardProps) {
  const router = useRouter();
  const [isRating, setIsRating] = useState(false);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  
  // Calculate average rating
  const totalRatings = album.ratings.length;
  const averageRating = totalRatings > 0
    ? album.ratings.reduce((acc: number, rating: Rating) => acc + rating.score, 0) / totalRatings
    : 0;

  const handleRateAlbum = async (score: number) => {
    if (!userId) return;
    
    try {
      setIsRating(true);
      await onRateAlbum(album.id, score);
      toast.success(`Rated "${album.name}" ${score}/10`);
      setShowRatingDialog(false);
    } catch (error) {
      toast.error("Failed to rate album");
      console.error(error);
    } finally {
      setIsRating(false);
    }
  };

  const handleCardClick = () => {
    router.push(`/album/${album.id}`);
  };

  const toggleRatingDialog = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowRatingDialog(!showRatingDialog);
  };

  return (
    <>
      <Card 
        className="group relative h-full overflow-hidden hover:shadow-md transition-all duration-300"
      >
        {/* Album Cover with Overlay */}
        <div 
          className="relative aspect-square cursor-pointer"
          onClick={handleCardClick}
        >
          <div className="relative w-full h-full rounded-md overflow-hidden p-4">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-[90%] h-[90%] flex items-center justify-center">
                <Image
                  src={album.imageUrl || "/placeholder-album.png"}
                  alt={album.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-contain transition-transform duration-300 group-hover:scale-105"
                  priority={true}
                />
              </div>
            </div>
            
            {/* Info Overlay (visible on hover) */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
              <h3 className="font-medium text-white truncate text-sm">{album.name}</h3>
              <p className="text-xs text-white/80 truncate">{album.artist}</p>
              {album.releaseDate && (
                <p className="text-xs text-white/60">
                  {new Date(album.releaseDate).getFullYear()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Album Info and Rating Section */}
        <CardContent className="p-3">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate text-sm">{album.name}</h3>
              <p className="text-xs text-muted-foreground truncate">{album.artist}</p>
            </div>
            
            {userId && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-full"
                onClick={toggleRatingDialog}
              >
                {userRating ? (
                  <div className="relative">
                    <Star className="h-4 w-4 fill-primary text-primary" />
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-primary-foreground">
                      {userRating.score}
                    </span>
                  </div>
                ) : (
                  <StarHalf className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
          
          {/* Rating Info */}
          <div className="mt-1 flex items-center text-xs text-muted-foreground">
            <Star className="h-3 w-3 mr-1 inline" />
            <span>{averageRating.toFixed(1)}</span>
            <span className="mx-1">•</span>
            <span>{totalRatings} {totalRatings === 1 ? "rating" : "ratings"}</span>
          </div>
        </CardContent>
      </Card>

      {/* Rating Dialog */}
      <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rate {album.name}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="flex flex-wrap gap-2 justify-center">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((score) => (
                <Button
                  key={score}
                  variant={userRating?.score === score ? "default" : "outline"}
                  size="lg"
                  className={cn(
                    "h-12 w-12 text-lg",
                    hoverRating && score <= hoverRating && "bg-primary/20" 
                  )}
                  disabled={isRating}
                  onClick={() => handleRateAlbum(score)}
                  onMouseEnter={() => setHoverRating(score)}
                  onMouseLeave={() => setHoverRating(null)}
                >
                  {score}
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 