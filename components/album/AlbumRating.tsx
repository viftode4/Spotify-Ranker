import { useState } from "react";
import { toast } from "sonner";
import { Album } from "./types";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

interface AlbumRatingProps {
  album: Album;
  userRating: number | null;
  userId: string;
  onRatingUpdate: (album: Album, score: number) => void;
}

export function AlbumRating({ album, userRating, userId, onRatingUpdate }: AlbumRatingProps) {
  const [isRating, setIsRating] = useState(false);
  const [currentRating, setCurrentRating] = useState<number>(userRating || 5);

  const handleRateAlbum = async () => {
    if (!userId || !album) return;
    
    try {
      setIsRating(true);
      const response = await fetch("/api/ratings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ albumId: album.id, score: currentRating }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to rate album");
      }

      // Update local album state with new rating
      const updatedAlbum = { ...album };
      const userRatingIndex = updatedAlbum.ratings.findIndex(
        (r) => r.userId === userId
      );
      
      if (userRatingIndex >= 0) {
        updatedAlbum.ratings[userRatingIndex].score = currentRating;
      } else {
        // If no existing rating, add a new one
        const newRating = await response.json();
        updatedAlbum.ratings.push(newRating);
      }
      
      onRatingUpdate(updatedAlbum, currentRating);
      toast.success(`Rated "${album.name}" with a score of ${currentRating}`);
    } catch (error: unknown) {
      console.error("Error rating album:", error);
      toast.error(error instanceof Error ? error.message : "Failed to rate album");
    } finally {
      setIsRating(false);
    }
  };

  return (
    <div className="mt-6">
      <p className="font-medium mb-2">Your Rating</p>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Slider
            value={[currentRating]}
            min={1}
            max={10}
            step={1}
            disabled={isRating}
            onValueChange={(value) => setCurrentRating(value[0])}
            className="w-full"
          />
          <span className="font-medium w-8 text-center">{currentRating}</span>
        </div>
        <Button 
          onClick={handleRateAlbum} 
          disabled={isRating}
          className="w-full"
        >
          {userRating ? "Update Rating" : "Submit Rating"}
        </Button>
      </div>
    </div>
  );
} 