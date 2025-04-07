import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    
    // If no userId is provided, use the current user's ID
    if (!userId) {
      const session = await getServerSession(authOptions);
      
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }
      
      // Use the logged-in user's ID
      const userData = await getUserData(session.user.id);
      return NextResponse.json(userData);
    }
    
    // Get user data for the specified userId
    const userData = await getUserData(userId);
    return NextResponse.json(userData);
    
  } catch (error) {
    console.error("Error fetching user avatar data:", error);
    return NextResponse.json(
      { error: "Failed to fetch user data" },
      { status: 500 }
    );
  }
}

async function getUserData(userId: string) {
  // Get basic user info
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      image: true,
    }
  });
  
  if (!user) {
    throw new Error("User not found");
  }
  
  // Get user ratings to calculate average
  const ratings = await prisma.$queryRaw<Array<{ score: number }>>`
    SELECT "score" FROM "UserRating" WHERE "ratedUserId" = ${userId}
  `;
  
  // Calculate average rating
  let averageRating = null;
  if (ratings.length > 0) {
    const totalScore = ratings.reduce((sum: number, rating: { score: number }) => sum + rating.score, 0);
    averageRating = parseFloat((totalScore / ratings.length).toFixed(1));
  }
  
  // Determine flairs
  const flairs = await getUserFlairs(userId);
  
  // Return complete user avatar data
  return {
    id: user.id,
    name: user.name,
    image: user.image,
    averageRating,
    ratingCount: ratings.length,
    flairs
  };
}

async function getUserFlairs(userId: string) {
  const flairs: string[] = [];
  
  // Check for Echo Warrior - if the user rated himself
  const selfRating = await prisma.$queryRaw<Array<{ id: string; score: number; ratedUserId: string; raterUserId: string }>>`
    SELECT * FROM "UserRating" 
    WHERE "ratedUserId" = ${userId} AND "raterUserId" = ${userId}
  `;
  
  if (selfRating.length > 0) {
    flairs.push("✨ Echo Warrior ✨");
  }
  
  // Get all comments on this user's profile
  const userComments = await prisma.$queryRaw<Array<{ id: string; content: string; votes: number; ratedUserId: string; raterUserId: string }>>`
    SELECT * FROM "UserComment" 
    WHERE "ratedUserId" = ${userId}
    ORDER BY "votes" DESC
  `;
  
  // Check if any comments exist
  if (userComments.length > 0) {
    const topComment = userComments[0];
    
    // Add top rated comment message
    flairs.push(`🔥 ${topComment.content} 🔥`);
    
    // Check for self-comments
    const selfComments = userComments.filter(comment => comment.raterUserId === userId);
    
    if (selfComments.length > 0) {
      // Check if own comment is the top rated - Shukar
      if (topComment.raterUserId === userId) {
        flairs.push("💅 Shukar 💯");
      } else {
        // If commented on self but not top rated - Dubios
        flairs.push("🤡 Dubios 👀");
      }
    }
  }
  
  // If no flairs assigned, give default "Fan Nane" flair
  if (flairs.length === 0) {
    flairs.push("👽 Fan Nane 👾");
  }
  
  return flairs;
} 