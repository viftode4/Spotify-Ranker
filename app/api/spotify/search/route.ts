import { NextRequest, NextResponse } from "next/server";
import { searchAlbums } from "@/lib/spotify";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchQuery = request.nextUrl.searchParams.get("q");
    
    if (!searchQuery) {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 });
    }

    const albums = await searchAlbums(searchQuery);
    
    return NextResponse.json(albums);
  } catch (error) {
    console.error("Error searching Spotify albums:", error);
    return NextResponse.json({ error: "Failed to search albums" }, { status: 500 });
  }
} 