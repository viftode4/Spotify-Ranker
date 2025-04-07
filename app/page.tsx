import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Metadata } from "next";
import { ActivityFeed } from "@/components/activity";

export const metadata: Metadata = {
  title: "Activity | Spotify Ranker",
  description: "See all the latest activity happening on Spotify Ranker"
};

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id;

  return (
    <div className="container py-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Activity Feed</h1>
        <p className="text-muted-foreground">
          See what everyone is rating and commenting on
        </p>
      </div>

      <ActivityFeed currentUserId={currentUserId} />
    </div>
  );
}
