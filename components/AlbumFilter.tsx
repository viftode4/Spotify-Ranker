"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlbumFilterProps {
  artists: string[];
  onFilter: (filters: {
    search: string;
    artist: string;
    minRating: number;
    maxRating: number;
  }) => void;
}

export function AlbumFilter({ artists, onFilter }: AlbumFilterProps) {
  const [search, setSearch] = useState("");
  const [artist, setArtist] = useState("all");
  const [ratingRange, setRatingRange] = useState("all");
  const [isExpanded, setIsExpanded] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      handleFilter();
    }, 300);

    return () => clearTimeout(timer);
  }, [search, artist, ratingRange]);

  const handleFilter = () => {
    let minRating = 0;
    let maxRating = 10;

    if (ratingRange !== "all") {
      const [min, max] = ratingRange.split("-").map(Number);
      minRating = min;
      maxRating = max !== undefined ? max : 10;
    }

    onFilter({
      search,
      artist: artist === "all" ? "" : artist,
      minRating,
      maxRating,
    });
  };

  const handleClearFilters = () => {
    setSearch("");
    setArtist("all");
    setRatingRange("all");
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search albums..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-12 pr-4 w-full"
        />
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-2 w-full sm:w-auto"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <Filter className="h-4 w-4" />
          Filters
        </Button>

        {(artist !== "all" || ratingRange !== "all" || search) && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground w-full sm:w-auto"
            onClick={handleClearFilters}
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Expanded Filters */}
      <div className={cn(
        "grid gap-4 transition-all duration-200",
        isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      )}>
        <div className="overflow-hidden">
          <div className="grid gap-4">
            <Select value={artist} onValueChange={setArtist}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Artist" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Artists</SelectItem>
                {artists.map((artistName) => (
                  <SelectItem key={artistName} value={artistName}>
                    {artistName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={ratingRange} onValueChange={setRatingRange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="9-10">9-10 (S Tier)</SelectItem>
                <SelectItem value="8-8.9">8-8.9 (A Tier)</SelectItem>
                <SelectItem value="7-7.9">7-7.9 (B Tier)</SelectItem>
                <SelectItem value="6-6.9">6-6.9 (C Tier)</SelectItem>
                <SelectItem value="5-5.9">5-5.9 (D Tier)</SelectItem>
                <SelectItem value="3-4.9">3-4.9 (E Tier)</SelectItem>
                <SelectItem value="0-2.9">0-2.9 (F Tier)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
} 