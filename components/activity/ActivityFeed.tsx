"use client";

import { useState, useEffect } from "react";
import { Loader2, Star, MessageSquare, Music } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ActivityCard } from "./ActivityCard";

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
  user: {
    id: string;
    name: string | null;
    image: string | null;
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
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface ActivityItem {
  id: string;
  type: "rating" | "comment";
  createdAt: string;
  content: Rating | Comment;
}

interface ActivityFeedProps {
  // Not currently used, but kept for future features like highlighting the current user's activities
  currentUserId?: string;
}

// Cache structure to store activity data
interface ActivityCache {
  data: ActivityItem[];
  timestamp: number;
}

// Initialize cache object
let activityCache: ActivityCache | null = null;

// Cache expiration time in milliseconds (5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function ActivityFeed({ currentUserId }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<"all" | "ratings" | "comments">("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const itemsPerPage = 20;
  
  // Reset state when activeView changes
  useEffect(() => {
    setActivities([]);
    setPage(1);
    setHasMore(true);
    fetchActivity();
  }, [activeView]);
  
  // Clear cache when unmounting
  useEffect(() => {
    return () => {
      activityCache = null;
    };
  }, []);

  const fetchActivity = async (loadMore = false) => {
    if (loadMore) {
      setIsLoading(true);
    } else {
      setPage(1);
      setActivities([]);
      setIsLoading(true);
    }

    const currentPage = loadMore ? page + 1 : 1;
    
    try {
      // Only use cache for "all" view on first page
      const now = Date.now();
      if (!loadMore && 
          currentPage === 1 && 
          activeView === "all" && 
          activityCache && 
          (now - activityCache.timestamp < CACHE_EXPIRATION)) {
        // Use cached data if it's still valid
        setActivities(activityCache.data);
        setIsLoading(false);
        setPage(1);
        setHasMore(activityCache.data.length >= itemsPerPage);
        return;
      }

      // Fetch fresh data 
      let apiUrl = `/api/activity?page=${currentPage}&limit=${itemsPerPage}`;
      
      if (activeView !== "all") {
        apiUrl += `&type=${activeView}`;
      }
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error("Failed to fetch activity");
      }
      
      const data = await response.json();
      const newActivities = data.activities || [];
      
      // Update the state
      if (loadMore) {
        setActivities(prev => [...prev, ...newActivities]);
        setPage(currentPage);
      } else {
        setActivities(newActivities);
        setPage(1);
        
        // Update the cache for first page of "all" view only
        if (currentPage === 1 && activeView === "all") {
          activityCache = {
            data: newActivities,
            timestamp: now
          };
        }
      }
      
      // Check if there might be more items
      setHasMore(newActivities.length >= itemsPerPage);
      
    } catch (error) {
      console.error("Error fetching activity:", error);
      toast.error("Failed to load activity");
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = () => {
    if (!isLoading && hasMore) {
      fetchActivity(true);
    }
  };

  // Format date to be more readable
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      // Today - show hours
      return date.toLocaleTimeString("en-US", { 
        hour: "numeric", 
        minute: "2-digit",
        hour12: true
      });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return date.toLocaleDateString("en-US", { weekday: "long" });
    } else {
      return date.toLocaleDateString("en-US", { 
        year: "numeric", 
        month: "short", 
        day: "numeric" 
      });
    }
  };

  const filteredActivities = activities.filter(activity => {
    // Filter out hidden comments
    if (activity.type === "comment") {
      const comment = activity.content as Comment;
      if (comment.isHidden) {
        return false;
      }
    }
    return true;
  });

  if (isLoading && filteredActivities.length === 0) {
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
          Latest Activity
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
                <Star className="h-10 w-10 text-muted-foreground/50" />
              ) : activeView === "comments" ? (
                <MessageSquare className="h-10 w-10 text-muted-foreground/50" />
              ) : (
                <Music className="h-10 w-10 text-muted-foreground/50" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-medium">No activity found</h3>
              <p className="text-muted-foreground text-sm mt-1">
                {activeView === "ratings" ? (
                  <>Be the first to rate an album!</>
                ) : activeView === "comments" ? (
                  <>No comments yet. Start a conversation about an album.</>
                ) : (
                  <>No activity yet. Start exploring albums.</>
                )}
              </p>
            </div>
            <Button asChild>
              <Link href="/albums">Browse Albums</Link>
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredActivities.map((activity) => (
            <ActivityCard 
              key={activity.id} 
              activity={activity} 
              formatDate={formatDate} 
            />
          ))}
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button 
            variant="outline" 
            onClick={loadMore}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More"
            )}
          </Button>
        </div>
      )}
    </div>
  );
} 