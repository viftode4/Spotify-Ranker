import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user's album ratings with album details
    const ratings = await prisma.rating.findMany({
      where: {
        userId: userId
      },
      include: {
        album: {
          select: {
            id: true,
            name: true,
            artist: true,
            imageUrl: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 20 // Limit to most recent 20
    });

    return NextResponse.json({ ratings });
  } catch (error) {
    console.error("Error fetching user album ratings:", error);
    return NextResponse.json(
      { error: "Failed to fetch user album ratings" },
      { status: 500 }
    );
  }
} 