"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Star, Trash2, Info } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface UserRating {
  id: string;
  score: number;
  createdAt: string;
  raterUser: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface UserRatingsProps {
  userId: string;
  isOwnProfile: boolean;
  currentUserId: string | undefined;
}

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

export default function UserRatings({ userId, isOwnProfile, currentUserId }: UserRatingsProps) {
  const { data: session } = useSession();
  const [ratings, setRatings] = useState<UserRating[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newRating, setNewRating] = useState<number>(5);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);
  
  // Check if the current user has already rated
  const currentUserRating = ratings.find(rating => rating.raterUser.id === currentUserId);
  const canAddRating = !!currentUserId; // Allow rating own profile
  const isEditingRating = !!currentUserRating;

  useEffect(() => {
    fetchRatings();
  }, [userId]);

  const fetchRatings = async () => {
    setIsLoading(true);
    try {
      // Check if we have cached ratings for this userId
      const now = Date.now();
      const cacheKey = `ratings-${userId}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        const { ratings: cachedRatings, timestamp } = JSON.parse(cachedData);
        
        // If the cache is still valid (less than CACHE_DURATION old)
        if (now - timestamp < CACHE_DURATION) {
          setRatings(cachedRatings);
          setLastFetchTime(timestamp);
          setIsLoading(false);
          return;
        }
      }
      
      // If no valid cache, fetch from API
      const response = await fetch(`/api/users/ratings?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch ratings");
      }
      
      const data = await response.json();
      
      // Cache the result
      localStorage.setItem(
        cacheKey, 
        JSON.stringify({
          ratings: data.ratings,
          timestamp: now
        })
      );
      
      setRatings(data.ratings);
      setLastFetchTime(now);
    } catch (error) {
      console.error("Error fetching ratings:", error);
      toast.error("Failed to load ratings");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to force refresh the ratings (ignoring cache)
  const refreshRatings = () => {
    // Remove the cache for this userId
    localStorage.removeItem(`ratings-${userId}`);
    // Fetch fresh data
    fetchRatings();
  };

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user?.id) {
      toast.error("You must be logged in to rate");
      return;
    }
    
    setSubmitting(true);
    
    try {
      const response = await fetch("/api/users/ratings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          score: newRating,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to post rating");
      }
      
      // Refresh the ratings list
      refreshRatings();
      setNewRating(5);
      
      toast.success(isEditingRating ? "Rating updated" : "Rating submitted");
    } catch (error: unknown) {
      console.error("Error submitting rating:", error);
      toast.error(error instanceof Error ? error.message : "Failed to submit rating");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRating = async (ratingId: string, raterUserId: string) => {
    if (!session?.user?.id) {
      toast.error("You must be logged in to delete your rating");
      return;
    }
    
    // Check if the user is trying to delete someone else's rating
    if (session.user.id !== raterUserId) {
      toast.error("You can only delete your own ratings");
      return;
    }
    
    setDeleting(ratingId);
    
    try {
      const response = await fetch(`/api/users/ratings/${ratingId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete rating");
      }
      
      // Update local state
      setRatings(ratings.filter(r => r.id !== ratingId));
      
      // Update the cache
      const updatedRatings = ratings.filter(r => r.id !== ratingId);
      const cacheKey = `ratings-${userId}`;
      localStorage.setItem(
        cacheKey, 
        JSON.stringify({
          ratings: updatedRatings,
          timestamp: lastFetchTime || Date.now()
        })
      );
      
      toast.success("Rating deleted");
    } catch (error: unknown) {
      console.error("Error deleting rating:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete rating");
    } finally {
      setDeleting(null);
    }
  };

  // Format date to be more readable
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-6">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Rating Form */}
      {canAddRating && (
        <Card className="mb-3">
          <CardContent className="p-3">
            <form onSubmit={handleSubmitRating}>
              <div className="flex items-center gap-2">
                <Label htmlFor="rating" className="text-sm shrink-0">
                  {isOwnProfile ? "Rate:" : "Rating:"}
                </Label>
                <Slider
                  id="rating"
                  min={1}
                  max={10}
                  step={1}
                  value={[newRating]}
                  onValueChange={(values) => setNewRating(values[0])}
                  className="flex-1 mx-1"
                />
                <span className="font-medium min-w-[1.5rem] text-center">{newRating}</span>
                <Button 
                  type="submit" 
                  size="sm"
                  disabled={submitting}
                  className="ml-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      <span className="sr-only">Saving</span>
                    </>
                  ) : isEditingRating ? "Update" : "Rate"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* List of Recent Ratings */}
      {ratings.length > 0 && (
        <div className="text-sm text-muted-foreground mb-1 flex justify-between">
          <span>Recent Ratings</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3 w-3" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Users can only delete their own ratings</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
      
      {ratings.length === 0 ? (
        <div className="text-center py-2 text-sm text-muted-foreground">
          No ratings yet
        </div>
      ) : (
        <div className="space-y-2">
          {ratings.slice(0, 10).map((rating) => (
            <div 
              key={rating.id} 
              className="flex items-center gap-2 p-2 rounded-md border text-sm"
            >
              <Link href={`/users/${rating.raterUser.id}`}>
                <Avatar className="h-6 w-6">
                  <AvatarImage 
                    src={rating.raterUser.image || ""} 
                    alt={rating.raterUser.name || "User"} 
                  />
                  <AvatarFallback className="text-xs">
                    {rating.raterUser.name
                      ? rating.raterUser.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                      : "U"}
                  </AvatarFallback>
                </Avatar>
              </Link>
              
              <div className="flex-1 flex items-center justify-between min-w-0">
                <div className="truncate">
                  <Link 
                    href={`/users/${rating.raterUser.id}`}
                    className="hover:underline font-medium"
                  >
                    {rating.raterUser.name || "Anonymous"}
                  </Link>
                  <span className="text-xs text-muted-foreground ml-2">
                    {formatDate(rating.createdAt)}
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 font-medium">
                    {rating.score}
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  </div>
                  
                  {currentUserId === rating.raterUser.id && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRating(rating.id, rating.raterUser.id)}
                            disabled={deleting === rating.id}
                            className="h-6 w-6 p-0"
                          >
                            {deleting === rating.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3 text-destructive" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Delete your rating</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 