import { useState, useEffect } from "react";
import Link from "next/link";
import { Send, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Album } from "./types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserFlairs } from "@/components/flairs";
import { getAvatarData } from "@/lib/avatar-cache";

interface UserAvatarData {
  id: string;
  name: string | null;
  image: string | null;
  averageRating: number | null;
  ratingCount: number;
  flairs: string[];
}

interface AlbumCommentsProps {
  album: Album;
  userId?: string;
  onUpdateAlbum: (updatedAlbum: Album) => void;
}

export function AlbumComments({ album, userId, onUpdateAlbum }: AlbumCommentsProps) {
  const [comment, setComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [hidingCommentId, setHidingCommentId] = useState<string | null>(null);
  const [userAvatarData, setUserAvatarData] = useState<Record<string, UserAvatarData>>({});

  useEffect(() => {
    if (album?.comments) {
      const fetchUserAvatarData = async () => {
        const userIds = [...new Set(album.comments.map(comment => comment.userId))];
        const avatarData: Record<string, UserAvatarData> = {};
        
        await Promise.all(
          userIds.map(async (userId) => {
            try {
              const data = await getAvatarData(userId);
              avatarData[userId] = data;
            } catch (error) {
              console.error(`Error fetching avatar data for user ${userId}:`, error);
            }
          })
        );
        
        setUserAvatarData(avatarData);
      };
      
      fetchUserAvatarData();
    }
  }, [album?.comments]);

  const handleSubmitComment = async () => {
    if (!userId || !album || !comment.trim()) return;
    
    try {
      setIsSubmittingComment(true);
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          albumId: album.id, 
          content: comment.replace(/\r\n/g, '\n').replace(/\r/g, '\n') 
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to post comment");
      }

      const newComment = await response.json();
      
      // Update local album state with new comment
      const updatedAlbum = {
        ...album,
        comments: [...album.comments, newComment],
      };
      
      onUpdateAlbum(updatedAlbum);
      
      // Clear comment input
      setComment("");
      toast.success("Comment posted");
    } catch (error: unknown) {
      console.error("Error posting comment:", error);
      toast.error(error instanceof Error ? error.message : "Failed to post comment");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleHideComment = async (commentId: string) => {
    if (!userId || !album) return;
    
    try {
      setHidingCommentId(commentId);
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to hide comment");
      }
      
      // Update local album state with hidden comment
      const updatedAlbum = {
        ...album,
        comments: album.comments.map(comment => 
          comment.id === commentId 
            ? { ...comment, isHidden: true } 
            : comment
        ),
      };
      
      onUpdateAlbum(updatedAlbum);
      toast.success("Comment hidden");
    } catch (error: unknown) {
      console.error("Error hiding comment:", error);
      toast.error(error instanceof Error ? error.message : "Failed to hide comment");
    } finally {
      setHidingCommentId(null);
    }
  };

  // Filter out hidden comments
  const visibleComments = album.comments.filter(comment => 
    !comment.isHidden || comment.userId === userId
  );

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-medium">Discussion</h2>
      
      {visibleComments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet</p>
      ) : (
        <div className="space-y-4">
          {visibleComments
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((comment) => {
              const avatarData = userAvatarData[comment.userId];
              return (
                <div key={comment.id} className="group border-b border-border/30 pb-3 last:border-0">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-6 w-6 shrink-0 mt-0.5">
                      {comment.isHidden ? (
                        <AvatarFallback className="text-xs">?</AvatarFallback>
                      ) : (
                        <>
                          <AvatarImage
                            src={comment.user.image || ""}
                            alt={comment.user.name || "User"}
                          />
                          <AvatarFallback className="text-xs">
                            {comment.user.name?.[0] || "U"}
                          </AvatarFallback>
                        </>
                      )}
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-2 text-xs">
                          {comment.isHidden ? (
                            <span className="text-muted-foreground">Anonymous</span>
                          ) : (
                            <>
                              <Link href={`/users/${comment.userId}`} className="font-medium hover:underline">
                                {comment.user.name || "User"}
                              </Link>
                              
                              {!comment.isHidden && avatarData?.averageRating && (
                                <span className="text-muted-foreground flex items-center">
                                  <span className="text-yellow-500 mr-0.5">★</span>
                                  {avatarData.averageRating}
                                </span>
                              )}
                            </>
                          )}
                          <span className="text-muted-foreground">
                            {new Date(comment.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} {new Date(comment.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        
                        {userId === comment.userId && !comment.isHidden && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-5 w-5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" 
                            onClick={() => handleHideComment(comment.id)}
                            disabled={hidingCommentId === comment.id}
                          >
                            <EyeOff className="h-3 w-3" />
                            <span className="sr-only">Hide</span>
                          </Button>
                        )}
                      </div>
                      
                      {!comment.isHidden && avatarData?.flairs && avatarData.flairs.length > 0 && (
                        <UserFlairs flairs={avatarData.flairs} size="sm" className="mt-1" />
                      )}
                      
                      <pre className="text-sm mt-1 whitespace-pre-wrap max-h-[120px] overflow-y-auto font-sans">{comment.content}</pre>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}
      
      {userId && (
        <div className="relative mt-4 w-full max-w-2xl">
          <div className="relative">
            <Textarea
              placeholder="Add a comment..."
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
              }}
              className="py-2 break-words overflow-wrap-break-word min-h-[80px] max-h-[120px] overflow-y-auto w-full whitespace-pre-wrap text-base"
              style={{ resize: 'none', WebkitAppearance: 'none' }}
              maxLength={200}
            />
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">
                {comment.length}/200 characters
              </p>
              <Button 
                size="icon"
                variant="ghost"
                className="h-7 w-7" 
                disabled={!comment.trim() || isSubmittingComment || comment.length > 200}
                onClick={handleSubmitComment}
              >
                <Send className="h-3.5 w-3.5" />
                <span className="sr-only">Post</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 