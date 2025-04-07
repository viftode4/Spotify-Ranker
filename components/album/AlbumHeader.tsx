import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Album } from "./types";

interface AlbumHeaderProps {
  album: Album;
  averageRating: number;
  totalRatings: number;
}

export function AlbumHeader({ album, averageRating, totalRatings }: AlbumHeaderProps) {
  return (
    <div>
      <Link href="/" className="flex items-center text-sm mb-4 hover:underline">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to albums
      </Link>
      
      <div className="relative aspect-square mb-4">
        <Image
          src={album.imageUrl || "/placeholder-album.png"}
          alt={album.name}
          fill
          sizes="(max-width: 768px) 100vw, 300px"
          className="object-cover"
        />
      </div>
      
      <h1 className="text-2xl font-bold">{album.name}</h1>
      <p className="text-lg">{album.artist}</p>
      
      {album.releaseDate && (
        <p className="text-sm text-muted-foreground mt-1">
          Released: {new Date(album.releaseDate).getFullYear()}
        </p>
      )}
      
      <div className="mt-4">
        <p className="font-medium">
          Average Rating: {averageRating.toFixed(1)}/10
        </p>
        <p className="text-sm text-muted-foreground">
          Based on {totalRatings} {totalRatings === 1 ? "rating" : "ratings"}
        </p>
      </div>
    </div>
  );
} 