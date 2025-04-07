import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in to update a comment" },
        { status: 401 }
      );
    }

    const { id } = params;

    // Get the comment
    const comment = await prisma.comment.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!comment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    // Only the comment owner can hide their comment
    if (comment.userId !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized to update this comment" },
        { status: 403 }
      );
    }

    // Update comment to hide it
    const updatedComment = await prisma.comment.update({
      where: { id },
      data: {
        isHidden: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(updatedComment);
  } catch (error) {
    console.error("Error hiding comment:", error);
    return NextResponse.json(
      { error: "Failed to hide comment" },
      { status: 500 }
    );
  }
} 