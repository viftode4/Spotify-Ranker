import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pageStr = searchParams.get("page");
    const limitStr = searchParams.get("limit");
    const type = searchParams.get("type");

    const page = pageStr ? parseInt(pageStr) : 1;
    const limit = limitStr ? parseInt(limitStr) : 20;
    const skip = (page - 1) * limit;

    // Get ratings with user and album details
    const ratingsPromise = type === "comments" ? Promise.resolve([]) : prisma.rating.findMany({
      where: {},
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
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
      skip: type === "ratings" ? skip : 0,
      take: type === "ratings" ? limit : limit * 2
    });

    // Get comments with user and album details
    const commentsPromise = type === "ratings" ? Promise.resolve([]) : prisma.comment.findMany({
      where: {
        isHidden: false
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
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
      skip: type === "comments" ? skip : 0,
      take: type === "comments" ? limit : limit * 2
    });

    // Run queries in parallel
    const [ratings, comments] = await Promise.all([
      ratingsPromise,
      commentsPromise
    ]);

    // Create activity items
    const ratingActivities = ratings.map((rating) => ({
      id: `rating-${rating.id}`,
      type: "rating" as const,
      createdAt: rating.createdAt.toISOString(),
      content: {
        ...rating,
        createdAt: rating.createdAt.toISOString(),
        updatedAt: rating.updatedAt.toISOString(),
      }
    }));
    
    const commentActivities = comments.map((comment) => ({
      id: `comment-${comment.id}`,
      type: "comment" as const,
      createdAt: comment.createdAt.toISOString(),
      content: {
        ...comment,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
      }
    }));
    
    let activities;
    
    // If filtering by type, just return those activities
    if (type === "ratings") {
      activities = ratingActivities;
    } else if (type === "comments") {
      activities = commentActivities;
    } else {
      // For "all", combine and sort by date, then apply pagination
      activities = [...ratingActivities, ...commentActivities]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(skip, skip + limit);
    }

    return NextResponse.json({ activities });
  } catch (error) {
    console.error("Error fetching activity:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity" },
      { status: 500 }
    );
  }
} 