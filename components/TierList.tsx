"use client";

import { Album, Rating } from "@prisma/client";
import Image from "next/image";

// Define album with ratings with proper release date typing
type AlbumWithRatingsFull = Album & { 
  ratings: Rating[];
  averageRating?: number;
};

interface TierData {
  name: string;
  min: number;
  max: number;
  color: string;
}

interface TierGroup extends TierData {
  albums: (AlbumWithRatingsFull & { averageRating: number })[];
}

interface TierListProps {
  albums?: AlbumWithRatingsFull[];
  tierGroups?: TierGroup[];
}

// Define tier ranges
const tiers: TierData[] = [
  { name: "S", min: 9, max: 10, color: "bg-red-500" },
  { name: "A", min: 8, max: 8.9, color: "bg-orange-500" },
  { name: "B", min: 7, max: 7.9, color: "bg-yellow-500" },
  { name: "C", min: 6, max: 6.9, color: "bg-green-500" },
  { name: "D", min: 5, max: 5.9, color: "bg-blue-500" },
  { name: "E", min: 3, max: 4.9, color: "bg-indigo-500" },
  { name: "F", min: 0, max: 2.9, color: "bg-purple-500" },
];

export function TierList({ albums, tierGroups: propTierGroups }: TierListProps) {
  // Use provided tier groups if available, otherwise calculate from albums
  const tierGroups = propTierGroups || calculateTierGroups(albums || []);

  return (
    <div className="space-y-6">
      {tierGroups.map((tier) => (
        <div key={tier.name} className="space-y-2">
          <div className="flex flex-col xs:flex-row items-start xs:items-center gap-2 xs:gap-4">
            <div className={`flex items-center justify-center w-12 h-12 xs:w-16 xs:h-16 ${tier.color} text-white font-bold text-xl xs:text-2xl rounded-md`}>
              {tier.name}
            </div>
            <div className="text-xs xs:text-sm text-muted-foreground">
              {tier.min === tier.max ? tier.min : `${tier.min} - ${tier.max}`} / 10
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 min-h-16 xs:min-h-24 border-2 border-dashed p-2 xs:p-3 rounded-md">
            {tier.albums.length > 0 ? (
              tier.albums.map((album) => (
                <div
                  key={album.id}
                  className="relative h-12 w-12 xs:h-16 xs:w-16 shrink-0 border group hover-lift"
                  title={`${album.name} by ${album.artist} (${album.averageRating.toFixed(1)})`}
                >
                  <Image
                    src={album.imageUrl || "/placeholder-album.png"}
                    alt={album.name}
                    fill
                    sizes="(max-width: 640px) 48px, 64px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 xs:bg-black/0 xs:group-hover:bg-black/70 flex items-center justify-center xs:opacity-0 xs:group-hover:opacity-100 transition-all duration-200">
                    <span className="text-white text-[10px] xs:text-xs font-medium">
                      {album.averageRating.toFixed(1)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="w-full flex items-center justify-center h-12 xs:h-16 text-muted-foreground text-xs xs:text-sm">
                No albums in this tier
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Helper function to calculate tier groups from albums
function calculateTierGroups(albums: AlbumWithRatingsFull[]): TierGroup[] {
  // Calculate average ratings and group albums by tier
  const albumsWithRatings = albums
    .filter(album => album.ratings.length > 0)
    .map(album => {
      const totalRatings = album.ratings.length;
      const averageRating = totalRatings > 0
        ? album.ratings.reduce((acc, rating) => acc + rating.score, 0) / totalRatings
        : 0;
      
      return {
        ...album,
        averageRating
      };
    });

  // Create tier groups
  return tiers.map(tier => {
    const tierAlbums = albumsWithRatings.filter(
      album => album.averageRating! >= tier.min && album.averageRating! <= tier.max
    );
    
    return {
      ...tier,
      albums: tierAlbums
    };
  });
} 