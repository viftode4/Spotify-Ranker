import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema for rating submission
const RatingSchema = z.object({
  userId: z.string(),
  score: z.number().min(1).max(10).int(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get the ratings for the user
    const ratings = await prisma.userRating.findMany({
      where: {
        ratedUserId: userId,
      },
      select: {
        id: true,
        score: true,
        createdAt: true,
        updatedAt: true,
        raterUser: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ ratings });
  } catch (error) {
    console.error("Error fetching user ratings:", error);
    return NextResponse.json(
      { error: "Failed to fetch ratings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to rate a user" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validationResult = RatingSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid rating data", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { userId, score } = validationResult.data;

    // Check if user exists
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userExists) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if already rated this user
    const existingRating = await prisma.userRating.findUnique({
      where: {
        ratedUserId_raterUserId: {
          ratedUserId: userId,
          raterUserId: session.user.id,
        },
      },
    });

    if (existingRating) {
      // Update existing rating
      const updatedRating = await prisma.userRating.update({
        where: { id: existingRating.id },
        data: { score },
        select: {
          id: true,
          score: true,
          createdAt: true,
          updatedAt: true,
          raterUser: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });

      return NextResponse.json(updatedRating);
    } else {
      // Create new rating
      const newRating = await prisma.userRating.create({
        data: {
          score,
          ratedUserId: userId,
          raterUserId: session.user.id,
        },
        select: {
          id: true,
          score: true,
          createdAt: true,
          updatedAt: true,
          raterUser: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });

      return NextResponse.json(newRating);
    }
  } catch (error) {
    console.error("Error creating/updating rating:", error);
    return NextResponse.json(
      { error: "Failed to submit rating" },
      { status: 500 }
    );
  }
} 