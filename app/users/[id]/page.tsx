import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserComments from "@/components/UserComments";
import UserRatings from "@/components/UserRatings";
import { UserFlairs } from "@/components/flairs";
import UserActivity from "@/components/user/UserActivity";

interface AvatarData {
  id: string;
  name: string | null;
  image: string | null;
  averageRating: number | null;
  ratingCount: number;
  flairs: string[];
}

async function getAvatarData(userId: string): Promise<AvatarData> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/users/avatar?userId=${userId}`, {
    cache: 'no-store'
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch avatar data');
  }
  
  return response.json();
}

export default async function UserProfilePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  const userId = id;
  
  // Fetch the user
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });
  
  if (!user) {
    notFound();
  }

  // Fetch avatar data with flairs
  const avatarData = await getAvatarData(userId);
  const isOwnProfile = session?.user?.id === userId;

  return (
    <div className="container py-6 space-y-8">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/3 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col items-center text-center gap-4">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={avatarData.image || ""} alt={avatarData.name || "User"} />
                    <AvatarFallback>
                      {avatarData.name
                        ? avatarData.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                        : "U"}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold">{avatarData.name}</h1>
                  
                  {avatarData.averageRating !== null && (
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-yellow-500">★</span>
                      <span>{avatarData.averageRating}</span>
                      <span className="text-gray-500 text-sm">({avatarData.ratingCount})</span>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            
            {avatarData.flairs.length > 0 && (
              <CardContent>
                <UserFlairs flairs={avatarData.flairs} className="justify-center" />
              </CardContent>
            )}
          </Card>
        </div>

        <div className="md:w-2/3">
          <Tabs defaultValue="activity">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="activity">
                {isOwnProfile ? "Your Activity" : "Activity"}
              </TabsTrigger>
              <TabsTrigger value="ratings">
                {isOwnProfile ? "Your Ratings" : "Ratings"}
              </TabsTrigger>
              <TabsTrigger value="comments">
                {isOwnProfile ? "Your Comments" : "Comments"}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="activity" className="mt-6">
              <UserActivity userId={userId} isOwnProfile={isOwnProfile} currentUserId={session?.user?.id} />
            </TabsContent>
            <TabsContent value="ratings" className="mt-6">
              <UserRatings userId={userId} isOwnProfile={isOwnProfile} currentUserId={session?.user?.id} />
            </TabsContent>
            <TabsContent value="comments" className="mt-6">
              <UserComments userId={userId} isOwnProfile={isOwnProfile} currentUserId={session?.user?.id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 