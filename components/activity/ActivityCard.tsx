"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Star, MessageSquare, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserFlairs } from "@/components/flairs";
import { getAvatarData } from "@/lib/avatar-cache";

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
    flairs?: string[];
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
    flairs?: string[];
  };
}

interface ActivityItem {
  id: string;
  type: "rating" | "comment";
  createdAt: string;
  content: Rating | Comment;
}

interface ActivityCardProps {
  activity: ActivityItem;
  formatDate: (date: string) => string;
}

export function ActivityCard({ activity, formatDate }: ActivityCardProps) {
  const isRating = activity.type === "rating";
  const isComment = activity.type === "comment";
  const [userFlairs, setUserFlairs] = useState<string[]>([]);
  const [isLoadingFlairs, setIsLoadingFlairs] = useState(true);
  
  // Get the user ID from the activity content
  const userId = isRating 
    ? (activity.content as Rating).user.id 
    : (activity.content as Comment).user.id;
  
  // Fetch user flairs when component mounts
  useEffect(() => {
    const fetchUserFlairs = async () => {
      try {
        const userData = await getAvatarData(userId);
        setUserFlairs(userData.flairs || []);
      } catch (error) {
        console.error(`Error fetching flairs for user ${userId}:`, error);
      } finally {
        setIsLoadingFlairs(false);
      }
    };
    
    fetchUserFlairs();
  }, [userId]);
  
  if (isRating) {
    const rating = activity.content as Rating;
    return (
      <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-border/30 h-full">
        <CardContent className="p-3">
          <div className="flex flex-col h-full">
            {/* Album cover and info section */}
            <div className="flex gap-3 mb-3">
              {/* Album cover */}
              <Link 
                href={`/album/${rating.album.id}`} 
                className="relative block w-20 h-20 flex-shrink-0 overflow-hidden rounded-md"
              >
                <img 
                  src={rating.album.imageUrl || "/placeholder-album.png"} 
                  alt={rating.album.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs font-semibold">
                  <span className="text-yellow-400">{rating.score}</span>
                  <span className="text-white/80">/10</span>
                </div>
              </Link>
              
              {/* Album info */}
              <div className="flex-grow min-w-0">
                <Link href={`/album/${rating.album.id}`} className="block group">
                  <h3 className="text-base font-medium group-hover:text-primary transition-colors truncate">
                    {rating.album.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">{rating.album.artist}</p>
                </Link>
              </div>
            </div>
            
            {/* User info section */}
            <div className="flex items-start gap-3 mt-auto pt-3 border-t border-border/10">
              <Link href={`/users/${rating.user.id}`} className="flex-shrink-0">
                <Avatar className="h-8 w-8 ring-2 ring-background/80 shadow-sm">
                  <AvatarImage src={rating.user.image || ""} alt={rating.user.name || "User"} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {rating.user.name
                      ? rating.user.name.split(" ").map((n) => n[0]).join("")
                      : "U"}
                  </AvatarFallback>
                </Avatar>
              </Link>
              
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link href={`/users/${rating.user.id}`} className="font-medium hover:underline text-sm truncate">
                    {rating.user.name || "User"}
                  </Link>
                  <span className="flex items-center gap-1 text-muted-foreground text-xs">
                    <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                    rated
                  </span>
                </div>
                
                {/* User flairs */}
                {!isLoadingFlairs && userFlairs.length > 0 && (
                  <UserFlairs flairs={userFlairs} size="sm" className="mt-1" />
                )}
                
                {/* Time */}
                <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatDate(rating.createdAt)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (isComment) {
    const comment = activity.content as Comment;
    return (
      <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-border/30 h-full">
        <CardContent className="p-3">
          <div className="flex flex-col h-full">
            {/* Album cover and info section */}
            <div className="flex gap-3 mb-3">
              {/* Album cover */}
              <Link 
                href={`/album/${comment.album.id}`} 
                className="relative block w-20 h-20 flex-shrink-0 overflow-hidden rounded-md"
              >
                <img 
                  src={comment.album.imageUrl || "/placeholder-album.png"} 
                  alt={comment.album.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute bottom-1 right-1 bg-primary/20 backdrop-blur-sm rounded-full px-1.5 py-0.5 text-xs">
                  <MessageSquare className="h-3 w-3 inline-block text-primary" />
                </div>
              </Link>
              
              {/* Album info */}
              <div className="flex-grow min-w-0">
                <Link href={`/album/${comment.album.id}`} className="block group">
                  <h3 className="text-base font-medium group-hover:text-primary transition-colors truncate">
                    {comment.album.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">{comment.album.artist}</p>
                </Link>
              </div>
            </div>
            
            {/* Comment content */}
            <div className="text-sm bg-muted/50 p-2.5 rounded-md text-pretty line-clamp-3 border border-border/10 mb-3">
              {comment.content}
            </div>
            
            {/* User info section */}
            <div className="flex items-start gap-3 mt-auto pt-3 border-t border-border/10">
              <Link href={`/users/${comment.user.id}`} className="flex-shrink-0">
                <Avatar className="h-8 w-8 ring-2 ring-background/80 shadow-sm">
                  <AvatarImage src={comment.user.image || ""} alt={comment.user.name || "User"} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {comment.user.name
                      ? comment.user.name.split(" ").map((n) => n[0]).join("")
                      : "U"}
                  </AvatarFallback>
                </Avatar>
              </Link>
              
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link href={`/users/${comment.user.id}`} className="font-medium hover:underline text-sm truncate">
                    {comment.user.name || "User"}
                  </Link>
                  <span className="flex items-center gap-1 text-muted-foreground text-xs">
                    <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
                    commented
                  </span>
                </div>
                
                {/* User flairs */}
                {!isLoadingFlairs && userFlairs.length > 0 && (
                  <UserFlairs flairs={userFlairs} size="sm" className="mt-1" />
                )}
                
                {/* Time */}
                <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatDate(comment.createdAt)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return null;
} 