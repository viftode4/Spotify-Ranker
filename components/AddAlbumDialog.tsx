"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, Loader2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

interface SpotifyAlbum {
  id: string;
  name: string;
  artists: { name: string }[];
  images: { url: string }[];
  release_date: string;
  album_type: string;
  popularity: number;
}

interface AddAlbumDialogProps {
  onAddAlbum: (spotifyId: string) => Promise<void>;
}

export function AddAlbumDialog({ onAddAlbum }: AddAlbumDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [searchResults, setSearchResults] = useState<SpotifyAlbum[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<SpotifyAlbum | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = async () => {
    try {
      setIsSearching(true);
      const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(searchQuery)}`);
      
      if (!response.ok) {
        throw new Error("Failed to search albums");
      }
      
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Error searching albums:", error);
      toast.error("Failed to search albums");
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddAlbum = async (album: SpotifyAlbum) => {
    try {
      setSelectedAlbum(album);
      setIsAdding(true);
      await onAddAlbum(album.id);
      toast.success(`Added "${album.name}" to your collection`);
      setOpen(false);
      setSearchQuery("");
      setSearchResults([]);
      setSelectedAlbum(null);
    } catch (error) {
      console.error("Error adding album:", error);
      toast.error("Failed to add album");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Album
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Add Album</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Search for an album on Spotify and add it to your collection.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col min-h-0">
          <div className="relative mb-4">
            <Input
              placeholder="Search by album or artist name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-8"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {isSearching ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 border rounded-lg animate-pulse">
                    <div className="h-12 w-12 bg-muted rounded-md" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-3/4 bg-muted rounded" />
                      <div className="h-3 w-1/2 bg-muted rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-3">
                {searchResults.map((album) => (
                  <div
                    key={album.id}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => handleAddAlbum(album)}
                  >
                    <div className="relative h-12 w-12 flex-shrink-0 rounded-md overflow-hidden">
                      <Image
                        src={album.images[0]?.url || "/placeholder-album.png"}
                        alt={album.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{album.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {album.artists.map((artist) => artist.name).join(", ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(album.release_date).getFullYear()} • {album.album_type}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="shrink-0"
                      disabled={isAdding && selectedAlbum?.id === album.id}
                    >
                      {isAdding && selectedAlbum?.id === album.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 