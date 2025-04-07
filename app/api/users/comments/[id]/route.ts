import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in to delete a comment" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Get the comment
    const comment = await prisma.userComment.findUnique({
      where: { id },
    });

    if (!comment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    // Only the comment owner can delete their comment
    if (comment.raterUserId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized to delete this comment" },
        { status: 403 }
      );
    }

    // Delete the comment
    await prisma.userComment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
} 