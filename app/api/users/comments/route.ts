import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get the current user from session for upvote info
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;

    // Fetch user profile comments with votes
    const comments = await prisma.userComment.findMany({
      where: { 
        ratedUserId: userId 
      },
      include: {
        raterUser: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        userVotes: {
          select: {
            userId: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform the comments to include upvotedBy array and remove userVotes
    const transformedComments = comments.map(comment => {
      const { userVotes, ...restComment } = comment;
      return {
        ...restComment,
        upvotedBy: userVotes.map(vote => vote.userId),
      };
    });

    return NextResponse.json({ comments: transformedComments });
  } catch (error) {
    console.error("Error fetching user comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch user comments" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in to post a comment" },
        { status: 401 }
      );
    }

    const { userId, content } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    if (!content || content.trim() === "") {
      return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 }
      );
    }
    
    if (content.trim().length > 20) {
      return NextResponse.json(
        { error: "Comment content must be 20 characters or less" },
        { status: 400 }
      );
    }
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user already has a comment from this rater
    const existingComment = await prisma.userComment.findFirst({
      where: {
        ratedUserId: userId,
        raterUserId: session.user.id,
      },
    });

    let comment;
    
    if (existingComment) {
      // If we're updating an existing comment, we need to reset votes
      
      // First, delete all votes for this comment
      await prisma.userCommentVote.deleteMany({
        where: {
          userCommentId: existingComment.id
        }
      });
      
      // Then update the comment and reset the score to 0
      comment = await prisma.userComment.update({
        where: { id: existingComment.id },
        data: {
          content: content.trim(),
          updatedAt: new Date(),
          votes: 0, // Reset votes to 0
        },
        include: {
          raterUser: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });
    } else {
      // Create new comment
      comment = await prisma.userComment.create({
        data: {
          content: content.trim(),
          ratedUserId: userId,
          raterUserId: session.user.id,
        },
        include: {
          raterUser: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });
    }

    return NextResponse.json(comment);
  } catch (error) {
    console.error("Error creating/updating user comment:", error);
    return NextResponse.json(
      { error: "Failed to create/update user comment" },
      { status: 500 }
    );
  }
} 