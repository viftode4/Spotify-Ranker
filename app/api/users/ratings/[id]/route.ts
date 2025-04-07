import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const {id} = await params;
    const ratingId = id;

    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to delete a rating" },
        { status: 401 }
      );
    }

    // Get the rating
    const rating = await prisma.userRating.findUnique({
      where: { id: ratingId },
    });

    if (!rating) {
      return NextResponse.json(
        { error: "Rating not found" },
        { status: 404 }
      );
    }

    // Check if user is authorized to delete (only if they are the rater)
    if (rating.raterUserId !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json(
        { error: "You can only delete your own ratings" },
        { status: 403 }
      );
    }

    // Delete the rating
    await prisma.userRating.delete({
      where: { id: ratingId },
    });

    return NextResponse.json(
      { message: "Rating deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting rating:", error);
    return NextResponse.json(
      { error: "Failed to delete rating" },
      { status: 500 }
    );
  }
} 