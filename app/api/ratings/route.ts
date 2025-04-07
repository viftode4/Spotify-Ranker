import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// Create or update a rating
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { albumId, score } = await request.json();

    // Validate score
    if (score < 1 || score > 10) {
      return NextResponse.json({ error: "Score must be between 1 and 10" }, { status: 400 });
    }

    // Check if album exists
    const album = await prisma.album.findUnique({
      where: { id: albumId },
    });

    if (!album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    // Verify that the user exists in the database
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has already rated this album
    const existingRating = await prisma.rating.findUnique({
      where: {
        userId_albumId: {
          userId: user.id,
          albumId,
        },
      },
    });

    if (existingRating) {
      // Update existing rating
      const updatedRating = await prisma.rating.update({
        where: {
          id: existingRating.id,
        },
        data: {
          score,
        },
      });

      return NextResponse.json(updatedRating);
    } else {
      // Create new rating
      const newRating = await prisma.rating.create({
        data: {
          score,
          userId: user.id,
          albumId,
        },
      });

      return NextResponse.json(newRating, { status: 201 });
    }
  } catch (error) {
    console.error("Error rating album:", error);
    return NextResponse.json({ error: "Failed to rate album" }, { status: 500 });
  }
} 