"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Trash2, Send, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { UserFlair } from "@/components/flairs";
import { getAvatarData } from "@/lib/avatar-cache";

interface UserComment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  votes: number;
  upvotedBy: string[];
  raterUser: {
    id: string;
    name: string | null;
    image: string | null;
    flairs?: string[];
  };
}

interface UserCommentsProps {
  userId: string;
  isOwnProfile: boolean;
  currentUserId: string | undefined;
}

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

export default function UserComments({ userId, isOwnProfile, currentUserId }: UserCommentsProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<UserComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [upvoting, setUpvoting] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"date" | "votes">("date");
  const [userFlairs, setUserFlairs] = useState<{ [userId: string]: string[] }>({});
  
  // Check if the current user has already commented
  const currentUserComment = comments.find(comment => comment.raterUser.id === currentUserId);
  const canAddComment = !!currentUserId; // Allow all logged in users to comment, including on own profile
  const isEditingComment = !!currentUserComment;

  // Sort comments based on selected sort method
  const sortedComments = [...comments].sort((a, b) => {
    if (sortBy === "votes") {
      return b.votes - a.votes;
    } else {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  useEffect(() => {
    fetchComments();
  }, [userId]);

  useEffect(() => {
    // Fetch flairs for all unique users in comments
    if (comments.length > 0) {
      const uniqueUserIds = [...new Set(comments.map(comment => comment.raterUser.id))];
      fetchUserFlairs(uniqueUserIds);
    }
  }, [comments.length]);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      // Check if we have cached comments for this userId
      const now = Date.now();
      const cacheKey = `comments-${userId}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        const { comments: cachedComments, timestamp } = JSON.parse(cachedData);
        
        // If the cache is still valid (less than CACHE_DURATION old)
        if (now - timestamp < CACHE_DURATION) {
          // Ensure upvotedBy is always an array in cached comments
          const safeComments = cachedComments.map((comment: UserComment) => ({
            ...comment,
            upvotedBy: comment.upvotedBy || []
          }));
          setComments(safeComments);
          setLastFetchTime(timestamp);
          setIsLoading(false);
          return;
        }
      }
      
      // If no valid cache, fetch from API
      const response = await fetch(`/api/users/comments?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch comments");
      }
      
      const data = await response.json();
      
      // Ensure upvotedBy is always an array
      const commentsWithSafeUpvotedBy = data.comments.map((comment: UserComment) => ({
        ...comment,
        upvotedBy: comment.upvotedBy || []
      }));
      
      // Cache the result
      localStorage.setItem(
        cacheKey, 
        JSON.stringify({
          comments: commentsWithSafeUpvotedBy,
          timestamp: now
        })
      );
      
      setComments(commentsWithSafeUpvotedBy);
      setLastFetchTime(now);
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast.error("Failed to load comments");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to force refresh the comments (ignoring cache)
  const refreshComments = () => {
    // Remove the cache for this userId
    localStorage.removeItem(`comments-${userId}`);
    // Fetch fresh data
    fetchComments();
  };

  const handleUpvoteComment = async (commentId: string) => {
    if (!session?.user?.id) {
      toast.error("You must be logged in to upvote a comment");
      return;
    }
    
    setUpvoting(commentId);
    
    try {
      const comment = comments.find(c => c.id === commentId);
      const hasUpvoted = comment?.upvotedBy?.includes(session.user.id);
      
      const response = await fetch(`/api/users/comments/${commentId}/upvote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          remove: hasUpvoted,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upvote comment");
      }
      
      const updatedComment = await response.json();
      
      // Ensure upvotedBy is always an array
      const safeUpdatedComment = {
        ...updatedComment,
        upvotedBy: updatedComment.upvotedBy || []
      };
      
      // Update the comment in the local state
      const updatedComments = comments.map(c => 
        c.id === commentId ? safeUpdatedComment : c
      );
      
      // Update local state
      setComments(updatedComments);
      
      // Update the cache with the new comments
      const cacheKey = `comments-${userId}`;
      localStorage.setItem(
        cacheKey, 
        JSON.stringify({
          comments: updatedComments,
          timestamp: lastFetchTime || Date.now()
        })
      );
      
      if (hasUpvoted) {
        toast.success("Upvote removed");
      } else {
        toast.success("Comment upvoted");
      }
    } catch (error: unknown) {
      console.error("Error upvoting comment:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upvote comment");
    } finally {
      setUpvoting(null);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user?.id) {
      toast.error("You must be logged in to comment");
      return;
    }
    
    if (!newComment.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }
    
    setSubmitting(true);
    
    try {
      const response = await fetch("/api/users/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          content: newComment.trim(),
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to post comment");
      }
      
      const comment = await response.json();
      
      // Update local state with the new/updated comment
      let updatedComments;
      
      if (isEditingComment) {
        // Update the comment in the list
        updatedComments = comments.map(c => 
          c.id === comment.id ? comment : c
        );
        toast.success("Comment updated successfully");
      } else {
        // Add the new comment to the list
        updatedComments = [comment, ...comments];
        toast.success("Comment added successfully");
      }
      
      // Set the new comments in state
      setComments(updatedComments);
      
      // Update the cache with the new comments
      const cacheKey = `comments-${userId}`;
      localStorage.setItem(
        cacheKey, 
        JSON.stringify({
          comments: updatedComments,
          timestamp: lastFetchTime || Date.now()
        })
      );
      
      // Clear the input
      setNewComment("");
    } catch (error: unknown) {
      console.error("Error posting comment:", error);
      toast.error(error instanceof Error ? error.message : "Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!session?.user?.id) {
      toast.error("You must be logged in to delete a comment");
      return;
    }
    
    setDeleting(commentId);
    
    try {
      const response = await fetch(`/api/users/comments/${commentId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete comment");
      }
      
      // Remove the comment from the local state
      const updatedComments = comments.filter(c => c.id !== commentId);
      setComments(updatedComments);
      
      // Update the cache with the updated comments
      const cacheKey = `comments-${userId}`;
      localStorage.setItem(
        cacheKey, 
        JSON.stringify({
          comments: updatedComments,
          timestamp: lastFetchTime || Date.now()
        })
      );
      
      toast.success("Comment deleted successfully");
    } catch (error: unknown) {
      console.error("Error deleting comment:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete comment");
    } finally {
      setDeleting(null);
    }
  };

  // Set the comment text if the user is editing their existing comment
  useEffect(() => {
    if (currentUserComment && currentUserId) {
      setNewComment(currentUserComment.content);
    }
  }, [currentUserComment, currentUserId]);

  // Fetch flairs for multiple users
  const fetchUserFlairs = async (userIds: string[]) => {
    try {
      const flairsData: { [userId: string]: string[] } = {};
      
      // Fetch flairs for each user
      await Promise.all(
        userIds.map(async (userId) => {
          try {
            const userData = await getAvatarData(userId);
            flairsData[userId] = userData.flairs || [];
          } catch (error) {
            console.error(`Error fetching flairs for user ${userId}:`, error);
          }
        })
      );
      
      setUserFlairs(flairsData);
      
      // Update comments with flairs - but don't trigger a state update that would cause this effect to run again
      const updatedComments = comments.map(comment => ({
        ...comment,
        raterUser: {
          ...comment.raterUser,
          flairs: flairsData[comment.raterUser.id] || []
        }
      }));
      
      // Update the state with new comments that include flairs
      setComments(updatedComments);
    } catch (error) {
      console.error("Error fetching user flairs:", error);
    }
  };

  return (
    <div className="space-y-6">
      {canAddComment && (
        <form onSubmit={handleSubmitComment} className="flex items-center space-x-2 mb-4">
          <div className="relative flex-1">
            <Input
              placeholder={isEditingComment ? "Edit your comment..." : "Add a comment..."}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              maxLength={20}
              className="pr-16 h-9 text-sm"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {newComment.length}/20
            </div>
          </div>
          <Button 
            type="submit" 
            disabled={submitting || !newComment.trim()} 
            size="sm"
            className="h-9 px-3"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="sr-only">{isEditingComment ? "Update" : "Post"}</span>
          </Button>
          {isEditingComment && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => handleDeleteComment(currentUserComment.id)}
              disabled={!!deleting}
              size="sm"
              className="h-9 px-3"
            >
              {deleting === currentUserComment.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              <span className="sr-only">Delete</span>
            </Button>
          )}
        </form>
      )}
      
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Comments {comments.length > 0 && `(${comments.length})`}</h3>
        <div className="flex items-center gap-2">
          <div className="flex text-xs bg-muted/50 rounded-md overflow-hidden">
            <button 
              onClick={() => setSortBy("date")} 
              className={`px-2 py-1 ${sortBy === "date" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            >
              Newest
            </button>
            <button 
              onClick={() => setSortBy("votes")} 
              className={`px-2 py-1 ${sortBy === "votes" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            >
              Top
            </button>
          </div>
          {lastFetchTime && (
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshComments}
              className="h-7 text-xs"
            >
              Refresh
            </Button>
          )}
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center my-8">
          <Loader2 className="animate-spin h-8 w-8 text-gray-400" />
        </div>
      ) : sortedComments.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No comments yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedComments.map((comment) => (
            <div 
              key={comment.id} 
              className="flex gap-4 p-4 rounded-lg border"
            >
              <div>
                <Link href={`/users/${comment.raterUser.id}`}>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={comment.raterUser.image || ""} alt={comment.raterUser.name || "User"} />
                    <AvatarFallback>
                      {comment.raterUser.name
                        ? comment.raterUser.name.split(" ").map((n) => n[0]).join("")
                        : "U"}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              </div>
              
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/users/${comment.raterUser.id}`} className="font-semibold hover:underline">
                    {comment.raterUser.name}
                  </Link>
                  
                  {comment.raterUser.flairs && comment.raterUser.flairs.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {comment.raterUser.flairs.map((flair, index) => (
                        <UserFlair key={index} flair={flair} size="sm" />
                      ))}
                    </div>
                  )}
                </div>
                
                <p>{comment.content}</p>
                
                <div className="flex items-center text-sm text-gray-500 gap-4">
                  <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleUpvoteComment(comment.id)}
                    disabled={!session?.user || upvoting === comment.id}
                    className={`flex items-center gap-1 ${
                      comment.upvotedBy?.includes(session?.user?.id || "") 
                        ? "text-blue-600" 
                        : ""
                    }`}
                  >
                    {upvoting === comment.id ? (
                      <Loader2 className="animate-spin h-4 w-4" />
                    ) : (
                      <ThumbsUp className="h-4 w-4" />
                    )}
                    <span>{comment.votes}</span>
                  </Button>
                  
                  {(session?.user?.id === comment.raterUser.id || isOwnProfile) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteComment(comment.id)}
                      disabled={deleting === comment.id}
                      className="text-red-500 hover:text-red-700"
                    >
                      {deleting === comment.id ? (
                        <Loader2 className="animate-spin h-4 w-4" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
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