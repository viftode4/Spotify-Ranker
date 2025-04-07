"use client";

import { useState, useEffect } from "react";
import { Loader2, Star, MessageSquare, Music } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

interface Rating {
  id: string;
  score: number;
  createdAt: string;
  album: {
    id: string;
    name: string;
    artist: string;
    imageUrl: string;
  };
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  isHidden?: boolean;
  album: {
    id: string;
    name: string;
    artist: string;
    imageUrl: string;
  };
}

interface ActivityItem {
  id: string;
  type: "rating" | "comment";
  createdAt: string;
  content: Rating | Comment;
}

interface UserActivityProps {
  userId: string;
  isOwnProfile: boolean;
  currentUserId: string | undefined;
}

// Cache structure to store user activity data
interface ActivityCache {
  [userId: string]: {
    data: ActivityItem[];
    timestamp: number;
  };
}

// Initialize cache object
const activityCache: ActivityCache = {};

// Cache expiration time in milliseconds (5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000;

export default function UserActivity({ userId, isOwnProfile }: UserActivityProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<"all" | "ratings" | "comments">("all");

  useEffect(() => {
    fetchUserActivity();
  }, [userId]);

  const fetchUserActivity = async () => {
    setIsLoading(true);
    try {
      // Check if we have cached data that's still valid
      const cachedData = activityCache[userId];
      const now = Date.now();
      
      if (cachedData && (now - cachedData.timestamp < CACHE_EXPIRATION)) {
        // Use cached data if it's still valid
        setActivities(cachedData.data);
        setIsLoading(false);
        return;
      }

      // Fetch fresh data if no cache or cache expired
      const response = await fetch(`/api/users/activity?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch user activity");
      }
      
      const data = await response.json();
      const activitiesData = data.activities || [];
      
      // Update the state
      setActivities(activitiesData);
      
      // Update the cache
      activityCache[userId] = {
        data: activitiesData,
        timestamp: now
      };
    } catch (error) {
      console.error("Error fetching user activity:", error);
      toast.error("Failed to load activity");
    } finally {
      setIsLoading(false);
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

  const filteredActivities = activities.filter(activity => {
    // Filter out hidden comments
    if (activity.type === "comment") {
      const comment = activity.content as Comment;
      if (comment.isHidden) {
        return false;
      }
    }
    
    // Apply view filter
    if (activeView === "all") return true;
    if (activeView === "ratings") return activity.type === "rating";
    if (activeView === "comments") return activity.type === "comment";
    return false;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-6">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          {isOwnProfile ? "Your Activity" : "User Activity"}
        </h2>
        
        <div className="flex text-xs bg-muted/50 rounded-md overflow-hidden">
          <button 
            onClick={() => setActiveView("all")} 
            className={`px-3 py-1.5 ${activeView === "all" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
          >
            All
          </button>
          <button 
            onClick={() => setActiveView("ratings")} 
            className={`px-3 py-1.5 ${activeView === "ratings" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
          >
            Ratings
          </button>
          <button 
            onClick={() => setActiveView("comments")} 
            className={`px-3 py-1.5 ${activeView === "comments" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
          >
            Comments
          </button>
        </div>
      </div>

      {filteredActivities.length === 0 ? (
        <Card className="p-6">
          <div className="text-center py-8 space-y-4">
            <div className="flex justify-center">
              {activeView === "ratings" ? (
                <Star className="h-12 w-12 text-muted-foreground opacity-30" />
              ) : activeView === "comments" ? (
                <MessageSquare className="h-12 w-12 text-muted-foreground opacity-30" />
              ) : (
                <Music className="h-12 w-12 text-muted-foreground opacity-30" />
              )}
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium">No {activeView === "all" ? "activity" : activeView} found</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {isOwnProfile ? (
                  <>{activeView === "ratings" ? "You haven't rated any albums yet. Start exploring and rating albums!" : 
                     activeView === "comments" ? "You haven't left any comments yet. Share your thoughts on albums you've listened to!" :
                     "You don't have any activity yet. Start exploring albums, rating them, and leaving comments!"}</>
                ) : (
                  <>This user hasn&apos;t {activeView === "ratings" ? "rated any albums" : 
                                      activeView === "comments" ? "left any comments" : 
                                      "any activity"} yet.</>
                )}
              </p>
              {isOwnProfile && (
                <Button asChild className="mt-4">
                  <Link href="/">Explore Albums</Link>
                </Button>
              )}
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredActivities.map((activity) => (
            <ActivityCard 
              key={activity.id} 
              activity={activity} 
              formatDate={formatDate} 
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ActivityCardProps {
  activity: ActivityItem;
  formatDate: (date: string) => string;
}

function ActivityCard({ activity, formatDate }: ActivityCardProps) {
  const isRating = activity.type === "rating";
  const isComment = activity.type === "comment";
  
  if (isRating) {
    const rating = activity.content as Rating;
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0 w-16 h-16">
              <img 
                src={rating.album.imageUrl || "/placeholder-album.png"} 
                alt={rating.album.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="flex-grow">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                <span className="font-medium">Rated an album</span>
                <span className="text-sm text-muted-foreground">{formatDate(rating.createdAt)}</span>
              </div>
              
              <Link 
                href={`/album/${rating.album.id}`}
                className="font-medium hover:underline mt-1 block"
              >
                {rating.album.name}
              </Link>
              
              <p className="text-sm text-muted-foreground">{rating.album.artist}</p>
              
              <div className="mt-2 flex items-center gap-1">
                <span className="font-semibold">{rating.score}</span>
                <span className="text-yellow-500">★</span>
                <span className="text-sm text-muted-foreground">out of 10</span>
              </div>
            </div>
            
            <Button asChild size="sm" variant="outline" className="flex-shrink-0">
              <Link href={`/album/${rating.album.id}`}>
                View Album
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (isComment) {
    const comment = activity.content as Comment;
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0 w-16 h-16">
              <img 
                src={comment.album.imageUrl || "/placeholder-album.png"} 
                alt={comment.album.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="flex-grow">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-500" />
                <span className="font-medium">Commented on an album</span>
                <span className="text-sm text-muted-foreground">{formatDate(comment.createdAt)}</span>
              </div>
              
              <Link 
                href={`/album/${comment.album.id}`}
                className="font-medium hover:underline mt-1 block"
              >
                {comment.album.name}
              </Link>
              
              <p className="text-sm text-muted-foreground">{comment.album.artist}</p>
              
              <div className="mt-2 p-2 bg-muted/50 rounded-md">
                <p className="text-sm">{comment.content}</p>
              </div>
            </div>
            
            <Button asChild size="sm" variant="outline" className="flex-shrink-0">
              <Link href={`/album/${comment.album.id}`}>
                View Album
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return null;
} 