"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlbumCard } from "./AlbumCard";
import { Loader2 } from "lucide-react";

interface ProfileContentProps {
  userId: string;
}

interface Album {
  id: string;
  spotifyId: string;
  name: string;
  artist: string;
  imageUrl: string;
  releaseDate?: string;
}

interface Rating {
  id: string;
  score: number;
  createdAt: string;
  album: Album;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  album: Album;
}

// Create a simplified version of AlbumCard for the profile view
function ProfileAlbumCard({ album, userRating }: { album: Album, userRating: number }) {
  return (
    <Card className="h-full flex flex-col cursor-pointer hover:shadow-md transition-shadow">
      <div className="p-0">
        <div className="relative aspect-square">
          <img
            src={album.imageUrl || "/placeholder-album.png"}
            alt={album.name}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
      <CardContent className="flex-grow p-4">
        <h3 className="font-semibold truncate">{album.name}</h3>
        <p className="text-sm text-muted-foreground">{album.artist}</p>
        {album.releaseDate && (
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(album.releaseDate).getFullYear()}
          </p>
        )}
        <div className="mt-2">
          <p className="text-sm">
            <span className="font-medium">Your rating: </span>
            {userRating}/10
          </p>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button variant="outline" size="sm" className="w-full" asChild>
          <a href={`/album/${album.id}`}>View Album</a>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function ProfileContent({ userId }: ProfileContentProps) {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("ratings");
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [ratingPage, setRatingPage] = useState(1);
  const [commentPage, setCommentPage] = useState(1);
  const [ratingTotalPages, setRatingTotalPages] = useState(1);
  const [commentTotalPages, setCommentTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const pageSize = 6;
  
  const isOwnProfile = session?.user?.id === userId;

  useEffect(() => {
    fetchRatings(ratingPage);
  }, [userId, ratingPage]);

  useEffect(() => {
    fetchComments(commentPage);
  }, [userId, commentPage]);

  const fetchRatings = async (page: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/ratings?page=${page}&pageSize=${pageSize}`);
      const data = await response.json();
      
      if (response.ok) {
        setRatings(data.ratings);
        setRatingTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error("Error fetching ratings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchComments = async (page: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/comments?page=${page}&pageSize=${pageSize}`);
      const data = await response.json();
      
      if (response.ok) {
        setComments(data.comments);
        setCommentTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleRatingPageChange = (newPage: number) => {
    setRatingPage(newPage);
  };

  const handleCommentPageChange = (newPage: number) => {
    setCommentPage(newPage);
  };

  const renderRatingPagination = () => {
    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => handleRatingPageChange(Math.max(1, ratingPage - 1))}
              className={ratingPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
          
          {Array.from({ length: ratingTotalPages }, (_, i) => i + 1).map((page) => (
            <PaginationItem key={page}>
              <PaginationLink 
                isActive={page === ratingPage}
                onClick={() => handleRatingPageChange(page)}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}
          
          <PaginationItem>
            <PaginationNext 
              onClick={() => handleRatingPageChange(Math.min(ratingTotalPages, ratingPage + 1))}
              className={ratingPage === ratingTotalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  const renderCommentPagination = () => {
    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => handleCommentPageChange(Math.max(1, commentPage - 1))}
              className={commentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
          
          {Array.from({ length: commentTotalPages }, (_, i) => i + 1).map((page) => (
            <PaginationItem key={page}>
              <PaginationLink 
                isActive={page === commentPage}
                onClick={() => handleCommentPageChange(page)}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}
          
          <PaginationItem>
            <PaginationNext 
              onClick={() => handleCommentPageChange(Math.min(commentTotalPages, commentPage + 1))}
              className={commentPage === commentTotalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <Tabs defaultValue="ratings" value={activeTab} onValueChange={handleTabChange}>
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="ratings">{isOwnProfile ? "Your Ratings" : "Ratings"}</TabsTrigger>
        <TabsTrigger value="comments">{isOwnProfile ? "Your Comments" : "Comments"}</TabsTrigger>
      </TabsList>
      
      <TabsContent value="ratings" className="space-y-6">
        {isLoading && ratingPage === 1 && ratings.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : ratings.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ratings.map((rating) => (
                <ProfileAlbumCard
                  key={rating.id}
                  album={rating.album}
                  userRating={rating.score}
                />
              ))}
            </div>
            {ratingTotalPages > 1 && renderRatingPagination()}
          </>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No Ratings Yet</CardTitle>
              <CardDescription>
                {isOwnProfile 
                  ? "You haven't rated any albums yet. Start rating albums to see them here!"
                  : "This user hasn't rated any albums yet."}
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </TabsContent>
      
      <TabsContent value="comments" className="space-y-6">
        {isLoading && commentPage === 1 && comments.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-6">
              {comments.map((comment) => (
                <Card key={comment.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex gap-4 items-center">
                      <img
                        src={comment.album.imageUrl}
                        alt={comment.album.name}
                        className="h-16 w-16 object-cover rounded-md"
                      />
                      <div>
                        <CardTitle className="text-lg">{comment.album.name}</CardTitle>
                        <CardDescription>{comment.album.artist}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground mb-2">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </div>
                    <p className="text-sm">{comment.content}</p>
                    <Button variant="link" className="px-0 mt-2" asChild>
                      <a href={`/album/${comment.album.id}`}>View Album</a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            {commentTotalPages > 1 && renderCommentPagination()}
          </>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No Comments Yet</CardTitle>
              <CardDescription>
                {isOwnProfile
                  ? "You haven't commented on any albums yet. Start commenting to see them here!"
                  : "This user hasn't commented on any albums yet."}
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
} 