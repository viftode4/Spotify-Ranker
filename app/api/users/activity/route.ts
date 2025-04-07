import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit") as string) : 20;

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
      take: limit
    });

    // Get user's album comments with album details
    const comments = await prisma.comment.findMany({
      where: {
        userId: userId,
        isHidden: false
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
      take: limit
    });

    // Create activity items
    const ratingActivities = ratings.map((rating) => ({
      id: `rating-${rating.id}`,
      type: "rating",
      createdAt: rating.createdAt.toISOString(),
      content: {
        ...rating,
        createdAt: rating.createdAt.toISOString(),
        updatedAt: rating.updatedAt.toISOString(),
      }
    }));
    
    const commentActivities = comments.map((comment) => ({
      id: `comment-${comment.id}`,
      type: "comment",
      createdAt: comment.createdAt.toISOString(),
      content: {
        ...comment,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
      }
    }));
    
    // Combine and sort by date
    const activities = [...ratingActivities, ...commentActivities]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);

    return NextResponse.json({ activities });
  } catch (error) {
    console.error("Error fetching user activity:", error);
    return NextResponse.json(
      { error: "Failed to fetch user activity" },
      { status: 500 }
    );
  }
} 