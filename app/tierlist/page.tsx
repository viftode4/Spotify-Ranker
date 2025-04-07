"use client";

import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { TierList } from "@/components/TierList";
import { toast } from "sonner";
import { useTierListCache } from "@/hooks/useTierListCache";

export default function TierListPage() {
  const { data: session } = useSession();
  const { tierGroups, isLoading, error, refreshTierList } = useTierListCache();

  // Show error toast if API fetch fails
  if (error) {
    toast.error(error || "Failed to fetch tier list");
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <p className="text-lg">Loading tier list...</p>
      </div>
    );
  }

  if (!tierGroups.some(group => group.albums.length > 0)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
        <h1 className="text-2xl font-bold mb-2">No rated albums found</h1>
        <p className="text-muted-foreground mb-6">
          Rate some albums to see them in the tier list
        </p>
        <Button href="/" asChild>
          <a>Go to Albums</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Album Tier List</h1>
        <div className="flex gap-2">
          <Button onClick={refreshTierList} variant="outline">
            Refresh
          </Button>
          <Button href="/" variant="outline" asChild>
            <a>Back to Albums</a>
          </Button>
        </div>
      </div>
      
      <p className="text-muted-foreground">
        Albums are ranked based on their average ratings from all users.
      </p>
      
      <TierList tierGroups={tierGroups} />
    </div>
  );
} 