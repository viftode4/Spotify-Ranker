import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in to upvote a comment" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { remove } = await req.json();

    // Get the comment with user votes
    const comment = await prisma.userComment.findUnique({
      where: { id },
      include: {
        userVotes: {
          where: {
            userId: session.user.id
          }
        },
        raterUser: {
          select: {
            id: true,
            name: true, 
            image: true
          }
        }
      }
    });

    if (!comment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    const existingVote = comment.userVotes[0];
    let updatedComment;

    if (remove && existingVote) {
      // Remove the vote
      await prisma.userCommentVote.delete({
        where: { id: existingVote.id }
      });
      
      // Decrement the votes count
      updatedComment = await prisma.userComment.update({
        where: { id },
        data: {
          votes: {
            decrement: 1
          }
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
              userId: true
            }
          }
        },
      });
    } 
    else if (!remove && !existingVote) {
      // Create a new vote
      await prisma.userCommentVote.create({
        data: {
          userComment: { connect: { id } },
          user: { connect: { id: session.user.id } },
          value: 1
        }
      });
      
      // Increment the votes count
      updatedComment = await prisma.userComment.update({
        where: { id },
        data: {
          votes: {
            increment: 1
          }
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
              userId: true
            }
          }
        },
      });
    } else {
      // Just return the comment as is
      return NextResponse.json({
        ...comment,
        upvotedBy: comment.userVotes.map(vote => vote.userId)
      });
    }
    
    // Transform the updated comment to include upvotedBy
    const transformedComment = {
      ...updatedComment,
      upvotedBy: updatedComment.userVotes.map(vote => vote.userId)
    };
    
    // Remove userVotes from the response
    const { userVotes, ...commentWithoutVotes } = transformedComment;
    
    return NextResponse.json(commentWithoutVotes);
  } catch (error) {
    console.error("Error upvoting comment:", error);
    return NextResponse.json(
      { error: "Failed to upvote comment" },
      { status: 500 }
    );
  }
} 