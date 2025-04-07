import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// Get a specific album with ratings, tracks, and comments
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const {id}  = await params;
    
    const album = await prisma.album.findUnique({
      where: { id },
      include: {
        ratings: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        tracks: {
          orderBy: {
            number: 'asc',
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    return NextResponse.json(album);
  } catch (error) {
    console.error("Error fetching album:", error);
    return NextResponse.json({ error: "Failed to fetch album" }, { status: 500 });
  }
}

// Delete an album
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = params.id;

    // Check if album exists
    const album = await prisma.album.findUnique({
      where: { id },
    });

    if (!album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    // Delete album and all associated ratings, comments, and tracks
    await prisma.album.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Album deleted successfully" });
  } catch (error) {
    console.error("Error deleting album:", error);
    return NextResponse.json({ error: "Failed to delete album" }, { status: 500 });
  }
} 