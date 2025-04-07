import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getSpotifyToken, getAlbumById } from "@/lib/spotify";

// Define interface for track items from Spotify API
interface SpotifyTrack {
  name: string;
  duration_ms: number;
  track_number: number;
}

// Get all albums
export async function GET() {
  try {
    const albums = await prisma.album.findMany({
      include: {
        ratings: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(albums);
  } catch (error) {
    console.error("Error fetching albums:", error);
    // Return an empty array instead of an error object to prevent client-side mapping errors
    return NextResponse.json([], { status: 200 });
  }
}

// Add a new album
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { spotifyId } = await request.json();

    // Check if album already exists
    const existingAlbum = await prisma.album.findUnique({
      where: { spotifyId },
    });

    if (existingAlbum) {
      return NextResponse.json({ error: "Album already exists" }, { status: 400 });
    }

    // Get album details from Spotify
    await getSpotifyToken();
    const albumData = await getAlbumById(spotifyId);

    // Create new album with tracks
    const album = await prisma.album.create({
      data: {
        spotifyId,
        name: albumData.name,
        artist: albumData.artists[0].name,
        imageUrl: albumData.images[0]?.url || "",
        releaseDate: albumData.release_date,
        tracks: {
          create: albumData.tracks.items.map((track: SpotifyTrack) => ({
            name: track.name,
            duration: track.duration_ms,
            number: track.track_number,
          })),
        },
      },
      include: {
        tracks: true,
      },
    });

    return NextResponse.json(album, { status: 201 });
  } catch (error) {
    console.error("Error adding album:", error);
    return NextResponse.json({ error: "Failed to add album" }, { status: 500 });
  }
} 